import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { toHex } from "@cosmjs/encoding";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";

import { registerGonkaWallet } from "@/lib/gonka/register";
import { decrypt, encrypt } from "@/lib/wallet/kms";

export const CHAIN_ID = process.env.GONKA_CHAIN_ID || "gonka-mainnet";
export const ADDRESS_PREFIX = "gonka";
export const DENOM = "ngonka";
const GONKA_API_URL = "https://gonka.gg/api/public";
const GONKA_API_KEY = process.env.GONKA_API_KEY;

const NGONKA_PER_GONKA = 1_000_000_000n;
const DEFAULT_RPC_URL = "http://node2.gonka.ai:8000/chain-rpc";

function resolveRpcUrl() {
  const raw = (process.env.GONKA_RPC_URL || "").trim();
  if (!raw) return DEFAULT_RPC_URL;

  try {
    const parsed = new URL(raw);

    // Gonka RPC must run on :8000, even if env var omitted the port.
    if (parsed.hostname.endsWith("gonka.ai") && !parsed.port) {
      parsed.port = "8000";
    }

    // Chain RPC endpoint path.
    if (!parsed.pathname || parsed.pathname === "/") {
      parsed.pathname = "/chain-rpc";
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_RPC_URL;
  }
}

export const RPC_URL = resolveRpcUrl();

function ngonkaToGonkaString(ngonka: string) {
  const n = BigInt(ngonka || "0");
  const whole = n / NGONKA_PER_GONKA;
  const frac = n % NGONKA_PER_GONKA;
  const fracStr = frac.toString().padStart(9, "0").replace(/0+$/, "");
  return fracStr.length ? `${whole.toString()}.${fracStr}` : whole.toString();
}

/**
 * Generate a new Gonka wallet locally (instant, no on-chain registration).
 * On-chain registration happens lazily when user first uses inference.
 */
export async function generateWallet(): Promise<{ address: string; encryptedMnemonic: string; encryptedPrivateKey: string }> {
  // 24-word mnemonic with Gonka HD path (coin type 1200)
  const wallet = await DirectSecp256k1HdWallet.generate(24, { 
    prefix: ADDRESS_PREFIX,
    hdPaths: [stringToPath("m/44'/1200'/0'/0/0")],
  });

  let mnemonic = wallet.mnemonic;
  try {
    const accounts = await wallet.getAccounts();
    const account = accounts[0];

    if (!account) {
      throw new Error("Failed to generate account");
    }

    // Derive private key for signing (same path as registration)
    const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, stringToPath("m/44'/1200'/0'/0/0"));
    const privateKeyHex = toHex(privkey);

    const encryptedMnemonic = await encrypt(mnemonic);
    const encryptedPrivateKey = await encrypt(privateKeyHex);

    return {
      address: account.address,
      encryptedMnemonic,
      encryptedPrivateKey,
    };
  } finally {
    mnemonic = "";
  }
}

/**
 * Register wallet on-chain as inference participant.
 * Call this lazily before first inference, not on wallet creation.
 */
export async function registerWalletOnChain(encryptedMnemonic: string): Promise<{ address: string; pubkey: string }> {
  let mnemonic: string | null = null;
  try {
    mnemonic = await decrypt(encryptedMnemonic);
    const registration = await registerGonkaWallet(mnemonic);
    return { address: registration.address, pubkey: registration.pubkey };
  } finally {
    if (mnemonic) {
      mnemonic = "";
      mnemonic = null;
    }
  }
}

export async function getBalance(address: string): Promise<{ gonka: string; ngonka: string }> {
  try {
    const response = await fetch(`${GONKA_API_URL}/search?query=${address}`, {
      headers: {
        "X-API-Key": GONKA_API_KEY || "",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Balance fetch failed:", response.status);
      return { gonka: "0", ngonka: "0" };
    }

    const data = (await response.json()) as {
      type?: string;
      found?: boolean;
      data?: {
        balances?: Array<{ denom?: string; amount?: string }>;
      };
    };

    if (data.type === "wallet" && data.found && data.data?.balances) {
      const balance = data.data.balances.find((b) => b.denom === "ngonka");
      const ngonka = balance?.amount || "0";
      const gonkaNum = Number(ngonka) / 1_000_000_000;

      return {
        ngonka,
        gonka: gonkaNum.toFixed(9).replace(/\.?0+$/, "") || "0",
      };
    }

    return { gonka: "0", ngonka: "0" };
  } catch (error) {
    console.error("Balance fetch error:", error);
    return { gonka: "0", ngonka: "0" };
  }
}

export async function sendTokens(encryptedMnemonic: string, toAddress: string, amountNgonka: string): Promise<string> {
  let mnemonic = "";

  try {
    mnemonic = await decrypt(encryptedMnemonic);

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: ADDRESS_PREFIX });
    const [account] = await wallet.getAccounts();

    if (!account) {
      throw new Error("Missing from account");
    }

    const client = await SigningStargateClient.connectWithSigner(RPC_URL, wallet);

    const msgSend = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress: account.address,
        toAddress,
        amount: [{ denom: DENOM, amount: amountNgonka }],
      },
    };

    const result = await client.signAndBroadcast(account.address, [msgSend], "auto");

    if (result.code !== 0) {
      throw new Error(result.rawLog || "Broadcast failed");
    }

    return result.transactionHash;
  } finally {
    // Best-effort cleanup.
    mnemonic = "";
  }
}
