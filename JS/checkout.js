import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const form = document.getElementById("checkout-form");
const summaryDiv = document.getElementById("order-summary");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

let orderTotal = 0;

// Toast
function showToast(message, icon = "fa-check-circle") {
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  const iconEl = toast.querySelector("i");
  if (iconEl) {
    iconEl.className = `fas ${icon}`;
    iconEl.style.color = icon === "fa-exclamation-circle" ? "#ef4444" : "#4ade80";
  }
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

// Skeleton loading
function showSkeleton() {
  if (!summaryDiv) return;
  summaryDiv.innerHTML = `
    <div class="order-summary-card">
      <div class="skeleton" style="height: 24px; width: 60%; border-radius: 8px; margin-bottom: 20px;"></div>
      <div style="display: flex; gap: 12px; margin-bottom: 14px;">
        <div class="skeleton" style="width: 56px; height: 56px; border-radius: 8px; flex-shrink: 0;"></div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center;">
          <div class="skeleton" style="height: 14px; width: 70%; border-radius: 6px;"></div>
          <div class="skeleton" style="height: 14px; width: 40%; border-radius: 6px;"></div>
        </div>
      </div>
      <div style="display: flex; gap: 12px; margin-bottom: 14px;">
        <div class="skeleton" style="width: 56px; height: 56px; border-radius: 8px; flex-shrink: 0;"></div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center;">
          <div class="skeleton" style="height: 14px; width: 60%; border-radius: 6px;"></div>
          <div class="skeleton" style="height: 14px; width: 35%; border-radius: 6px;"></div>
        </div>
      </div>
      <div class="skeleton" style="height: 14px; width: 100%; border-radius: 6px; margin-top: auto;"></div>
      <div class="skeleton" style="height: 48px; width: 100%; border-radius: 10px; margin-top: 10px;"></div>
    </div>
  `;
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  showSkeleton();
  await loadUserProfile(user.uid);
  await loadOrderSummary(user.uid);
});

async function loadUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const profile = userDoc.data();
      const phoneEl = document.getElementById("phone");
      const emailEl = document.getElementById("email");
      if (phoneEl) phoneEl.value = profile.phone || "";
      if (emailEl) emailEl.value = profile.email || "";
    }
  } catch (error) {
    console.error("Profile load error:", error);
  }
}

async function loadOrderSummary(uid) {
  const cartRef = collection(db, "users", uid, "cart");
  const snapshot = await getDocs(cartRef);

  orderTotal = 0;
  const items = [];

  snapshot.forEach((docSnap) => {
    const item = docSnap.data();
    const subtotal = item.price * item.quantity;
    orderTotal += subtotal;
    items.push({ id: docSnap.id, ...item, subtotal });
  });

  if (items.length === 0) {
    renderEmptyState();
    return;
  }

  renderSummary(items, orderTotal);
}

function renderSummary(items, total) {
  if (!summaryDiv) return;

  let itemsHtml = "";
  items.forEach((item) => {
    let variantHtml = "";
    if (item.selectedModel) variantHtml += `<div class="summary-item-variant">Model: ${item.selectedModel}</div>`;
    if (item.selectedColor) variantHtml += `<div class="summary-item-variant">Color: ${item.selectedColor}</div>`;

    itemsHtml += `
      <div class="summary-item">
        <img src="${item.imageUrl || "https://via.placeholder.com/56x56/e2e8f0/94a3b8?text=No+Img"}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/56x56/e2e8f0/94a3b8?text=No+Img'">
        <div class="summary-item-info">
          <div class="summary-item-name">${item.name} × ${item.quantity}</div>
          ${variantHtml}
          <div class="summary-item-price">${item.subtotal.toLocaleString("en-IN")}F</div>
        </div>
      </div>
    `;
  });

  summaryDiv.innerHTML = `
    <div class="order-summary-card">
      <h2>Votre commande</h2>
      ${itemsHtml}
      <div class="summary-row">
        <span>Subtotal</span>
        <span>${total.toLocaleString("en-IN")}F</span>
      </div>
      <div class="summary-row">
        <span>Expédition</span>
        <span style="color: #10b981; font-weight: 600;">Gratuit</span>
      </div>
      <div class="summary-row total">
        <span>Total</span>
        <span>${total.toLocaleString("en-IN")}F</span>
      </div>
      <button type="submit" form="checkout-form" class="place-order-btn">
        <i class="fas fa-lock"></i> Confirmer — ${total.toLocaleString("en-IN")}F
      </button>
    </div>
  `;
}

function renderEmptyState() {
  if (!summaryDiv) return;
  summaryDiv.innerHTML = `
    <div class="order-summary-card" style="text-align: center; padding: 40px 24px;">
      <i class="fas fa-shopping-basket" style="font-size: 48px; color: var(--border); margin-bottom: 16px;"></i>
      <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">Votre panier est vide.</h3>
      <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px;">Ajoutez des produits avant de passer à la caisse.</p>
      <a href="index.html" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: var(--primary); color: #fff; border-radius: var(--radius-sm); text-decoration: none; font-weight: 600;">
        <i class="fas fa-store"></i> Parcourir la boutique
      </a>
    </div>
  `;
}

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const shipping = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    address: document.getElementById("address").value.trim(),
    city: document.getElementById("city").value.trim()
  };
  const payment = document.querySelector("input[name='payment']:checked")?.value;

  // Validate required fields
  if (!shipping.name) {
    showToast("Veuillez entrer votre nom et prénom.", "fa-exclamation-circle");
    return;
  }
  if (!shipping.address) {
    showToast("Veuillez entrer votre adresse.", "fa-exclamation-circle");
    return;
  }
  if (!shipping.city) {
    showToast("Veuillez entrer votre pays.", "fa-exclamation-circle");
    return;
  }
  if (!payment) {
    showToast("Veuillez sélectionner un mode de paiement.", "fa-exclamation-circle");
    return;
  }

  const btn = form.querySelector("button[type='submit']") || document.querySelector(".place-order-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> En cours...`;
  }

  try {
    const cartQuery = query(collection(db, "users", user.uid, "cart"));
    const cartSnap = await getDocs(cartQuery);
    const items = [];
    let currentTotal = 0;

    cartSnap.forEach((docSnap) => {
      const item = docSnap.data();
      // Sanitize fields: Firestore rejects undefined
      const sanitizedItem = {
        id: docSnap.id,
        name: item.name || "Produit",
        price: typeof item.price === "number" ? item.price : 0,
        imageUrl: item.imageUrl || null,
        quantity: typeof item.quantity === "number" ? item.quantity : 1,
        selectedModel: item.selectedModel || null,
        selectedColor: item.selectedColor || null
      };
      items.push(sanitizedItem);
      currentTotal += sanitizedItem.price * sanitizedItem.quantity;
    });

    if (items.length === 0) {
      showToast("Votre panier est vide.", "fa-exclamation-circle");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-lock"></i> Confirmer — ${currentTotal.toLocaleString("en-IN")}F`;
      }
      return;
    }

    const ordersRef = collection(db, "orders");
    const orderRef = await addDoc(ordersRef, {
      ...shipping,
      payment,
      items,
      total: currentTotal,
      status: "pending",
      isNew: true,
      uid: user.uid,
      timestamp: serverTimestamp()
    });

    // Clear cart — await all deletions before redirect
    await Promise.all(cartSnap.docs.map((d) => deleteDoc(d.ref)));

    showToast("Commande passée avec succès!");
    setTimeout(() => {
      window.location.href = `success.html?orderId=${orderRef.id}`;
    }, 800);

  } catch (error) {
    console.error("Checkout error:", error.message || error);
    let msg = error.message || "Erreur inconnue";
    if (msg.toLowerCase().includes("permission")) {
      msg = "Permissions Firebase manquantes. Veuillez mettre à jour les règles Firestore pour autoriser la création de commandes.";
    }
    showToast("La commande a échoué. Veuillez réessayer. (" + msg + ")", "fa-exclamation-circle");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-lock"></i> Confirmer — ${orderTotal.toLocaleString("en-IN")}F`;
    }
  }
});

