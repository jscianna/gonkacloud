import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { toHex } from "@cosmjs/encoding";
import { GonkaOpenAI, resolveEndpoints } from "gonka-openai";

import { decrypt } from "@/lib/wallet/kms";

export const GONKA_MODELS = ["Qwen/Qwen3-235B-A22B-Instruct-2507-FP8"] as const;
export const DEFAULT_GONKA_MODEL = GONKA_MODELS[0];

const GONKA_NODE_URL = process.env.GONKA_NODE_URL || "http://node1.gonka.ai:8000";

let endpointsCache: Awaited<ReturnType<typeof resolveEndpoints>> | null = null;
let endpointsCacheAt = 0;
const ENDPOINT_CACHE_TTL_MS = 60_000;

async function derivePrivateKeyHexFromMnemonic(mnemonic: string): Promise<string> {
  const hdPath = stringToPath("m/44'/118'/0'/0/0");
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  return toHex(privkey);
}

export async function resolveGonkaEndpoints() {
  const now = Date.now();
  if (endpointsCache && now - endpointsCacheAt < ENDPOINT_CACHE_TTL_MS) {
    return endpointsCache;
  }

  const endpoints = await resolveEndpoints({ sourceUrl: GONKA_NODE_URL });
  endpointsCache = endpoints;
  endpointsCacheAt = now;
  return endpoints;
}

export async function createGonkaClient(params: {
  encryptedMnemonic: string;
  gonkaAddress: string;
}) {
  let mnemonic: string | null = null;

  try {
    mnemonic = await decrypt(params.encryptedMnemonic);
    const privateKeyHex = await derivePrivateKeyHexFromMnemonic(mnemonic);
    const endpoints = await resolveGonkaEndpoints();

    return new GonkaOpenAI({
      gonkaPrivateKey: privateKeyHex,
      gonkaAddress: params.gonkaAddress,
      endpoints,
    });
  } finally {
    if (mnemonic) {
      mnemonic = "";
      mnemonic = null;
    }
  }
}
