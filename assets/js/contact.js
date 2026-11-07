/* Contact page: copy-email button, and a form that opens the visitor's
   email app with their message filled in (no server or paid service needed). */
(() => {
  const email = "remainrogue@gmail.com";

  $("#copy-email").addEventListener("click", async e => {
    try { await navigator.clipboard.writeText(email); e.target.textContent = "Copied"; }
    catch {
      const r = document.createRange(); r.selectNodeContents($("#email"));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      e.target.textContent = "Press Ctrl+C / Cmd+C to copy";
    }
    setTimeout(() => e.target.textContent = "Copy email address", 2500);
  });

  $("#contact-form").addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target, name = f.name.value.trim(), subject = f.subject.value.trim(), msg = f.message.value.trim(), order = f.order.value.trim();
    if (!name || !subject || !msg) { $("#cf-err").hidden = false; return; }
    $("#cf-err").hidden = true;
    const body = `${msg}\n\n— ${name}${order ? `\nOrder number: ${order}` : ""}`;
    location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
