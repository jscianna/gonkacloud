import { NextResponse } from "next/server";

import { PRICING } from "@/lib/api/pricing";
import { ApiAuthError, validateKey } from "@/lib/api/validate-key";

export async function GET(req: Request) {
  try {
    await validateKey(req);

    const data = Object.keys(PRICING).map((id) => ({
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
