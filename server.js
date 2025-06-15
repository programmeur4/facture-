require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

// Initialisation express
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ limit: "20mb", extended: true }));
app.use(express.static("public"));

// Variables d'environnement
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

// 📁 Dossier PDF
const PDF_FOLDER = path.join(__dirname, "factures");
if (!fs.existsSync(PDF_FOLDER)) fs.mkdirSync(PDF_FOLDER);
app.use("/factures", express.static(PDF_FOLDER));

// 📦 Route des factures (API REST)
const factureRoutes = require("./routes/factures");
app.use("/api/factures", factureRoutes);

// 🔌 Connexion MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connecté à MongoDB Atlas"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

// 🧾 Modèle de licence
const Licence = mongoose.model(
  "Licence",
  new mongoose.Schema({
    code: String,
  })
);

// 🔐 Middleware JWT
function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(403).send("⛔ Token manquant.");
  try {
    jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) {
    res.status(403).send("⛔ Token invalide.");
  }
}

// 🔑 Authentification par licence
app.post("/index", async (req, res) => {
  const { licence } = req.body;
  if (!licence) return res.status(400).json({ message: "Licence requise." });

  const valid = await Licence.findOne({ code: licence });
  if (!valid)
    return res.status(401).json({ message: "Clé de licence invalide." });

  const token = jwt.sign({ licence }, SECRET_KEY, { expiresIn: "7d" });
  res.json({ token });
});

// ✅ Route test sécurisée
app.get("/facture", verifyToken, (req, res) => {
  res.send("✅ Accès autorisé à la facturation.");
});

// 📄 Génération de PDF
app.post("/generate-pdf", verifyToken, (req, res) => {
  const { client, products, total, logo, signature } = req.body;

  if (!client || !Array.isArray(products) || !total) {
    return res.status(400).json({ message: "Champs requis manquants." });
  }

  const filename = `facture-${client.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
  const filepath = path.join(PDF_FOLDER, filename);

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  // Logo
  if (logo) {
    try {
      const logoBuffer = Buffer.from(logo.split(",")[1], "base64");
      doc.image(logoBuffer, { fit: [100, 100], align: "center" });
    } catch (e) {
      console.warn("⚠️ Logo invalide");
    }
  }

  doc.moveDown();
  doc.fontSize(18).text(`Facture pour : ${client}`, { underline: true });
  doc.moveDown();

  doc.fontSize(14);
  products.forEach(({ name, price, qty }) => {
    const subtotal = price * qty;
    doc.text(`${name}  x${qty}  - ${subtotal} FCFA`);
  });

  doc.moveDown();
  doc.fontSize(16).text(`Total : ${total} FCFA`, { bold: true });
  doc.moveDown(2);

  // Signature
  if (signature) {
    try {
      const signatureBuffer = Buffer.from(signature.split(",")[1], "base64");
      doc.text("Signature :");
      doc.image(signatureBuffer, { fit: [150, 50] });
    } catch (e) {
      console.warn("⚠️ Signature invalide");
    }
  }

  doc.end();

  stream.on("finish", () => {
    res.json({ success: true, url: `/factures/${filename}` });
  });
});

// 🚀 Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`);
});
