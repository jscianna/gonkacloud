import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { toHex } from "@cosmjs/encoding";

import { decrypt } from "@/lib/wallet/kms";
import { signGonkaRequest } from "@/lib/gonka/sign";

const GONKA_NODES = ["http://node1.gonka.ai:8000", "http://node2.gonka.ai:8000", "http://node3.gonka.ai:8000"];

function requireGonkaAddress(addr: string | null | undefined) {
  if (!addr || typeof addr !== "string") {
    throw new Error("Missing gonkaAddress");
  }
  return addr;
}

async function getProviderAddress(nodeUrl: string): Promise<string> {
  const res = await fetch(`${nodeUrl}/v1/info`);
  if (!res.ok) {
    throw new Error("Failed to fetch provider info");
  }

  const data = (await res.json().catch(() => null)) as any;
  const provider = data?.provider_address || data?.providerAddress || data?.address;
  if (!provider) {
    throw new Error("Missing provider address");
  }
  return String(provider);
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

    // Restore wallet and ensure mnemonic/account are valid.
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "gonka" });
    const accounts = await wallet.getAccounts();
    if (!accounts[0]) {
      throw new Error("Failed to derive wallet account");
    }

    // Private key must exist in memory only for signing.
    const privateKeyHex = await derivePrivateKeyHexFromMnemonic(mnemonic);

    const nodeUrl = GONKA_NODES[Math.floor(Math.random() * GONKA_NODES.length)];
    const providerAddress = await getProviderAddress(nodeUrl);

    const payload = {
      model: params.model,
      messages: params.messages,
      stream: params.stream || false,
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
