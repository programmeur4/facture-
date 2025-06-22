const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configuration devrait venir du .env
const SECRET_KEY = process.env.SECRET_KEY || "secret_key_par_defaut";

// Config Cloudinary (à mettre dans .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "TON_CLOUD_NAME",
  api_key: process.env.CLOUDINARY_API_KEY || "TA_API_KEY",
  api_secret: process.env.CLOUDINARY_API_SECRET || "TON_SECRET",
});

const upload = multer();

// Route de connexion
router.post("/login", async (req, res) => {
  const { licence } = req.body;

  try {
    const user = await User.findOne({ licence });
    if (!user) {
      return res.status(401).json({ message: "Clé de licence invalide." });
    }

    const token = jwt.sign({ licence: user.licence }, SECRET_KEY, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      token,
      logo: user.logo || "",
      signature: user.signature || "",
    });
  } catch (error) {
    console.error("Erreur login:", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// Fonction helper pour Cloudinary
function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// Route de mise à jour
router.post("/update", upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "signature", maxCount: 1 }
]), async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findOne({ licence: decoded.licence });
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Traitement des fichiers
    const updates = {};
    if (req.files["logo"]) {
      updates.logo = await uploadToCloudinary(req.files["logo"][0].buffer, "logos");
    }
    if (req.files["signature"]) {
      updates.signature = await uploadToCloudinary(req.files["signature"][0].buffer, "signatures");
    }

    // Mise à jour de l'utilisateur
    const updatedUser = await User.findOneAndUpdate(
      { licence: decoded.licence },
      updates,
      { new: true }
    );

    res.status(200).json({
      message: "Mise à jour réussie",
      user: updatedUser
    });
  } catch (err) {
    console.error("Erreur update:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;