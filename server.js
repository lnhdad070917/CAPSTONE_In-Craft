const express = require("express");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const multer = require("multer");
const { spawn } = require("child_process");
const sharp = require("sharp");

// Inisialisasi Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "pemrograman-976fd.appspot.com",
  databaseURL:
    "https://pemrograman-976fd-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const app = express();
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Middleware untuk mem-parse body permintaan
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi storage untuk multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Fungsi untuk melakukan kompresi gambar
const compressImage = async (file) => {
  const { buffer } = await sharp(file.buffer)
    .resize({ width: 800 })
    .jpeg({ quality: 80 })
    .toBuffer();

  // Konversi ArrayBuffer menjadi Buffer
  const convertedBuffer = Buffer.from(buffer);

  return convertedBuffer;
};

// Endpoint untuk mengunggah foto ke Firebase Storage dan mendapatkan prediksi
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const file = req.file;
    const filePath = `images/${file.originalname}`;

    // Kompresi gambar sebelum mengunggah ke Firebase Storage
    const compressedImageBuffer = await compressImage(file);

    // Belum melakukan kompress
    // // Upload file ke Firebase Storage
    // await bucket.file(filePath).save(file.buffer, {
    //   contentType: file.mimetype,
    // });

    // Upload file ke Firebase Storage
    await bucket.file(filePath).save(compressedImageBuffer, {
      contentType: file.mimetype,
    });

    // Dapatkan link yang ditandatangani dari Firebase Storage
    const [signedUrl] = await bucket
      .file(filePath)
      .getSignedUrl({ action: "read", expires: "03-01-2500" });

    // Simpan link file ke Firestore
    const photoData = {
      url: signedUrl,
    };
    const docRef = await db.collection("file").add(photoData);

    // Kirim link foto ke model untuk prediksi
    const pythonProcess = spawn("python", ["model_loader.py", signedUrl]);

    let prediction = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      // Data yang diterima dari skrip Python (hasil prediksi)
      prediction += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      // Kesalahan yang terjadi di skrip Python
      errorOutput += data.toString();
    });
    // respon hanya presdiksi
    // pythonProcess.on("close", (code) => {
    //   // Skrip Python selesai dieksekusi
    //   console.log(`Child process exited with code ${code}`);

    //   if (code === 0) {
    //     // Jika skrip Python berhasil dieksekusi tanpa kesalahan
    //     prediction = prediction.replace(/\r?\n|\r/g, "");
    //     res.setHeader("Content-Type", "application/json");
    //     res.send({ prediction });
    //   } else {
    //     // Jika ada kesalahan dalam menjalankan skrip Python
    //     res.status(500).json({ error: "Internal server error", errorOutput });
    //   }
    // });

    //respon dengan data firestore database
    pythonProcess.on("close", async (code) => {
      // Skrip Python selesai dieksekusi
      console.log(`Child process exited with code ${code}`);

      if (code === 0) {
        // Jika skrip Python berhasil dieksekusi tanpa kesalahan
        prediction = prediction.replace(/\r?\n|\r/g, "");

        // Mengambil data dari Firestore
        const snapshot = await db.collection("Jenis").get();
        const matchedData = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          // console.log(data);
          if (data.kelas === prediction) {
            matchedData.push({
              id: doc.id,
              jenis: data.jenis,
              link: data.link,
            });
          }
        });

        if (matchedData.length === 0) {
          // Jika tidak ada data yang cocok
          res.status(404).json({ error: "Data not found" });
        } else {
          // Jika ada data yang cocok
          res.setHeader("Content-Type", "application/json");
          res.send({ imageUrl: signedUrl, matchedData });
        }
      } else {
        // Jika ada kesalahan dalam menjalankan skrip Python
        res.status(500).json({ error: "Internal server error", errorOutput });
      }
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send("An error occurred while uploading the file.");
  }
});

// Endpoint untuk mendapatkan data dari koleksi "Jenis"
app.get("/jenis", async (req, res) => {
  try {
    const snapshot = await db.collection("Jenis").get();
    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error while fetching data:", error);
    return res.status(500).json({ error: "Failed to fetch data." });
  }
});

app.get("/jenis/:id", async (req, res) => {
  try {
    const jenisId = req.params.id;
    const doc = await db.collection("Jenis").doc(jenisId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Jenis not found." });
    }

    const jenisData = { id: doc.id, ...doc.data() };
    return res.status(200).json(jenisData);
  } catch (error) {
    console.error("Error while fetching data:", error);
    return res.status(500).json({ error: "Failed to fetch data." });
  }
});

// Endpoint untuk menambahkan data ke koleksi "Jenis"
app.post("/jenis", async (req, res) => {
  const data = req.body;

  try {
    const jenisCollection = db.collection("Jenis");
    const docRef = await jenisCollection.add(data);
    const newData = { id: docRef.id, ...data };
    return res.status(200).json(newData);
  } catch (error) {
    console.error("Error creating data:", error);
    return res.status(500).json({ error: "Failed to create data." });
  }
});

// Endpoint untuk menghapus data dari koleksi "Jenis"
app.delete("/jenis/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const jenisDoc = db.collection("Jenis").doc(id);
    await jenisDoc.delete();
    return res.status(200).json({ message: "Data deleted successfully." });
  } catch (error) {
    console.error("Error deleting data:", error);
    return res.status(500).json({ error: "Failed to delete data." });
  }
});

// Endpoint untuk memperbarui data dalam koleksi "Jenis"
app.put("/jenis/:id", async (req, res) => {
  const { id } = req.params;
  const newData = req.body;

  try {
    const jenisDoc = db.collection("Jenis").doc(id);
    await jenisDoc.update(newData);
    return res.status(200).json({ message: "Data updated successfully." });
  } catch (error) {
    console.error("Error updating data:", error);
    return res.status(500).json({ error: "Failed to update data." });
  }
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
