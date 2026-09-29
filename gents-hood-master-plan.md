# GENTS HOOD — Master Plan & AI Agent Prompt Pack

> Ei file ta tumi tomar AI agent ke dibe. Age **Part A (Agent Rules)** pura porte bolo, tarpor ekta ekta kore **Phase** er prompt copy-paste korbe. Ek phase shesh hole agent ke "Done when" checklist verify korte bolo, tarpor next phase.

---

# PART 0 — Quick Notes (tomar jonno)

1. Tumi color `#171718` ke "red" likhecho. Ota asholei **near-black (charcoal)**. Ami eta **Ink Black** hisebe dhorechi. Jodi sotti red chao, bolo, token change korle pura site auto change hobe.
2. Reference design ta (GAZU) er **layout, spacing, typography, section order** sob same hobe. Sudhu brand = Gents Hood, color = `#171718` + `#FFFFF3`, ar content = dress.
3. Reference er image-gulo copy korbe na. Agent ke tomar nijer dress er photo dite hobe (hero ke cutout PNG lagbe — Phase 2 te bola ache).

---

# PART A — AGENT RULES (Prothome eta paste koro)

```
Tumi ekjon Senior Full-Stack Engineer + Premium UI Designer. Amra "Gents Hood" naam er ekta premium e-commerce landing website banacchi.

NON-NEGOTIABLE RULES:
1. Ami jei phase dibo SHUDHU sei phase er kaj korbe. Next phase e nijer theke jabe na.
2. Kaj shuru korar age 5-10 line e plan likhbe: ki ki file banabe/edit korbe.
3. Kono kichu guess korbe na. Kono confusion thakle KAJ THAMIYE amake prosno korbe.
4. Kono placeholder ("TODO", "lorem ipsum", "coming soon") rakhbe na — real, polished content likhbe.
5. Shob code TypeScript strict mode e. `any` use kora jabe na.
6. Folder structure niche deoa architecture ba exact follow korbe. Nijer moto notun structure banabe na.
7. Prottek phase shesh e: (a) ki ki banalo tar list, (b) kivabe test korbe, (c) "Done when" checklist er prottekta tick kore dekhabe, (d) tarpor STOP kore amar approval er jonno wait korbe.
8. Existing kaj bhangbe na. Notun phase e purono code change korte hole age bolo keno.
9. Design tokens (color, font, spacing) SHUDHU tokens file theke ashbe. Component er vitor hardcoded hex color likha NISHEDH.
10. Mobile-first likhbe. Prottek section 360px, 390px, 768px, 1024px, 1440px e check korbe.
11. Accessibility: semantic HTML, alt text, focus ring, keyboard navigation, color contrast.
12. Security: shob input server-side e Zod diye validate korbe. Secret key kokhono client e jabe na.
13. Commit message clear likhbe (feat:, fix:, chore:).
14. Kono error hole nije fix kore bolo ki fix korle. Error chapa dibe na.
```

---

# PART B — FULL ARCHITECTURE

## B1. Tech Stack

| Layer | Choice | Keno |
|---|---|---|
| Framework | **Next.js 14+ (App Router) + TypeScript** | SSR/ISR, SEO, speed, API routes |
| Styling | **Tailwind CSS** + CSS variables (tokens) | Same-to-same design + easy theming |
| Animation | **Framer Motion** (light use) | Premium feel, but performance safe |
| Database | **PostgreSQL** | Tomar requirement |
| ORM | **Prisma** | Type-safe, migration easy |
| Cache / Rate limit | **Redis (Upstash)** | High traffic e DB er pressure komay |
| Image storage | **Cloudinary** (ba Cloudflare R2 + Images) | Auto resize/WebP/AVIF, CDN |
| Auth (admin) | **Auth.js (NextAuth) credentials** ba custom JWT + httpOnly cookie | Admin protected |
| Validation | **Zod** | Server + client same schema |
| State (cart) | **Zustand** (localStorage persist) | Guest cart |
| Forms | **React Hook Form + Zod** | Clean order form |
| Email/SMS | Resend (email) + BD SMS gateway (optional, later) | Order confirmation |
| Deploy | **Vercel** + Cloudflare (DNS/CDN/WAF) | Tomar existing plan |
| DB Hosting | **Neon** ba **Supabase** Postgres (pooled connection) | Vercel serverless er sathe connection pooling dorkar |
| Monitoring | Sentry + Vercel Analytics | Error track |

> **High traffic er jonno key decision:** Serverless e direct Postgres connection dile connection limit shesh hoye jai. Tai **PgBouncer / pooled URL** use korbo, ar public page gulo **ISR + Redis cache** diye serve korbo jate DB te request kom jai.

## B2. Folder Structure (Agent eta exact follow korbe)

```
gents-hood/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ public/
│  ├─ fonts/
│  └─ icons/
├─ src/
│  ├─ app/
│  │  ├─ (store)/
│  │  │  ├─ layout.tsx              # Announcement bar + Header + Footer
│  │  │  ├─ page.tsx                # Landing page
│  │  │  ├─ trending/page.tsx       # Best of Gents Hood full listing
│  │  │  ├─ product/[slug]/page.tsx # Premium product page
│  │  │  ├─ cart/page.tsx
│  │  │  ├─ checkout/page.tsx       # Clean order page
│  │  │  ├─ order-success/[orderNo]/page.tsx  # Thank-you page
│  │  │  ├─ track-order/page.tsx
│  │  │  ├─ account/page.tsx
│  │  │  ├─ contact/page.tsx
│  │  │  └─ (policies)/ returns, privacy, terms
│  │  ├─ admin/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ (panel)/layout.tsx      # Sidebar layout, auth guard
│  │  │  ├─ (panel)/dashboard/page.tsx
│  │  │  ├─ (panel)/products/       # list, new, [id]/edit
│  │  │  ├─ (panel)/featured/page.tsx   # Main hero product selector
│  │  │  ├─ (panel)/orders/         # list, [id]
│  │  │  ├─ (panel)/customers/
│  │  │  ├─ (panel)/site-settings/  # Social links, contact, announcement text
│  │  │  └─ (panel)/media/
│  │  ├─ api/
│  │  │  ├─ products/route.ts
│  │  │  ├─ orders/route.ts
│  │  │  ├─ orders/track/route.ts
│  │  │  ├─ admin/...               # Protected routes
│  │  │  └─ revalidate/route.ts
│  │  ├─ layout.tsx, globals.css, not-found.tsx, error.tsx
│  ├─ components/
│  │  ├─ layout/    (AnnouncementBar, Header, MobileMenu, Footer)
│  │  ├─ landing/   (Hero, GalleryStrip, FeaturedProduct, TrustBar, TrendingGrid)
│  │  ├─ product/   (ProductCard, Gallery, VariantPicker, QtySelector, PriceBlock, InfoTabs)
│  │  ├─ cart/      (CartDrawer, CartItem)
│  │  ├─ checkout/  (OrderForm, OrderSummary)
│  │  ├─ admin/     (DataTable, ImageUploader, ProductForm, StatCard)
│  │  └─ ui/        (Button, Input, Select, Modal, Skeleton, Toast, Badge)
│  ├─ lib/
│  │  ├─ db.ts (Prisma singleton)
│  │  ├─ redis.ts
│  │  ├─ auth.ts
│  │  ├─ cache.ts (getOrSet helpers)
│  │  ├─ rate-limit.ts
│  │  ├─ validators/ (zod schemas)
│  │  ├─ services/  (product.service, order.service, settings.service)
│  │  └─ utils/     (money, slug, order-number)
│  ├─ styles/tokens.css
│  ├─ store/cart.ts
│  ├─ types/
│  └─ middleware.ts                 # admin guard + basic rate limit
├─ .env.example
└─ README.md
```

**Rule:** Business logic `services/` e thakbe. Route handler / page e direct Prisma query likha jabe na.

## B3. Database Schema (PostgreSQL / Prisma)

Tables:

- **Product**: id, slug (unique), name, shortDescription, description (rich text), price, comparePrice, sku, status (DRAFT/ACTIVE/ARCHIVED), isTrending (bool), trendingOrder (int), fabric, fit, care, sizeChartJson, tagsJson, seoTitle, seoDescription, createdAt, updatedAt
- **ProductImage**: id, productId, url, alt, position, isPrimary
- **ProductVariant**: id, productId, size, color, colorHex, sku, stock, priceOverride?
- **SiteSetting** (key/value JSON): `featuredProductId`, `announcementText`, `contactPhone`, `contactEmail`, `whatsapp`, `address`, `socialLinks` (facebook, instagram, tiktok, youtube, whatsapp, messenger), `deliveryCharges` (inside Dhaka / outside Dhaka), `heroTagline`, `heroBackgroundWord`
- **Customer**: id, name, phone (indexed), email?, createdAt
- **Address**: id, customerId, fullName, phone, district, area, addressLine, isDefault
- **Order**: id, orderNo (unique, e.g. GH-240929-0001), customerId?, status (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED), paymentMethod (COD, BKASH, NAGAD, CARD), paymentStatus, subtotal, deliveryCharge, discount, total, shippingName, shippingPhone, shippingDistrict, shippingArea, shippingAddress, note, idempotencyKey (unique), createdAt
- **OrderItem**: id, orderId, productId, variantId, nameSnapshot, sizeSnapshot, colorSnapshot, priceSnapshot, qty, imageSnapshot
- **OrderStatusHistory**: id, orderId, status, note, createdAt (tracking timeline)
- **AdminUser**: id, email, passwordHash (argon2/bcrypt), role (OWNER/STAFF), createdAt
- **AuditLog**: id, adminId, action, entity, entityId, metaJson, createdAt

**Indexes (must):** Product(slug), Product(status, isTrending, trendingOrder), Order(orderNo), Order(shippingPhone), Order(status, createdAt), Customer(phone), ProductVariant(productId).

**Rules:**
- Order e product er **snapshot** save hobe (price, name) jate pore product change holeo old order thik thake.
- Stock reduce hobe **transaction** er vitor (`SELECT ... FOR UPDATE` ba Prisma atomic update) — oversell rukhte.
- Duplicate order rukhte `idempotencyKey`.

## B4. Main Product Logic (tomar most important requirement)

- `Product` table e ekta dress ke "main" banano jabe na alada column diye; bhabe: `SiteSetting.featuredProductId` e product id thakbe.
- Admin → **Featured Product** page: dropdown/search e shob ACTIVE product (Trending section er product-shoho) dekhabe. Ekta select kore "Set as Main Product" chaple landing er **NEW VIBES** section er product change hoye jabe. Kono code change lagbe na.
- Change korle cache invalidate (`revalidateTag('featured')`) hobe, tai visitor instantly notun main product dekhbe.
- Trending section e unlimited product add kora jabe (admin → Products → isTrending = true). Trending ordering drag-drop.
- Main product o Trending list e thakte pare — ata allowed.

## B5. High Traffic Strategy

1. **Landing / Trending / Product page = ISR** (revalidate 60s + on-demand revalidate admin change korle).
2. **Redis cache**: featured product, trending list, site settings — TTL 60–300s, admin update e invalidate.
3. **Pooled DB connection** (Neon pooled URL / PgBouncer). Prisma singleton.
4. **Cloudflare** front e: CDN cache, WAF, bot protection, DDoS shield.
5. **Images**: Cloudinary auto format (AVIF/WebP), responsive `sizes`, `priority` only hero LCP image, baki lazy.
6. **Fonts**: `next/font`, subset, `display: swap`.
7. **Order API**: rate limit (IP + phone), idempotency key, transaction, small payload. Fail hole friendly error.
8. **Queue heavy work** (email/SMS/notification) — order response block korbe na; background e pathabe (Vercel `after()` / Upstash QStash).
9. **Bundle**: dynamic import (Cart drawer, admin charts), no heavy libs on landing.
10. **Targets**: Lighthouse Mobile ≥ 90 Performance, LCP < 2.5s, CLS < 0.05, INP < 200ms.
11. **DB**: read replica later jodi lage; slow query log; proper indexes.
12. **Load test**: k6 diye 500–1000 concurrent user test kora (Phase 10).

## B6. Security Checklist

- Admin route middleware guard + httpOnly, secure, sameSite cookie
- Password hashing (argon2/bcrypt), login rate limit + lockout
- Zod validation shob API te, output sanitize (XSS)
- CSRF protection (sameSite + origin check)
- Order tracking: **orderNo + phone** duijon match na hole info dekhabe na (data leak rukhte)
- Cloudflare Turnstile (captcha) order form + admin login e
- Secure headers (CSP, HSTS, X-Frame-Options)
- `.env` secret kokhono commit hobe na
- Payment gateway thakle server-side webhook verify
- Daily DB backup

## B7. SEO & Tracking

- Metadata + OpenGraph + Twitter card, `sitemap.xml`, `robots.txt`
- Product JSON-LD schema
- Meta Pixel + Conversions API ready (Facebook ad er jonno BD te dorkar) — events: ViewContent, AddToCart, InitiateCheckout, Purchase
- Google Analytics 4

---

# PART C — DESIGN SYSTEM (Reference: GAZU screenshot, same-to-same)

## C1. Color Tokens (`src/styles/tokens.css`)

```css
:root {
  --ink:        #171718;  /* reference er black er jaygay */
  --cream:      #FFFFF3;  /* reference er white/light er jaygay */
  --cream-soft: #F4F4E6;  /* section bg variation (cream er ektu dark) */
  --ink-soft:   #2A2A2C;  /* hover on ink */
  --line:       rgba(23,23,24,0.12);   /* borders on cream */
  --line-inv:   rgba(255,255,243,0.16);/* borders on ink */
  --muted:      #6B6B66;  /* secondary text on cream */
  --muted-inv:  #B9B9AE;  /* secondary text on ink */
  --success:    #2E7D5B;
  --danger:     #B3382C;
}
```

Rule: reference er jekhane **black** — `--ink`, jekhane **white/off-white** — `--cream`. Pure `#000` / `#fff` kothao use kora jabe na.

## C2. Typography

- Font: clean geometric grotesk — **"Inter Tight"** ba **"Manrope"** (Google Font) — reference er moto wide, clean, uppercase tracking.
- Hero background word "GENTS HOOD": very large, weight 500–600, tight letter-spacing, `clamp(6rem, 22vw, 22rem)`.
- Small labels (FASHION THAT MOVES WITH YOU, NEW COLLECTION, NEW SEASON): 11–12px, uppercase, `letter-spacing: 0.28em`.
- Section headings ("NEW VIBES"): 56–72px desktop, 700, line-height 0.95, uppercase.
- Nav/link text: 11–12px uppercase, tracking 0.12em.
- Bangla text lagle: "Hind Siliguri" ba "Noto Sans Bengali" fallback.

## C3. Layout Grid & Spacing

- Container max-width 1440px, side padding: 24px mobile / 40px tablet / 56px desktop.
- Section vertical spacing: 96–128px desktop, 64px mobile.
- Buttons: rectangle (border-radius 0–2px), padding 16px 32px, uppercase 11–12px, tracking 0.14em. Primary = `--ink` bg + `--cream` text. Secondary = text link with 1px underline.
- Image: sharp corners, no shadow. Subtle grain/soft shadow only under hero model.

---

# PART D — PAGE-BY-PAGE SPEC

## D1. Announcement Bar (top strip)
- Full-width `--ink` bar, height 32px, cream 10–11px uppercase text.
- Left: "FREE DELIVERY ON ORDERS ABOVE ৳X" (admin editable).
- Right: "TRACK ORDER | HELP" links. (Reference er "Download app" bad.)

## D2. Header (Navbar)
- Cream background, sticky, thin bottom border on scroll.
- **Left:** `CONTACT`, `TRENDING` (Best of Gents Hood page link).
- **Center:** Logo text **GENTS HOOD** (bold, wide tracking, ~28px).
- **Right:** `TRACK ORDER`, `CART (0)` with live count, `ACCOUNT`. Icon + label desktop e, mobile e shudhu icon.
- **Mobile:** hamburger left, logo center, cart icon right. Full-screen menu (ink bg, cream text) with Contact, Trending, Track Order, Account.

## D3. Hero (reference er hero same-to-same)
- Cream bg. Left top: small tagline "FASHION / THAT MOVES / WITH YOU." + short underline.
- Center: giant word **GENTS HOOD** (2 lines on mobile if needed) behind the model.
- Model: **transparent PNG cutout** tomar dress pora model. Model image text er **opor** e overlap korbe (reference e jemon model "A" ar "Z" er upor). Soft ground shadow.
- Bottom-left: `SHOP NOW` (filled ink button → scrolls to New Vibes section) + `EXPLORE NEW IN` (underline link → Trending page).
- Bottom-right: small text "NEW COLLECTION / 2025" with underline. Year auto dynamic.
- Mobile: text scale down, model centered, buttons stacked/side-by-side full width.

## D4. Category Strip → "Main Product Gallery Strip"
- Full-width `--ink` band (reference er black strip).
- Reference e Men/Women/Kids ache; tomar ekhane **main product er gallery image** hobe: 3 ta card (main product er 3 ta different photo — front, detail, back/lifestyle), image-sm 70×94 style thumbnail + title + 2 line text + "VIEW →" link.
- Card click korle → main product er **big image gallery lightbox** khulbe, ba product page e jabe.
- Images admin theke featured product er gallery theke auto ashbe.
- Mobile: horizontal scroll snap ba 1-column stack.

## D5. NEW VIBES — Main Product Section (Landing er heart)
- Reference er "NEW SEASON / NEW VIBES" section er layout: soft cream-soft/gray-tone bg, left e text, right e big product image (full-bleed, bottom aligned).
- Left content stack:
  - Label: "NEW SEASON"
  - Heading: **NEW VIBES**
  - Product name (Dress), rating stars (optional), price + compare price (strike) + discount badge
  - Short premium description (2 line)
  - **Color selector** (round swatches)
  - **Size selector** (chips: S M L XL XXL) + "Size Guide" link → modal size chart
  - **Quantity selector** (− 1 +), stock limit maintain
  - Stock indicator ("Only 5 left")
  - Buttons: **ADD TO CART** (outlined) + **ORDER NOW** (filled ink)
  - Delivery info line, return policy line
  - Premium **Info Tabs/Accordion**: Description, Fabric & Care, Fit & Size, Delivery & Return
- Behavior:
  - Size/Color select na korle Add to Cart / Order Now disabled hobe + clear message.
  - **Add to Cart** → cart drawer slide-in from right, item add, subtotal dekhabe.
  - **Order Now** → direct `/checkout` e niye jabe ei item niye (cart e existing item thakle o ei single-item flow alada).
- Right image: main product er primary image, gallery thumbnails dot/arrow diye change kora jabe, hover e zoom (desktop), swipe (mobile).

## D6. Trust Bar (reference er 4 icon row)
- 4 ta: Fast Delivery / Easy Returns (7 din ba jeta tumi dao) / Quality Assured / Secure Payment (ba Cash on Delivery).
- Thin line icons (Lucide), cream bg, mobile e 2×2 grid.

## D7. TRENDING — "Best of Gents Hood" Section
- Heading: **TRENDING** (label: "BEST OF GENTS HOOD"), right e `VIEW ALL` underline link → `/trending`.
- 4-column grid desktop, 2-column mobile. Product card: 3:4 image, wishlist heart (top-right), name, price, hover e second image + "Quick Add" bar.
- Data source: `isTrending = true` products, admin order onujayi. Unlimited product — landing e prothom 8 ta, `/trending` page e pagination/infinite load.
- Card click → `/product/[slug]`.

## D8. Trending Page (`/trending`)
- Same header/footer. Filter (size, price range), sort (Newest, Price low-high), grid, skeleton loading, pagination.

## D9. Premium Product Page (`/product/[slug]`)
- Desktop: left sticky gallery (thumbnails vertical + big image + zoom), right details.
- Mobile: swipeable gallery with dots, sticky bottom bar (Price + Add to Cart + Order Now).
- Details: breadcrumb, name, price block, color/size/qty pickers, size chart modal, Add to Cart, Order Now, delivery estimate, accordion (Description, Fabric, Care, Delivery & Return), trust icons.
- Below: "You may also like" (Trending theke), recently viewed.
- Sob product order kora jabe ekhan theke — same cart/checkout flow.
- JSON-LD + OG tags.

## D9.5 Cart
- Drawer (quick) + `/cart` page. Qty change, remove, subtotal, delivery estimate, "Proceed to Checkout".

## D10. Order / Checkout Page (`/checkout`) — Clean & Safe
- **Notun page**, header e sudhu logo + "Secure Checkout" lock badge (distraction free, footer minimal).
- Layout: left form, right order summary (mobile e summary collapsible top e).
- Form fields (minimal): Full name, Phone (BD format validate 01XXXXXXXXX), Email (optional), District (dropdown), Area/Thana, Full address, Order note (optional).
- Delivery charge auto: Dhaka vs outside Dhaka (admin editable).
- Payment method: **Cash on Delivery** (default). bKash/Nagad optional later phase.
- Order summary: item image, name, size/color, qty change, subtotal, delivery, total.
- Trust: "Your information is safe", SSL lock, return policy link.
- Button: **PLACE ORDER** (loading state, double-click prevent, idempotency key).
- Turnstile captcha invisible.
- Validation error inline, friendly.
- Success → `/order-success/[orderNo]`.

## D11. Order Success / Thank-You Page
- Big check icon, "ধন্যবাদ! / Thank you for your order 🎉" — **abhinondon** message: "Congratulations! Your order has been placed successfully."
- Order number, summary, estimated delivery, "We will call you to confirm shortly".
- Buttons: Track Order, Continue Shopping.
- Refresh e duplicate order hobe na.
- Confirmation email/SMS (jodi email deoa thake).

## D12. Track Order Page
- Input: Order Number + Phone → status timeline (Placed → Confirmed → Processing → Shipped → Delivered), date/time, courier info (jodi thake).

## D13. Account Page
- Phase 1: simple — phone OTP ba email login **optional**; order history phone diye dekha. (Guest checkout always allowed. Jodi full account na chao, ei page e "My Orders" + "Track" rakho.)

## D14. Contact Page
- Phone, WhatsApp, email, address, map embed, simple message form (rate limited).

## D15. Premium Advanced Footer
- Full `--ink` bg, cream text, thick premium spacing.
- Top: big **GENTS HOOD** wordmark (huge, low opacity outline/solid), newsletter signup ("Join the Hood — get early access").
- Columns: Shop (Trending, New In), Help (Track Order, Contact, Returns, Size Guide), Company (About, Privacy, Terms), Contact info.
- **Social icons**: Facebook, Instagram, TikTok, YouTube, WhatsApp, Messenger — links **admin site-settings theke** ashbe (hover animation).
- Payment/COD badges, "Made with ♥ by Tamim Labs" (optional).
- Bottom: copyright + "Back to top" button.
- Mobile: accordion columns.

## D16. Admin Panel
- Login (secure), Dashboard (today orders, revenue, pending, low stock, chart).
- **Products**: add/edit/delete, multi-image upload + reorder, variants (size/color/stock), price, compare price, fabric/care/size chart, status, **"Show in Trending" toggle**, SEO fields.
- **Featured (Main Product)**: Trending/Active product list theke select kore "Set as Main Product" — instant landing update.
- **Orders**: list + filter (status, date, phone), order details, status change (timeline auto log), print invoice/packing slip, export CSV, admin note.
- **Customers**: list, order count.
- **Site Settings**: announcement text, delivery charge, contact info, **social media links**, hero tagline, free delivery threshold.
- **Media library**.
- Audit log. Mobile e o usable.

---

# PART E — PHASED PROMPTS (Ekta ekta kore agent ke dao)

## PHASE 0 — Project Setup

```
PHASE 0: Project setup. SHUDHU eta korbe, design ba feature banabe na.

1. Next.js 14+ (App Router) + TypeScript strict + Tailwind CSS + ESLint + Prettier + Husky/lint-staged setup koro.
2. Folder structure exactly ei rokom banao (empty folder e .gitkeep): [Part B2 er structure paste koro]
3. Prisma + PostgreSQL connection setup (pooled URL + direct URL), `src/lib/db.ts` singleton.
4. `.env.example` banao: DATABASE_URL, DIRECT_URL, UPSTASH_REDIS_REST_URL/TOKEN, CLOUDINARY_*, AUTH_SECRET, ADMIN_EMAIL, TURNSTILE_*, NEXT_PUBLIC_SITE_URL, SENTRY_DSN.
5. next/font diye "Inter Tight" load koro.
6. README.md te setup steps likho.
7. `npm run build` pass korte hobe.

Done when: build pass, lint pass, folder structure thik, dev server e blank home page cholche.
Tarpor STOP koro.
```

## PHASE 1 — Design System & Layout Shell

```
PHASE 1: Design system + layout shell.

1. `src/styles/tokens.css` e ei tokens banao: [Part C1 paste koro]. Tailwind config e ei tokens map koro (ink, cream, cream-soft, muted, line...). Pure #000/#fff kothao use korbe na.
2. Typography scale + utility classes banao (label-caps, display-xl, heading-lg, nav-link) [Part C2 onujayi].
3. Base UI components: Button (primary/secondary-link), Input, Select, Badge, Skeleton, Modal, Toast. Sob accessible, focus-visible ring soho.
4. Layout components: AnnouncementBar, Header (Left: Contact, Trending | Center: GENTS HOOD | Right: Track Order, Cart(count), Account), MobileMenu (full screen ink bg), Footer (ekhon basic placeholder-free simple version, advanced footer Phase 8 e hobe).
5. Header sticky, scroll e thin border.
6. Cart count ekhon Zustand store theke (store/cart.ts) — persist localStorage.
7. Storybook lagbe na, kintu ekta temporary `/design-check` page banao jekhane shob component dekha jai (Phase 10 e delete korbe).

Done when: mobile (360/390) ar desktop (1440) e header/announcement bar reference er moto dekhay, mobile menu kaj kore, colors sob token theke.
Screenshot dekhao. Tarpor STOP koro.
```

## PHASE 2 — Landing Page Static UI (Hero → Trust Bar)

```
PHASE 2: Landing page UI — SHUDHU frontend, hardcoded sample data diye (database Phase 3 e).

Reference screenshot exactly follow koro (layout, spacing, proportion, typography). Shudhu color: black => #171718, white/light => #FFFFF3. Brand text: GENTS HOOD.

Sections (order): Hero → Gallery Strip (ink band) → NEW VIBES main product section → Trust Bar.
Detail spec: [Part D3, D4, D5, D6 paste koro]

Important:
- Hero te giant "GENTS HOOD" text model er PIECHHE, model cutout PNG text er UPOR (overlap). Ami transparent PNG dibo `/public/images/hero-model.png`; ekhon ekta placeholder cutout use koro ar clearly comment likho kothay replace korbe.
- NEW VIBES section e: color swatch, size chips, quantity selector, Add to Cart, Order Now — full working UI state (select na korle button disabled).
- Add to Cart => cart store e item add + CartDrawer open. Order Now => `/checkout` e redirect (checkout page Phase 5 e, ekhon simple placeholder route).
- Image gallery: thumbnails, swipe (mobile), hover zoom (desktop).
- Framer Motion: sudhu subtle fade/slide-up on scroll. Heavy animation nishedh.
- next/image, hero image `priority`, baki lazy, proper `sizes`.

Responsive check: 360, 390, 768, 1024, 1440. Kono horizontal scroll thakbe na, text overlap hobe na.

Done when: reference er sathe side-by-side compare korle proportion/spacing/typography match kore, sob breakpoint e sundor.
Screenshot dekhao (desktop + mobile). STOP koro.
```

## PHASE 3 — Database, Services, Caching

```
PHASE 3: Database + backend services.

1. Prisma schema likho: [Part B3 er sob table/field/index paste koro]. Migration run koro.
2. `prisma/seed.ts`: 1 ta main dress product (3 color, 4 size, 5 image), 8 ta trending product, SiteSetting default (social links placeholder URL, delivery charge Dhaka 70 / outside 130, announcement text), 1 admin user (env theke).
3. Services (`lib/services`): product.service (getFeatured, getTrending, getBySlug, list w/ pagination), settings.service, order.service (createOrder — transaction, stock check + decrement, snapshot, idempotency, order number generate, status history) — abhi order.service sudhu likho, UI Phase 5 e.
4. Redis cache helper `getOrSet(key, ttl, fn)`; featured, trending, settings cache koro (TTL 120s) + invalidate function.
5. Landing page ke hardcoded data theke real DB data e switch koro (ISR revalidate 60 + tag revalidate).
6. Zod schemas `lib/validators`.
7. Unit test: createOrder (stock kome, oversell hoy na, duplicate idempotencyKey e ek order).

Done when: seed run hoy, landing page DB theke data dekhay, tests pass, DB query e proper index ache (EXPLAIN dekhao 2 ta main query er).
STOP koro.
```

## PHASE 4 — Trending Section, Trending Page, Product Page

```
PHASE 4: Trending + Product page.

1. Landing e TRENDING section (Part D7) — DB theke isTrending products, admin order onujayi, max 8, VIEW ALL => /trending.
2. ProductCard: 3:4 image, hover e 2nd image, wishlist heart (localStorage), Quick Add.
3. `/trending` page (Part D8): filter, sort, pagination, skeleton.
4. Premium product page `/product/[slug]` (Part D9): sticky gallery, swipe mobile, zoom, size chart modal, accordion info, sticky mobile bottom bar, related products, JSON-LD, OG tags, generateStaticParams + ISR.
5. Ekhan theke Add to Cart + Order Now kaj korbe (same components reuse koro, duplicate code likhbe na).
6. Loading (skeleton) + not-found + error states.

Done when: Trending card click => product page, product page theke add to cart/order now kaj kore, mobile e sticky bar thik, Lighthouse mobile perf >= 90 (score dekhao).
STOP koro.
```

## PHASE 5 — Cart, Checkout, Order Success

```
PHASE 5: Cart + Checkout + Success.

1. Cart drawer + /cart page (Part D9.5).
2. `/checkout` page (Part D10): distraction-free header/footer, React Hook Form + Zod, BD phone validation, district dropdown (64 district), auto delivery charge (Dhaka/outside, SiteSetting theke), COD payment, order summary with qty edit.
3. "Order Now" flow: single-item checkout (cart alada thakbe), "Add to Cart" flow: full cart checkout.
4. POST /api/orders: Zod validate, Turnstile verify, rate limit (IP + phone: 5/10min), createOrder service, idempotencyKey, friendly error. Price kokhono client theke nibe na — server DB theke calculate korbe.
5. Success page `/order-success/[orderNo]` (Part D11): abhinondon message, order summary, Track/Continue buttons. Refresh e duplicate order hobe na. Cart clear hobe.
6. Order confirmation email (Resend) background e.
7. Analytics events: InitiateCheckout, Purchase (Meta Pixel + GA4, env flag).

Done when: full flow test: product select -> add to cart -> checkout -> order place -> success -> DB te order + items + status history ache, stock komeche, double-click e ek order. Mobile e form smooth.
STOP koro.
```

## PHASE 6 — Track Order + Account + Contact

```
PHASE 6: Track order, account, contact pages.
- /track-order (Part D12): orderNo + phone match hole timeline dekhabe; na hole generic "not found" (info leak nai). Rate limit.
- /account (Part D13): phone-based order lookup / simple login (ami je option select korbo pore bolbo — ekhon phone lookup diye koro).
- /contact (Part D14): info SiteSetting theke, message form (rate limited, Turnstile).
Done when: sob page mobile-perfect, security rules follow kora.
STOP koro.
```

## PHASE 7 — Admin Panel

```
PHASE 7: Admin panel (/admin) — Part D16 er sob feature.

1. Auth: email + password (argon2), httpOnly secure cookie session, middleware guard, login rate limit + lockout, Turnstile.
2. Dashboard: today/7d orders, revenue, pending, low stock, simple chart.
3. Products CRUD: multi image upload (Cloudinary signed upload), drag-drop reorder, variants table (size/color/stock), all fields, "Show in Trending" toggle + drag-drop trending order, SEO fields, slug auto.
4. **Featured Product page**: active product list (search soho) theke ekta select kore "Set as Main Product" => SiteSetting.featuredProductId update + Redis invalidate + revalidateTag. Landing page e instantly notun main product dekhabe (gallery strip + NEW VIBES section duitai).
5. Orders: list/filter/search, details, status update (history log), admin note, print invoice, CSV export.
6. Customers list.
7. Site settings: announcement text, delivery charges, free-delivery threshold, contact info, **social links** (fb, ig, tiktok, youtube, whatsapp, messenger), hero tagline. Save korle footer o auto update.
8. AuditLog: prottek admin action log.
9. Admin panel mobile e usable.

Done when: admin theke product add -> trending e dekhay; main product change -> landing update; social link change -> footer update; order status change -> track page e dekhay.
STOP koro.
```

## PHASE 8 — Premium Advanced Footer

```
PHASE 8: Footer — Part D15 exactly.
- Huge GENTS HOOD wordmark, newsletter (Zod + API + DB table Subscriber), link columns, social icons (SiteSetting theke), payment/COD badges, back-to-top, mobile accordion.
- Hover/micro-interaction premium kintu light.
Done when: desktop + mobile e reference-er premium tone match kore, social icons admin theke control hoy.
STOP koro.
```

## PHASE 9 — Performance, SEO, Security Hardening

```
PHASE 9: Hardening. Part B5, B6, B7 er sob item implement + verify koro.
- Secure headers (CSP, HSTS...), rate limit sob public API te, Sentry, sitemap/robots, JSON-LD, Meta Pixel + CAPI hooks.
- Bundle analyzer chalao, heavy lib dynamic import.
- Image audit (sizes, formats), font audit.
- Lighthouse mobile: Performance >= 90, Accessibility >= 95, SEO >= 95, Best Practices >= 95. Report dekhao.
Done when: sob score target hit kore ba na hole keno ar ki fix korle hit kore ta explain koro.
STOP koro.
```

## PHASE 10 — QA, Load Test, Deploy

```
PHASE 10: Final QA + deploy.
1. Full QA checklist chalao (niche list), prottekta pass/fail table e dekhao.
2. k6 load test: 500 concurrent user landing + 100 concurrent order placement; result + bottleneck report dao.
3. /design-check page delete, console.log delete, unused code delete.
4. Vercel deploy config, env vars list, Cloudflare DNS + WAF + cache rules guide, DB backup schedule, Neon/Supabase pooling verify.
5. README te full deploy + admin usage guide likho.
Done when: production e sob flow live test pass.
```

---

# PART F — FINAL QA CHECKLIST

**Design**
- [ ] Reference er layout/spacing/typography match kore
- [ ] Shob black = #171718, shob light = #FFFFF3 (pure black/white nai)
- [ ] 360 / 390 / 768 / 1024 / 1440 e perfect, horizontal scroll nai
- [ ] Hero model text er opor overlap thik

**Function**
- [ ] Add to Cart, Order Now, Quantity, Size, Color sob kaj kore
- [ ] Main product admin theke change kora jai, instant update
- [ ] Trending e unlimited product add kora jai
- [ ] Trending card click => premium product page => order kora jai
- [ ] Checkout clean, order complete => abhinondon page
- [ ] Track order kaj kore
- [ ] Footer social links admin theke control hoy

**Technical**
- [ ] Oversell hoy na, duplicate order hoy na
- [ ] Price server-side calculate
- [ ] Lighthouse mobile >= 90
- [ ] Load test pass
- [ ] Admin secure, rate limit ache
- [ ] Backup + monitoring on

---

# PART G — Tomar jonno Decision List (agent er por ekta ekta korbe)

Ei jinis gulo tumi ager theke thik kore rakho, na hole agent ke bolte hobe:

1. **Hero model image**: transparent PNG cutout (dress pora model) — remove.bg diye banano jai
2. **Main product er 5+ photo** (front, back, detail, lifestyle)
3. **Delivery charge**: Dhaka koto, bahire koto
4. **Free delivery threshold** koto taka
5. **Return policy** koto din
6. **Payment**: shudhu COD naki bKash/Nagad o (bKash/Nagad hole merchant account lagbe)
7. **Social media links** (FB, IG, TikTok, YouTube, WhatsApp)
8. **Contact phone/WhatsApp/email/address**
9. **Size chart** (measurement)
10. **Account system**: full login naki guest + phone lookup (recommend: guest + phone lookup ekhon, pore login)
