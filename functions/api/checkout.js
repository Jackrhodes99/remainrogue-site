/* ==========================================================================
   POST /api/checkout  —  creates a Stripe Checkout Session
   This runs on Cloudflare's servers (a "Pages Function"), never in the
   customer's browser, so your Stripe secret key stays private.

   Security:
   - The browser sends ONLY product ids, sizes and quantities.
   - Prices are looked up here from products.json, so nobody can change them.
   - The secret key comes from the encrypted STRIPE_SECRET_KEY setting in
     Cloudflare. It is never written in this code.

   Test mode vs live mode: whatever key you save in Cloudflare decides it.
   A key starting sk_test_ = test payments. A key starting sk_live_ = real money.
   ========================================================================== */

// Countries we deliver to outside Australia. Add or remove two-letter codes here.
const INTERNATIONAL_COUNTRIES = [
  "NZ", "US", "CA", "GB", "IE", "FR", "DE", "NL", "BE", "ES", "IT", "PT", "AT", "CH",
  "SE", "NO", "DK", "FI", "SG", "HK", "JP", "KR", "AE", "MY", "TH", "PH", "ID", "ZA", "MX"
];
const MAX_QTY_PER_LINE = 10;
const MAX_LINES = 30;

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: "Checkout isn't set up yet. Please contact us to order." }, 500);
  }

  // 1. Read what the browser sent
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const items = Array.isArray(body.items) ? body.items.slice(0, MAX_LINES) : [];
  const region = body.region === "INTL" ? "INTL" : "AU";
  if (!items.length) return json({ error: "Your cart is empty." }, 400);

  // 2. Load the real product list (same products.json the website uses)
  const origin = new URL(request.url).origin;
  const catalogRes = await env.ASSETS.fetch(new URL("/products.json", origin));
  if (!catalogRes.ok) return json({ error: "Products couldn't load. Please try again." }, 500);
  const catalog = await catalogRes.json();
  const products = new Map(catalog.products.filter(p => p.active !== false).map(p => [p.id, p]));
  const ship = catalog.shipping;

  // 3. Check every item and build Stripe line items using OUR prices
  const params = new URLSearchParams();
  let subtotalCents = 0;
  const summary = [];
  let i = 0;
  for (const item of items) {
    const p = products.get(String(item.id));
    if (!p) return json({ error: "An item in your cart is no longer available. Please remove it and try again." }, 400);
    const qty = Math.floor(Number(item.qty));
    if (!(qty >= 1 && qty <= MAX_QTY_PER_LINE)) return json({ error: "Please check the quantities in your cart." }, 400);
    const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;
    const size = hasSizes ? String(item.size) : "One size";
    if (hasSizes && !p.sizes.includes(size)) return json({ error: `Please choose a valid size for ${p.name}.` }, 400);

    const unit = toCents(p.price);
    subtotalCents += unit * qty;
    summary.push(`${qty}x ${p.name} (${size})`);

    const li = `line_items[${i}]`;
    params.append(`${li}[quantity]`, qty);
    params.append(`${li}[price_data][currency]`, "aud");
    params.append(`${li}[price_data][unit_amount]`, unit);
    params.append(`${li}[price_data][product_data][name]`, hasSizes ? `${p.name} – Size ${size}` : p.name);
    params.append(`${li}[price_data][product_data][description]`, p.colour || p.name);
    if (p.images && p.images[0]) params.append(`${li}[price_data][product_data][images][0]`, new URL(p.images[0], origin).href);
    params.append(`${li}[price_data][product_data][metadata][product_id]`, p.id);
    params.append(`${li}[price_data][product_data][metadata][size]`, size);
    i++;
  }

  // 4. Shipping: worked out here, not in the browser
  if (region === "AU") {
    const free = subtotalCents >= toCents(ship.freeShippingThreshold);
    addShipping(params, 0, free ? 0 : toCents(ship.australiaFlatRate),
      free ? "Free standard shipping (Australia)" : "Standard shipping (Australia)", 5, 7);
    params.append("shipping_address_collection[allowed_countries][0]", "AU");
  } else {
    addShipping(params, 0, toCents(ship.internationalFlatRate), "International shipping", 15, 20);
    INTERNATIONAL_COUNTRIES.forEach((c, n) => params.append(`shipping_address_collection[allowed_countries][${n}]`, c));
  }

  // 5. Other checkout settings
  params.append("mode", "payment");
  params.append("success_url", `${origin}/success?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${origin}/cancel`);
  params.append("phone_number_collection[enabled]", "true");   // couriers often need a phone number
  params.append("allow_promotion_codes", "true");             // lets you create discount codes in Stripe
  params.append("billing_address_collection", "auto");
  params.append("metadata[items]", summary.join(", ").slice(0, 490)); // shows in your Stripe dashboard
  params.append("payment_intent_data[description]", ("Remain Rogue order: " + summary.join(", ")).slice(0, 490));

  // 6. Ask Stripe to create the checkout page
  let res, session;
  try {
    res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });
    session = await res.json();
  } catch (e) {
    console.log("Could not reach Stripe:", e && e.message);
    return json({ error: "Checkout couldn't start. Please try again in a moment." }, 502);
  }
  if (!res.ok) {
    console.log("Stripe error:", session?.error?.message);   // visible in Cloudflare logs, not to customers
    return json({ error: "Checkout couldn't start. Please try again, or contact us." }, 502);
  }
  return json({ url: session.url });
}

// Anything other than POST gets a polite refusal
export function onRequest() {
  return json({ error: "Method not allowed" }, 405);
}

/* ---------- helpers ---------- */
function toCents(dollars) { return Math.round(Number(dollars) * 100); }

function addShipping(params, n, cents, name, minDays, maxDays) {
  const s = `shipping_options[${n}][shipping_rate_data]`;
  params.append(`${s}[type]`, "fixed_amount");
  params.append(`${s}[fixed_amount][amount]`, cents);
  params.append(`${s}[fixed_amount][currency]`, "aud");
  params.append(`${s}[display_name]`, name);
  params.append(`${s}[delivery_estimate][minimum][unit]`, "business_day");
  params.append(`${s}[delivery_estimate][minimum][value]`, minDays);
  params.append(`${s}[delivery_estimate][maximum][unit]`, "business_day");
  params.append(`${s}[delivery_estimate][maximum][value]`, maxDays);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
