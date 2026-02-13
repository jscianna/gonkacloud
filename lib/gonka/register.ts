import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, ripemd160, sha256, stringToPath } from "@cosmjs/crypto";
import { toBech32, toHex } from "@cosmjs/encoding";
import * as secp256k1 from "secp256k1";

import { decrypt } from "@/lib/wallet/kms";

const GONKA_NODE_URL = process.env.GONKA_NODE_URL || "http://node1.gonka.ai:8000";

export async function registerGonkaWallet(mnemonic: string): Promise<{
  address: string;
  pubkey: string;
  privateKey: string;
}> {
  const hdPath = stringToPath("m/44'/118'/0'/0/0");
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  const pubkey = secp256k1.publicKeyCreate(privkey, true);

  const pubkeyHash = sha256(pubkey);
  const ripemdHash = ripemd160(pubkeyHash);
  const address = toBech32("gonka", ripemdHash);
  const pubkeyBase64 = Buffer.from(pubkey).toString("base64");
  const privateKeyHex = toHex(privkey);

  const base = GONKA_NODE_URL.replace(/\/$/, "");
  const registrationEndpoints = [`${base}/api/v1/participants`, `${base}/v1/participants`];

  let lastError = "Gonka registration failed";
  let registered = false;

  console.log("=== REGISTRATION DEBUG ===");
  console.log("Address:", address);
  console.log("Pubkey (base64):", pubkeyBase64);
  console.log("Pubkey decoded length:", Buffer.from(pubkeyBase64, "base64").length, "bytes");
  console.log("Request body:", JSON.stringify({ pub_key: pubkeyBase64, address }));

  for (const endpoint of registrationEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ pub_key: pubkeyBase64, address }),
      });

      const responseText = await response.text().catch(() => "");
      console.log("Registration full response:", response.status, responseText);
      const text = responseText;
      const lowered = text.toLowerCase();

      if (response.ok || lowered.includes("already")) {
        registered = true;
        break;
      }

      lastError = `Gonka registration failed (${response.status}): ${text || response.statusText}`;
    } catch (error) {
      console.error(
        "Registration request error:",
        endpoint,
        error instanceof Error ? error.message : String(error)
      );
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  if (!registered) {
    throw new Error(lastError);
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
    const registration = await registerGonkaWallet(mnemonic);

    if (params.expectedAddress && registration.address !== params.expectedAddress) {
      throw new Error("Derived address does not match wallet address");
    }

    return registration;
  } finally {
    if (mnemonic) {
      mnemonic = "";
      mnemonic = null;
    }
  }
}
