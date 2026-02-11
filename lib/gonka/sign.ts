import { sha256 } from "@cosmjs/crypto";
import { fromHex } from "@cosmjs/encoding";
import * as secp256k1 from "secp256k1";

export function signGonkaRequest(
  payload: string,
  privateKeyHex: string,
  timestampNs: bigint,
  providerTransferAddress: string
): string {
  // SDK signing spec: sign(payload + timestamp + providerTransferAddress)
  const message = `${payload}${timestampNs.toString()}${providerTransferAddress}`;
  const messageBytes = new TextEncoder().encode(message);

  const messageHash = sha256(messageBytes);
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
