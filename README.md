# dogecat

Production-ready Next.js 14 app for dogecat, a SaaS wrapper around Gonka.ai's decentralized GPU network.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui conventions
- Drizzle ORM + Neon Postgres
- Clerk auth
- Stripe payments
- Upstash Redis (rate limiting)

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Configure env vars:

```bash
cp .env.example .env.local
```

3. Run dev server:

```bash
npm run dev
```

## Database

- Schema: `lib/db/schema.ts`
- Connection: `lib/db/index.ts`
- Drizzle config: `drizzle.config.ts`
