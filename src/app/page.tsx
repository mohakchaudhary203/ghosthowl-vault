import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-xl">
        <h1 className="text-4xl font-bold mb-4">
          👻 Ghost<span className="text-vault-accent">Howl</span> Vault
        </h1>
        <p className="text-gray-400 mb-8">
          End-to-end encrypted secrets manager with zero-knowledge architecture.
          Your API keys are encrypted in your browser before they ever leave your device —
          we couldn't read them even if we wanted to.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="btn-primary">Get started</Link>
          <Link href="/login" className="px-4 py-2 rounded-lg border border-vault-border">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
