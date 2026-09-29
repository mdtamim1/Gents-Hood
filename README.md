# Gents Hood — Premium Menswear & E-Commerce

Gents Hood is an ultra-premium menswear and streetwear e-commerce platform built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Custom Design Tokens (`--ink: #171718`, `--cream: #FFFFF3`)
- **Database & ORM**: PostgreSQL + Prisma ORM (Connection Pooling ready)
- **State Management**: Zustand (Guest Cart with `localStorage` persistence)
- **Validation**: Zod (End-to-end type safety)
- **Animations**: Framer Motion (micro-interactions)
- **Code Quality**: ESLint, Prettier, Husky, Lint-Staged

## Getting Started

### 1. Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm 10+
- PostgreSQL database instance (Neon, Supabase, or local PostgreSQL)

### 2. Installation

```bash
# Install dependencies
npm install

# Initialize Husky git hooks
npm run prepare
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: Connection pooled URL (PgBouncer) for serverless queries.
- `DIRECT_URL`: Direct PostgreSQL connection URL for Prisma migrations.
- `UPSTASH_REDIS_REST_URL` & `TOKEN`: Redis cache and rate limiting.
- `CLOUDINARY_*`: Image hosting and CDN transformation.
- `AUTH_SECRET`: Random secret key for admin authentication session.

### 4. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Apply database migrations
npm run prisma:migrate
```

### 5. Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 6. Linting & Formatting

```bash
# Run ESLint
npm run lint

# Check code formatting
npm run format:check

# Auto-format files
npm run format
```

### 7. Production Build

```bash
npm run build
npm run start
```

## Architecture Overview

```
gents-hood/
├─ prisma/
│  ├─ schema.prisma        # Complete schema (Product, Variant, Order, Setting, etc.)
│  └─ seed.ts              # Database seeding
├─ public/                 # Static assets, fonts, icons
├─ src/
│  ├─ app/                 # Next.js App Router (store, admin, api)
│  ├─ components/          # Reusable UI & section components
│  ├─ lib/                 # Core utilities, services, db client, validators
│  ├─ styles/              # Design tokens and global CSS
│  ├─ store/               # Zustand stores (cart)
│  ├─ types/               # TypeScript interfaces & types
│  └─ middleware.ts        # Admin route protection and rate limits
└─ .env.example
```
