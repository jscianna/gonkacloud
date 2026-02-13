const GONKA_NODE_URL = process.env.GONKA_NODE_URL || "http://node1.gonka.ai:8000";
const GNK_DECIMALS = 1_000_000;

export async function getGonkaBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`${GONKA_NODE_URL.replace(/\/$/, "")}/v1/participants/${address}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return 0;
    }

    const data = (await response.json()) as { balance?: number | string };
    const raw = typeof data.balance === "string" ? Number(data.balance) : data.balance;
    return Number.isFinite(raw) ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function formatGonkaBalance(balance: number): string {
  return `${(balance / GNK_DECIMALS).toFixed(6)} GNK`;
}
