const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  licence: {
    type: String,
    required: true,
    unique: true,
  },
  logo: {
    type: String,
    required: false,
  },
  signature: {
    type: String,
    required: false,
  },
});

// Ajout d'un console.log pour vérifier le chargement
console.log("✅ Modèle User chargé avec succès");
module.exports = mongoose.model("User", UserSchema);