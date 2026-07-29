'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deriveVaultKey, encryptSecret, decryptSecret } from '@/lib/crypto';

type StoredSecret = {
  id: string;
  name: string;
  ciphertext: string;
  iv: string;
  authTag: string;
};

type DecryptedSecret = StoredSecret & { plaintext?: string; revealed: boolean };

export default function VaultClient() {
  const router = useRouter();
  const [masterPassword, setMasterPassword] = useState('');
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [secrets, setSecrets] = useState<DecryptedSecret[]>([]);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const salt = localStorage.getItem('ghosthowl_kdf_salt');
    if (!salt) {
      setError('No vault salt found. Please log in again.');
      return;
    }
    try {
      const key = await deriveVaultKey(masterPassword, salt);
      setVaultKey(key);
      await loadSecrets();
    } catch {
      setError('Failed to derive key');
    }
  }

  async function loadSecrets() {
    const res = await fetch('/api/secrets');
    if (res.ok) {
      const data: StoredSecret[] = await res.json();
      setSecrets(data.map((s) => ({ ...s, revealed: false })));
    }
  }

  async function addSecret(e: React.FormEvent) {
    e.preventDefault();
    if (!vaultKey) return;
    const encrypted = await encryptSecret(value, vaultKey);
    const res = await fetch('/api/secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ...encrypted })
    });
    if (res.ok) {
      setName('');
      setValue('');
      await loadSecrets();
    }
  }

  async function toggleReveal(secret: DecryptedSecret) {
    if (!vaultKey) return;
    if (secret.revealed) {
      setSecrets((prev) =>
        prev.map((s) => (s.id === secret.id ? { ...s, revealed: false, plaintext: undefined } : s))
      );
      return;
    }
    const plaintext = await decryptSecret(secret.ciphertext, secret.iv, secret.authTag, vaultKey);
    setSecrets((prev) =>
      prev.map((s) => (s.id === secret.id ? { ...s, revealed: true, plaintext } : s))
    );
  }

  async function deleteSecret(id: string) {
    await fetch(`/api/secrets/${id}`, { method: 'DELETE' });
    await loadSecrets();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('ghosthowl_kdf_salt');
    router.push('/');
  }

  if (!vaultKey) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <form onSubmit={unlock} className="card p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold mb-2">Re-enter master password</h1>
          <p className="text-xs text-gray-500 mb-4">
            Your key is derived fresh each session and never stored.
          </p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <input
            className="input-field mb-4"
            type="password"
            required
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
          />
          <button className="btn-primary w-full">Derive key & unlock</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Vault</h1>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-white">
          Log out
        </button>
      </div>

      <form onSubmit={addSecret} className="card p-6 mb-8 space-y-3">
        <h2 className="font-semibold mb-2">Add a secret</h2>
        <input
          className="input-field"
          placeholder="Name (e.g. STRIPE_API_KEY)"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Value"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn-primary">Encrypt & save</button>
      </form>

      <div className="space-y-3">
        {secrets.length === 0 && <p className="text-gray-500 text-sm">No secrets yet.</p>}
        {secrets.map((s) => (
          <div key={s.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-vault-accent2">{s.name}</p>
              <p className="font-mono text-xs text-gray-400 mt-1">
                {s.revealed ? s.plaintext : '••••••••••••'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleReveal(s)}
                className="text-xs px-2 py-1 rounded border border-vault-border"
              >
                {s.revealed ? 'Hide' : 'Reveal'}
              </button>
              <button
                onClick={() => deleteSecret(s.id)}
                className="text-xs px-2 py-1 rounded border border-red-900 text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
