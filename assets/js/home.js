/* Home page: fills the category tiles and featured products from products.json */
(async () => {
  try {
    const data = await loadCatalog();

    // Category tiles
    $("#tiles").innerHTML = data.categories.map(c => {
      const n = data.products.filter(p => p.category === c.id).length;
      return `<a class="tile" href="/shop?category=${encodeURIComponent(c.id)}">
        <img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" decoding="async" width="825" height="1024">
        ${c.imageIsAI ? `<span class="ai-label">AI-generated</span>` : ""}
        <div class="label"><h3>${esc(c.name)}</h3><span class="go">${n} style${n === 1 ? "" : "s"}</span></div>
      </a>`;
    }).join("");

    // Featured products ("featured": true), or the first 6 products if none are marked
    let featured = data.products.filter(p => p.featured);
    if (!featured.length) featured = data.products.slice(0, 6);
    $("#featured").innerHTML = featured.map(productCard).join("");
  } catch (e) {
    $("#featured").innerHTML = `<p>Products couldn't load. Please refresh the page.</p>`;
  }
})();
