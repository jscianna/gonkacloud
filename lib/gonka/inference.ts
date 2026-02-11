import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { toHex } from "@cosmjs/encoding";

import { decrypt } from "@/lib/wallet/kms";
import { getRandomNode } from "@/lib/gonka/config";
import { signGonkaRequest } from "@/lib/gonka/sign";

function requireGonkaAddress(addr: string | null | undefined) {
  if (!addr || typeof addr !== "string") {
    throw new Error("Missing gonkaAddress");
  }
  return addr;
}

async function derivePrivateKeyHexFromMnemonic(mnemonic: string): Promise<string> {
  // Cosmos standard HD path
  const hdPath = stringToPath("m/44'/118'/0'/0/0");
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  return toHex(privkey);
}

type GonkaChatMessage = { role: string; content: string };

export async function gonkaInference(params: {
  encryptedMnemonic: string;
  gonkaAddress: string;
  model: string;
  messages: Array<GonkaChatMessage>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}): Promise<Response> {
  let mnemonic: string | null = null;

  try {
    mnemonic = await decrypt(params.encryptedMnemonic);

    // Private key must exist in memory only for signing.
    const privateKeyHex = await derivePrivateKeyHexFromMnemonic(mnemonic);

    const nodeUrl = getRandomNode();

    const infoRes = await fetch(`${nodeUrl}/v1/info`, { method: "GET" });
    if (!infoRes.ok) {
      throw new Error("Failed to fetch provider info");
    }

    const info = (await infoRes.json().catch(() => null)) as any;
    const providerAddress = String(info?.providerAddress ?? info?.provider_address ?? info?.address ?? "");
    if (!providerAddress) {
      throw new Error("Missing provider address");
    }

    const payload = {
      model: params.model,
      messages: params.messages,
      stream: params.stream,
      temperature: params.temperature,
      max_tokens: params.max_tokens,
    };

    const payloadJson = JSON.stringify(payload);

    const timestampNs = BigInt(Date.now()) * 1_000_000n;

    const signature = signGonkaRequest(payloadJson, privateKeyHex, timestampNs, providerAddress);

    const requester = requireGonkaAddress(params.gonkaAddress);

    const res = await fetch(`${nodeUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: signature,
        "x-requester-address": requester,
        "x-timestamp": timestampNs.toString(),
      },
      body: payloadJson,
    });

    return res;
  } finally {
    // CRITICAL: zero mnemonic reference
    if (mnemonic) {
      mnemonic = "";
      mnemonic = null;
    }
  }
}
