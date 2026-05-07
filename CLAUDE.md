# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

汎用クラウドファンディングプラットフォーム（ショップ機能統合）。Next.js 16 (App Router)、React 19、TypeScript、Neon PostgreSQL、Stripe、Tailwind CSS 4 + shadcn/ui で構築。Vercel（サーバーレス）にデプロイ。

## Commands

```bash
pnpm dev          # Start dev server (Webpack, not Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
```

Database migrations are raw SQL files in `scripts/` — run them manually against Neon PostgreSQL. Seed admin data with `node scripts/seed-admin.mjs`.

**No test framework is configured.** There are no test files in this project.

## Architecture

### Routing & Layout

- **App Router** (`app/`) with React Server Components by default
- Root layout wraps app in `SiteSettingsProvider` > `LanguageProvider` > `ThemeProvider`
- Admin routes use a `(protected)` route group that validates session cookies via `lib/auth.ts`
- Public pages: homepage, campaign detail, checkout, shop, legal pages, shortlink redirects (`/go/[slug]`)

### Key Directories

- `app/api/` — ~39 API route handlers (admin CRUD, checkout flows, Stripe webhooks, file uploads)
- `components/admin/` — Admin panel components (forms, tables, management UIs)
- `components/checkout/` — Stripe checkout and shipping flows
- `components/campaign/` — Public campaign display (hero, rewards, funding progress, block renderer)
- `components/ui/` — shadcn/ui primitives (new-york style, CSS variables enabled)
- `lib/` — Shared utilities: database client (`db.ts`), auth (`auth.ts`), Stripe (`stripe.ts`), email (`email.ts`), i18n (`i18n.ts`), block types, receipt generation
- `hooks/` — Custom React hooks (mobile detection, postal code lookup, toast)
- `scripts/` — SQL migration files and admin seeding scripts

### Database

Neon PostgreSQL via `@neondatabase/serverless`. No ORM — direct SQL queries in `lib/db.ts`. Key tables: `campaigns`, `reward_tiers`, `pledges`, `products`, `shop_orders`, `gallery_photos`, `performers`, `admin_users`, `admin_sessions`, `site_settings`, `email_templates`, `shortlinks`.

Multi-language columns use suffixed pattern: `title`, `title_en`, `title_ko`, `title_zh` (Japanese is primary, unsuffixed).

### Payments

Stripe with dual-mode (test/live). Keys can come from `site_settings` DB table or env vars (DB takes priority). Checkout flow: create Stripe session → redirect → webhook confirms payment → update pledge/order status.

### i18n

Four locales: ja (primary), en, ko, zh. Translations in `lib/i18n.ts`. Runtime switching via `LanguageProvider` context. AI-powered translation via OpenAI GPT-4o-mini in `lib/translate.ts` (admin translation endpoint).

### File Uploads

Uploaded via `app/api/admin/upload/route.ts` to Vercel Blob (`@vercel/blob`). Image URLs stored in database records.

### Forms & Validation

React Hook Form + Zod for form handling and validation across admin and checkout flows.

### Styling

Tailwind CSS 4 with oklch() color variables defined in `app/globals.css`. Custom theme: `--brand-green`, `--brand-gold`, `--brand-dark`. Light/dark mode via `next-themes`. Font: Noto Sans JP (primary).

## Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).

## Environment Variables

Required: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `NEXT_PUBLIC_BASE_URL`. Test-mode Stripe keys use `STRIPE_TEST_*` prefix.

## Build Notes

- `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` are both `true` in next.config.mjs
- Images are unoptimized (Vercel static export compatibility)
- Turbopack is disabled — uses Webpack
