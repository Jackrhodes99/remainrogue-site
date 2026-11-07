# Remain Rogue: Website

The online store for **www.remainrogue.com.au**. It's built with plain HTML, CSS and JavaScript, hosted free on **Cloudflare Pages**, with payments through **Stripe Checkout**.

- 🚀 **Setting it up for the first time?** Read **`SETUP-GUIDE.md`**.
- 📸 Product photos live in the `images` folder. Full-size originals are in Documents\Remain Rogue photos on your computer.

---

## What it costs

| Thing | Cost |
|---|---|
| Cloudflare Pages hosting + checkout function | Free plan (100,000 checkout requests a day; you won't come close) |
| GitHub | Free |
| Fonts (Anton, Archivo) | Free, open licence, stored in this folder |
| Stripe | No monthly fee; Stripe's normal per-sale fee only |
| Domain | Your existing GoDaddy renewal (unchanged) |

---

## Updating products (the most common job)

All products live in **one file: `products.json`.** You edit it right on the GitHub website, and your store updates by itself in 1–2 minutes.

### How to edit
1. Go to github.com and open your **remainrogue-site** repository.
2. Click **`products.json`**, then the ✏️ **pencil icon** (top right of the file).
3. Make your change (see below).
4. Click **Commit changes…**, then **Commit changes**.
5. Wait 1–2 minutes and refresh your website.

### Change a price
Find the product and change the numbers:
```json
"price": 53.40,          ← what the customer pays
"compareAtPrice": 89.00, ← the old price shown crossed out
```
- **End a sale:** set `"price": 89.00` and `"compareAtPrice": null`.
- Use numbers only: no `$` sign and no quotes around them.

### Hide a product (sold out) without deleting it
Change `"active": true` to `"active": false`.

### Show a product on the homepage
`"featured": true` puts it in the homepage product row; `false` removes it.

### Add a new product
1. Upload its photos to the **`images`** folder on GitHub (**Add file**, then **Upload files**). Use simple names like `new-polo-1.jpg`, under 1 MB each.
2. In `products.json`, copy a whole product block, from its `{` to its `},`, and paste it straight after another product.
3. Change every value. The **`id`** must be unique, lower-case, with dashes instead of spaces (e.g. `"sunset-polo"`). It becomes the web address: `/product/sunset-polo`.
4. Set `"images": ["/images/new-polo-1.jpg", "/images/new-polo-2.jpg"]`.
5. `"category"` must be `"polos"`, `"tees"` or `"caps"`.
6. `"sizes"`: e.g. `["XS", "S", "M", "L", "XL"]`. Use `[]` for one-size items like caps.
7. Also add a line to **`sitemap.xml`** so Google finds it (copy a product line and change the id).

### ⚠️ Rules that keep the file working
- Every product block except the **last one** ends with `},`. The last one ends with `}`, with no comma.
- Text goes in "double quotes". Numbers and `true` / `false` / `null` don't.
- Made a mistake and the shop stopped loading? Open `products.json` on GitHub, click **History**, open the previous version and copy it back. You can also paste the file into **jsonlint.com** to find the error.

### Change shipping prices
At the bottom of `products.json`:
```json
"australiaFlatRate": 9.99,
"freeShippingThreshold": 99.00,
"internationalFlatRate": 30.00
```
If you change these, also update the wording on these pages: `shipping-returns.html`, `faq.html`, the homepage `index.html`, and the announcement bar text in `assets/js/site.js`.

---

## Editing other things

| To change… | Edit this file |
|---|---|
| Announcement bar, footer email, Instagram, ABN, **online checkout on/off** (`checkoutOpen`) | `assets/js/site.js` (the `SITE` section at the top) |
| Menu links | `assets/js/site.js` (`renderHeader`) |
| Homepage text | `index.html` |
| About, FAQ, Shipping & Returns, Privacy, Terms | `about.html`, `faq.html`, `shipping-returns.html`, `privacy.html`, `terms.html` |
| Colours or fonts | `assets/css/style.css` (the `:root` section at the top) |
| Countries you ship to | `functions/api/checkout.js` (`INTERNATIONAL_COUNTRIES` at the top) |

Text pages are ordinary HTML: change the words between the tags, e.g. `<p>your words</p>`, and leave the `< >` parts alone.

---

## How the site works (for the curious)

```
index.html, shop.html, ...      The pages
product.html                    One page that shows ANY product (/product/<id>)
products.json                   ← all products, prices and shipping rates
assets/css/style.css            All the styling
assets/js/site.js               Header, footer, cart (saved in the visitor's browser)
assets/js/*.js                  Code for each page
functions/api/checkout.js       Runs on Cloudflare: checks prices and creates the Stripe checkout
functions/api/order.js          Runs on Cloudflare: shows order total on the thank-you page
_redirects                      Old Wix links → new pages; /product/<id> addresses
_headers                        Security and speed settings
sitemap.xml, robots.txt         For Google
images/                         Your product photos (see PHOTO-CHECKLIST.txt)
```

**Why prices can't be tampered with:** the cart in the browser only sends product ids, sizes and quantities. `functions/api/checkout.js` runs on Cloudflare's servers, looks up the real prices in `products.json`, works out shipping, and sends that to Stripe.

**Where your secret key lives:** only in Cloudflare's encrypted **Variables and Secrets** setting, called `STRIPE_SECRET_KEY`. It's never in these files. `sk_test_…` gives test payments; `sk_live_…` gives real payments.

**Orders:** every order appears in your Stripe dashboard under **Payments**, with the items, sizes, customer details and shipping address. Stripe can email you each one (see `SETUP-GUIDE.md`, Part 3c). There's no separate database to pay for.

## Credits
- Fonts: Anton and Archivo (SIL Open Font Licence). See `assets/fonts/LICENSE-fonts-OFL.txt`.
- Product and category photos: Remain Rogue's own.
- Hero contour graphic, social share image and icons: original artwork made for this site (no stock photos used).
