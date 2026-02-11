'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatroomStream } from '@/hooks/useChatroomStream';
import ChatRoom from '@/components/chatroom/ChatRoom';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useVault } from '@/contexts/VaultContext';
import { useGuest } from '@/contexts/GuestContext';
import ToastContainer, { ToastData } from '@/components/ToastContainer';
import GuestModeBanner from '@/components/GuestModeBanner';
import { motion, AnimatePresence } from 'framer-motion';

interface HumanMessage {
  id: string;
  address: string | null;
  username: string;
  content: string;
  timestamp: number;
  isGuest?: boolean;
}

export default function ArenaPage() {
  const chatroomData = useChatroomStream();
  const { address, isConnected } = useAccount();
  const { getDepositsByAddress } = useVault();
  const { guestUser, isGuestMode, createGuestUser, getStoredUsername } = useGuest();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Human chat state
  const [humanMessages, setHumanMessages] = useState<HumanMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('');
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);

  // CVAULT-218: Prevent scroll-into-view behavior for chat input
  useEffect(() => {
    const preventScrollIntoView = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && (target.id === 'arena-chat-input' || target.id === 'human-message-input')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        requestAnimationFrame(() => {
          window.scrollTo(window.scrollX, window.scrollY);
        });
      }
    };

    document.addEventListener('focusin', preventScrollIntoView, true);
    document.addEventListener('focus', preventScrollIntoView, true);

    return () => {
      document.removeEventListener('focusin', preventScrollIntoView, true);
      document.removeEventListener('focus', preventScrollIntoView, true);
    };
  }, []);

  // CVAULT-218: Prevent scroll on input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
    });
  }, []);

  // CVAULT-218: Prevent scroll on input focus
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const target = e.target as HTMLInputElement;
    target.style.scrollBehavior = 'auto';
    target.style.scrollMargin = '0px';
    target.style.scrollMarginTop = '0px';
    target.style.scrollMarginBottom = '0px';

    requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
    });
  }, []);

  // Mark as client-side rendered and initialize guest mode
  useEffect(() => {
    setIsClient(true);
    
    // Load username from localStorage or guest user
    const savedUsername = localStorage.getItem('arena-username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
    
    // If user is not connected and no guest user exists, show guest prompt
    if (!isConnected && !guestUser && !savedUsername) {
      setShowGuestPrompt(true);
    }
  }, [isConnected, guestUser]);

  // Auto-scroll human chat to bottom
  const humanChatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (humanChatContainerRef.current) {
      const container = humanChatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [humanMessages]);

  const addToast = (message: string, type: ToastData['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // CVAULT-243: Handle guest user creation
  const handleCreateGuestUser = () => {
    const defaultUsername = `Guest${Math.floor(Math.random() * 10000)}`;
    createGuestUser(defaultUsername);
    setUsername(defaultUsername);
    setShowGuestPrompt(false);
    addToast('Welcome! You can now chat as a guest.', 'success');
  };

  // CVAULT-243: Handle sending messages (works for both guest and authenticated)
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    if (!username.trim()) {
      setShowGuestPrompt(true);
      return;
    }

    const newMessage: HumanMessage = {
      id: `human-${Date.now()}-${Math.random()}`,
      address: address || null,
      username: username.trim(),
      content: messageInput.trim(),
      timestamp: Date.now(),
      isGuest: !isConnected && isGuestMode,
    };

    setHumanMessages((prev) => [...prev, newMessage]);
    setMessageInput('');
    
    // Save username
    localStorage.setItem('arena-username', username.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === 'Enter' && e.shiftKey) {
      return;
    }
  };

  // Check if current user can send messages
  const canSendMessages = username.trim().length > 0;
  const isCurrentUserGuest = !isConnected && isGuestMode;

  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Dual Arena - Agent Debate and Human Discussion">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* CVAULT-243: Guest Mode Banner */}
      <GuestModeBanner onConnectWallet={() => setShowWalletPrompt(true)} />

      {/* CVAULT-243: Wallet Required Prompt Modal */}
      <AnimatePresence>
        {showWalletPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWalletPrompt(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 z-50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="wallet-prompt-title"
            >
              <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl">👛</span>
                  </div>
                  <h3 id="wallet-prompt-title" className="text-lg font-bold mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Connect your wallet to unlock premium features like trading, 
                    deposits, and verified identity. Your chat messages will be preserved.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button
                          onClick={() => {
                            openConnectModal();
                            setShowWalletPrompt(false);
                          }}
                          className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors touch-manipulation min-h-[44px]"
                        >
                          Connect Wallet
                        </button>
                      )}
                    </ConnectButton.Custom>
                    <button
                      onClick={() => setShowWalletPrompt(false)}
                      className="px-6 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors touch-manipulation min-h-[44px]"
                    >
                      Continue as Guest
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CVAULT-243: Guest Username Prompt Modal */}
      <AnimatePresence>
        {showGuestPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuestPrompt(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 z-50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="guest-prompt-title"
            >
              <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <span className="text-3xl">👤</span>
                  </div>
                  <h3 id="guest-prompt-title" className="text-lg font-bold mb-2">
                    Join the Discussion
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    You can participate in the chat as a guest without connecting a wallet. 
                    Connect later to unlock premium features.
                  </p>
                  
                  {/* Username Input */}
                  <div className="mb-4">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter a username..."
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      maxLength={20}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && username.trim()) {
                          createGuestUser(username.trim());
                          setShowGuestPrompt(false);
                          addToast('Welcome! You can now chat as a guest.', 'success');
                        }
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        if (username.trim()) {
                          createGuestUser(username.trim());
                        } else {
                          handleCreateGuestUser();
                        }
                        setShowGuestPrompt(false);
                        addToast('Welcome! You can now chat as a guest.', 'success');
                      }}
                      className="w-full px-6 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors touch-manipulation min-h-[44px]"
                    >
                      {username.trim() ? 'Join as Guest' : 'Join with Random Name'}
                    </button>
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button
                          onClick={() => {
                            openConnectModal();
                            setShowGuestPrompt(false);
                          }}
                          className="w-full px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors touch-manipulation min-h-[44px]"
                        >
                          Connect Wallet
                        </button>
                      )}
                    </ConnectButton.Custom>
                    <button
                      onClick={() => setShowGuestPrompt(false)}
                      className="px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Just Browse
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div id="main-content" className="container mx-auto px-4 py-6 lg:py-8 max-w-[1800px]">
        {/* Page Header */}
        <section className="mb-6" aria-labelledby="arena-header-heading">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h2 id="arena-header-heading" className="text-2xl font-bold mb-2">
                🎭 Dual Arena
              </h2>
              <p className="text-muted-foreground">
                Watch AI agents debate on the left, discuss with humans on the right. 
                <span className="font-semibold text-bullish"> DEBATE</span> → 
                <span className="font-semibold text-blue-500"> CONSENSUS</span> → 
                <span className="font-semibold text-purple-500"> COOLDOWN</span>
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-right" role="complementary" aria-label="Agent debate status">
                <div className="text-xs text-muted-foreground">Agents</div>
                <div className={`font-semibold ${chatroomData.isConnected ? 'text-green-500' : 'text-yellow-500'}`}>
                  {chatroomData.isConnected ? 'Live' : 'Connecting...'}
                </div>
              </div>
              <div className="text-right" role="complementary" aria-label="Current phase">
                <div className="text-xs text-muted-foreground">Phase</div>
                <div className="font-semibold">{chatroomData.phase}</div>
              </div>
              <div className="text-right" role="complementary" aria-label="Human participants">
                <div className="text-xs text-muted-foreground">Humans</div>
                <div className="font-semibold text-blue-500">{humanMessages.length} msgs</div>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT PANEL: Agent Debate (Read-only) */}
          <section 
            className="bg-card/50 rounded-xl border border-border p-4"
            aria-labelledby="agent-debate-heading"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl" role="img" aria-label="Robot icon">🤖</span>
              <h3 id="agent-debate-heading" className="text-lg font-bold">
                Agent Debate
              </h3>
              <span className="ml-auto text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                Read-only
              </span>
            </div>
            
            <ChatRoom
              messages={chatroomData.messages}
              phase={chatroomData.phase}
              typingPersona={chatroomData.typingPersona}
              cooldownEndsAt={chatroomData.cooldownEndsAt}
              isConnected={chatroomData.isConnected}
            />

            {/* Consensus Information */}
            {chatroomData.consensusDirection && (
              <div className="mt-4 bg-card rounded-lg p-4 border border-border">
                <h4 className="text-sm font-semibold mb-2">Current Consensus</h4>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {chatroomData.consensusDirection === 'bullish' ? '📈' : 
                     chatroomData.consensusDirection === 'bearish' ? '📉' : '⚖️'}
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${
                      chatroomData.consensusDirection === 'bullish' ? 'text-bullish' : 
                      chatroomData.consensusDirection === 'bearish' ? 'text-bearish' : 'text-gray-500'
                    }`}>
                      {chatroomData.consensusDirection.toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(chatroomData.consensusStrength * 100)}% strength
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* RIGHT PANEL: Human Discussion (Interactive) */}
          <section
            className="bg-card/50 rounded-xl border border-border p-4 flex flex-col"
            aria-labelledby="human-discussion-heading"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl" role="img" aria-label="People icon">👥</span>
              <h3 id="human-discussion-heading" className="text-lg font-bold">
                Human Discussion
              </h3>
              <span className="ml-auto text-xs text-muted-foreground bg-blue-500/10 px-2 py-1 rounded">
                Interactive
              </span>
            </div>

            {/* CVAULT-243: Username Setup Banner (shown if no username set) */}
            {!username && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-sm">Join the conversation</h4>
                    <p className="text-xs text-muted-foreground">
                      Set a username to start chatting. No wallet required!
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowGuestPrompt(true)}
                      className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Join as Guest
                    </button>
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button
                          onClick={openConnectModal}
                          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Connect Wallet
                        </button>
                      )}
                    </ConnectButton.Custom>
                  </div>
                </div>
              </div>
            )}

            {/* CVAULT-243: User Status Indicator */}
            {username && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <span className="text-sm font-medium">{username}</span>
                  {isCurrentUserGuest && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                      Guest
                    </span>
                  )}
                  {isConnected && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
                {isCurrentUserGuest && (
                  <button
                    onClick={() => setShowWalletPrompt(true)}
                    className="text-xs text-primary hover:text-primary/80 underline"
                  >
                    Connect wallet for full access
                  </button>
                )}
              </div>
            )}

            {/* Human Chat Messages */}
            <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden flex flex-col max-h-[520px]">
              {/* Messages Area */}
              <div ref={humanChatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {humanMessages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center">
                    <div>
                      <p className="mb-2">💬 No human messages yet</p>
                      <p className="text-xs">Be the first to share your thoughts on the agent debate!</p>
                    </div>
                  </div>
                )}

                {humanMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {msg.username}
                      </span>
                      {msg.isGuest && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                          Guest
                        </span>
                      )}
                      {msg.address && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                          Verified
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      {msg.username === username && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg ${
                        msg.username === username
                          ? 'bg-primary text-primary-foreground'
                          : msg.isGuest
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-border bg-muted/30 chat-input-container">
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="arena-chat-input"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={handleInputFocus}
                    placeholder={username ? "Share your thoughts..." : "Set username to chat..."}
                    disabled={!username}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    maxLength={500}
                    style={{
                      scrollMargin: 0,
                      scrollMarginTop: 0,
                      scrollMarginBottom: 0,
                      scrollBehavior: 'auto',
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!username || !messageInput.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Press Enter to send, Shift+Enter for new line
                  {isCurrentUserGuest && (
                    <span className="ml-2 text-blue-400">
                      • Guest messages are public
                    </span>
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* System Information (Full Width) */}
        <section 
          className="mt-6 bg-card rounded-xl p-6 border border-border"
          aria-labelledby="system-info-heading"
        >
          <h3 id="system-info-heading" className="text-lg font-bold mb-4">
            Arena Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-sm">🤖 AI Models</h4>
              <p className="text-xs text-muted-foreground">DeepSeek, Kimi, MiniMax, GLM, Gemini</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-sm">📋 Debate Phases</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <span className="font-semibold text-bullish">DEBATE:</span> Free discussion</li>
                <li>• <span className="font-semibold text-blue-500">CONSENSUS:</span> 80% agreement</li>
                <li>• <span className="font-semibold text-purple-500">COOLDOWN:</span> 5-minute pause</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-sm">💬 Human Chat</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Real-time discussion</li>
                <li>• Guest mode available</li>
                <li>• Connect wallet for verified status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-sm">📊 Stats</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {chatroomData.messages.length} agent messages</li>
                <li>• {humanMessages.length} human messages</li>
                <li>• {isConnected ? 'Verified user' : isGuestMode ? 'Guest user' : 'Browsing mode'}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer Info */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Dual Arena: AI-powered debate + human discussion
          </p>
          <p className="mt-1 text-xs">
            Agent messages stream via SSE • Human chat is local-only • Guest mode supported
          </p>
        </footer>
      </div>
    </main>
  );
}
