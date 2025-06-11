const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const streamifier = require("streamifier");
const cloudinary = require("../cloudinary");

router.post("/generate", async (req, res) => {
  try {
    const { client, items, total } = req.body;

    const doc = new PDFDocument();
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
    console.error("Erreur de génération de facture:", err);
    res
      .status(500)
      .json({ message: "Erreur lors de la génération de la facture" });
  }
});

module.exports = router;
