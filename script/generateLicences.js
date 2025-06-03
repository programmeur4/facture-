require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Connexion MongoDB (utilise ta variable d'environnement ou colle l'URI ici)
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://mationprogram54:1xTPUIggcdTGUmHN@factureapp.tdsmwtk.mongodb.net/factureDB?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => {
    console.error("❌ Erreur connexion MongoDB:", err);
    process.exit(1);
  });

// Schéma licence
const licenceSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  expiryDate: { type: Date, required: true },
});

const Licence = mongoose.model("Licence", licenceSchema);

// Fonction génératrice de clés formatées
function generateFormattedLicenseKey(groups = 4, groupLength = 4) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let licenseKey = "";
  for (let i = 0; i < groups; i++) {
    let group = "";
    for (let j = 0; j < groupLength; j++) {
      group += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    licenseKey += group;
    if (i < groups - 1) licenseKey += "-";
  }
  return licenseKey;
}

// Fonction pour générer et insérer plusieurs licences
async function generateAndInsertLicences(count = 10, daysValid = 30) {
  for (let i = 0; i < count; i++) {
    const code = generateFormattedLicenseKey();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysValid);

    const licence = new Licence({ code, expiryDate });
    try {
      await licence.save();
      console.log(
        `Licence créée : ${code} | Expire le : ${
          expiryDate.toISOString().split("T")[0]
        }`
      );
    } catch (err) {
      if (err.code === 11000) {
        // Code déjà existant, recommence l'itération
        console.log(
          `Doublon détecté pour ${code}, génération d'une nouvelle clé...`
        );
        i--;
      } else {
        console.error("Erreur insertion licence :", err);
      }
    }
  }
  mongoose.disconnect();
  console.log("✅ Génération terminée, connexion fermée.");
}

// Exécution : génère 20 licences valides 30 jours
generateAndInsertLicences(20, 30).catch(console.error);
