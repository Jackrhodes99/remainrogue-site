/* ==========================================================================
   REMAIN ROGUE — shared code used on every page
   - Draws the header (logo, menu, cart icon) and footer, so they only need
     editing in ONE place: right here.
   - Loads the product list from /products.json
   - Stores the shopping cart in the visitor's browser (localStorage)
   ========================================================================== */

/* ---------- Business details shown in the footer ---------- */
const SITE = {
  name: "Remain Rogue",
  email: "remainrogue@gmail.com",
  instagram: "https://www.instagram.com/remainrogue",
  instagramHandle: "@remainrogue",
  abn: "84 415 772 446",
  location: "Queensland, Australia",
  announcement: "Free shipping Australia-wide on orders $99+",

  // ONLINE CHECKOUT SWITCH
  // true  = customers pay online through Stripe
  // false = checkout button is replaced by an "email us to order" message
  //         (use this while Stripe isn't activated yet)
  checkoutOpen: true
};

/* ---------- Small helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const money = n => "$" + Number(n).toFixed(2);           // 53.4 -> "$53.40"
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const productUrl = id => "/product/" + encodeURIComponent(id);

/* ---------- Product list ---------- */
let _catalog;
async function loadCatalog() {
  if (!_catalog) {
    _catalog = fetch("/products.json", { cache: "no-cache" })
      .then(r => { if (!r.ok) throw new Error("Could not load products"); return r.json(); })
      .then(data => {
        data.products = data.products.filter(p => p.active !== false);
        return data;
      });
  }
  return _catalog;
}

/* ---------- Cart (saved in the browser) ----------
   Each cart line is { id, size, qty }. Prices are NOT saved here; they are
   always read fresh from products.json, and checked again on the server. */
const CART_KEY = "rr_cart_v1";
const Cart = {
  read() {
    try { const v = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(v) ? v : []; }
    catch { return []; }
  },
  write(lines) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(lines)); } catch { /* storage blocked */ }
    updateBadge(true);
    document.dispatchEvent(new CustomEvent("cart:change"));
  },
  add(id, size, qty = 1) {
    const lines = Cart.read();
    const hit = lines.find(l => l.id === id && l.size === size);
    if (hit) hit.qty = Math.min(10, hit.qty + qty); else lines.push({ id, size, qty: Math.min(10, qty) });
    Cart.write(lines);
  },
  setQty(id, size, qty) {
    let lines = Cart.read();
    lines = qty <= 0
      ? lines.filter(l => !(l.id === id && l.size === size))
      : lines.map(l => (l.id === id && l.size === size) ? { ...l, qty: Math.min(10, qty) } : l);
    Cart.write(lines);
  },
  clear() { Cart.write([]); },
  count() { return Cart.read().reduce((n, l) => n + l.qty, 0); }
};

function updateBadge(animate) {
  const b = $("#cart-count");
  if (!b) return;
  const n = Cart.count();
  b.textContent = n;
  $("#cart-link")?.setAttribute("aria-label", `Cart, ${n} item${n === 1 ? "" : "s"}`);
  if (animate) { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
}

/* ---------- Pop-up message at the bottom of the screen ---------- */
function toast(html) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.innerHTML = html;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- Header ---------- */
function renderHeader() {
  const here = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  const cat = new URLSearchParams(location.search).get("category");
  const links = [
    ["Shop", "/shop", here === "/shop" && !cat],
    ["Polos", "/shop?category=polos", cat === "polos"],
    ["Tees", "/shop?category=tees", cat === "tees"],
    ["Caps", "/shop?category=caps", cat === "caps"],
    ["About", "/about", here === "/about"]
  ];
  const navLinks = links.map(([t, h, on]) => `<a href="${h}"${on ? ' aria-current="page"' : ""}>${t}</a>`).join("");
  const el = $("#site-header");
  if (!el) return;
  el.outerHTML = `
  <a class="skip" href="#main">Skip to content</a>
  <div class="announce"><div class="wrap">${esc(SITE.announcement)}</div></div>
  <header class="site-header">
    <div class="wrap bar">
      <div class="nav-left">
        <button class="menu-btn" id="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button>
        <nav class="main" aria-label="Main">${navLinks}</nav>
      </div>
      <a class="logo" href="/">REMAIN<span class="hollow"> ROGUE</span><span class="visually-hidden"> home</span></a>
      <div class="tools">
        <a class="hide-sm" href="/contact">Contact</a>
        <a class="cartlink" id="cart-link" href="/cart" aria-label="Cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
          <span class="badge" id="cart-count">0</span>
        </a>
      </div>
    </div>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile" hidden><div class="wrap">${navLinks}<a href="/faq">FAQ</a><a href="/contact">Contact</a></div></nav>
  </header>`;
  const btn = $("#menu-btn"), nav = $("#mobile-nav");
  btn.addEventListener("click", () => {
    const open = nav.hidden;
    nav.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  updateBadge(false);
}

/* ---------- Footer ---------- */
function renderFooter() {
  const el = $("#site-footer");
  if (!el) return;
  el.outerHTML = `
  <footer class="site-footer">
    <div class="wrap">
      <div class="fcols">
        <div><p class="fh">Get in touch</p><ul>
          <li><a href="/contact">${esc(SITE.email)}</a></li>
          <li><a href="${SITE.instagram}" target="_blank" rel="noopener">Instagram ${esc(SITE.instagramHandle)}</a></li>
          <li>${esc(SITE.location)}</li></ul></div>
        <div><p class="fh">Shop</p><ul>
          <li><a href="/shop">All products</a></li><li><a href="/shop?category=polos">Polos</a></li>
          <li><a href="/shop?category=tees">Tees</a></li><li><a href="/shop?category=caps">Caps</a></li></ul></div>
        <div><p class="fh">Help</p><ul>
          <li><a href="/faq">FAQ</a></li><li><a href="/shipping-returns">Shipping &amp; Returns</a></li>
          <li><a href="/contact">Contact</a></li><li><a href="/about">About</a></li></ul></div>
        <div><p class="fh">Legal</p><ul>
          <li><a href="/privacy">Privacy Policy</a></li><li><a href="/terms">Terms &amp; Conditions</a></li></ul></div>
      </div>
      <p class="fbig" aria-hidden="true">REMAIN<span class="hollow">ROGUE</span></p>
      <div class="legal"><span>© ${new Date().getFullYear()} ${esc(SITE.name)} · ABN ${esc(SITE.abn)}</span><span>All prices in Australian dollars (AUD)</span></div>
    </div>
  </footer>`;
}

/* ---------- Product card used on Home and Shop ---------- */
function productCard(p) {
  const onSale = p.compareAtPrice && p.compareAtPrice > p.price;
  const pct = onSale ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  return `
  <a class="card" href="${productUrl(p.id)}">
    <div class="ph">
      <img src="${esc(p.images[0])}" alt="${esc(p.name)}, ${esc(p.colour)}" loading="lazy" decoding="async" width="1000" height="1000">
      ${onSale ? `<span class="tag">${pct}% off</span>` : ""}
    </div>
    <div class="meta">
      <div><h3>${esc(p.name)}</h3><div class="sub">${esc(p.colour)}</div></div>
      <div class="price">${onSale ? `<s>${money(p.compareAtPrice)}</s><span class="visually-hidden">Now </span><b>${money(p.price)}</b>` : money(p.price)}</div>
    </div>
  </a>`;
}

/* ---------- Run on every page ---------- */
renderHeader();
renderFooter();
// Keep the cart count in sync if the cart changes in another tab
window.addEventListener("storage", e => { if (e.key === CART_KEY) updateBadge(false); });
