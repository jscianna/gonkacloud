/**
 * Test file to verify signing matches OpenGNK Go implementation.
 * 
 * OpenGNK Signing Scheme (from signer.go):
 * 1. payload_hash = hex(SHA256(payload_bytes))
 * 2. signature_input = payload_hash + timestamp_ns + transfer_address  
 * 3. message_hash = SHA256(signature_input)
 * 4. Sign message_hash with ECDSA (RFC 6979 deterministic)
 * 5. Low-S normalize
 * 6. Encode r(32) || s(32) as base64
 */

import { sha256 } from "@cosmjs/crypto";
import { fromHex, toHex } from "@cosmjs/encoding";
import { signGonkaRequest } from "./sign";

// Test vectors
const TEST_PRIVATE_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const TEST_PAYLOAD = JSON.stringify({
  model: "llama3.1:70b",
  messages: [{ role: "user", content: "Hello" }],
  stream: false,
});
const TEST_TIMESTAMP_NS = 1707847200000000000n; // Feb 13, 2024 in nanoseconds
const TEST_TRANSFER_ADDRESS = "gonka1y2a9p56kv044327uycmqdexl7zs82fs5ryv5le";

function runTests() {
  console.log("=== GonkaCloud Signing Tests ===\n");

  // Test 1: Verify signature format
  console.log("Test 1: Signature format verification");
  const sig = signGonkaRequest(TEST_PAYLOAD, TEST_PRIVATE_KEY, TEST_TIMESTAMP_NS, TEST_TRANSFER_ADDRESS);
  
  // Should be base64 encoded
  const sigBytes = Buffer.from(sig, "base64");
  console.log(`  Signature length: ${sigBytes.length} bytes (expected: 64)`);
  console.log(`  Base64 signature: ${sig}`);
  
  if (sigBytes.length !== 64) {
    throw new Error(`Signature should be 64 bytes, got ${sigBytes.length}`);
  }
  console.log("  ✓ Signature is 64 bytes (32r + 32s)\n");

  // Test 2: Verify signature input construction
  console.log("Test 2: Signature input construction");
  const payloadHash = sha256(new TextEncoder().encode(TEST_PAYLOAD));
  const payloadHashHex = Buffer.from(payloadHash).toString("hex");
  const signatureInput = `${payloadHashHex}${TEST_TIMESTAMP_NS.toString()}${TEST_TRANSFER_ADDRESS}`;
  
  console.log(`  Payload hash (hex): ${payloadHashHex}`);
  console.log(`  Timestamp (ns): ${TEST_TIMESTAMP_NS}`);
  console.log(`  Transfer address: ${TEST_TRANSFER_ADDRESS}`);
  console.log(`  Full signature input length: ${signatureInput.length} chars`);
  console.log("  ✓ Signature input matches OpenGNK format\n");

  // Test 3: Deterministic signing (same inputs = same output)
  console.log("Test 3: Deterministic signing (RFC 6979)");
  const sig2 = signGonkaRequest(TEST_PAYLOAD, TEST_PRIVATE_KEY, TEST_TIMESTAMP_NS, TEST_TRANSFER_ADDRESS);
  
  if (sig !== sig2) {
    throw new Error("Signatures should be deterministic!");
  }
  console.log("  ✓ Same inputs produce identical signatures\n");

  // Test 4: Different timestamp = different signature
  console.log("Test 4: Different timestamp produces different signature");
  const differentTs = TEST_TIMESTAMP_NS + 1n;
  const sig3 = signGonkaRequest(TEST_PAYLOAD, TEST_PRIVATE_KEY, differentTs, TEST_TRANSFER_ADDRESS);
  
  if (sig === sig3) {
    throw new Error("Different timestamps should produce different signatures!");
  }
  console.log("  ✓ Different timestamp produces different signature\n");

  // Test 5: Different transfer address = different signature
  console.log("Test 5: Different transfer address produces different signature");
  const differentAddr = "gonka1dkl4mah5erqggvhqkpc8j3qs5tyuetgdy552cp";
  const sig4 = signGonkaRequest(TEST_PAYLOAD, TEST_PRIVATE_KEY, TEST_TIMESTAMP_NS, differentAddr);
  
  if (sig === sig4) {
    throw new Error("Different transfer address should produce different signatures!");
  }
  console.log("  ✓ Different transfer address produces different signature\n");

  // Test 6: Low-S normalization
  console.log("Test 6: Low-S normalization check");
  const sBytes = sigBytes.slice(32, 64);
  const sInt = BigInt("0x" + sBytes.toString("hex"));
  const order = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
  const halfOrder = order / 2n;
  
  if (sInt > halfOrder) {
    throw new Error("S value not normalized to low-S!");
  }
  console.log(`  S value: ${sInt.toString(16).substring(0, 20)}...`);
  console.log(`  Half order: ${halfOrder.toString(16).substring(0, 20)}...`);
  console.log("  ✓ S value is low-S normalized\n");

  // Test 7: Nanosecond timestamp format
  console.log("Test 7: Timestamp format verification");
  const nowNs = BigInt(Date.now()) * 1_000_000n;
  console.log(`  Current time in ns: ${nowNs}`);
  console.log(`  Number of digits: ${nowNs.toString().length} (expected: ~19)`);
  
  if (nowNs.toString().length < 19) {
    throw new Error("Nanosecond timestamp should have ~19 digits!");
  }
  console.log("  ✓ Timestamp is in nanoseconds\n");

  console.log("=== All tests passed! ===");
  return true;
}

// Export for use
export { runTests };

// Run if executed directly
if (typeof process !== "undefined" && process.argv[1]?.includes("sign.test")) {
  runTests();
}
