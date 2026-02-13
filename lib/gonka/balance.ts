const GONKA_API_URL = "https://gonka.gg/api/public";
const GONKA_API_KEY = process.env.GONKA_API_KEY;
const GNK_DECIMALS = 1_000_000_000; // ngonka has 9 decimals

export async function getGonkaBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`${GONKA_API_URL}/search?query=${address}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${GONKA_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("Gonka balance API failed:", response.status);
      return 0;
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
      return Number(ngonka);
    }

    return 0;
  } catch (error) {
    console.error("Gonka balance fetch error:", error);
    return 0;
  }
}

export function formatGonkaBalance(ngonkaBalance: number): string {
  const gonka = ngonkaBalance / GNK_DECIMALS;
  return `${gonka.toFixed(9).replace(/\.?0+$/, "")} GNK`;
}
