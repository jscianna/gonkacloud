import { auth } from "@clerk/nextjs/server";
import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { toHex } from "@cosmjs/encoding";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as secp256k1 from "secp256k1";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { decrypt } from "@/lib/wallet/kms";
import { getBalance } from "@/lib/wallet/gonka";

const NODE_URL = process.env.GONKA_NODE_URL || "http://node2.gonka.ai:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function derivePrivateKeyHexFromMnemonic(mnemonic: string): Promise<string> {
  const hdPath = stringToPath("m/44'/118'/0'/0/0");
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  return toHex(privkey);
}

export async function POST() {
  let mnemonic: string | null = null;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db
      .select({
        id: users.id,
        gonkaAddress: users.gonkaAddress,
        encryptedMnemonic: users.encryptedMnemonic,
        inferenceRegistered: users.inferenceRegistered,
      })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not provisioned" }, { status: 400 });
    }

    if (!dbUser.gonkaAddress || !dbUser.encryptedMnemonic) {
      return NextResponse.json({ error: "Wallet not provisioned" }, { status: 400 });
    }

    if (dbUser.inferenceRegistered) {
      return NextResponse.json({ success: true, alreadyRegistered: true }, { status: 200 });
    }

    const balance = await getBalance(dbUser.gonkaAddress);
    if (Number(balance.ngonka) <= 0) {
      return NextResponse.json(
        { error: "Wallet must be funded before inference registration." },
        { status: 400 }
      );
    }

    mnemonic = await decrypt(dbUser.encryptedMnemonic);
    const privateKeyHex = await derivePrivateKeyHexFromMnemonic(mnemonic);
    const privateKeyBuffer = Buffer.from(privateKeyHex.replace(/^0x/, ""), "hex");

    const publicKeyCompressed = secp256k1.publicKeyCreate(privateKeyBuffer, true);
    const pubKeyBase64 = Buffer.from(publicKeyCompressed).toString("base64");

    console.log("=== REGISTRATION DEBUG ===");
    console.log("Address:", dbUser.gonkaAddress);
    console.log("PubKey Base64:", pubKeyBase64);
    console.log("PubKey length (should be 44 chars for 33-byte key):", pubKeyBase64.length);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const response = await fetch(`${NODE_URL.replace(/\/$/, "")}/v1/participants`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        pub_key: pubKeyBase64,
        address: dbUser.gonkaAddress,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    console.log("Gonka response status:", response.status);
    const responseText = await response.text();
    console.log("Gonka response body:", responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Registration failed: ${responseText || response.statusText}` },
        { status: 500 }
      );
    }

    await db
      .update(users)
      .set({
        inferenceRegistered: true,
        inferenceRegisteredAt: new Date(),
      })
      .where(eq(users.id, dbUser.id));

    return NextResponse.json({ success: true, message: "Wallet registered for inference" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register wallet for inference";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (mnemonic) {
      mnemonic = "";
      mnemonic = null;
    }
  }
}
