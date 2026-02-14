/**
 * Admin endpoint to encrypt a mnemonic with KMS
 * Protected by ADMIN_SECRET env var
 * Use once to generate encrypted mnemonic, then store in env vars
 */

import { NextResponse } from "next/server";

import { encrypt } from "@/lib/wallet/kms";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(req: Request) {
  // Check admin secret
  const authHeader = req.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");
  
  if (!ADMIN_SECRET || providedSecret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mnemonic } = body;

    if (!mnemonic || typeof mnemonic !== "string") {
      return NextResponse.json({ error: "mnemonic is required" }, { status: 400 });
    }

    // Validate mnemonic format (24 words)
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 24) {
      return NextResponse.json({ error: "mnemonic must be 24 words" }, { status: 400 });
    }

    // Encrypt with KMS
    const encrypted = await encrypt(mnemonic.trim());

    return NextResponse.json({ 
      success: true,
      encrypted,
      note: "Store this value in PUBLIC_WALLET_ENCRYPTED_MNEMONIC or TREASURY_ENCRYPTED_MNEMONIC env var"
    });

  } catch (error) {
    console.error("[admin/encrypt-mnemonic] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Encryption failed" },
      { status: 500 }
    );
  }
}
