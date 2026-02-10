import crypto from "crypto";
import { DecryptCommand, EncryptCommand, GenerateDataKeyCommand, KMSClient } from "@aws-sdk/client-kms";

// Envelope encryption format:
// - GenerateDataKey (AES-256) from KMS: returns plaintext data key + encrypted data key (EDK)
// - Encrypt plaintext locally with AES-256-GCM using plaintext data key
// - Store { edk, iv, ct, tag } base64-encoded inside a base64(JSON) wrapper

type EnvelopePayloadV1 = {
  v: 1;
  alg: "AES-256-GCM";
  edk: string; // base64
  iv: string; // base64
  ct: string; // base64
  tag: string; // base64
};

function getKmsClient() {
  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("AWS_REGION is not set");
  }

  return new KMSClient({ region });
}

function getKmsKeyId() {
  const keyId = process.env.AWS_KMS_KEY_ID;
  if (!keyId) {
    throw new Error("AWS_KMS_KEY_ID is not set");
  }
  return keyId;
}

function b64(buf: Uint8Array) {
  return Buffer.from(buf).toString("base64");
}

function b64ToBuf(str: string) {
  return Buffer.from(str, "base64");
}

export async function encrypt(plaintext: string): Promise<string> {
  const kms = getKmsClient();
  const keyId = getKmsKeyId();

  const iv = crypto.randomBytes(12);

  // Convert to Buffer so we can attempt to wipe it.
  const ptBuf = Buffer.from(plaintext, "utf8");

  let dataKey: Buffer | null = null;
  let edk: Uint8Array | null = null;
  let ct: Buffer | null = null;
  let tag: Buffer | null = null;

  try {
    const dk = await kms.send(
      new GenerateDataKeyCommand({
        KeyId: keyId,
        KeySpec: "AES_256",
      })
    );

    if (!dk.Plaintext || !dk.CiphertextBlob) {
      throw new Error("KMS did not return data key");
    }

    dataKey = Buffer.from(dk.Plaintext);
    edk = dk.CiphertextBlob;

    const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
    ct = Buffer.concat([cipher.update(ptBuf), cipher.final()]);
    tag = cipher.getAuthTag();

    const payload: EnvelopePayloadV1 = {
      v: 1,
      alg: "AES-256-GCM",
      edk: b64(edk),
      iv: b64(iv),
      ct: b64(ct),
      tag: b64(tag),
    };

    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  } finally {
    // Best-effort wipe of sensitive buffers.
    ptBuf.fill(0);
    if (dataKey) dataKey.fill(0);
    if (ct) ct.fill(0);
    if (tag) tag.fill(0);
  }
}

export async function decrypt(ciphertext: string): Promise<string> {
  const kms = getKmsClient();

  const decoded = Buffer.from(ciphertext, "base64").toString("utf8");
  const payload = JSON.parse(decoded) as EnvelopePayloadV1;

  if (payload.v !== 1 || payload.alg !== "AES-256-GCM") {
    throw new Error("Unsupported ciphertext format");
  }

  const edk = b64ToBuf(payload.edk);
  const iv = b64ToBuf(payload.iv);
  const ct = b64ToBuf(payload.ct);
  const tag = b64ToBuf(payload.tag);

  let dataKey: Buffer | null = null;
  let pt: Buffer | null = null;

  try {
    const out = await kms.send(new DecryptCommand({ CiphertextBlob: edk }));

    if (!out.Plaintext) {
      throw new Error("KMS did not return plaintext data key");
    }

    dataKey = Buffer.from(out.Plaintext);

    const decipher = crypto.createDecipheriv("aes-256-gcm", dataKey, iv);
    decipher.setAuthTag(tag);

    pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  } finally {
    // Best-effort wipe of sensitive buffers.
    edk.fill(0);
    iv.fill(0);
    ct.fill(0);
    tag.fill(0);
    if (dataKey) dataKey.fill(0);
    if (pt) pt.fill(0);
  }
}

// Optional helper for encrypting small secrets using KMS direct Encrypt (not used for mnemonics).
export async function encryptDirect(plaintext: string): Promise<string> {
  const kms = getKmsClient();
  const keyId = getKmsKeyId();

  const out = await kms.send(
    new EncryptCommand({
      KeyId: keyId,
      Plaintext: Buffer.from(plaintext, "utf8"),
    })
  );

  if (!out.CiphertextBlob) {
    throw new Error("KMS did not return ciphertext");
  }

  return Buffer.from(out.CiphertextBlob).toString("base64");
}
