require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const axios = require("axios");
const invoiceRoutes = require("./routes/invoiceRoutes");

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialisation Express
const app = express();

// Dossiers
const PDF_FOLDER = path.join(__dirname, "factures");
const PUBLIC_FOLDER = path.join(__dirname, "public");

if (!fs.existsSync(PDF_FOLDER)) fs.mkdirSync(PDF_FOLDER, { recursive: true });
if (!fs.existsSync(PUBLIC_FOLDER))
  fs.mkdirSync(PUBLIC_FOLDER, { recursive: true });

// Middlewares
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://votre-domaine.com"
        : ["http://localhost:3000", "http://127.0.0.1:5500"],
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(express.static(PUBLIC_FOLDER));
app.use("/factures", express.static(PDF_FOLDER));

app.use("/api/invoices", invoiceRoutes);
// Configuration serveur
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const SECRET_KEY = process.env.SECRET_KEY;

if (!MONGO_URI || !SECRET_KEY) {
  console.error("❌ Configuration manquante dans .env");
  process.exit(1);
}

// Connexion MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ Connecté à MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ Erreur MongoDB:", err.message);
    process.exit(1);
  });

// Modèles
const userSchema = new mongoose.Schema({
  licence: { type: String, required: true, unique: true, trim: true },
  logo: String,
  signature: String,
  companyName: { type: String, default: "Mon Entreprise" },
  companyDescription: String,
  companyAddress: String,
  companyPhone: String,
  companyEmail: String,
  companySiret: String,
  socialMedia: {
    website: String,
    facebook: String,
    instagram: String,
    linkedin: String,
    whatsapp: String,
  },
  lastLogin: { type: Date, default: Date.now },
});

const licenceSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Licence =
  mongoose.models.Licence || mongoose.model("Licence", licenceSchema);

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentification requise" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = await User.findOne({ licence: decoded.licence });
    if (!req.user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    next();
  } catch (err) {
    console.error("Erreur JWT:", err.message);
    res.status(403).json({ message: "Token invalide ou expiré" });
  }
};

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_FOLDER, "index.html"));
});

app.post("/api/user/login", async (req, res) => {
  try {
    const { licence } = req.body;

    if (!licence?.trim()) {
      return res.status(400).json({ message: "Clé de licence requise" });
    }

    const licenceValid = await Licence.findOne({ code: licence.trim() });
    if (!licenceValid) {
      return res.status(401).json({ message: "Licence invalide" });
    }

    let user = await User.findOne({ licence: licence.trim() });
    if (!user) {
      user = await User.create({ licence: licence.trim() });
    }

    const token = jwt.sign({ licence: user.licence }, SECRET_KEY, {
      expiresIn: "7d",
    });

    res.json({
      token,
      logo: user.logo || null,
      signature: user.signature || null,
      companyInfo: {
        name: user.companyName,
        description: user.companyDescription,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Configuration upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Helper pour upload vers Cloudinary
const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });

// Route pour uploader logo/signature et infos entreprise
app.post(
  "/api/user/upload",
  authenticate,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const updates = {
        companyName: req.body.companyName,
        companyDescription: req.body.companyDescription,
        companyAddress: req.body.companyAddress,
        companyPhone: req.body.companyPhone,
        companyEmail: req.body.companyEmail,
        companySiret: req.body.companySiret,
        socialMedia: {
          website: req.body.website,
          facebook: req.body.facebook,
          instagram: req.body.instagram,
          linkedin: req.body.linkedin,
          whatsapp: req.body.whatsapp,
        },
      };

      const uploadPromises = [];
      if (req.files?.logo) {
        uploadPromises.push(
          uploadToCloudinary(req.files.logo[0], "logos").then((url) => {
            updates.logo = url;
          })
        );
      }
      if (req.files?.signature) {
        uploadPromises.push(
          uploadToCloudinary(req.files.signature[0], "signatures").then(
            (url) => {
              updates.signature = url;
            }
          )
        );
      }

      await Promise.all(uploadPromises);
      const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
      });

      res.json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Erreur upload:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de l'upload",
      });
    }
  }
);

app.get("/api/user/check-auth", authenticate, (req, res) => {
  res.json({
    success: true,
    logo: req.user.logo || null,
    signature: req.user.signature || null,
    companyInfo: {
      name: req.user.companyName,
      description: req.user.companyDescription,
    },
  });
});

// Helper pour télécharger les images depuis Cloudinary
const downloadImage = async (url) => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return response.data;
  } catch (error) {
    console.error("Erreur téléchargement image:", error);
    return null;
  }
};

// Route pour générer le PDF (version corrigée)
app.post("/api/generate-pdf", authenticate, async (req, res) => {
  try {
    const { client, products, total } = req.body;
    const user = req.user;
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("fr-FR");
    const invoiceNumber = `FAC-${currentDate.getFullYear()}${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}${String(currentDate.getDate()).padStart(
      2,
      "0"
    )}-${Math.floor(1000 + Math.random() * 9000)}`;

    const filename = `facture_${client.replace(
      /[^a-z0-9]/gi,
      "_"
    )}_${Date.now()}.pdf`;
    const filepath = path.join(PDF_FOLDER, filename);
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // ==== HEADER LOGO & INFOS ENTREPRISE ====
    if (user.logo) {
      try {
        const logoImg = await downloadImage(user.logo);
        doc.image(logoImg, 40, 40, { width: 80 });
      } catch (e) {
        console.warn("Erreur logo:", e);
      }
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#333333")
      .text(user.companyName || "Mon Entreprise", 130, 40);

    if (user.companyDescription) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#555555")
        .text(user.companyDescription, 130, 60, { width: 400 });
    }

    // ==== SÉPARATEUR ====
    doc
      .moveTo(40, 100)
      .lineTo(550, 100)
      .lineWidth(1)
      .strokeColor("#cccccc")
      .stroke();

    // ==== TITRE FACTURE ====
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#000000")
      .text("FACTURE", 40, 110);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#444444")
      .text(`Date : ${formattedDate}`, 400, 110, { align: "right" })
      .text(`Client : ${client}`, 400, 125, { align: "right" })
      .text(`Réf : ${invoiceNumber}`, 400, 140, { align: "right" });

    // ==== TABLE PRODUITS ====
    let tableTop = 170;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#ffffff")
      .rect(40, tableTop, 510, 20)
      .fill("#2c3e50")
      .stroke();

    doc
      .fillColor("#ffffff")
      .text("DESCRIPTION", 45, tableTop + 5)
      .text("QTÉ", 350, tableTop + 5, { width: 50, align: "right" })
      .text("PRIX UNIT.", 410, tableTop + 5, { width: 70, align: "right" })
      .text("TOTAL", 490, tableTop + 5, { width: 60, align: "right" });

    let position = tableTop + 25;

    products.forEach((p, i) => {
      const totalLine = p.qty * p.price;
      const background = i % 2 === 0 ? "#f8f8f8" : "#ffffff";
      doc.fillColor(background).rect(40, position, 510, 20).fill();

      doc
        .font("Helvetica")
        .fillColor("#000000")
        .text(p.name, 45, position + 5)
        .text(p.qty.toString(), 350, position + 5, {
          width: 50,
          align: "right",
        })
        .text(`${p.price.toFixed(2)} FCFA`, 410, position + 5, {
          width: 70,
          align: "right",
        })
        .text(`${totalLine.toFixed(2)} FCFA`, 490, position + 5, {
          width: 60,
          align: "right",
        });

      position += 20;
    });

    // ==== TOTAL ====
    doc
      .moveTo(350, position + 10)
      .lineTo(550, position + 10)
      .strokeColor("#2c3e50")
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("TOTAL :", 350, position + 15, { width: 130, align: "right" })
      .text(`${parseFloat(total).toFixed(2)} FCFA`, 490, position + 15, {
        width: 60,
        align: "right",
      });

    // ==== PIED DE PAGE ====
    let footerY = position + 60;
    if (user.signature) {
      try {
        const signature = await downloadImage(user.signature);
        doc.image(signature, 40, footerY - 40, { width: 40 }); // ↓ Réduction taille
      } catch (e) {
        console.warn("Erreur signature:", e);
      }
    }

    // Coordonnées avec icônes
    const coordonnees = [
      user.companyAddress ? `Adresse : ${user.companyAddress}` : null,
      user.companyPhone ? `Téléphone : ${user.companyPhone}` : null,
      user.companyEmail ? `Email : ${user.companyEmail}` : null,
      user.companySiret ? `SIRET : ${user.companySiret}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#444444")
      .text(coordonnees, user.signature ? 120 : 40, footerY - 5, {
        width: 400,
      });

    // Ligne bas + mention légale
    doc
      .moveTo(40, footerY + 45)
      .lineTo(550, footerY + 45)
      .strokeColor("#cccccc")
      .stroke();

    doc
      .font("Helvetica-Oblique")
      .fontSize(7)
      .fillColor("#888888")
      .text(
        "Facture générée électroniquement - valable sans signature",
        40,
        footerY + 50,
        { align: "center", width: 500 }
      );

    doc.end();
    await new Promise((resolve) => stream.on("finish", resolve));

    res.json({
      success: true,
      url: `/factures/${filename}`,
      path: filepath,
    });
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération de la facture",
    });
  }
});

// Gestion des erreurs
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint non trouvé",
  });
});

app.use((err, req, res, next) => {
  console.error("Erreur:", err.stack);
  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur",
  });
});

// Démarrage serveur
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📁 Dossier public: ${PUBLIC_FOLDER}`);
  console.log(`📁 Dossier PDF: ${PDF_FOLDER}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Erreur non gérée:", err);
  server.close(() => process.exit(1));
});
