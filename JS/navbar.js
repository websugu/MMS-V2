import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// Render navbar with cart counter
export async function renderNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  const user = auth.currentUser;
  if (!user) {
    navbar.innerHTML = `
      <nav class="main-nav">
        <div class="nav-container">
          <a href="index.html" class="nav-logo">
            <img src="IMG/Store-logo-nav.png" width="150">
          </a>

          <button class="nav-mobile-toggle" onclick="toggleMobileNav()" aria-label="Menu">
            <i class="fas fa-bars"></i>
          </button>

          <div class="nav-links" id="nav-links">
            <a href="index.html" class="nav-link ${isActive('index.html')}">
              <i class="fas fa-home"></i> Boutique
            </a>
          </div>

          <div class="nav-profile">
            <a href="login.html" class="nav-link">
              <i class="fas fa-sign-in-alt"></i> Se connecter
            </a>
          </div>
        </div>
      </nav>
    `;
    return;
  }

  // Get cart item count (sum quantities)
  let totalItems = 0;
  try {
    const cartRef = collection(db, "users", user.uid, "cart");
    const snapshot = await getDocs(cartRef);
    snapshot.forEach(doc => {
      totalItems += doc.data().quantity || 1;
    });
  } catch (e) {
    console.error("Navbar cart count error:", e);
  }

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "U";

  navbar.innerHTML = `
    <nav class="main-nav">
      <div class="nav-container">
        <a href="index.html" class="nav-logo">
          <img src="IMG/Store-logo-nav.png" width="150">
        </a>

        

        <div class="nav-links" id="nav-links">
          <a href="index.html" class="nav-link ${isActive('index.html')}">
            <i class="fas fa-home"></i> Boutique
          </a>
        </div>

        <div class="nav-profile">
        <div class="card-display">
            <a href="cart.html" class="nav-link ${isActive('cart.html')}">
              <i class="fas fa-shopping-cart"></i>
              ${totalItems > 0 ? `<span class="nav-badge">${totalItems}</span>` : ''}
            </a>
          </div>
          <div onclick="window.location.href='account.html'" class="nav-avatar ${isActive('account.html')}" title="${user.email}">
            ${initials}
          </div>
          <div>
          <button class="nav-logout" onclick="logout()" title="Se déconnecter">
            <i class="fas fa-sign-out-alt"></i>
          </button>
          </div>
          
          <div> 
            <button class="nav-mobile-toggle" onclick="toggleMobileNav()" aria-label="Menu">
              <i class="fas fa-bars"></i>
            </button>
        </div>
        </div>
      </div>
    </nav>
  `;
}

function isActive(page) {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  return current === page ? 'active' : '';
}

window.toggleMobileNav = function() {
  const links = document.getElementById('nav-links');
  if (links) {
    links.classList.toggle('open');
  }
};

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  const links = document.getElementById('nav-links');
  const toggle = document.querySelector('.nav-mobile-toggle');
  if (links && toggle && !links.contains(e.target) && !toggle.contains(e.target)) {
    links.classList.remove('open');
  }
});

// Global logout
window.logout = function() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
};

