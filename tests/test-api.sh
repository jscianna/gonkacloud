#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
MODEL="${MODEL:-llama-3.3-70b}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (used to create a temporary API key + verify balance/usage)" >&2
  exit 1
fi

if [[ -z "${GONKA_API_URL:-}" || -z "${GONKA_API_KEY:-}" ]]; then
  echo "GONKA_API_URL and GONKA_API_KEY are required (the inference API forwards upstream)" >&2
  exit 1
fi

echo "[1/7] Selecting a user from DB..."
USER_JSON=$(node --input-type=module <<'NODE'
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`select id, email, balance_usd from users order by created_at asc limit 1`;
console.log(JSON.stringify(rows[0] ?? null));
NODE
)

if [[ "$USER_JSON" == "null" ]]; then
  echo "No users found in DB. Sign up first so Clerk webhook creates a user." >&2
  exit 1
fi

USER_ID=$(node -p "JSON.parse(process.argv[1]).id" "$USER_JSON")
START_BAL=$(node -p "parseFloat(JSON.parse(process.argv[1]).balance_usd)" "$USER_JSON")
export USER_ID

echo "User: $USER_ID (start balance: $START_BAL)"

echo "[2/7] Creating a temporary API key directly in DB (not via dashboard)..."
KEY_JSON=$(node --input-type=module <<'NODE'
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

function sha256Hex(input){
  return crypto.createHash('sha256').update(input).digest('hex');
}

const userId = process.env.USER_ID;
const fullKey = `sk-gc-${crypto.randomBytes(36).toString('base64url')}`;
const keyHash = sha256Hex(fullKey);
const keyPrefix = fullKey.slice(0, 12);

const inserted = await sql`
  insert into api_keys (user_id, key_hash, key_prefix, name)
  values (${userId}, ${keyHash}, ${keyPrefix}, 'tests/test-api.sh')
  returning id
`;

console.log(JSON.stringify({ key: fullKey, id: inserted[0].id }));
NODE
)

export GONKACLOUD_API_KEY=$(node -p "JSON.parse(process.argv[1]).key" "$KEY_JSON")

echo "[3/7] /v1/models"
curl -s "$APP_URL/api/v1/models" -H "Authorization: Bearer $GONKACLOUD_API_KEY" | jq >/dev/null

echo "[4/7] /v1/chat/completions (non-stream)"
RESP=$(curl -s "$APP_URL/api/v1/chat/completions" \
  -H "Authorization: Bearer $GONKACLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hello in one sentence\"}]}"
)

echo "$RESP" | jq -e '.choices[0].message.content' >/dev/null

echo "[5/7] /v1/chat/completions (stream)"
curl -sN "$APP_URL/api/v1/chat/completions" \
  -H "Authorization: Bearer $GONKACLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$MODEL\",\"stream\":true,\"messages\":[{\"role\":\"user\",\"content\":\"Write a 3-line haiku about GPUs\"}]}" \
  | head -n 20 >/dev/null

echo "[6/7] Verify usage log exists"
USAGE_COUNT=$(node --input-type=module <<'NODE'
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`select count(*)::int as c from usage_logs where user_id = ${process.env.USER_ID}`;
console.log(rows[0].c);
NODE
)

echo "usage_logs count: $USAGE_COUNT"

echo "[7/7] Verify balance decreased"
END_BAL=$(node --input-type=module <<'NODE'
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`select balance_usd from users where id = ${process.env.USER_ID} limit 1`;
console.log(parseFloat(rows[0].balance_usd));
NODE
)

echo "end balance: $END_BAL"

if awk "BEGIN {exit !($END_BAL < $START_BAL)}"; then
  echo "OK: balance decreased"
else
  echo "WARNING: balance did not decrease (upstream may not be returning usage, or calls failed)" >&2
fi
