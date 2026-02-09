'use client';

import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface WalletGateProps {
  title?: string;
  description?: string;
}

export default function WalletGate({
  title = 'Connect Your Wallet',
  description = 'Join the conversation with other traders. Wallet connection required to participate in the human chatroom.',
}: WalletGateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <span className="text-4xl" role="img" aria-hidden="true">
          🔐
        </span>
      </div>

      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-col items-center gap-4">
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
                        className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors min-h-[48px] text-base shadow-lg shadow-primary/20"
                      >
                        Connect Wallet to Chat
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors min-h-[48px] text-base"
                      >
                        Wrong Network - Switch to Base
                      </button>
                    );
                  }

                  return (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-500 font-medium">
                          Wallet Connected
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You can now participate in the chat
                      </p>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-lg">
            🔒
          </div>
          <span className="text-xs text-muted-foreground">Wallet Verified</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-lg">
            ⚡
          </div>
          <span className="text-xs text-muted-foreground">Real-time Chat</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-lg">
            👥
          </div>
          <span className="text-xs text-muted-foreground">Community</span>
        </div>
      </div>
    </motion.div>
  );
}
