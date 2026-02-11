import { NextResponse } from "next/server";

import { generateWallet } from "@/lib/wallet/gonka";

export async function GET() {
  try {
    console.log("[test/wallet] testing wallet generation");
    const wallet = await generateWallet();
    console.log("[test/wallet] generated address", wallet.address);
    return NextResponse.json({ success: true, address: wallet.address });
  } catch (error) {
    console.error("[test/wallet] wallet error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown wallet error",
      },
      { status: 500 }
    );
  }
}
