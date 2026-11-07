/* ==========================================================================
   GET /api/order?session_id=cs_...  —  used by the Order Success page to show
   the customer's email and order total. Returns only those few details.
   ========================================================================== */
export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("session_id") || "";
  // Stripe checkout session ids look like cs_test_... or cs_live_...
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id) || !env.STRIPE_SECRET_KEY) {
    return json({ error: "Not found" }, 404);
  }
  let s;
  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
    });
    if (!res.ok) return json({ error: "Not found" }, 404);
    s = await res.json();
  } catch {
    return json({ error: "Not available" }, 502);
  }
  return json({
    paid: s.payment_status === "paid",
    email: s.customer_details?.email || "",
    total: (s.amount_total || 0) / 100,
    currency: (s.currency || "aud").toUpperCase()
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
