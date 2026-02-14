/**
 * Treasury wallet utilities
 * The treasury is a funded Gonka wallet that distributes tokens to subscribers
 */

import { getBalance } from "@/lib/wallet/gonka";

export const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || "";
export const TREASURY_ENCRYPTED_MNEMONIC = process.env.TREASURY_ENCRYPTED_MNEMONIC || "";

// Minimum balance before alerting (100 GNK = enough for ~1 subscriber)
const MIN_BALANCE_NGONKA = 100_000_000_000n;

export interface TreasuryStatus {
  configured: boolean;
  address?: string;
  balance?: {
    gonka: string;
    ngonka: string;
  };
  lowBalance?: boolean;
  error?: string;
}

/**
 * Check treasury wallet status
 */
export async function getTreasuryStatus(): Promise<TreasuryStatus> {
  if (!TREASURY_ADDRESS || !TREASURY_ENCRYPTED_MNEMONIC) {
    return {
      configured: false,
      error: "Treasury wallet not configured. Set TREASURY_ADDRESS and TREASURY_ENCRYPTED_MNEMONIC.",
    };
  }

  try {
    const balance = await getBalance(TREASURY_ADDRESS);
    const balanceNgonka = BigInt(balance.ngonka || "0");
    const lowBalance = balanceNgonka < MIN_BALANCE_NGONKA;

    return {
      configured: true,
      address: TREASURY_ADDRESS,
      balance,
      lowBalance,
    };
  } catch (error) {
    return {
      configured: true,
      address: TREASURY_ADDRESS,
      error: `Failed to fetch balance: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Calculate how many subscriptions the treasury can fund
 */
export async function getTreasuryCapacity(): Promise<number> {
  const status = await getTreasuryStatus();
  
  if (!status.configured || !status.balance) {
    return 0;
  }

  const balanceNgonka = BigInt(status.balance.ngonka || "0");
  const tokensPerSub = 100_000_000_000n; // 100 GNK per subscription
  
  return Number(balanceNgonka / tokensPerSub);
}
