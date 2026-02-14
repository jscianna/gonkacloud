"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

import {
  deriveKey,
  createPinVerifier,
  verifyPin,
  cachePinVerifier,
  getCachedPinVerifier,
  clearPinCache,
  encryptMessage,
  decryptMessage,
} from "@/lib/encryption/crypto";

type EncryptionState = 
  | { status: "loading" }
  | { status: "needs-setup" } // First time, no PIN set
  | { status: "needs-pin" } // Has PIN but not unlocked
  | { status: "unlocked"; key: CryptoKey };

interface EncryptionContextType {
  state: EncryptionState;
  setupPin: (pin: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  lock: () => void;
  encrypt: (plaintext: string) => Promise<string>;
  decrypt: (encrypted: string) => Promise<string>;
}

const EncryptionContext = createContext<EncryptionContextType | null>(null);

export function useEncryption() {
  const ctx = useContext(EncryptionContext);
  if (!ctx) {
    throw new Error("useEncryption must be used within EncryptionProvider");
  }
  return ctx;
}

interface Props {
  userId: string;
  children: ReactNode;
}

export function EncryptionProvider({ userId, children }: Props) {
  const [state, setState] = useState<EncryptionState>({ status: "loading" });
  const [pinVerifier, setPinVerifier] = useState<string | null>(null);

  // Check for existing PIN setup on mount
  useEffect(() => {
    async function init() {
      try {
        // Check if user has a PIN verifier stored
        const res = await fetch("/api/user/encryption");
        const data = await res.json();
        
        if (!data.pinVerifier) {
          // No PIN set up yet
          setState({ status: "needs-setup" });
          return;
        }
        
        setPinVerifier(data.pinVerifier);
        
        // Check if we have a cached session
        const cached = await getCachedPinVerifier(userId);
        if (cached) {
          // Verify the cached verifier matches
          if (cached === data.pinVerifier) {
            // Try to derive key - user needs to enter PIN at least once
            // For now, require PIN entry
            setState({ status: "needs-pin" });
          } else {
            // Verifier mismatch, clear cache
            await clearPinCache(userId);
            setState({ status: "needs-pin" });
          }
        } else {
          setState({ status: "needs-pin" });
        }
      } catch (error) {
        console.error("Encryption init error:", error);
        setState({ status: "needs-setup" });
      }
    }
    
    init();
  }, [userId]);

  const setupPin = useCallback(async (pin: string) => {
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      throw new Error("PIN must be exactly 6 digits");
    }
    
    // Create verifier and derive key
    const verifier = await createPinVerifier(userId, pin);
    const key = await deriveKey(userId, pin);
    
    // Save verifier to server
    await fetch("/api/user/encryption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinVerifier: verifier }),
    });
    
    // Cache locally
    await cachePinVerifier(userId, verifier);
    setPinVerifier(verifier);
    
    setState({ status: "unlocked", key });
  }, [userId]);

  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    if (!pinVerifier) return false;
    
    const valid = await verifyPin(userId, pin, pinVerifier);
    if (!valid) return false;
    
    const key = await deriveKey(userId, pin);
    
    // Refresh cache (extends 30 day window)
    await cachePinVerifier(userId, pinVerifier);
    
    setState({ status: "unlocked", key });
    return true;
  }, [userId, pinVerifier]);

  const lock = useCallback(() => {
    setState({ status: "needs-pin" });
  }, []);

  const encrypt = useCallback(async (plaintext: string): Promise<string> => {
    if (state.status !== "unlocked") {
      throw new Error("Encryption not unlocked");
    }
    return encryptMessage(plaintext, state.key);
  }, [state]);

  const decrypt = useCallback(async (encrypted: string): Promise<string> => {
    if (state.status !== "unlocked") {
      throw new Error("Encryption not unlocked");
    }
    return decryptMessage(encrypted, state.key);
  }, [state]);

  return (
    <EncryptionContext.Provider
      value={{ state, setupPin, unlockWithPin, lock, encrypt, decrypt }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}
