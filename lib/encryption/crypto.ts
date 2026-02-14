/**
 * Client-side E2E encryption using Web Crypto API
 * 
 * Key derivation: PBKDF2 with 100K iterations
 * Encryption: AES-256-GCM
 * 
 * The PIN never leaves the browser. Server only sees encrypted blobs.
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/**
 * Derive an encryption key from user ID + PIN
 * Uses PBKDF2 with high iteration count to slow brute force attacks
 */
export async function deriveKey(userId: string, pin: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  // Create a deterministic salt from userId (so same PIN = same key across devices)
  const saltInput = encoder.encode(`dogecat:${userId}:salt:v1`);
  const saltHash = await crypto.subtle.digest('SHA-256', saltInput);
  const salt = new Uint8Array(saltHash).slice(0, SALT_LENGTH);
  
  // Import PIN as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the actual encryption key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
  
  return key;
}

/**
 * Encrypt a message using AES-256-GCM
 * Returns base64-encoded string: iv:ciphertext
 */
export async function encryptMessage(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a message using AES-256-GCM
 * Expects base64-encoded string: iv:ciphertext
 */
export async function decryptMessage(encrypted: string, key: CryptoKey): Promise<string> {
  const decoder = new TextDecoder();
  
  // Decode base64
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  
  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  
  return decoder.decode(plaintext);
}

/**
 * Verify a PIN by attempting to decrypt a test message
 */
export async function verifyPin(userId: string, pin: string, testEncrypted: string): Promise<boolean> {
  try {
    const key = await deriveKey(userId, pin);
    await decryptMessage(testEncrypted, key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a test encryption to verify PIN later
 */
export async function createPinVerifier(userId: string, pin: string): Promise<string> {
  const key = await deriveKey(userId, pin);
  return encryptMessage('dogecat-pin-verifier', key);
}

// IndexedDB helpers for PIN caching
const DB_NAME = 'dogecat-encryption';
const STORE_NAME = 'keys';
const PIN_CACHE_DAYS = 30;

interface CachedKeyData {
  userId: string;
  keyData: string; // We store a verifier, not the actual key
  expiresAt: number;
}

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
  });
}

/**
 * Cache the PIN verifier in IndexedDB (expires in 30 days)
 */
export async function cachePinVerifier(userId: string, verifier: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  const data: CachedKeyData = {
    userId,
    keyData: verifier,
    expiresAt: Date.now() + PIN_CACHE_DAYS * 24 * 60 * 60 * 1000,
  };
  
  store.put(data);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get cached PIN verifier from IndexedDB
 */
export async function getCachedPinVerifier(userId: string): Promise<string | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.get(userId);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result as CachedKeyData | undefined;
      
      if (!data) {
        resolve(null);
        return;
      }
      
      // Check if expired
      if (Date.now() > data.expiresAt) {
        // Delete expired entry
        const deleteTx = db.transaction(STORE_NAME, 'readwrite');
        deleteTx.objectStore(STORE_NAME).delete(userId);
        resolve(null);
        return;
      }
      
      resolve(data.keyData);
    };
  });
}

/**
 * Clear cached PIN data
 */
export async function clearPinCache(userId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(userId);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
