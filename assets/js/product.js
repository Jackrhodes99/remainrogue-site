/* Product page: works out which product to show from the web address
   (/product/mojito -> "mojito"), then builds the page from products.json. */
(async () => {
  const root = $("#product-root");
  const id = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || new URLSearchParams(location.search).get("id") || "");

  let data;
  try { data = await loadCatalog(); }
  catch { root.innerHTML = `<p>This product couldn't load. Please refresh the page.</p>`; return; }

  const p = data.products.find(x => x.id === id);
  if (!p) {
    document.title = "Product not found | Remain Rogue";
    root.outerHTML = `<div class="result"><div class="eyebrow">Not found</div><h1>Product not found</h1><p>This product may have sold out or moved.</p><div class="actions"><a class="btn" href="/shop">Shop all products</a></div></div>`;
    return;
  }

  /* ----- Page title, description and share details for this product ----- */
  const url = "https://www.remainrogue.com.au" + productUrl(p.id);
  document.title = `${p.name} | Remain Rogue`;
  setMeta("description", `${p.name} – ${p.colour}. ${p.description}`.slice(0, 158));
  setMeta("og:title", `${p.name} | Remain Rogue`, true);
  setMeta("og:url", url, true);
  setMeta("og:image", p.images[0], true);
  const canon = document.createElement("link"); canon.rel = "canonical"; canon.href = url; document.head.appendChild(canon);
  // Structured data so Google can show price and stock in search results
  const ld = document.createElement("script"); ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product", name: p.name, image: p.images,
    description: p.description, brand: { "@type": "Brand", name: "Remain Rogue" },
    offers: { "@type": "Offer", priceCurrency: "AUD", price: p.price.toFixed(2), availability: "https://schema.org/InStock", url }
  });
  document.head.appendChild(ld);

  /* ----- Build the page ----- */
  const onSale = p.compareAtPrice && p.compareAtPrice > p.price;
  const pct = onSale ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  const catName = (data.categories.find(c => c.id === p.category) || {}).name || "Shop";
  const hasSizes = p.sizes && p.sizes.length > 0;

  root.removeAttribute("aria-busy");
  root.innerHTML = `
    <div class="gallery">
      <div class="main"><img id="main-img" src="${esc(p.images[0])}" alt="${esc(p.name)}, ${esc(p.colour)}, photo 1" width="1000" height="1000" fetchpriority="high"></div>
      ${p.images.length > 1 ? `<div class="thumbs" role="group" aria-label="Product photos">${p.images.map((src, i) =>
        `<button type="button" id="thumb-${i}" data-i="${i}" aria-label="Show photo ${i + 1}" aria-current="${i === 0}"><img src="${esc(src)}" alt="" loading="lazy" width="200" height="200"></button>`).join("")}</div>` : ""}
    </div>
    <div class="buybox">
      <div class="crumbs"><a href="/shop">Shop</a> / <a href="/shop?category=${esc(p.category)}">${esc(catName)}</a></div>
      ${p.collection ? `<div class="eyebrow">${esc(p.collection)}</div>` : ""}
      <h1>${esc(p.name)}</h1>
      <div class="bigprice">${onSale ? `<s>${money(p.compareAtPrice)}</s><span class="visually-hidden">Now </span><b>${money(p.price)}</b><span class="save">Save ${pct}%</span>` : money(p.price)}</div>
      <div class="sub" style="font-size:16px">Colour: ${esc(p.colour)}</div>

      ${hasSizes ? `
      <div>
        <p class="field-label" id="size-label"><span>Size</span></p>
        <div class="sizes" role="group" aria-labelledby="size-label">${p.sizes.map(s =>
          `<button type="button" id="size-${esc(s)}" data-size="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join("")}</div>
        <p class="err" id="size-err" hidden>Please choose a size.</p>
      </div>` : `<div class="sub" style="font-size:16px">Size: One size</div>`}

      ${p.fitNote ? `<div class="fit">${esc(p.fitNote)}</div>` : ""}

      <div>
        <p class="field-label"><span>Quantity</span></p>
        <div class="buyrow">
          <div class="qty">
            <button type="button" id="qty-minus" aria-label="Decrease quantity">−</button>
            <input id="qty" type="number" min="1" max="10" value="1" inputmode="numeric" aria-label="Quantity">
            <button type="button" id="qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <button class="btn" type="button" id="add-to-cart">Add to cart</button>
        </div>
      </div>

      <div class="details">
        <details open><summary>Description</summary><p>${esc(p.description)}</p></details>
        <details><summary>Fabric &amp; care</summary><p>${esc(p.fabric)}. Wash cold, inside out. Don't tumble dry. Always check the care label.</p></details>
        <details><summary>Shipping &amp; returns</summary><p>$9.99 flat Australia-wide, free on orders $99+. International $30. 30-day returns on unworn items with tags attached. <a href="/shipping-returns">Full details</a>.</p></details>
      </div>
    </div>`;

  /* ----- Photo thumbnails ----- */
  root.querySelector(".thumbs")?.addEventListener("click", e => {
    const b = e.target.closest("[data-i]"); if (!b) return;
    const i = +b.dataset.i;
    const img = $("#main-img"); img.src = p.images[i]; img.alt = `${p.name}, ${p.colour}, photo ${i + 1}`;
    root.querySelectorAll(".thumbs button").forEach(x => x.setAttribute("aria-current", String(x === b)));
  });

  /* ----- Size buttons ----- */
  let size = hasSizes ? null : "One size";
  root.querySelector(".sizes")?.addEventListener("click", e => {
    const b = e.target.closest("[data-size]"); if (!b) return;
    size = b.dataset.size;
    root.querySelectorAll(".sizes button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    $("#size-err").hidden = true;
  });

  /* ----- Quantity ----- */
  const qty = $("#qty");
  const clamp = v => Math.max(1, Math.min(10, parseInt(v, 10) || 1));
  $("#qty-minus").onclick = () => qty.value = clamp(+qty.value - 1);
  $("#qty-plus").onclick = () => qty.value = clamp(+qty.value + 1);
  qty.onchange = () => qty.value = clamp(qty.value);

  /* ----- Add to cart ----- */
  const addBtn = $("#add-to-cart");
  addBtn.onclick = () => {
    if (!size) { $("#size-err").hidden = false; root.querySelector(".sizes button")?.focus(); return; }
    Cart.add(p.id, size, clamp(qty.value));
    addBtn.textContent = "Added to cart"; addBtn.classList.add("added");
    setTimeout(() => { addBtn.textContent = "Add to cart"; addBtn.classList.remove("added"); }, 1600);
    toast(`${esc(p.name)}${hasSizes ? " (" + esc(size) + ")" : ""} added. <a href="/cart">View cart</a>`);
  };

  /* ----- More products ----- */
  const more = data.products.filter(x => x.id !== p.id).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 3);
  if (more.length) { $("#more-grid").innerHTML = more.map(productCard).join(""); $("#more").hidden = false; }

  function setMeta(name, content, isProp) {
    const attr = isProp ? "property" : "name";
    let m = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!m) { m = document.createElement("meta"); m.setAttribute(attr, name); document.head.appendChild(m); }
    m.setAttribute("content", content);
  }
})();
