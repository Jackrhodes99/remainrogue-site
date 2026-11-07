/* Order success page: empties the cart and shows the order email and total. */
(async () => {
  Cart.clear();
  const id = new URLSearchParams(location.search).get("session_id");
  if (!id) return;
  try {
    const res = await fetch("/api/order?session_id=" + encodeURIComponent(id));
    if (!res.ok) return;
    const o = await res.json();
    if (o.paid) {
      $("#order-msg").innerHTML = `Your payment of <strong>${money(o.total)} ${esc(o.currency)}</strong> went through. A receipt is on its way to <strong>${esc(o.email)}</strong>.`;
    }
  } catch { /* keep the default message */ }
})();
