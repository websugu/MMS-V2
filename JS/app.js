import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const container = document.getElementById("products-container");
const searchInput = document.getElementById("search-input");
const productCount = document.getElementById("product-count");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

let allProducts = [];
let activeCategory = 'all';

// Show skeleton loading
function showSkeleton(count = 6) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "skeleton-card";
    div.innerHTML = `
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-text" style="width: 70%;"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton-buttons">
        <div class="skeleton skeleton-btn"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    `;
    container.appendChild(div);
  }
}

// 🎨 Render products array to DOM
function renderProducts(products) {
  if (!container) return;

  container.innerHTML = "";

  if (productCount) {
    productCount.textContent = products.length > 0 ? `${products.length} product${products.length !== 1 ? 's' : ''}` : '';
  }

  if (products.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No products found</h3>
        <p>Try a different search term</p>
      </div>
    `;
    return;
  }

  products.forEach(({ id, product }) => {
    const div = document.createElement("div");
    div.classList.add("product");

    div.innerHTML = `
    <div onclick="window.location.href='product.html?id=${id}'">
    <div class="product-image-wrapper">
        <img src="${product.imageUrl}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300/e2e8f0/94a3b8?text=No+Image'">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="product-price">${Number(product.price).toLocaleString('en-IN')}F</div>
        <div class="product-actions">
          <button class="btn btn-primary" onclick="addToCart('${id}', '${product.name.replace(/'/g, "\\'")}', '${product.price}', '${product.imageUrl}')">
            <i class="fas fa-cart-plus"></i> Ajouté au panier
          </button>
        </div>
      </div>
    </div>
    `;

    container.appendChild(div);
  });
}

// 🛍 Load Products
async function loadProducts() {
  try {
    if (!container) {
      console.error("❌ Container not found");
      return;
    }

    showSkeleton(6);

    const querySnapshot = await getDocs(collection(db, "products"));

    if (querySnapshot.empty) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-box-open"></i>
          <h3>No Products Yet</h3>
          <p>Check back later for amazing deals</p>
        </div>
      `;
      if (productCount) productCount.textContent = "0 products";
      return;
    }

    allProducts = [];
    querySnapshot.forEach((docSnap) => {
      allProducts.push({ id: docSnap.id, product: docSnap.data() });
    });

    renderProducts(allProducts);

  } catch (error) {
    console.error("❌ Error loading products:", error);

    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>
        <h3>Failed to Load</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// 🔎 Search / Filter
function applyFilters() {
  const term = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let filtered = allProducts;

  // Category filter
  if (activeCategory !== 'all') {
    filtered = filtered.filter(({ product }) => product.category === activeCategory);
  }

  // Search filter
  if (term) {
    filtered = filtered.filter(({ product }) =>
      product.name.toLowerCase().includes(term)
    );
  }

  renderProducts(filtered);
}

if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

// Category chip click handlers
const categoryChips = document.getElementById('category-chips');
if (categoryChips) {
  categoryChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    activeCategory = chip.dataset.category || 'all';

    // Update active state
    categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    applyFilters();
  });
}

// Toast notification
function showToast(message) {
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// 🛒 ADD TO CART FUNCTION
window.addToCart = async function (id, name, price, imageUrl) {
  try {
    const user = auth.currentUser;

    if (!user) {
      showToast("Veuillez d'abord vous connecter.");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
      return;
    }

    const cartRef = doc(db, "users", user.uid, "cart", id);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      const data = cartSnap.data();
      await setDoc(cartRef, {
        ...data,
        quantity: data.quantity + 1
      });
    } else {
      await setDoc(cartRef, {
        name,
        price,
        imageUrl,
        quantity: 1
      });
    }

    showToast(`${name} Ajouté au panier!`);

  } catch (error) {
    console.error("Cart Error:", error);
    showToast("Error adding to cart");
  }
};

// 🚀 Run after load
loadProducts();

