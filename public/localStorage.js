// Exemple de données à sauvegarder
const facture = {
  date: new Date().toISOString(),
  client: nomClient, // une variable contenant le nom du client
  products: listeProduits, // tableau [{ name, qty, price }]
  total: totalMontant, // le montant total
};

// Récupérer l'historique existant
let historique = JSON.parse(localStorage.getItem("facturesHistorique") || "[]");

// Ajouter la nouvelle facture au début
historique.unshift(facture);

// Sauvegarder dans le localStorage
localStorage.setItem("facturesHistorique", JSON.stringify(historique));
