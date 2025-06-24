
 🧾 FactureApp - Générateur de Factures pour Vendeurs WhatsApp

FactureApp est une application web locale simple et rapide qui permet aux vendeurs sur WhatsApp, Facebook, etc., de :

✅ Générer des factures  
✅ Ajouter leur logo et signature une seule fois  
✅ Envoyer la facture au client via WhatsApp  
✅ Consulter l’historique  
✅ Exporter en PDF ou Excel



 Fonctionnalités

- 🔐 Connexion avec une clé de licence
- 🖼️ Upload unique du logo et de la signature
- 🧾 Génération de factures professionnelles en PDF (avec logo + signature)
- 🗃️ Historique des factures en `localStorage`
- 📤 Export PDF et Excel
- 📱 Intégration avec WhatsApp Web



 Structure du projet

```
factureapp/
├── public/
│   ├── index.html         # Page de connexion
│   ├── setup.html         # Upload logo + signature
│   ├── facture.html       # Création de la facture
│   ├── historique.html    # Liste des anciennes factures
│   ├── style.css          # Feuilles de style
│   └── script.js          # JS principal (PDF, WhatsApp, etc.)
├── routes/
│   ├── user.js            # Connexion, upload logo/signature
│   └── pdf.js             # Génération de la facture PDF
├── models/
│   └── User.js            # Schéma MongoDB pour les utilisateurs
├── cloudinary.js          # Configuration de Cloudinary
├── server.js              # Serveur Express principal
├── .env                   # Variables d’environnement
└── README.md              # Documentation (ce fichier)


 🛠️ Installation & Lancement

1. Clone le dépôt
   bash
   git clone https://github.com/programmeur4/facture-.git
   cd factureapp
   

2. InStalle les dépendances
   bash
   npm install
   

3. Configure le fichier `.env
   env
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/factureDB
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   SECRET_KEY=ton_secret_pour_JWT
   

4. Lance le serveur
   bash
   npm start
   

5. Ouvre ton navigateur  
   [http://localhost:5000](http://localhost:5000)

---

 Démo rapide

1. Saisir une clé de licence (déjà enregistrée dans MongoDB)
2. Si c’est la 1ère fois : on te demande d’ajouter ton **logo** et ta **signature**
3. Ensuite, tu accèdes à la création de facture avec calcul automatique
4. Génère → Télécharge → Envoie par WhatsApp ✅

  Technologies

- Frontend : HTML, CSS, JavaScript
- Backend : Node.js + Express
- Base de données : MongoDB (avec Mongoose)
- Cloud : Cloudinary pour héberger le logo & la signature
- PDF : PDFKit côté serveur

 Sécurité

 Utilisation de JWT pour authentifier l’utilisateur via une clé de licence
 Données critiques (clé, cloud, MongoDB) dans le fichier `.env`



 Licence

Projet open-source libre pour les entrepreneurs et vendeurs souhaitant professionnaliser leurs factures sans prise de tête.
 🙌 Auteur

Développé avec ❤️ par Coulibaly Kassoum Cedric 
💼 Ingénieur logiciel — Côte d’Ivoire  
📧 Contact :mationprogram54@gmail.com 
📱 TikTok / WhatsApp / GitHub : @programmeur4

