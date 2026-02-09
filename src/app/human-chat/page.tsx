'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useEnsName } from 'wagmi';
import { base } from 'wagmi/chains';
import { useHumanChat } from '@/hooks/useHumanChat';
import HumanChatRoom from '@/components/human-chat/HumanChatRoom';
import HumanChatInput from '@/components/human-chat/HumanChatInput';
import WalletGate from '@/components/human-chat/WalletGate';
import ToastContainer, { ToastData } from '@/components/ToastContainer';

// Avatar options for users to choose from
const AVATAR_OPTIONS = ['👤', '🦞', '🚀', '🌙', '💎', '🦍', '🐂', '🐻', '🔥', '⚡', '🎯', '🎲'];

export default function HumanChatPage() {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ 
    address,
    chainId: base.id,
  });
  
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Mark as client-side rendered
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate handle from address or ENS name
  const handle = useMemo(() => {
    if (ensName) return ensName;
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return '';
  }, [address, ensName]);

  // Use the human chat hook
  const {
    messages,
    isConnected: chatConnected,
    activeUsers,
    state,
    error,
    isRateLimited,
    rateLimitRemainingMs,
    sendMessage,
    retryConnection,
  } = useHumanChat(address, handle, selectedAvatar);

  // Show error toasts
  useEffect(() => {
    if (error) {
      addToast(error, 'error');
    }
  }, [error]);

  const addToast = (message: string, type: ToastData['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!isConnected || !address) {
      addToast('Please connect your wallet to send messages', 'error');
      return;
    }

    try {
      await sendMessage(content);
    } catch (err) {
      addToast('Failed to send message. Please try again.', 'error');
    }
  };

  // Show loading state during SSR
  if (!isClient) {
    return (
      <main className="min-h-screen bg-background" role="main" aria-label="Human Chat Room">
        <div className="container mx-auto px-4 py-6 lg:py-8 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-96 bg-muted rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Human Chat Room">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div id="main-content" className="container mx-auto px-4 py-6 lg:py-8 max-w-4xl">
        {/* Page Header */}
        <section className="mb-6" aria-labelledby="human-chat-header">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 id="human-chat-header" className="text-2xl font-bold mb-2">
                Human Chat 💬
              </h1>
              <p className="text-muted-foreground">
                Real-time chat with fellow traders. Wallet-gated and moderated for quality discussions.
              </p>
            </div>
            
            {isConnected && (
              <div className="flex gap-4">
                <div className="text-right" role="complementary" aria-label="Connection status">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div 
                    className={`font-semibold ${chatConnected ? 'text-green-500' : 'text-yellow-500'}`}
                    aria-label={chatConnected ? 'Connected to chat' : 'Connecting to chat'}
                  >
                    {chatConnected ? 'Connected' : 'Connecting...'}
                  </div>
                </div>
                <div className="text-right" role="complementary" aria-label="Active users">
                  <div className="text-xs text-muted-foreground">Online</div>
                  <div className="font-semibold" aria-label={`${activeUsers} users online`}>
                    {activeUsers}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main Chat Area */}
        {!isConnected ? (
          <section 
            className="bg-card rounded-xl border border-border overflow-hidden"
            aria-labelledby="wallet-gate-heading"
          >
            <h2 id="wallet-gate-heading" className="sr-only">Wallet Connection Required</h2>
            <WalletGate />
          </section>
        ) : (
          <section aria-labelledby="chatroom-heading">
            <h2 id="chatroom-heading" className="sr-only">Chat Room</h2>
            
            {/* Avatar Selector */}
            <div className="mb-4 flex items-center gap-3 px-1">
              <span className="text-sm text-muted-foreground">Your avatar:</span>
              <div className="flex gap-1 flex-wrap">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                      selectedAvatar === avatar
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'bg-card border border-border hover:bg-muted'
                    }`}
                    aria-label={`Select ${avatar} avatar`}
                    aria-pressed={selectedAvatar === avatar}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Room */}
            <HumanChatRoom
              messages={messages}
              currentUserId={address}
              isConnected={chatConnected}
              activeUsers={activeUsers}
            />

            {/* Input Area */}
            <div className="mt-4">
              <HumanChatInput
                onSendMessage={handleSendMessage}
                isRateLimited={isRateLimited}
                rateLimitRemainingMs={rateLimitRemainingMs}
                disabled={!isConnected}
              />
            </div>
          </section>
        )}

        {/* Info Section */}
        <section 
          className="mt-8 bg-card rounded-xl p-6 border border-border"
          aria-labelledby="chat-info-heading"
        >
          <h3 id="chat-info-heading" className="text-lg font-bold mb-4">
            About Human Chat
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-sm">Rules & Guidelines</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• Wallet connection required to participate</li>
                <li>• Rate limited: 1 message per 5 seconds</li>
                <li>• Be respectful to fellow traders</li>
                <li>• No spam, scams, or manipulation attempts</li>
                <li>• Messages are moderated by AI</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-sm">Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• Real-time messaging with SSE streaming</li>
                <li>• ENS name support (if available)</li>
                <li>• Customizable avatars</li>
                <li>• Message history preserved</li>
                <li>• Separate from AI Debate Arena</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground" role="contentinfo">
          <p>
            Human Chat is a separate feature from the AI Debate Arena.
          </p>
          <p className="mt-1">
            Messages are streamed in real-time via SSE from /api/human-chat/stream
          </p>
        </footer>
      </div>
    </main>
  );
}
