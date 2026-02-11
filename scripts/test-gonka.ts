import { gonkaInference } from "../lib/gonka/inference";

async function test() {
  // Replace with an actual encrypted mnemonic from your users table.
  const result = await gonkaInference({
    encryptedMnemonic: "YOUR_ENCRYPTED_MNEMONIC",
    gonkaAddress: "gonka175gyaqxp2yy05t99fkjmuacj04np7a60fyt2ct",
    model: "Qwen/Qwen3-235B-A22B-Instruct-2507-FP8",
    messages: [{ role: "user", content: "Say hello" }],
    stream: false,
  });

  console.log("Status:", result.status);
  console.log("Body:", await result.text());
}

test().catch(console.error);
