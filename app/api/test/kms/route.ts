import { NextResponse } from "next/server";

import { decrypt, encrypt } from "@/lib/wallet/kms";

export async function GET() {
  try {
    console.log("[test/kms] testing KMS");
    const testMsg = `test-${Date.now()}`;
    const encrypted = await encrypt(testMsg);
    console.log("[test/kms] encrypted sample", `${encrypted.substring(0, 20)}...`);
    const decrypted = await decrypt(encrypted);
    console.log("[test/kms] decrypted", decrypted);

    return NextResponse.json({ success: true, match: decrypted === testMsg });
  } catch (error) {
    console.error("[test/kms] KMS error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown KMS error",
      },
      { status: 500 }
    );
  }
}
