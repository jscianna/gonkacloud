import { sha256 } from "@cosmjs/crypto";
import { fromHex } from "@cosmjs/encoding";
import * as secp256k1 from "secp256k1";

export function signGonkaRequest(
  payload: string,
  privateKeyHex: string,
  timestampNs: bigint,
  providerAddress: string
): string {
  const payloadBytes = new TextEncoder().encode(payload);
  const timestampBytes = new TextEncoder().encode(timestampNs.toString());
  const providerBytes = new TextEncoder().encode(providerAddress);

  // Concatenate: payload || timestamp || provider
  const message = new Uint8Array([...payloadBytes, ...timestampBytes, ...providerBytes]);

  const messageHash = sha256(message);
  const privateKey = fromHex(privateKeyHex);

  const { signature } = secp256k1.ecdsaSign(messageHash, privateKey);

  // Normalize S value (low-S)
  const r = signature.slice(0, 32);
  const s = signature.slice(32, 64);
  const order = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
  let sInt = BigInt(`0x${Buffer.from(s).toString("hex")}`);
  if (sInt > order / 2n) {
    sInt = order - sInt;
  }
  const normalizedS = Buffer.from(sInt.toString(16).padStart(64, "0"), "hex");

  const fullSig = Buffer.concat([Buffer.from(r), normalizedS]);
  return fullSig.toString("base64");
}
