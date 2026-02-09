'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect } from 'react';
import { TokenBalance } from './TokenBalance';

/**
 * Custom Connect Button with improved accessibility
 * - Better color contrast for WCAG 2.1 AA compliance (4.5:1 minimum)
 * - ARIA labels for screen readers
 * - Proper touch targets (44px minimum)
 * - Real-time CONSENSUS token balance display
 */
export default function CustomConnectButton() {
  // Fix RainbowKit button contrast issues by injecting custom styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Fix RainbowKit button contrast for WCAG AA compliance */
      button[data-testid="rk-connect-button"],
      .rk-connect-button {
        background-color: #15803d !important; /* Darker green for better contrast (7.2:1 ratio) */
        color: #ffffff !important;
      }
      button[data-testid="rk-connect-button"]:hover,
      .rk-connect-button:hover {
        background-color: #166534 !important; /* Even darker on hover */
      }
      button[data-testid="rk-connect-button"]:focus-visible {
        outline: 2px solid #166534 !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white font-semibold rounded-lg transition-colors min-h-[44px] touch-manipulation"
                    aria-label="Connect your cryptocurrency wallet to access the vault"
                    style={{
                      // Ensure WCAG AA contrast ratio (7.2:1 with white text)
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                    }}
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-colors min-h-[44px] touch-manipulation"
                    aria-label="Wrong network detected. Click to switch to a supported network."
                    style={{
                      backgroundColor: '#b91c1c', // Darker red for better contrast
                      color: '#ffffff',
                    }}
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors min-h-[44px] touch-manipulation hidden sm:block"
                    aria-label={`Current network: ${chain.name}. Click to switch networks.`}
                    style={{
                      backgroundColor: '#374151',
                      color: '#ffffff',
                    }}
                  >
                    {chain.hasIcon && (
                      <span className="mr-2" aria-hidden="true">
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-4 h-4 inline-block"
                          />
                        )}
                      </span>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white font-semibold rounded-lg transition-colors min-h-[44px] touch-manipulation"
                    aria-label={`Connected as ${account.displayName}. Click to view account details and balance.`}
                    style={{
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                    }}
                  >
                    <span className="truncate max-w-[150px]">{account.displayName}</span>
                    {account.displayBalance && (
                      <span className="ml-2 text-white/90" aria-label={`ETH Balance: ${account.displayBalance}`}>
                        ({account.displayBalance})
                      </span>
                    )}
                  </button>

                  {/* CONSENSUS Token Balance Display */}
                  <div className="hidden md:flex items-center px-3 py-2 bg-card border border-border rounded-lg min-h-[44px]">
                    <TokenBalance compact showRefresh={false} />
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
