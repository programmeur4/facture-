// routes/authMiddleware.js (ou dans un autre dossier si tu préfères)

const jwt = require("jsonwebtoken");
const User = require("../models/User"); // adapte selon ton chemin
const SECRET_KEY = process.env.SECRET_KEY;

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

module.exports = authenticate;
