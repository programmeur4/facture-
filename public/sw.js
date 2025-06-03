// Ton code principal ici...

// Enregistrement du service worker pour le PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("✅ Service Worker enregistré"))
      .catch((e) => console.error("❌ Erreur Service Worker :", e));
  });
}
