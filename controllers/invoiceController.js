const Invoice = require("../models/Invoice");
const fs = require("fs");
const path = require("path");

exports.createInvoice = async (req, res) => {
  try {
    const { client, products, total, pdfUrl } = req.body;

    const newInvoice = new Invoice({
      user: req.user._id,
      client,
      products,
      total,
      pdfUrl,
    });

    await newInvoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).sort(
      "-createdAt"
    );
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }

    // Supprimer le fichier PDF
    const filePath = path.join(
      __dirname,
      "../factures",
      path.basename(invoice.pdfUrl)
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Facture supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id });

    // Supprimer les fichiers PDF
    invoices.forEach((invoice) => {
      const filePath = path.join(
        __dirname,
        "../factures",
        path.basename(invoice.pdfUrl)
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Invoice.deleteMany({ user: req.user._id });
    res.json({ message: "Toutes les factures ont été supprimées" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
