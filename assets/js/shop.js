/* Shop page: shows every product, with category filter buttons.
   The chosen category is kept in the web address (e.g. /shop?category=polos)
   so it can be linked to and bookmarked. */
(async () => {
  const grid = $("#grid"), filters = $("#filters"), count = $("#count"), title = $("#shop-title");
  let data;
  try { data = await loadCatalog(); }
  catch { grid.innerHTML = `<p>Products couldn't load. Please refresh the page.</p>`; return; }

  const cats = [{ id: "all", name: "All" }, ...data.categories];

  function current() {
    const c = new URLSearchParams(location.search).get("category");
    return cats.some(x => x.id === c) ? c : "all";
  }

  function render() {
    const c = current();
    const list = c === "all" ? data.products : data.products.filter(p => p.category === c);
    const catName = cats.find(x => x.id === c).name;

    filters.innerHTML = cats.map(x =>
      `<button type="button" class="chip" id="f-${x.id}" data-cat="${x.id}" aria-pressed="${x.id === c}">${esc(x.name)}</button>`).join("");
    title.textContent = c === "all" ? "Shop all" : catName;
    document.title = (c === "all" ? "Shop All" : catName) + " | Remain Rogue";
    count.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
    grid.innerHTML = list.length ? list.map(productCard).join("") : `<p>Nothing here yet. Check back soon.</p>`;
  }

  filters.addEventListener("click", e => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    const url = new URL(location.href);
    if (b.dataset.cat === "all") url.searchParams.delete("category"); else url.searchParams.set("category", b.dataset.cat);
    history.pushState(null, "", url);
    render();
  });
  window.addEventListener("popstate", render);
  render();
})();
