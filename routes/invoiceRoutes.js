const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const authenticate = require("./authMiddleware");

router.post("/", authenticate, invoiceController.createInvoice);
router.get("/", authenticate, invoiceController.getUserInvoices);
router.delete("/:id", authenticate, invoiceController.deleteInvoice);
router.delete("/", authenticate, invoiceController.deleteAllInvoices);

module.exports = router;
