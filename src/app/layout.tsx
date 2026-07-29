import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GhostHowl Vault',
  description: 'End-to-end encrypted secrets manager with zero-knowledge architecture'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
