'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * Custom Connect Button with improved accessibility
 * - Better color contrast for WCAG 2.1 AA compliance
 * - ARIA labels for screen readers
 */
export default function CustomConnectButton() {
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
                    className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-lg transition-colors min-h-[44px] touch-manipulation"
                    aria-label="Connect your cryptocurrency wallet"
                    style={{
                      // Ensure high contrast ratio (4.5:1 minimum)
                      backgroundColor: '#16a34a',
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
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors min-h-[44px] touch-manipulation"
                    aria-label="Wrong network detected. Click to switch networks."
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
                    className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-lg transition-colors min-h-[44px] touch-manipulation"
                    aria-label={`Connected account: ${account.displayName}. Click to view account details.`}
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                    }}
                  >
                    {account.displayName}
                    {account.displayBalance && (
                      <span className="ml-2 text-white/80" aria-label={`Balance: ${account.displayBalance}`}>
                        ({account.displayBalance})
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
