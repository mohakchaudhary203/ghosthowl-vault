'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

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
        <h1 className="text-xl font-bold mb-6">Unlock your vault</h1>
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
          className="input-field mb-6"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>
    </main>
  );
}
