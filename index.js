const express = require("express");
const app = express();
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const { PythonShell } = require("python-shell");
const fs = require("fs");

//install module
//npm install multer @google-cloud/storage python-shell

// // Mendapatkan path ke file kategori data
// const kategoriDataPath = "path/ke/file_kategori_data.json"; // Ubah dengan path yang sesuai ke file kategori data

// Konfigurasi Google Cloud Storage
const storage = new Storage({
  projectId: "project-id", // Ganti dengan ID proyek Google Cloud Storage
  keyFilename: "path/to/your/serviceAccountKey.json", // Ganti dengan path ke service account key JSON
});
const bucketName = "bucket-name"; // Ganti dengan nama bucket Google Cloud Storage yang ingin digunakan

// Konfigurasi Multer untuk mengunggah file gambar
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// Endpoint untuk mendeteksi sampah
app.post("/detect", upload.single("image"), (req, res) => {
  const imageFile = req.file;

  // Menyimpan file di Google Cloud Storage
  const bucket = storage.bucket(bucketName);
  const fileName = Date.now() + "-" + imageFile.originalname;
  const file = bucket.file(fileName);

  const blobStream = file.createWriteStream({
    metadata: {
      contentType: imageFile.mimetype,
    },
  });

  blobStream.on("error", (error) => {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  });

  blobStream.on("finish", () => {
    // Mengirimkan informasi file ke model machine learning
    const options = {
      scriptPath: "path/to/your/model/script/", // Ubah dengan path ke script Python yang memuat model
      args: [fileName],
    };

    // Memanggil model machine learning menggunakan PythonShell
    PythonShell.run("model.py", options, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
      } else {
        const prediction = results[0];

        // Membaca data kategori dari file JSON
        const kategoriDataPath = path.join(__dirname, "data/index.json");
        const kategoriData = JSON.parse(
          fs.readFileSync(kategoriDataPath, "utf8")
        );

        // Mengirimkan respons JSON dengan data tambahan sesuai prediksi
        if (prediction in kategoriData) {
          const additionalData = kategoriData[prediction];
          res.json({ prediction: prediction, data: additionalData });
        } else {
          res.json({ prediction: prediction });
        }
      }
    });
  });

  blobStream.end(imageFile.buffer);
});

// Menjalankan server
app.listen(3000, () => {
  console.log("Server berjalan di port 3000");
});
