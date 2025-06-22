const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const streamifier = require("streamifier");
const cloudinary = require("../cloudinary");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET_KEY = "secret_key_à_personnaliser"; // 🔐 Utilise .env en production

// 📄 Génération de facture avec authentification
router.post("/generate", async (req, res) => {
  try {
    const { token, client, items, total } = req.body;

    // 🔐 Vérification du token
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findOne({ licence: decoded.licence });

    if (!user)
      return res.status(401).json({ message: "Utilisateur introuvable." });

    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "raw", folder: "factures" },
        (error, result) => {
          if (error) return res.status(500).json({ error });
          return res.status(200).json({ url: result.secure_url });
        }
      );

      streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
    });

    // 🖼️ Logo depuis Cloudinary
    if (user.logo) {
      doc.image(user.logo, 50, 45, { width: 100 });
    }

    // 🧾 En-tête
    doc.fontSize(20).text("Facture Professionnelle", 50, 120);
    doc.fontSize(12).text(`Date : ${new Date().toLocaleDateString()}`, 50, 145);
    doc.text(`Client : ${client}`, 50, 160);
    doc.moveDown();

    // 🧮 Détails des articles
    doc.moveDown().fontSize(14).text("Détails :", { underline: true });
    items.forEach((item, index) => {
      doc
        .fontSize(12)
        .text(`${index + 1}. ${item.description} - ${item.prix} FCFA`);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total à payer : ${total} FCFA`, {
      align: "right",
    });

    // ✍️ Signature depuis Cloudinary
    doc.moveDown().moveDown();
    doc.text("Signature du vendeur :", 50, doc.y + 20);
    if (user.signature) {
      doc.image(user.signature, 200, doc.y - 10, { width: 100 });
    }

    doc.end();
  } catch (err) {
    console.error("Erreur génération facture:", err);
    res
      .status(500)
      .json({ message: "Erreur lors de la génération de la facture" });
  }
});

module.exports = router;



async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const clientName = document.getElementById("client").value || "Client";
  const products = Array.from(document.querySelectorAll(".product")).map((el) => {
    const name = el.querySelector(".name").value;
    const price = parseFloat(el.querySelector(".price").value);
    const qty = parseInt(el.querySelector(".qty").value);
    return {
      name,
      price,
      qty,
      total: price * qty,
    };
  });

  const totalAmount = products.reduce((sum, p) => sum + p.total, 0);

  // Récupérer les images logo et signature
  const logoURL = document.getElementById("logoDisplay").src;
  const signatureURL = window.userSignature;

  // Charger images en base64
  const logoData = await toDataURL(logoURL);
  const signatureData = await toDataURL(signatureURL);

  // Ajouter le logo
  doc.addImage(logoData, "PNG", 80, 10, 50, 30); // centré
  doc.setFontSize(16);
  doc.text("FACTURE", 105, 50, null, null, "center");
  doc.setFontSize(12);
  doc.text("Client : " + clientName, 14, 60);
  doc.text("Date : " + new Date().toLocaleDateString(), 14, 68);

  // Table des produits
  doc.autoTable({
    startY: 75,
    head: [["Produit", "Prix", "Quantité", "Total"]],
    body: products.map((p) => [p.name, p.price + " FCFA", p.qty, p.total + " FCFA"]),
  });

  // Total final
  doc.setFontSize(14);
  doc.text("Total : " + totalAmount + " FCFA", 14, doc.lastAutoTable.finalY + 10);

  // Ajouter la signature
  doc.addImage(signatureData, "PNG", 140, doc.lastAutoTable.finalY + 20, 50, 25);
  doc.setFontSize(10);
  doc.text("Signature", 160, doc.lastAutoTable.finalY + 48, null, null, "center");

  // Télécharger
  doc.save(`facture-${clientName}.pdf`);
}

// Convertir une URL en base64
function toDataURL(url) {
  return fetch(url)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        })
    );
}
