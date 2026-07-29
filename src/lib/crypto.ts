/**
 * Zero-knowledge client-side crypto helpers.
 *
 * The server NEVER sees the master password or the derived encryption key.
 * Only ciphertext, IV, and auth tag ever leave the browser.
 *
 * Flow:
 *  1. On signup, generate a random `kdfSalt` (stored server-side, it's not secret).
 *  2. Derive an AES-256-GCM key from the user's master password + kdfSalt via PBKDF2.
 *  3. Use that key to encrypt/decrypt secret values entirely in-browser.
 *  4. Login password is a SEPARATE value (or same password but never sent in a way
 *     that leaks the key) - here we treat auth as independent of the vault key
 *     derivation salt to keep the two concerns cleanly separated.
 */

const PBKDF2_ITERATIONS = 210_000;

export async function deriveVaultKey(masterPassword: string, saltB64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const salt = base64ToBytes(saltB64);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bytesToBase64(salt);
}

export async function encryptSecret(plaintext: string, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
  const cipherBytes = new Uint8Array(cipherBuffer);

  // WebCrypto appends the 16-byte auth tag to the ciphertext output; split it off
  const authTag = cipherBytes.slice(cipherBytes.length - 16);
  const ciphertext = cipherBytes.slice(0, cipherBytes.length - 16);

  return {
    ciphertext: bytesToBase64(ciphertext),
    iv: bytesToBase64(iv),
    authTag: bytesToBase64(authTag)
  };
}

export async function decryptSecret(
  ciphertextB64: string,
  ivB64: string,
  authTagB64: string,
  key: CryptoKey
): Promise<string> {
  const ciphertext = base64ToBytes(ciphertextB64);
  const iv = base64ToBytes(ivB64);
  const authTag = base64ToBytes(authTagB64);

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
  return new TextDecoder().decode(plainBuffer);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
