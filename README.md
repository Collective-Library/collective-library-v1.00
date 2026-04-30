# Collective Library

Mobile-first community book marketplace and lending network for the Journey Perintis community in Semarang.

Live: https://collectivelibrary.vercel.app

## About the Project

Collective Library is a platform to surface books and trust that already exist in the JP community, making them visible and accessible. Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, and Supabase for database/auth/storage. The project is open source and community-driven.

**Tagline:** Where books connect people, and ideas turn into movement.

## Project Structure

```
app/                # Main app routes, API, and static pages
  (app)/            # Auth-gated routes (profile, shelf, activity, etc)
components/         # UI, books, profile, activity, layout, map, etc
lib/                # Supabase, auth, books, profile, utils
public/             # Static assets (logo, images)
supabase/           # Database migrations
scripts/            # Seed and utility scripts
docs/               # Documentation (STATE.md, checklists)
types/              # TypeScript types
```

See `docs/STATE.md` for a detailed and always up-to-date project state and file structure.

## How to Contribute

- If you want contribute , **always create a new branch from main**. Do not code directly on main.
- After finishing your feature, open a Pull Request (PR) to main for review and merge.
- Follow the code style and conventions (TypeScript strict, Tailwind v4, etc).
- Please read `docs/STATE.md` before starting work.

## Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/collective-library.git
   cd collective-library
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Create a `.env.local` file in the root directory with the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
   RESEND_SMTP_KEY=your_resend_smtp_key
   SENTRY_DSN=your_sentry_dsn
   DISCORD_WEBHOOK_URL=your_discord_webhook_url
   NEXT_PUBLIC_INSTAGRAM_FEED_ID=your_instagram_feed_id
   # (add any other required secrets from Vercel dashboard or docs/STATE.md)
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

Below is the default Next.js README for reference:

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
