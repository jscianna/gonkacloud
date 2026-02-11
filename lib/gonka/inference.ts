import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { toHex } from "@cosmjs/encoding";

import { decrypt } from "@/lib/wallet/kms";
import { signGonkaRequest } from "@/lib/gonka/sign";

const GONKA_NODES = ["http://node1.gonka.ai:8000", "http://node2.gonka.ai:8000", "http://node3.gonka.ai:8000"];
const FETCH_TIMEOUT_MS = 10_000;

function requireGonkaAddress(addr: string | null | undefined) {
  if (!addr || typeof addr !== "string") {
    throw new Error("Missing gonkaAddress");
  }
  return addr;
}

async function getProviderAddress(nodeUrl: string): Promise<string> {
  const participantsUrl = `${nodeUrl}/v1/epochs/current/participants`;
  console.log("Fetching participants from:", participantsUrl);

  const participantsController = new AbortController();
  const participantsTimeout = setTimeout(() => participantsController.abort(), FETCH_TIMEOUT_MS);

  const participantsRes = await fetch(participantsUrl, { signal: participantsController.signal }).finally(() =>
    clearTimeout(participantsTimeout)
  );

  if (!participantsRes.ok) {
    throw new Error(`Failed to fetch participants: ${participantsRes.status}`);
  }

  const data = (await participantsRes.json()) as any;
  console.log("Participants response keys:", Object.keys(data ?? {}));
  console.log("First participant (sample):", JSON.stringify(data).substring(0, 500));

  // Find any Gonka address in the payload for now.
  const jsonStr = JSON.stringify(data);
  const match = jsonStr.match(/gonka1[a-z0-9]{38}/);
  if (match) {
    console.log("Found provider address:", match[0]);
    return match[0];
  }

  throw new Error("Could not find provider address in participants");
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

    console.log("Step: select Gonka node");
    const nodeUrl = GONKA_NODES[Math.floor(Math.random() * GONKA_NODES.length)];
    console.log("Step: fetch provider address");
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
    const targetUrl = `${nodeUrl}/v1/chat/completions`;
    console.log("Target URL:", targetUrl);
    console.log("Provider address:", providerAddress);

    console.log("Gonka inference URL:", nodeUrl);
    console.log("Gonka inference headers:", {
      Authorization: `${signature.substring(0, 20)}...`,
      "X-Requester-Address": params.gonkaAddress,
      "X-Timestamp": timestampNs.toString(),
    });

    console.log("Step: send inference request");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: signature,
        "x-requester-address": requester,
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
