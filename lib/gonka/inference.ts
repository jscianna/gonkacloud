import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { toHex } from "@cosmjs/encoding";

import { signGonkaRequest } from "@/lib/gonka/sign";

const PARTICIPANT_BOOTSTRAP_NODES = ["http://node1.gonka.ai:8000", "http://node2.gonka.ai:8000"];
const RPC_URL = "http://node1.gonka.ai:8000/chain-rpc/";
const PROVIDER_FETCH_TIMEOUT_MS = 30_000;
const INFERENCE_FETCH_TIMEOUT_MS = 120_000;
const CLOCK_SKEW_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 5000;

// Shared wallet configuration
const GONKA_MNEMONIC = process.env.GONKA_MNEMONIC;
const GONKA_WALLET_ADDRESS = process.env.GONKA_WALLET_ADDRESS || "gonka1g72am4v9gc5c0z66pcvtlz73hk6k52r0kkv6fy";

// Clock skew cache
let cachedClockSkewMs: number | null = null;
let clockSkewCachedAt = 0;

// Cached wallet derivation
let cachedPrivateKeyHex: string | null = null;
let cachedWalletAddress: string | null = null;

/**
 * Get clock skew between local time and Gonka chain.
 */
async function getClockSkew(): Promise<number> {
  const now = Date.now();
  if (cachedClockSkewMs !== null && now - clockSkewCachedAt < CLOCK_SKEW_CACHE_TTL_MS) {
    return cachedClockSkewMs;
  }

  try {
    const localBefore = Date.now();
    const resp = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "status" }),
      signal: AbortSignal.timeout(5000),
    });
    const localAfter = Date.now();
    const data = await resp.json();

    const blockTimeStr = data?.result?.sync_info?.latest_block_time;
    if (!blockTimeStr) {
      console.warn("No block time in RPC response, using 0 skew");
      return 0;
    }

    const nodeTime = new Date(blockTimeStr).getTime();
    const localTime = (localBefore + localAfter) / 2;

    cachedClockSkewMs = localTime - nodeTime;
    clockSkewCachedAt = Date.now();

    console.log(`Clock skew: ${(cachedClockSkewMs / 1000).toFixed(1)}s (local ahead of chain)`);
    return cachedClockSkewMs;
  } catch (e) {
    console.error("Failed to get clock skew:", e instanceof Error ? e.message : String(e));
    return cachedClockSkewMs ?? 0;
  }
}

const ALLOWED_TRANSFER_AGENTS = [
  "gonka1y2a9p56kv044327uycmqdexl7zs82fs5ryv5le",
  "gonka1dkl4mah5erqggvhqkpc8j3qs5tyuetgdy552cp",
  "gonka1kx9mca3xm8u8ypzfuhmxey66u0ufxhs7nm6wc5",
  "gonka1ddswmmmn38esxegjf6qw36mt4aqyw6etvysy5x",
  "gonka10fynmy2npvdvew0vj2288gz8ljfvmjs35lat8n",
  "gonka1v8gk5z7gcv72447yfcd2y8g78qk05yc4f3nk4w",
  "gonka1gndhek2h2y5849wf6tmw6gnw9qn4vysgljed0u",
];

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
  const endpointsToTry = [
    `${nodeUrl}/v1/epochs/current/participants`,
    `${nodeUrl}/api/v1/participants`,
  ];

  let lastError: Error | null = null;

  for (const participantsUrl of endpointsToTry) {
    try {
      console.log("Fetching participants from:", participantsUrl);

      const participantsRes = await fetch(participantsUrl, {
        signal: AbortSignal.timeout(PROVIDER_FETCH_TIMEOUT_MS),
      });

      if (!participantsRes.ok) {
        console.warn(`Participants API returned ${participantsRes.status}`);
        continue;
      }

      const data = (await participantsRes.json()) as any;

      const list =
        data?.active_participants?.participants ||
        data?.participants ||
        data?.data?.active_participants?.participants ||
        data?.data?.participants ||
        [];

      if (Array.isArray(list)) {
        const eligible = list.filter((p: any) => {
          const address = String(p?.index || p?.id || "");
          const inferenceUrl = String(p?.inference_url || p?.inferenceUrl || p?.url || "");
          return ALLOWED_TRANSFER_AGENTS.includes(address) && Boolean(inferenceUrl);
        });

        if (eligible.length > 0) {
          const ranked = eligible.sort((a: any, b: any) => getProviderWeight(b) - getProviderWeight(a));
          const provider = ranked[0];
          const providerTransferAddress = String(provider.index || provider.id || "");
          const inferenceUrl = String(provider.inference_url || provider.inferenceUrl || provider.url || "").replace(/\/$/, "");

          if (providerTransferAddress && inferenceUrl) {
            console.log("Selected provider:", providerTransferAddress);
            return { providerTransferAddress, inferenceUrl };
          }
        }
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn("Participants fetch failed:", participantsUrl, lastError.message);
    }
  }

  throw lastError || new Error("Could not find provider address + inference_url in participants");
}

async function getProviderWithFallback(): Promise<SelectedProvider> {
  let lastError: unknown;

  for (const nodeUrl of PARTICIPANT_BOOTSTRAP_NODES) {
    try {
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

async function getAllProviders(nodeUrl: string): Promise<SelectedProvider[]> {
  const endpointsToTry = [
    `${nodeUrl}/v1/epochs/current/participants`,
    `${nodeUrl}/api/v1/participants`,
  ];

  for (const participantsUrl of endpointsToTry) {
    try {
      const participantsRes = await fetch(participantsUrl, {
        signal: AbortSignal.timeout(PROVIDER_FETCH_TIMEOUT_MS),
      });

      if (!participantsRes.ok) continue;

      const data = (await participantsRes.json()) as any;
      const list =
        data?.active_participants?.participants ||
        data?.participants ||
        data?.data?.active_participants?.participants ||
        data?.data?.participants ||
        [];

      if (Array.isArray(list)) {
        const eligible = list.filter((p: any) => {
          const address = String(p?.index || p?.id || "");
          const inferenceUrl = String(p?.inference_url || p?.inferenceUrl || p?.url || "");
          return ALLOWED_TRANSFER_AGENTS.includes(address) && Boolean(inferenceUrl);
        });

        const ranked = eligible.sort((a: any, b: any) => getProviderWeight(b) - getProviderWeight(a));
        
        return ranked.map((provider: any) => ({
          providerTransferAddress: String(provider.index || provider.id || ""),
          inferenceUrl: String(provider.inference_url || provider.inferenceUrl || provider.url || "").replace(/\/$/, ""),
        })).filter((p: SelectedProvider) => p.providerTransferAddress && p.inferenceUrl);
      }
    } catch (e) {
      console.warn("getAllProviders failed:", participantsUrl);
    }
  }

  return [];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWalletCredentials(): Promise<{ privateKeyHex: string; address: string }> {
  // Return cached if available
  if (cachedPrivateKeyHex && cachedWalletAddress) {
    return { privateKeyHex: cachedPrivateKeyHex, address: cachedWalletAddress };
  }

  if (!GONKA_MNEMONIC) {
    throw new Error("GONKA_MNEMONIC is not set");
  }

  const hdPath = stringToPath("m/44'/1200'/0'/0/0");
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(GONKA_MNEMONIC));
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(GONKA_MNEMONIC, { 
    prefix: "gonka",
    hdPaths: [hdPath]
  });
  const accounts = await wallet.getAccounts();
  
  if (!accounts[0]) {
    throw new Error("Failed to derive wallet account");
  }

  cachedPrivateKeyHex = toHex(privkey);
  cachedWalletAddress = accounts[0].address;

  return { privateKeyHex: cachedPrivateKeyHex, address: cachedWalletAddress };
}

type GonkaChatMessage = { role: string; content: string };

/**
 * Run inference on Gonka network using the shared wallet.
 */
export async function gonkaInference(params: {
  model: string;
  messages: Array<GonkaChatMessage>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}): Promise<Response> {
  console.log("=== GONKA INFERENCE ===");

  const { privateKeyHex, address } = await getWalletCredentials();
  console.log("Using wallet:", address);

  // Get all available providers for rotation on rate limits
  let allProviders: SelectedProvider[] = [];
  for (const nodeUrl of PARTICIPANT_BOOTSTRAP_NODES) {
    try {
      allProviders = await getAllProviders(nodeUrl);
      if (allProviders.length > 0) break;
    } catch (e) {
      console.warn("Failed to get providers from:", nodeUrl);
    }
  }

  if (allProviders.length === 0) {
    const singleProvider = await getProviderWithFallback();
    allProviders = [singleProvider];
  }

  console.log("Available providers:", allProviders.length);

  const payload = {
    model: params.model,
    messages: params.messages,
    stream: params.stream ?? false,
    temperature: params.temperature,
    max_tokens: params.max_tokens,
  };

  const payloadJson = JSON.stringify(payload);

  // Get clock skew once
  const clockSkewMs = await getClockSkew();

  // Retry loop with provider rotation
  let lastError: Error | null = null;
  let providerIndex = 0;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const provider = allProviders[providerIndex % allProviders.length];
    const providerTransferAddress = provider.providerTransferAddress;

    // Fresh timestamp for each attempt
    const adjustedTimeMs = Math.floor(Date.now() - clockSkewMs);
    const timestampNs = BigInt(adjustedTimeMs) * 1_000_000n;
    
    if (attempt > 0) {
      console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} with provider: ${providerTransferAddress}`);
    }

    const signature = signGonkaRequest(payloadJson, privateKeyHex, timestampNs, providerTransferAddress);

    const targetUrl = `${provider.inferenceUrl}/v1/chat/completions`;
    console.log("Target URL:", targetUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), INFERENCE_FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: signature,
          "x-requester-address": address,
          "x-timestamp": timestampNs.toString(),
        },
        body: payloadJson,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check for rate limit
      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const delayMs = retryAfter 
          ? parseInt(retryAfter, 10) * 1000 
          : INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        
        console.warn(`Rate limited (429). Retrying in ${delayMs}ms...`);
        providerIndex++;
        
        if (attempt < MAX_RETRIES - 1) {
          await sleep(delayMs);
          continue;
        }
      }

      // Check for server errors (5xx)
      if (res.status >= 500 && res.status < 600) {
        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Server error (${res.status}). Retrying in ${delayMs}ms...`);
        
        providerIndex++;
        
        if (attempt < MAX_RETRIES - 1) {
          await sleep(delayMs);
          continue;
        }
      }

      console.log("Gonka response status:", res.status);
      return res;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error("Fetch error:", lastError.message);
      
      providerIndex++;
      
      if (attempt < MAX_RETRIES - 1) {
        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.log(`Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }
  }

  throw lastError || new Error("All inference attempts failed");
}
