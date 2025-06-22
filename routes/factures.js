const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const streamifier = require("streamifier");
const cloudinary = require("../cloudinary");

router.post("/generate", async (req, res) => {
  try {
    const { client, items, total } = req.body;

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

    // 🖼️ Logo (remplace par ton URL Cloudinary si dispo)
    doc.image("public/logo.png", 50, 45, { width: 100 });

    // 🧾 En-tête
    doc.fontSize(20).text("Facture Professionnelle", 50, 120);
    doc.fontSize(12).text(`Date : ${new Date().toLocaleDateString()}`, 50, 145);
    doc.text(`Client : ${client}`, 50, 160);
    doc.moveDown();

    // 🧮 Tableau des articles
    doc.moveDown();
    doc.fontSize(14).text("Détails :", { underline: true });

    items.forEach((item, index) => {
      doc
        .fontSize(12)
        .text(`${index + 1}. ${item.description} - ${item.prix} FCFA`);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total à payer : ${total} FCFA`, {
      align: "right",
      bold: true,
    });

    // ✍️ Signature
    doc.moveDown();
    doc.moveDown();
    doc.text("Signature du vendeur :", 50, doc.y + 20);
    doc.image("public/signature.png", 200, doc.y - 10, { width: 100 });

    doc.end();
  } catch (err) {
    console.error("Erreur de génération de facture:", err);
    res
      .status(500)
      .json({ message: "Erreur lors de la génération de la facture" });
  }
});

module.exports = router;
