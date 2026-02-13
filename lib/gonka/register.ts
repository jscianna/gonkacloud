import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, ripemd160, sha256, stringToPath } from "@cosmjs/crypto";
import { toBech32, toHex } from "@cosmjs/encoding";
import * as secp256k1 from "secp256k1";

import { decrypt } from "@/lib/wallet/kms";

const GONKA_REGISTRATION_WORKER_URL =
  process.env.GONKA_REGISTRATION_WORKER_URL ||
  "https://gonka-registration-worker-production.up.railway.app/register";
const GONKA_WORKER_API_KEY = process.env.GONKA_WORKER_API_KEY;

function deriveAddressFromCompressedPubkey(pubkey: Uint8Array) {
  const pubkeyHash = sha256(pubkey);
  const ripemdHash = ripemd160(pubkeyHash);
  return toBech32("gonka", ripemdHash);
}

type WorkerResponse = {
  success?: boolean;
  address?: string;
  pubkey?: string;
  error?: string;
};

export async function registerGonkaWallet(mnemonic: string): Promise<{
  address: string;
  pubkey: string;
  privateKey: string;
}> {
  const hdPath = stringToPath("m/44'/1200'/0'/0/0");
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  const pubkey = secp256k1.publicKeyCreate(privkey, true);

  const address = deriveAddressFromCompressedPubkey(pubkey);
  const pubkeyBase64 = Buffer.from(pubkey).toString("base64");
  const privateKeyHex = toHex(privkey);

  console.log("=== REGISTRATION DEBUG ===");
  console.log("Address:", address);
  console.log("Pubkey (base64):", pubkeyBase64);
  console.log("Pubkey decoded length:", Buffer.from(pubkeyBase64, "base64").length, "bytes");
  console.log("Request body:", JSON.stringify({ pub_key: pubkeyBase64, address }));

  if (!GONKA_WORKER_API_KEY) {
    throw new Error("GONKA_WORKER_API_KEY is not set");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const response = await fetch(GONKA_REGISTRATION_WORKER_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${GONKA_WORKER_API_KEY}`,
    },
    body: JSON.stringify({ mnemonic }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  const text = await response.text().catch(() => "");
  console.log("Worker registration response:", response.status, text);

  if (!response.ok) {
    throw new Error(`Worker registration failed (${response.status}): ${text || response.statusText}`);
  }

  let parsed: WorkerResponse;
  try {
    parsed = JSON.parse(text) as WorkerResponse;
  } catch {
    throw new Error("Worker returned invalid JSON");
  }

  if (!parsed.success || !parsed.address || !parsed.pubkey) {
    throw new Error(parsed.error || "Worker registration did not return success");
  }

  if (parsed.address !== address) {
    throw new Error(`Worker registered address mismatch: expected ${address}, got ${parsed.address}`);
  }

  if (parsed.pubkey !== pubkeyBase64) {
    throw new Error("Worker returned pubkey mismatch for derived mnemonic");
  }

  return {
    address,
    pubkey: pubkeyBase64,
    privateKey: privateKeyHex,
  };
}

export async function registerEncryptedMnemonicWallet(params: {
  encryptedMnemonic: string;
  expectedAddress?: string | null;
}) {
  let mnemonic: string | null = null;
  try {
    mnemonic = await decrypt(params.encryptedMnemonic);
    const hdPath = stringToPath("m/44'/1200'/0'/0/0");
    const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
    const pubkey = secp256k1.publicKeyCreate(privkey, true);
    const derivedAddress = deriveAddressFromCompressedPubkey(pubkey);

    if (params.expectedAddress && derivedAddress !== params.expectedAddress) {
      throw new Error("Derived address does not match wallet address");
    }

    const registration = await registerGonkaWallet(mnemonic);

    return registration;
  } finally {
    if (mnemonic) {
      mnemonic = "";
      mnemonic = null;
    }
  }
}
