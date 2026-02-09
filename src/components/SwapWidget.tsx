'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnectorClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// OPENWORK Token ABI (ERC20)
const OPENWORK_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

const OPENWORK_TOKEN_ADDRESS = '0x299c30DD5974BF4D5bFE42C340CA40462816AB07' as const;
const BASE_CHAIN_ID = 8453;

interface SwapWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SwapWidget({ isOpen, onClose }: SwapWidgetProps) {
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [isClient, setIsClient] = useState(false);
  const [LiFiWidget, setLiFiWidget] = useState<any>(null);

  // Ensure client-side only rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dynamic import of LI.FI widget (must be client-only, ~500KB)
  useEffect(() => {
    if (isClient && isOpen) {
      import('@lifi/widget').then((mod) => {
        setLiFiWidget(() => mod.LiFiWidget);
      }).catch((err) => {
        console.error('Failed to load LI.FI widget:', err);
      });
    }
  }, [isClient, isOpen]);

  // Check if user is on Base network
  const isWrongNetwork = chain?.id !== BASE_CHAIN_ID;

  // LI.FI widget configuration
  const widgetConfig = {
    toChain: BASE_CHAIN_ID,
    toToken: OPENWORK_TOKEN_ADDRESS,
    disabledUI: ['toToken'],
    chains: { allow: [BASE_CHAIN_ID] },
    theme: {
      container: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  };

  // Handle wallet connection via RainbowKit
  const handleConnectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  if (!isClient || !isOpen) {
    return null;
  }

  // Show connect wallet prompt if not connected
  if (!isConnected) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="bg-card border border-border rounded-xl p-8 w-full max-w-md shadow-2xl text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Connect your wallet to get OPENWORK tokens on the Base network
            </p>
          </div>
          <button
            onClick={handleConnectWallet}
            className="w-full px-6 py-3 bg-bullish text-white rounded-lg font-semibold hover:bg-bullish/90 transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connect Wallet
          </button>
          <button
            onClick={onClose}
            className="w-full mt-3 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors touch-manipulation min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Show network switch prompt if on wrong network
  if (isWrongNetwork) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="bg-card border border-border rounded-xl p-8 w-full max-w-md shadow-2xl text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Switch to Base Network</h2>
            <p className="text-muted-foreground">
              OPENWORK tokens are on the Base network. Please switch your wallet network to continue.
            </p>
          </div>
          <div className="text-sm text-muted-foreground mb-4 p-3 bg-accent/10 rounded-lg">
            <p className="font-medium">Network Details:</p>
            <p>Chain ID: {BASE_CHAIN_ID}</p>
            <p>Network: Base</p>
          </div>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors touch-manipulation min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while widget loads
  if (!LiFiWidget) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="bg-card border border-border rounded-xl p-8 w-full max-w-md shadow-2xl text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-lg font-semibold">Loading Swap Widget...</p>
            <p className="text-sm text-muted-foreground mt-2">Preparing your trading experience</p>
          </div>
        </div>
      </div>
    );
  }

  // Render the LI.FI widget
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Get OPENWORK</h2>
            <p className="text-xs text-muted-foreground">Swap any token for OPENWORK on Base</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 -m-2 touch-manipulation"
            aria-label="Close swap widget"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* LI.FI Widget */}
        <div className="p-4">
          <LiFiWidget integrator="consensus-vault" config={widgetConfig} />
        </div>
      </div>
    </div>
  );
}
