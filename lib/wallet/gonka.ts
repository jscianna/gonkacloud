/**
 * Gonka wallet utilities - simplified for single shared wallet architecture.
 * All inference uses the Dogecat/Vex wallet configured via GONKA_MNEMONIC.
 */

const GONKA_API_URL = "https://gonka.gg/api/public";
const GONKA_API_KEY = process.env.GONKA_API_KEY;

/**
 * Get balance for a Gonka address (for monitoring the shared wallet).
 */
export async function getBalance(address: string): Promise<{ gonka: string; ngonka: string }> {
  try {
    const response = await fetch(`${GONKA_API_URL}/search?query=${address}`, {
      headers: {
        "X-API-Key": GONKA_API_KEY || "",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = (await response.json()) as {
        type?: string;
        found?: boolean;
        data?: {
          balances?: Array<{ denom?: string; amount?: string }>;
        };
      };

      if (data.type === "wallet" && data.found && data.data?.balances) {
        const balance = data.data.balances.find((b) => b.denom === "ngonka");
        if (balance?.amount && balance.amount !== "0") {
          const ngonka = balance.amount;
          const gonkaNum = Number(ngonka) / 1_000_000_000;
          return {
            ngonka,
            gonka: gonkaNum.toFixed(9).replace(/\.?0+$/, "") || "0",
          };
        }
      }
    }

    return { gonka: "0", ngonka: "0" };
  } catch (error) {
    console.error("Balance fetch error:", error);
    return { gonka: "0", ngonka: "0" };
  }
}
