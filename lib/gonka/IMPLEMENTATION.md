# GonkaCloud Signing Implementation

This document describes the signing implementation for GonkaCloud, which matches the [OpenGNK](https://github.com/gonkalabs/opengnk) Go reference implementation.

## Signing Scheme

Based on the Gonka Python SDK v0.2.4 and OpenGNK Go implementation:

```
1. payload_hash = hex(SHA256(payload_bytes))
2. signature_input = payload_hash + timestamp_ns + transfer_address
3. message_hash = SHA256(signature_input)
4. signature = ECDSA_sign(message_hash, private_key)  // RFC 6979 deterministic
5. signature = low_S_normalize(signature)
6. output = base64(r || s)  // 64 bytes total
```

### Key Points

- **Timestamp**: Must be in **nanoseconds** (not milliseconds)
- **Transfer Address**: The bech32 address of the target node (provider)
- **Deterministic**: Uses RFC 6979 for deterministic nonce generation
- **Low-S**: S value is normalized to prevent signature malleability

## Request Headers

```
Authorization: <base64_signature>
X-Requester-Address: <user's_gonka_address>
X-Timestamp: <timestamp_nanoseconds>
Content-Type: application/json
```

## Transfer Agent Whitelist

Only these 7 nodes support proxied inference (v0.2.9+):

```
gonka1y2a9p56kv044327uycmqdexl7zs82fs5ryv5le (node1.gonka.ai)
gonka1dkl4mah5erqggvhqkpc8j3qs5tyuetgdy552cp (node2.gonka.ai)
gonka1kx9mca3xm8u8ypzfuhmxey66u0ufxhs7nm6wc5 (node3.gonka.ai)
gonka1ddswmmmn38esxegjf6qw36mt4aqyw6etvysy5x
gonka10fynmy2npvdvew0vj2288gz8ljfvmjs35lat8n
gonka1v8gk5z7gcv72447yfcd2y8g78qk05yc4f3nk4w
gonka1gndhek2h2y5849wf6tmw6gnw9qn4vysgljed0u
```

Requests to non-whitelisted nodes return: "Transfer Agent not allowed"

## Endpoint Discovery

1. Fetch active participants from: `GET /v1/epochs/current/participants`
2. Filter participants to whitelist
3. Pick endpoint (by weight, with rotation on rate limits)

## Clock Skew Handling

Gonka nodes can be ~30+ minutes behind real time. We:
1. Fetch latest block time from RPC
2. Calculate local → chain time skew
3. Adjust timestamps before signing
4. Cache skew for 5 minutes

## Files

- `sign.ts` - Core signing function
- `sign.test.ts` - Verification tests
- `inference.ts` - Full inference client with retry logic

## Testing

```bash
npx tsx lib/gonka/sign.test.ts
```

## Reference

- [OpenGNK signer.go](https://github.com/gonkalabs/opengnk/blob/main/internal/signer/signer.go)
- [OpenGNK client.go](https://github.com/gonkalabs/opengnk/blob/main/internal/upstream/client.go)
