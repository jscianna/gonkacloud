import { auth } from "@clerk/nextjs/server";
import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { toHex } from "@cosmjs/encoding";
import { eq } from "drizzle-orm";
import { GonkaOpenAI, resolveEndpoints } from "gonka-openai";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { decrypt } from "@/lib/wallet/kms";

async function derivePrivateKeyHexFromMnemonic(mnemonic: string): Promise<string> {
  const hdPath = stringToPath("m/44'/118'/0'/0/0");
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  return toHex(privkey);
}

export async function POST(req: Request) {
  void req;
  let mnemonic: string | null = null;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        gonkaAddress: users.gonkaAddress,
        encryptedMnemonic: users.encryptedMnemonic,
      })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user?.gonkaAddress || !user.encryptedMnemonic) {
      return NextResponse.json({ error: "Wallet not provisioned" }, { status: 400 });
    }

    mnemonic = await decrypt(user.encryptedMnemonic);
    const privateKeyHex = await derivePrivateKeyHexFromMnemonic(mnemonic);

    const endpoints = await resolveEndpoints({ sourceUrl: "http://node2.gonka.ai:8000" });

    const client = new GonkaOpenAI({
      gonkaPrivateKey: `0x${privateKeyHex}`,
      gonkaAddress: user.gonkaAddress,
      endpoints,
    });

    const response = await client.chat.completions.create({
      model: "Qwen/Qwen3-235B-A22B-Instruct-2507-FP8",
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      stream: false,
    });

    return NextResponse.json(
      {
        success: true,
        selectedEndpoint: client.selectedEndpoint,
        response,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message ?? "Unknown error" }, { status: 500 });
  } finally {
    if (mnemonic) {
      mnemonic = "";
      mnemonic = null;
    }
  }
}
