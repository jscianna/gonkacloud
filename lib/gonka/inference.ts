import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { toHex } from "@cosmjs/encoding";

import { decrypt } from "@/lib/wallet/kms";
import { signGonkaRequest } from "@/lib/gonka/sign";

const PARTICIPANT_BOOTSTRAP_NODES = ["http://node2.gonka.ai:8000", "http://node1.gonka.ai:8000"];
const PROVIDER_FETCH_TIMEOUT_MS = 30_000;
const INFERENCE_FETCH_TIMEOUT_MS = 120_000;

function requireGonkaAddress(addr: string | null | undefined) {
  if (!addr || typeof addr !== "string") {
    throw new Error("Missing gonkaAddress");
  }
  return addr;
}

type SelectedProvider = {
  providerTransferAddress: string;
  inferenceUrl: string;
};

function getProviderWeight(provider: any): number {
  const rawWeight =
    provider?.weight ??
    provider?.inference_weight ??
    provider?.voting_power ??
    provider?.capacity ??
    provider?.stake ??
    0;

  const parsed = Number(rawWeight);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getProvider(nodeUrl: string): Promise<SelectedProvider> {
  const participantsUrl = `${nodeUrl}/v1/epochs/current/participants`;
  console.log("Fetching participants from:", participantsUrl);

  const participantsController = new AbortController();
  const participantsTimeout = setTimeout(() => participantsController.abort(), PROVIDER_FETCH_TIMEOUT_MS);

  const participantsRes = await fetch(participantsUrl, { signal: participantsController.signal }).finally(() =>
    clearTimeout(participantsTimeout)
  );

  if (!participantsRes.ok) {
    throw new Error(`Failed to fetch participants: ${participantsRes.status}`);
  }

  const data = (await participantsRes.json()) as any;
  console.log("Participants response keys:", Object.keys(data ?? {}));
  console.log("First participant (sample):", JSON.stringify(data).substring(0, 500));

  const list =
    data?.active_participants?.participants ||
    data?.participants ||
    data?.data?.active_participants?.participants ||
    data?.data?.participants ||
    [];

  if (Array.isArray(list)) {
    const eligible = list.filter((p: any) => {
      const index = String(p?.index || "");
      const inferenceUrl = String(p?.inference_url || p?.inferenceUrl || p?.url || "");
      return Boolean(index) && Boolean(inferenceUrl);
    });

    if (eligible.length > 0) {
      const ranked = eligible.sort((a: any, b: any) => getProviderWeight(b) - getProviderWeight(a));
      const topProviders = ranked.slice(0, Math.min(5, ranked.length));
      const provider = topProviders[Math.floor(Math.random() * topProviders.length)];
      const providerTransferAddress = String(provider.index || "");
      const inferenceUrl = String(provider.inference_url || provider.inferenceUrl || provider.url || "").replace(/\/$/, "");

      console.log(
        "Provider candidate count:",
        eligible.length,
        "top candidate count:",
        topProviders.length,
        "selected weight:",
        getProviderWeight(provider)
      );

      if (providerTransferAddress && inferenceUrl) {
        console.log("Selected provider:", providerTransferAddress);
        console.log("Selected provider inference_url:", inferenceUrl);
        return { providerTransferAddress, inferenceUrl };
      }
    }
  }

  throw new Error("Could not find provider address + inference_url in participants");
}

async function getProviderWithFallback(): Promise<SelectedProvider> {
  let lastError: unknown;

  for (const nodeUrl of PARTICIPANT_BOOTSTRAP_NODES) {
    try {
      console.log("Trying participant bootstrap node:", nodeUrl);
      return await getProvider(nodeUrl);
    } catch (error) {
      lastError = error;
      console.warn("Participant bootstrap failed:", nodeUrl, error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(
    `Failed to fetch participants from bootstrap nodes. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
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
  console.log("=== GONKA INFERENCE DEBUG ===");
  let mnemonic: string | null = null;

  try {
    console.log("Step: decrypt mnemonic");
    mnemonic = await decrypt(params.encryptedMnemonic);

    // Restore wallet and ensure mnemonic/account are valid.
    console.log("Step: restore wallet from mnemonic");
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "gonka" });
    console.log("Step: read wallet accounts");
    const accounts = await wallet.getAccounts();
    if (!accounts[0]) {
      throw new Error("Failed to derive wallet account");
    }

    // Private key must exist in memory only for signing.
    console.log("Step: derive private key hex");
    const privateKeyHex = await derivePrivateKeyHexFromMnemonic(mnemonic);

    console.log("Step: fetch provider using bootstrap fallback");
    const provider = await getProviderWithFallback();
    const providerTransferAddress = provider.providerTransferAddress;

    const payload = {
      model: params.model,
      messages: params.messages,
      stream: false,
      temperature: params.temperature,
      max_tokens: params.max_tokens,
    };

    const payloadJson = JSON.stringify(payload);

    const timestampNs = BigInt(Date.now()) * 1_000_000n;

    const signature = signGonkaRequest(payloadJson, privateKeyHex, timestampNs, providerTransferAddress);

    requireGonkaAddress(params.gonkaAddress);
    const targetUrl = `${provider.inferenceUrl}/v1/chat/completions`;
    console.log("Target URL:", targetUrl);
    console.log("Provider transferAddress:", providerTransferAddress);

    console.log("Gonka inference URL:", provider.inferenceUrl);
    console.log("Gonka inference headers:", {
      Authorization: `${signature.substring(0, 20)}...`,
      "X-Requester-Address": params.gonkaAddress,
      "X-Timestamp": timestampNs.toString(),
    });

    console.log("Step: send inference request");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), INFERENCE_FETCH_TIMEOUT_MS);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: signature,
        "x-requester-address": params.gonkaAddress,
        "x-timestamp": timestampNs.toString(),
      },
      body: payloadJson,
      signal: controller.signal,
    })
      .catch((err: any) => {
        console.error("Fetch cause:", err?.cause);
        throw err;
      })
      .finally(() => clearTimeout(timeoutId));

    return res;
  } finally {
    // CRITICAL: zero mnemonic reference
    if (mnemonic) {
      mnemonic = "";
      mnemonic = null;
    }
  }
}
