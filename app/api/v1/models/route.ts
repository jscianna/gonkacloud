import { NextResponse } from "next/server";

import { ApiAuthError, validateKey } from "@/lib/api/validate-key";
import { GONKA_MODELS } from "@/lib/gonka/client";

export async function GET(req: Request) {
  try {
    await validateKey(req);

    const data = GONKA_MODELS.map((id) => ({
      id,
      object: "model",
      created: 0,
      owned_by: "gonka",
    }));

    return NextResponse.json({ object: "list", data }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json(
        { error: { message: error.message, type: error.type, code: error.code } },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: { message: "Failed to list models", type: "server_error", code: "internal_error" } },
      { status: 500 }
    );
  }
}
