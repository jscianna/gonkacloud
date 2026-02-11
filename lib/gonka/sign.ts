import crypto from "crypto";
import secp256k1 from "secp256k1";

function concatMessage(payloadJson: string, timestampNs: bigint, providerAddress: string) {
  const payloadBytes = Buffer.from(payloadJson, "utf8");
  const tsBytes = Buffer.from(timestampNs.toString(), "utf8");
  const providerBytes = Buffer.from(providerAddress, "utf8");
  return Buffer.concat([payloadBytes, tsBytes, providerBytes]);
}

export function signGonkaRequest(
  payloadJson: string,
  privateKeyHex: string,
  timestampNs: bigint,
  providerAddress: string
): string {
  const privKey = Buffer.from(privateKeyHex, "hex");
  if (privKey.length !== 32) {
    throw new Error("Invalid private key length");
  }

  const msg = concatMessage(payloadJson, timestampNs, providerAddress);
  const hash = crypto.createHash("sha256").update(msg).digest();

  const { signature } = secp256k1.ecdsaSign(hash, privKey);
  const normalized = secp256k1.signatureNormalize(signature);

  // signature is r||s (64 bytes)
  return Buffer.from(normalized).toString("base64");
}
