const express = require("express");
const admin = require("firebase-admin");
const formidable = require("formidable");
const fs = require("fs");
const serviceAccount = require("./serviceAccountKey.json");
const multer = require("multer");

// Inisialisasi Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "pemrograman-976fd.appspot.com",
  databaseURL:
    "https://pemrograman-976fd-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const app = express();
const db = admin.firestore();
// const bucket = admin.storage().bucket();

// Middleware untuk mem-parse body permintaan
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi storage untuk multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint untuk mengunggah foto ke Firebase Storage dan menyimpan tautan di Firestore
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const bucket = admin.storage().bucket();
    const file = req.file;
    const filePath = `images/${file.originalname}`;

    // Upload file ke Firebase Storage
    await bucket.file(filePath).save(file.buffer, {
      contentType: file.mimetype,
    });

    // Simpan link file ke Firestore
    const photoData = {
      url: `https://storage.googleapis.com/${bucket.name}/${filePath}`,
    };
    const docRef = await db.collection("file").add(photoData);

    // Kirim response berisi ID dokumen baru
    res.send({ id: docRef.id });
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
