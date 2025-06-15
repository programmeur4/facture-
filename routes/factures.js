const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const streamifier = require("streamifier");
const cloudinary = require("../cloudinary");

router.post("/generate", async (req, res) => {
  try {
    const { client, items, total } = req.body;

    if (!client || !items || !total) {
      return res.status(400).json({ message: "Données incomplètes" });
    }

    const doc = new PDFDocument();
    let buffers = [];

    doc.on("data", (data) => buffers.push(data));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "factures",
          public_id: `facture-${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            console.error("Erreur upload Cloudinary:", error);
            return res.status(500).json({ error: "Erreur d'upload Cloudinary" });
          }
          return res.status(200).json({ url: result.secure_url });
        }
      );

      streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
    });

    // 📄 Contenu du PDF
    doc.fontSize(16).text(`Facture pour : ${client}`, { align: "left" });
    doc.moveDown();

    items.forEach((item, index) => {
      doc
        .fontSize(12)
        .text(`${index + 1}. ${item.description} - ${item.prix} FCFA`);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total : ${total} FCFA`, { align: "right" });
    doc.end();
  } catch (err) {
    console.error("Erreur lors de la génération de la facture:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
