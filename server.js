const express = require("express");
const { Storage } = require("@google-cloud/storage");
const { Firestore } = require("@google-cloud/firestore");
const multer = require("multer");
const { spawn } = require("child_process");
const sharp = require("sharp");
const { nanoid } = require("nanoid");

// Path ke file kunci autentikasi JSON
const serviceAccountKey = require("./capstone-incraft.json");

// Inisialisasi Firestore
const db = new Firestore({
  projectId: serviceAccountKey.project_id,
  credentials: {
    client_email: serviceAccountKey.client_email,
    private_key: serviceAccountKey.private_key,
  },
});

// Inisialisasi Storage
const storage = new Storage({
  projectId: serviceAccountKey.project_id,
  credentials: {
    client_email: serviceAccountKey.client_email,
    private_key: serviceAccountKey.private_key,
  },
});

const app = express();

// Middleware untuk mem-parse body permintaan
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi storage untuk multer
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

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

// Endpoint untuk mengunggah foto ke Google Cloud Storage dan mendapatkan prediksi
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const file = req.file;
    const fileExtension = file.originalname.split(".").pop(); // Mendapatkan ekstensi file
    const randomFileName = `${nanoid()}.${fileExtension}`; // Membuat nama acak dengan nanoid
    // const filePath = `images/${file.originalname}`;
    const filePath = `images/${randomFileName}`;

    // Kompresi gambar sebelum mengunggah ke Google Cloud Storage
    const compressedImageBuffer = await compressImage(file);

    // Upload file ke Google Cloud Storage
    const fileUpload = storage.bucket("capstone_incraft").file(filePath);
    await fileUpload.save(compressedImageBuffer, {
      contentType: file.mimetype,
    });

    // // Dapatkan link yang ditandatangani dari Google Cloud Storage
    // const [signedUrl] = await fileUpload.getSignedUrl({
    //   action: "read",
    //   expires: "03-01-2500",
    // });

    // Dapatkan URL file langsung dari bucket yang sudah bersifat publik
    const signedUrl = `https://storage.googleapis.com/capstone_incraft/${filePath}`;

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

    pythonProcess.on("close", async (code) => {
      // Skrip Python selesai dieksekusi
      console.log(`Child process exited with code ${code}`);

      if (code === 0) {
        // Jika skrip Python berhasil dieksekusi tanpa kesalahan
        prediction = prediction.replace(/\r?\n|\r/g, "");
        res.send({ prediction, imageUrl: signedUrl });
        // Mengambil data dari Firestore
        // const snapshot = await db.collection("Jenis").get();
        // const matchedData = [];

        // snapshot.forEach((doc) => {
        //   const data = doc.data();
        //   if (data.kelas === prediction) {
        //     matchedData.push({
        //       id: doc.id,
        //       jenis: data.jenis,
        //       link: data.link,
        //     });
        //   }
        // });

        // if (matchedData.length === 0) {
        //   // Jika tidak ada data yang cocok
        //   res.status(404).json({ error: "Data not found" });
        // } else {
        //   // Jika ada data yang cocok
        //   res.setHeader("Content-Type", "application/json");
        //   res.send({ imageUrl: signedUrl, matchedData });
        // }
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

app.get("/kelas", async (req, res) => {
  try {
    const searchKelas = req.query.q; // Mengambil nilai query "kelas" dari URL
    const snapshot = await db.collection("Jenis").get();

    const matchedData = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.kelas === searchKelas) {
        const links = data.link.map((linkData) => ({
          bahan: linkData.bahan,
          judul: linkData.judul,
          url: linkData.url,
          langkah: linkData.langkah,
        }));

        matchedData.push({
          id: doc.id,
          jenis: data.jenis,
          link: links,
        });
      }
    });

    if (matchedData.length === 0) {
      return res.status(404).json({ error: "Jenis not found." });
    }

    return res.status(200).json(matchedData);
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

// Endpoint untuk menjalankan server
app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running on port 5000");
});
