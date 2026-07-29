'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSalt } from '@/lib/crypto';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Store kdfSalt locally so the browser can re-derive the vault key on login.
      // The master password itself is NEVER stored or sent anywhere beyond this
      // registration call establishing account auth (bcrypt-hashed server-side).
      localStorage.setItem('ghosthowl_kdf_salt', data.kdfSalt);
      router.push('/vault');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6">Create your vault</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <label className="block text-sm mb-1 text-gray-400">Email</label>
        <input
          className="input-field mb-4"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="block text-sm mb-1 text-gray-400">Master password</label>
        <input
          className="input-field mb-2"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-gray-500 mb-4">
          This encrypts your vault. We cannot recover it if you forget it.
        </p>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create vault'}
        </button>
      </form>
    </main>
  );
}
