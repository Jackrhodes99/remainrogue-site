# Remain Rogue: Setup Guide (step by step, for beginners)

Follow these parts in order. Everything here is **free**. Stripe only takes its normal fee on each sale.

You'll need about **1–2 hours** in total, spread over a day or two, because domain changes can take a few hours to switch over.

> 🔒 **Golden rule:** NEVER paste your Stripe **secret key** (it starts with `sk_`) into a chat (including with Claude), an email, or any file in this folder. It only ever goes into Cloudflare's encrypted settings (Part 3).

---

## Part 1: Put the website files on GitHub

GitHub stores your website files. Cloudflare reads them from there.

1. Unzip the website folder you downloaded. Open it so you can see `index.html`, `products.json`, the `assets` folder and so on.
2. Go to **github.com** and sign in. If you don't have an account yet, click **Sign up** and follow the steps (free).
3. Top-right, click the **+** button, then **New repository**.
4. Fill it in:
   - **Repository name:** `remainrogue-site`
   - Choose **Private** (only you can see the code; the website itself will still be public).
   - Leave everything else as it is. Click **Create repository**.
5. On the next page, click the link **uploading an existing file**.
6. Select **everything inside** the unzipped folder (all the files and folders, not the folder itself) and drag it into the browser window.
   - Check that `functions`, `assets` and `images` appear in the upload list. If folders don't upload, try a different browser (Chrome works best).
   - Files starting with a dot (`.gitignore`) may be hidden on your computer. That's fine; it's optional.
7. At the bottom, click **Commit changes**. Wait until the upload finishes.
8. You should now see `index.html`, `products.json`, `_redirects`, `_headers` and the folders listed in your repository.

---

## Part 2: Connect GitHub to Cloudflare Pages (free hosting)

1. Go to **dash.cloudflare.com** and sign in. If you don't have an account, sign up (free plan).
2. In the left menu, click **Workers & Pages**.
3. Click **Create application**, then choose **Pages**, then **Connect to Git**. Cloudflare sometimes shows Workers first; look for the **Pages** tab or a link that says something like "Looking to deploy Pages? Get started".
4. Click **Connect GitHub**, sign in to GitHub, and allow Cloudflare access to the `remainrogue-site` repository.
5. Select **remainrogue-site** and click **Begin setup**.
6. Settings:
   - **Project name:** `remainrogue` (this becomes `remainrogue.pages.dev`)
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** leave **empty**
   - **Build output directory:** `/`
7. Click **Save and Deploy**. After about a minute you'll see **Success** and a link like `https://remainrogue.pages.dev`.
8. Click the link. Your new store should load. Checkout won't work yet; that's Part 3.

From now on, **every time you change a file on GitHub, Cloudflare automatically updates the website within a minute or two.**

---

## Part 3: Add your Stripe key safely (test mode first)

### 3a. Copy your TEST secret key from Stripe
1. Go to **dashboard.stripe.com** and sign in.
2. Turn on **Test mode**. Look for a toggle or a "Test mode" / "Sandbox" switch, usually top-right. The dashboard turns orange or shows a test banner.
3. Click **Developers** (top right or bottom left), then **API keys**.
4. Next to **Secret key** (`sk_test_...`), click **Reveal**, then copy it. Don't paste it anywhere except step 3b.

### 3b. Save it in Cloudflare as an encrypted secret
1. In Cloudflare, go to **Workers & Pages**, click your **remainrogue** project, then **Settings**.
2. Find **Variables and Secrets** (sometimes "Environment variables") and click **Add**.
3. Fill in:
   - **Type:** **Secret** (this encrypts it; nobody can read it back, not even you)
   - **Variable name:** `STRIPE_SECRET_KEY` (exactly like this, in capitals)
   - **Value:** paste the `sk_test_...` key
4. Click **Save**. If asked which environment, choose **Production**. Adding it to **Preview** as well is fine.
5. The key only takes effect after a new deployment. Go to **Deployments**, find the top (latest) one, click the **⋯** menu and choose **Retry deployment**. Or just make any small edit on GitHub.

### 3c. Set up Stripe emails and branding (recommended)
- **Receipts to customers:** Stripe Dashboard, then **Settings**, then **Customer emails**. Turn on **Successful payments**.
- **Order alerts to you:** Stripe Dashboard, then your profile or **Settings**, then **Personal details / Communication preferences**. Turn on emails for **Successful payments**. Each email shows what was bought and the shipping address.
- **Make checkout look like your brand:** **Settings**, then **Branding**. Upload your logo or icon (`assets/img/icon-512.png` is in this folder), set the brand colour to `#d5feaf` and the accent to `#2f2c2c`.
- **Statement name:** **Settings**, then **Public details**. Set the statement descriptor to `REMAIN ROGUE`.

---

## Part 4: Test a purchase (no real money)

1. Open `https://remainrogue.pages.dev`.
2. Add a polo (pick a size) and a cap to your cart. Go to the cart and click **Checkout**.
3. On Stripe's page, enter:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** any future date, e.g. `12 / 34`
   - **CVC:** any 3 digits, e.g. `123`
   - Any name, any email you can check, and any Australian address.
4. Pay. You should land on the **"Thanks for going rogue"** page, and your cart should be empty.
5. In Stripe (still in test mode), go to **Payments**. You'll see the test order with the items and sizes, shipping address and amount.

**Also test:**
- An order **under $99** in Australia should charge $9.99 shipping.
- An order **$99 or more** in Australia should have free shipping.
- Choose **Outside Australia** in the cart. Shipping should be $30, and Stripe should only offer overseas countries.
- Click the back arrow on Stripe's page. You should see the **"No payment was taken"** page with your cart still full.
- Card `4000 0000 0000 0002` is a **declined** card. Stripe should show an error and take no order.

---

## Part 5: Connect your domain www.remainrogue.com.au (no downtime)

Your domain is registered at **GoDaddy** and currently shows your Wix site. We'll let Cloudflare manage the domain's DNS (free), which Cloudflare Pages needs for `remainrogue.com.au` without the www.

> **Do this at a quiet time,** e.g. a weeknight. Your old Wix site keeps working until the switch completes, so there's no downtime. The switch usually takes 1–4 hours, and occasionally up to 24.

### 5a. Write down your current settings (protects your email)
1. Sign in to **GoDaddy**, go to **My Products**, find **remainrogue.com.au**, and click **DNS** (or **Manage DNS**).
2. **Take screenshots of every record listed.** Pay special attention to:
   - **MX** records. These control email at `@remainrogue.com.au`, if you use it.
   - **TXT** records. These are used by Google, email and site verification.
3. Look at the **Nameservers** section on the same page.
   - If it says `ns1.wixdns.net` or similar, your domain's records are managed **in Wix**. Sign in to Wix, go to **Domains**, then **DNS records**, and screenshot those too.

### 5b. Add your domain to Cloudflare
1. In Cloudflare, click **Add a domain** (or **Add site**) and type `remainrogue.com.au`.
2. Choose the **Free** plan. You won't be charged; no card is needed.
3. Cloudflare scans and copies your existing DNS records. **Compare its list against your screenshots.** Make sure every **MX** and **TXT** record is there. If any are missing, click **Add record** and copy them in exactly.
4. Continue. Cloudflare shows you **two nameservers**, e.g. `ada.ns.cloudflare.com` and `bob.ns.cloudflare.com`. Keep this page open.

### 5c. Point GoDaddy at Cloudflare
1. In GoDaddy, go to the domain's **DNS** page.
2. If **DNSSEC** is turned on, turn it **off** first. Otherwise the domain can stop working during the switch.
3. In **Nameservers**, click **Change nameservers**, then **I'll use my own nameservers**.
4. Delete the old ones and enter the **two Cloudflare nameservers** exactly. Save and confirm.
5. Back in Cloudflare, click **Check nameservers**. You'll get an email when the domain is **Active**, usually within a few hours.

### 5d. Attach the domain to your store
Once Cloudflare says the domain is **Active**:
1. Go to **Workers & Pages**, then **remainrogue**, then **Custom domains**, then **Set up a domain**.
2. Type `www.remainrogue.com.au`, click **Continue**, then **Activate domain**.
   - If Cloudflare warns that an old `www` record exists (pointing to Wix), let it **replace** it.
3. Repeat for `remainrogue.com.au` (without www).
4. Wait a few minutes until both show **Active**, with a padlock (SSL) issued automatically.
5. Visit **https://www.remainrogue.com.au**. You should see the new store.

### 5e. (Optional) Always send visitors to the www address
In Cloudflare, open your domain, then **Rules**, then **Redirect Rules** (or **Rules overview**). Use the template **"Redirect from root to WWW"** and save. This is free.

### 5f. Check your email still works
Send a test email to any `@remainrogue.com.au` address you use and reply from it. If something's wrong, compare the **MX** and **TXT** records in Cloudflare against your screenshots and fix them. Your `@gmail.com` address isn't affected by any of this.

### 5g. Tell Stripe and Google
- In Stripe, go to **Settings**, then **Business / Public details**, and set your website to `https://www.remainrogue.com.au`.
- (Recommended) Go to **search.google.com/search-console**, add `remainrogue.com.au` using the **Domain** option, and verify it. Cloudflare can add the TXT record automatically. Then go to **Sitemaps** and submit `https://www.remainrogue.com.au/sitemap.xml`.

---

## Part 6: Go live (real payments)

Only do this after Part 4 tests pass and your domain works.

1. In Stripe, turn **Test mode off** and finish **activating your account** if asked: business details, ABN, and your bank account for payouts.
2. Go to **Developers**, then **API keys**. Reveal and copy the **live** secret key (`sk_live_...`).
3. In Cloudflare, go to **remainrogue**, then **Settings**, then **Variables and Secrets**. Find `STRIPE_SECRET_KEY`, click **Edit** (or delete it and add it again), paste the `sk_live_...` key, and save.
4. Go to **Deployments**, then the latest one, then **⋯**, then **Retry deployment**.
5. Do one real purchase of a cheap item (e.g. the cap) with your own card, then **refund it** in Stripe under **Payments**, then that payment, then **Refund**.
6. Check the live Stripe **Payments** page shows the order.

**To switch back to test mode at any time,** put the `sk_test_...` key back and redeploy.

---

## Part 7: Save your photos, then cancel Wix

Your product photos still load from Wix. Before cancelling Wix:
1. Follow `images/PHOTO-CHECKLIST.txt` (about 15 minutes).
2. Check every product page still shows its photos.
3. In Wix, disconnect the domain from your Wix site (go to **Domains**, then **remainrogue.com.au**, then **Disconnect**/**Remove**). **Don't** transfer or cancel the domain itself; it lives at GoDaddy.
4. Then cancel your Wix premium plan if you have one.

---

## If something goes wrong

| Problem | What to do |
|---|---|
| "Checkout isn't set up yet" | The Stripe key isn't saved, or you didn't redeploy. Redo Part 3b, including step 5. |
| "Checkout couldn't start" | Check the key was copied in full with no spaces. In Cloudflare, open the project, click the latest deployment, and look at **Functions** / **Logs** for the Stripe error. |
| Photos missing | The Wix links broke. Do Part 7 step 1. |
| My edit isn't showing | Wait 2 minutes, then refresh with **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac). In Cloudflare, check **Deployments**: a red ❌ means the change failed. |
| Site stopped working after an edit to products.json | The file probably has a typo, like a missing comma or quote. In GitHub, open the file's **History**, open the previous version, and copy it back. Or paste the file into **jsonlint.com** to find the mistake. |
| Email stopped working after the domain move | Compare the MX/TXT records in Cloudflare (open the domain, then **DNS**) against your GoDaddy screenshots and add any missing ones. |
