# GENTS HOOD — Premium Menswear & Editorial E-Commerce

Gents Hood is an ultra-premium menswear and streetwear e-commerce platform built strictly adhering to modern high-traffic architecture, Next.js 14 App Router, strict TypeScript, Tailwind CSS with design tokens, Prisma ORM, and robust security hardening.

---

## 💎 Design System & Aesthetic Standard

- **Palette**: Strictly design-token driven — Near-Black Ink (`#171718`), Warm Gallery Cream (`#FFFFF3`), Cream Soft (`#F4F4E6`), with thin editorial borders (`--line: rgba(23,23,24,0.12)`). Pure `#000` and `#fff` are prohibited.
- **Typography**: Clean geometric grotesque via **Inter Tight** (`next/font/google`) featuring wide tracking, uppercase labels, and editorial font hierarchies.
- **Layout**: Architectural grid max-width 1440px with responsive breakpoints (`360px`, `390px`, `768px`, `1024px`, `1440px`).
- **Hero Overlap**: Giant background watermark text with floating model cutout overlay.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Key Responsibility |
|---|---|---|
| **Framework** | **Next.js 14+ (App Router)** | ISR (60s revalidation), Server Components, dynamic OG metadata |
| **Language** | **TypeScript (Strict Mode)** | Strict types, `noImplicitAny`, zero `any` across the entire codebase |
| **Styling** | **Tailwind CSS + CSS Tokens** | Editorial design tokens in `src/styles/tokens.css` |
| **Database** | **PostgreSQL (Neon / Supabase)** | Relational model, SQLite supported in local dev (`prisma/dev.db`) |
| **ORM** | **Prisma** | Atomic transactions, race-condition prevention, stock decrement |
| **State** | **Zustand** | Persistent guest shopping cart in `localStorage` |
| **Validation** | **Zod** | End-to-end runtime request and form payload validation |
| **Security** | **HTTP Security Headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **Rate Limit** | **Sliding Window Token Bucket** | Distributed rate limiting across all public and admin endpoints |
| **Analytics** | **Meta Pixel + GA4 + CAPI** | `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase` + server CAPI |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ (Node.js 20+ recommended)
- npm 10+

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd "Gents Hood"

# Install all dependencies
npm install

# Initialize Husky git hooks
npm run prepare
```

### 3. Environment Setup
```bash
# Copy sample configuration
cp .env.example .env
```

### 4. Database Setup & Seeding
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Seed database with initial products, variants, settings, and admin user
npx tsx prisma/seed.ts
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Admin Panel Guide

- **URL**: `http://localhost:3000/admin/login`
- **Default Email**: `admin@gentshood.com`
- **Default Password**: `Admin@12345`

### Key Admin Capabilities
1. **Featured Main Dress Switcher (`/admin/featured`)**:
   - Displays all active inventory items with search.
   - 1-click **"Set as Main Product"** dynamically updates `SiteSetting.featuredProductId`, invalidates cache, and updates the hero gallery and NEW VIBES section instantly.
2. **Products & Catalog Management (`/admin/products`)**:
   - Full CRUD operations with multi-image gallery management, variant matrix (color, size, stock, SKU), pricing, and descriptions.
   - Instant toggle for **Show in Trending** grid.
3. **Order Management & Invoicing (`/admin/orders`)**:
   - Real-time search by Order No, customer name, and phone.
   - Status workflow: `PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED` / `CANCELLED` with audit history.
   - Print packing slips and printable tax invoices with one click.
   - CSV export for courier logistics.
4. **Site Settings & Social Links (`/admin/site-settings`)**:
   - Configure announcement strip text and free delivery threshold.
   - Modify inside Dhaka (৳70) and outside Dhaka (৳130) shipping rates.
   - Update phone, WhatsApp, customer support email, and physical showroom address.
   - Live social links (Facebook, Instagram, TikTok, YouTube) auto-reflected in the footer.
5. **Customer Insights (`/admin/customers`)**:
   - Customer lifetime value (LTV), total orders placed, and order history.

---

## 🧪 Automated Testing & Load Testing

### Run All Unit & Feature Verification Suites
```bash
# Phase 3: Transactional stock decrement & oversell prevention
npx tsx tests/order.test.ts

# Phase 5: Cart, checkout, and order placement flow
npx tsx tests/phase5-flow.test.ts

# Phase 6: Order tracking and account history lookup
npx tsx tests/phase6-flow.test.ts

# Phase 7: Admin authentication, permissions, and settings mutation
npx tsx tests/phase7-admin.test.ts

# Phase 8: Advanced footer and newsletter subscription API
npx tsx tests/phase8-footer.test.ts

# Phase 9: Security headers, sitemap, robots, and analytics tracking
npx tsx tests/phase9-hardening.test.ts
```

### Run High-Concurrency Load Test
```bash
# Simulates 500 concurrent visitors + 100 checkout attempts
npx tsx tests/run-concurrent-benchmark.ts
```

Or using **k6**:
```bash
k6 run tests/k6-load-test.js
```

---

## 🚢 Production Deployment Guide

### Step 1: PostgreSQL Setup (Neon / Supabase)
1. Create a serverless PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Obtain two connection strings:
   - **Pooled URL** (`DATABASE_URL`): Points to port `6543` / `?pgbouncer=true`.
   - **Direct URL** (`DIRECT_URL`): Points to direct PostgreSQL port `5432` for migrations.
3. Copy `docs/schema.postgresql.prisma.example` to `prisma/schema.prisma` before running production migrations.


### Step 2: Deploy to Vercel
1. Import the repository into your Vercel team dashboard.
2. In **Environment Variables**, configure:
   - `DATABASE_URL` and `DIRECT_URL`
   - `AUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `ADMIN_EMAIL`
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://gentshood.com`)
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`
   - `CLOUDINARY_*` credentials
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` & `TURNSTILE_SECRET_KEY`
   - `NEXT_PUBLIC_META_PIXEL_ID` & `FB_ACCESS_TOKEN`
   - `NEXT_PUBLIC_GA_ID`
3. Click **Deploy**. Vercel will build the optimized production bundle (`npm run build`).

### Step 3: Cloudflare DNS, WAF & Caching Configuration
1. **DNS**: Add CNAME record pointing `gentshood.com` to `cname.vercel-dns.com` with Cloudflare Proxy enabled (**Orange Cloud**).
2. **SSL/TLS**: Set SSL mode to **Full (Strict)**.
3. **Caching**:
   - Cache static assets (`/images/*`, `/_next/static/*`) with edge TTL = 1 month.
   - Bypass cache for `/admin/*` and `/api/*`.
4. **WAF & Security**:
   - Enable **Cloudflare Turnstile** on checkout and login.
   - Enable **Bot Fight Mode**.
   - Create a rate-limiting rule on `/api/orders` to limit more than 10 requests per minute per IP.

### Step 4: Daily Database Backup Schedule
- **Neon / Supabase**: Point-in-time recovery (PITR) is enabled automatically.
- **pg_dump Cron**:
  ```bash
  pg_dump "$DIRECT_URL" -F c -b -v -f "gentshood_backup_$(date +%Y%m%d).dump"
  ```

---

## 📁 Repository Structure

```
gents-hood/
├── docs/
│   └── schema.postgresql.prisma.example # PostgreSQL production schema reference
├── prisma/
│   ├── schema.prisma                  # Active database schema
│   └── seed.ts                        # Seeding script

├── public/
│   ├── images/                        # Models, products, textures
│   └── icons/                         # Line badges
├── src/
│   ├── app/
│   │   ├── (store)/                   # Storefront routes
│   │   │   ├── page.tsx               # Editorial landing page
│   │   │   ├── trending/              # Full catalog listing
│   │   │   ├── product/[slug]/        # Sticky gallery & product details
│   │   │   ├── cart/                  # Full cart page
│   │   │   ├── checkout/              # Distraction-free checkout
│   │   │   ├── order-success/[orderNo]# Order confirmation
│   │   │   ├── track-order/           # Order timeline lookup
│   │   │   ├── account/               # Customer order history
│   │   │   └── contact/               # Contact & showroom details
│   │   ├── admin/                     # Protected administration panel
│   │   │   ├── login/                 # Admin login
│   │   │   └── (panel)/               # Dashboard, products, orders, settings
│   │   ├── api/                       # Secure REST API endpoints
│   │   ├── sitemap.ts                 # Dynamic XML sitemap
│   │   ├── robots.ts                  # Search engine robots rules
│   │   ├── layout.tsx                 # Root layout with SEO & Meta Pixel
│   │   ├── error.tsx                  # Storefront error boundary
│   │   └── global-error.tsx           # Root layout error boundary
│   ├── components/                    # Modular UI components
│   ├── lib/                           # Services, auth, db, rate-limiter, analytics
│   ├── store/                         # Zustand cart store
│   ├── styles/                        # CSS design tokens
│   └── types/                         # TypeScript interfaces
├── tests/                             # Automated test suites & benchmarks
├── vercel.json                        # Vercel deployment configuration
├── .env.example                       # Documented environment variables
└── README.md                          # Full manual & deployment guide
```

---

## ⚖️ License
Proprietary — All rights reserved © Gents Hood.
