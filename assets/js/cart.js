/* Cart page: shows what's in the cart, lets the customer change quantities
   or remove items, works out shipping, and sends them to Stripe Checkout.
   NOTE: the totals here are for display only. The real prices are checked
   again on the server (functions/api/checkout.js) so they can't be changed. */
(async () => {
  const root = $("#cart-root");
  let data;
  try { data = await loadCatalog(); }
  catch { root.innerHTML = `<p style="padding-block:40px">Your cart couldn't load. Please refresh the page.</p>`; return; }

  const ship = data.shipping;
  let region = "AU";
  try { region = localStorage.getItem("rr_region") || "AU"; } catch {}

  // Builds the order summary used in the "Email us to order" button
  function orderText(lines) {
    const rows = lines.map(l => {
      const p = data.products.find(x => x.id === l.id);
      return `${l.qty} x ${p.name} (${l.size}) - ${money(p.price * l.qty)}`;
    });
    return `Hi Remain Rogue, I'd like to order:\n\n${rows.join("\n")}\n\nShipping to (${region === "AU" ? "Australia" : "outside Australia"}):\nName:\nAddress:\nPhone:\n`;
  }

  function render() {
    // Drop anything that's no longer sold (removed or set inactive in products.json)
    const lines = Cart.read().filter(l => data.products.some(p => p.id === l.id));
    if (lines.length !== Cart.read().length) Cart.write(lines);

    if (!lines.length) {
      root.innerHTML = `<div class="empty"><p style="font-size:20px;margin:0">Your cart is empty.</p><a class="btn" href="/shop">Start shopping</a></div>`;
      return;
    }

    const subtotal = lines.reduce((s, l) => s + data.products.find(p => p.id === l.id).price * l.qty, 0);
    const freeAU = subtotal >= ship.freeShippingThreshold;
    const shipping = region === "AU" ? (freeAU ? 0 : ship.australiaFlatRate) : ship.internationalFlatRate;
    const toFree = Math.max(0, ship.freeShippingThreshold - subtotal);

    root.innerHTML = `
    <div class="cart">
      <div class="lines">${lines.map(l => {
        const p = data.products.find(x => x.id === l.id);
        const key = `${p.id}__${l.size}`.replace(/[^a-z0-9_-]/gi, "");
        return `<div class="line">
          <a class="thumb" href="${productUrl(p.id)}"><img src="${esc(p.images[0])}" alt="" loading="lazy" width="200" height="200"></a>
          <div>
            <h3><a href="${productUrl(p.id)}">${esc(p.name)}</a></h3>
            <div class="sub">${esc(p.colour)} · ${esc(l.size)} · ${money(p.price)} each</div>
            <div class="controls">
              <div class="qty">
                <button type="button" data-act="dec" data-id="${esc(p.id)}" data-size="${esc(l.size)}" aria-label="Decrease quantity of ${esc(p.name)}">−</button>
                <input id="q-${key}" type="number" min="1" max="10" value="${l.qty}" data-id="${esc(p.id)}" data-size="${esc(l.size)}" aria-label="Quantity of ${esc(p.name)}, size ${esc(l.size)}">
                <button type="button" data-act="inc" data-id="${esc(p.id)}" data-size="${esc(l.size)}" aria-label="Increase quantity of ${esc(p.name)}">+</button>
              </div>
              <button type="button" class="remove" data-act="remove" data-id="${esc(p.id)}" data-size="${esc(l.size)}">Remove</button>
            </div>
          </div>
          <div class="lineprice">${money(p.price * l.qty)}</div>
        </div>`;
      }).join("")}</div>

      <aside class="summary" aria-label="Order summary">
        <h2>Summary</h2>
        <label class="field-label" for="region" style="margin:0">Shipping to</label>
        <select id="region">
          <option value="AU"${region === "AU" ? " selected" : ""}>Australia</option>
          <option value="INTL"${region === "INTL" ? " selected" : ""}>Outside Australia</option>
        </select>
        ${region === "AU" ? `<div class="progress">${freeAU ? "You've unlocked <strong>free shipping</strong>." : `Spend <strong>${money(toFree)}</strong> more for free shipping.`}
          <div class="barline"><span style="width:${Math.min(100, subtotal / ship.freeShippingThreshold * 100).toFixed(0)}%"></span></div></div>` : ""}
        <div class="row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
        <div class="row"><span>Shipping</span><span>${shipping === 0 ? "Free" : money(shipping)}</span></div>
        <div class="row total"><span>Total (AUD)</span><span>${money(subtotal + shipping)}</span></div>
        ${SITE.checkoutOpen ? `
        <button class="btn block" type="button" id="checkout">Checkout</button>
        <p class="err" id="checkout-err" role="alert" hidden></p>
        <p class="small">You'll enter your address and payment on Stripe's secure checkout page. Discount codes can be added there.</p>` : `
        <div class="progress"><strong>Online checkout opens very soon.</strong><br>To order now, email us your cart (items, sizes and quantities) and delivery address at <strong>${esc(SITE.email)}</strong> and we'll reply with how to pay.</div>
        <a class="btn block" href="mailto:${SITE.email}?subject=${encodeURIComponent("Order request")}&body=${encodeURIComponent(orderText(lines))}">Email us to order</a>`}
        <a class="textlink" href="/shop">Continue shopping</a>
      </aside>
    </div>`;
  }

  /* ----- Buttons and inputs ----- */
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const line = Cart.read().find(l => l.id === b.dataset.id && l.size === b.dataset.size); if (!line) return;
    if (b.dataset.act === "inc") Cart.setQty(line.id, line.size, line.qty + 1);
    if (b.dataset.act === "dec") Cart.setQty(line.id, line.size, line.qty - 1);
    if (b.dataset.act === "remove") Cart.setQty(line.id, line.size, 0);
  });
  root.addEventListener("change", e => {
    if (e.target.id === "region") { region = e.target.value; try { localStorage.setItem("rr_region", region); } catch {} render(); return; }
    if (e.target.matches("input[data-id]")) Cart.setQty(e.target.dataset.id, e.target.dataset.size, Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0)));
  });
  root.addEventListener("click", async e => {
    if (e.target.id !== "checkout") return;
    const btn = e.target, err = $("#checkout-err");
    btn.disabled = true; btn.textContent = "Opening secure checkout…"; err.hidden = true;
    try {
      // Only ids, sizes and quantities are sent. The server looks up the prices.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: Cart.read(), region })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.url) throw new Error(out.error || "Checkout couldn't start. Please try again.");
      location.href = out.url;   // go to Stripe's secure payment page
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false;
      btn.disabled = false; btn.textContent = "Checkout";
    }
  });

  document.addEventListener("cart:change", render);
  window.addEventListener("storage", e => { if (e.key === CART_KEY) render(); });
  render();
})();
