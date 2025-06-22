async function generatePDF() {
 const { jsPDF } = window.jspdf;
 const doc = new jsPDF();

 const clientName = document.getElementById("client").value || "Client";
 const products = Array.from(document.querySelectorAll(".product")).map((el) => {
   const name = el.querySelector(".name").value;
   const price = parseFloat(el.querySelector(".price").value);
   const qty = parseInt(el.querySelector(".qty").value);
   return {
     name,
     price,
     qty,
     total: price * qty,
   };
 });

 const totalAmount = products.reduce((sum, p) => sum + p.total, 0);

 // Récupérer les images logo et signature
 const logoURL = document.getElementById("logoDisplay").src;
 const signatureURL = window.userSignature;

 // Charger images en base64
 const logoData = await toDataURL(logoURL);
 const signatureData = await toDataURL(signatureURL);

 // Ajouter le logo
 doc.addImage(logoData, "PNG", 80, 10, 50, 30); // centré
 doc.setFontSize(16);
 doc.text("FACTURE", 105, 50, null, null, "center");
 doc.setFontSize(12);
 doc.text("Client : " + clientName, 14, 60);
 doc.text("Date : " + new Date().toLocaleDateString(), 14, 68);

 // Table des produits
 doc.autoTable({
   startY: 75,
   head: [["Produit", "Prix", "Quantité", "Total"]],
   body: products.map((p) => [p.name, p.price + " FCFA", p.qty, p.total + " FCFA"]),
 });

 // Total final
 doc.setFontSize(14);
 doc.text("Total : " + totalAmount + " FCFA", 14, doc.lastAutoTable.finalY + 10);

 // Ajouter la signature
 doc.addImage(signatureData, "PNG", 140, doc.lastAutoTable.finalY + 20, 50, 25);
 doc.setFontSize(10);
 doc.text("Signature", 160, doc.lastAutoTable.finalY + 48, null, null, "center");

 // Télécharger
 doc.save(`facture-${clientName}.pdf`);
}

// Convertir une URL en base64
function toDataURL(url) {
 return fetch(url)
   .then((res) => res.blob())
   .then(
     (blob) =>
       new Promise((resolve) => {
         const reader = new FileReader();
         reader.onloadend = () => resolve(reader.result);
         reader.readAsDataURL(blob);
       })
   );
}
