'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="w-full border-b border-white/10 bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🔐</div>
          <h1 className="text-xl font-bold">Consensus Vault</h1>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
