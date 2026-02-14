"use client";

import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useEncryption } from "./encryption-provider";

export function PinModal() {
  const { state, setupPin, unlockWithPin } = useEncryption();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSetup = state.status === "needs-setup";
  const needsConfirm = isSetup && pin.length === 6;

  useEffect(() => {
    inputRef.current?.focus();
  }, [needsConfirm]);

  if (state.status === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (state.status === "unlocked") {
    return null;
  }

  const handlePinChange = (value: string, isConfirm: boolean) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setError("");
    
    if (isConfirm) {
      setConfirmPin(cleaned);
    } else {
      setPin(cleaned);
      if (!isSetup && cleaned.length === 6) {
        // Auto-submit on 6 digits for unlock
        handleUnlock(cleaned);
      }
    }
  };

  const handleUnlock = async (pinValue: string) => {
    setLoading(true);
    setError("");
    
    try {
      const success = await unlockWithPin(pinValue);
      if (!success) {
        setError("Incorrect PIN. Please try again.");
        setPin("");
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (pin !== confirmPin) {
      setError("PINs don't match. Please try again.");
      setConfirmPin("");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await setupPin(pin);
    } catch (e) {
      setError("Failed to set up PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0b] p-6">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            {isSetup ? (
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            ) : (
              <Lock className="h-8 w-8 text-emerald-400" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-xl font-semibold text-white">
          {isSetup ? "Set Up Encryption" : "Unlock Your Chats"}
        </h2>
        
        <p className="mb-6 text-center text-sm text-white/60">
          {isSetup
            ? "Create a 6-digit PIN to encrypt your conversations. This PIN will be remembered for 30 days."
            : "Enter your 6-digit PIN to access your encrypted chats."}
        </p>

        {/* PIN Input */}
        <div className="mb-4">
          <label className="mb-2 block text-sm text-white/60">
            {needsConfirm ? "Confirm PIN" : "Enter PIN"}
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={needsConfirm ? confirmPin : pin}
              onChange={(e) => handlePinChange(e.target.value, needsConfirm)}
              placeholder="••••••"
              className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-center text-2xl tracking-[0.5em] text-white placeholder:tracking-[0.3em] focus:border-emerald-500/50 focus:outline-none"
              disabled={loading}
            />
          </div>
          
          {/* PIN dots indicator */}
          <div className="mt-3 flex justify-center gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  (needsConfirm ? confirmPin : pin).length > i
                    ? "bg-emerald-400"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 text-center text-sm text-red-400">{error}</p>
        )}

        {/* Submit button for setup */}
        {isSetup && needsConfirm && (
          <Button
            onClick={handleSetup}
            disabled={confirmPin.length !== 6 || loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Enable Encryption"}
          </Button>
        )}

        {/* Info text */}
        <div className="mt-6 rounded-lg bg-white/5 p-3 text-xs text-white/50">
          <p className="mb-1 font-medium text-white/70">🔐 End-to-End Encrypted</p>
          <p>
            Your chats are encrypted on your device before being sent to our servers.
            We cannot read your messages. Chats are automatically deleted after 30 days.
          </p>
        </div>
      </div>
    </div>
  );
}
