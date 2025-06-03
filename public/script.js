let productsContainer = document.getElementById("products");
let totalElement = document.getElementById("total");
let whatsappLink = document.getElementById("whatsappLink");
let whatsappPDFLink = document.getElementById("whatsappPDFLink");

function addProduct() {
  const div = document.createElement("div");
  div.className = "product";
  div.innerHTML = `
    <input type="text" placeholder="Produit" class="name" />
    <input type="number" placeholder="Prix" class="price" />
    <input type="number" placeholder="Quantité" class="qty" />
  `;
  productsContainer.appendChild(div);
}

// 🔄 Recalcul automatique du total
productsContainer.addEventListener("input", updateTotal);

function updateTotal() {
  let total = 0;
  const products = productsContainer.querySelectorAll(".product");
  products.forEach((prod) => {
    const price = parseFloat(prod.querySelector(".price").value) || 0;
    const qty = parseFloat(prod.querySelector(".qty").value) || 0;
    total += price * qty;
  });
  totalElement.innerText = total.toFixed(2);
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

async function generatePDF() {
  const token = localStorage.getItem("token");
  if (!token) return alert("Non autorisé");

  const client = document.getElementById("client").value;
  const logoFile = document.getElementById("logo").files[0];
  const signatureFile = document.getElementById("signature").files[0];

  const logo = await getBase64(logoFile);
  const signature = await getBase64(signatureFile);

  const products = [];
  document.querySelectorAll(".product").forEach((prod) => {
    const name = prod.querySelector(".name").value;
    const price = parseFloat(prod.querySelector(".price").value) || 0;
    const qty = parseFloat(prod.querySelector(".qty").value) || 0;
    if (name && price && qty) {
      products.push({ name, price, qty });
    }
  });

  const total = parseFloat(totalElement.innerText);

  const body = { client, logo, signature, products, total };

  try {
    const res = await fetch("/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.success) {
      const pdfURL = data.url;

      // Mise à jour du lien WhatsApp
      whatsappLink.href = `https://wa.me/?text=Bonjour%20${encodeURIComponent(
        client
      )}%2C%20voici%20votre%20facture%20:%20${encodeURIComponent(
        window.location.origin + pdfURL
      )}`;
      whatsappPDFLink.href = window.location.origin + pdfURL;
      whatsappPDFLink.style.display = "inline-block";

      alert("✅ Facture générée !");
    } else {
      alert("Erreur lors de la génération du PDF");
    }
  } catch (err) {
    console.error(err);
    alert("Erreur serveur");
  }
}
