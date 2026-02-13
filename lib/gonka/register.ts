import { Bip39, EnglishMnemonic, Secp256k1, Slip10, Slip10Curve, ripemd160, sha256, stringToPath } from "@cosmjs/crypto";
import { toBech32, toHex } from "@cosmjs/encoding";

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
  const { pubkey } = await Secp256k1.makeKeypair(privkey);

  const pubkeyHash = sha256(pubkey);
  const ripemdHash = ripemd160(pubkeyHash);
  const address = toBech32("gonka", ripemdHash);
  const pubkeyBase64 = Buffer.from(pubkey).toString("base64");
  const privateKeyHex = toHex(privkey);

  const response = await fetch(`${GONKA_NODE_URL.replace(/\/$/, "")}/v1/participants`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ pub_key: pubkeyBase64, address }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const lowered = text.toLowerCase();
    if (!lowered.includes("already")) {
      throw new Error(`Gonka registration failed (${response.status}): ${text || response.statusText}`);
    }
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
