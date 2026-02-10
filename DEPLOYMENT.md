# GonkaCloud Deployment (Vercel)

## 1) Connect GitHub to Vercel

1. Push the repo to GitHub.
2. In Vercel, click `Add New... -> Project` and import the GitHub repo.
3. Framework should auto-detect as Next.js.

## 2) Add Environment Variables

In Vercel Project Settings -> Environment Variables, add values for:

- App
  - `NEXT_PUBLIC_APP_URL` (e.g. `https://gonkacloud.vercel.app`)

- Clerk
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_WEBHOOK_SECRET`

- Database (Neon)
  - `DATABASE_URL`

- Upstash
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

- Gonka.ai
  - `GONKA_API_URL`
  - `GONKA_API_KEY`

- Stripe
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

See `.env.example` for the full list.

## 3) Deploy

1. Trigger a deployment from Vercel (or push to `main`).
2. Confirm the production URL works.

## 4) Run Database Migration

Drizzle is configured via `drizzle.config.ts`.

Options:

- Locally (recommended):

```bash
npm run db:push
```

This will apply the current schema to your `DATABASE_URL`.

Important: if you change the schema (e.g. add columns), run `npm run db:push` again.

## 5) Configure Stripe Webhook

1. In Stripe Dashboard -> Developers -> Webhooks.
2. Add endpoint:

- `https://YOUR_DOMAIN/api/webhooks/stripe`

3. Subscribe to event:

- `checkout.session.completed`

4. Copy the signing secret into Vercel:

- `STRIPE_WEBHOOK_SECRET`

## 6) Configure Clerk Webhook

1. In Clerk Dashboard -> Webhooks.
2. Add endpoint:

- `https://YOUR_DOMAIN/api/webhooks/clerk`

3. Subscribe to event:

- `user.created`

4. Copy the signing secret into Vercel:

- `CLERK_WEBHOOK_SECRET`

## 7) Test Checkout Flow

1. Go to `/dashboard/billing`.
2. Purchase credits.
3. Confirm balance updates after Stripe webhook is delivered.

## 8) Test API with curl

Create an API key in the dashboard (`/dashboard/api-keys`) and export it:

```bash
export GONKACLOUD_API_KEY="sk-gc-..."
export APP_URL="https://YOUR_DOMAIN"
```

List models:

```bash
curl -s "$APP_URL/api/v1/models" \
  -H "Authorization: Bearer $GONKACLOUD_API_KEY" | jq
```

Non-stream chat:

```bash
curl -s "$APP_URL/api/v1/chat/completions" \
  -H "Authorization: Bearer $GONKACLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b","messages":[{"role":"user","content":"Hello"}]}' | jq
```

Streaming chat:

```bash
curl -N "$APP_URL/api/v1/chat/completions" \
  -H "Authorization: Bearer $GONKACLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b","stream":true,"messages":[{"role":"user","content":"Stream a haiku"}]}'
```
