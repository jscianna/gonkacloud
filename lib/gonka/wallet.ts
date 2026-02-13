import { generateWallet } from "@/lib/wallet/gonka";

export type GonkaWallet = {
  address: string;
  encryptedMnemonic: string;
  encryptedPrivateKey: string;
};

export async function createGonkaWallet(_userId: string): Promise<GonkaWallet> {
  return generateWallet();
}
