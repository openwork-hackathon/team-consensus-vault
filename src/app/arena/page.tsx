'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatroomStream } from '@/hooks/useChatroomStream';
import ChatRoom from '@/components/chatroom/ChatRoom';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useVault } from '@/contexts/VaultContext';
import ToastContainer, { ToastData } from '@/components/ToastContainer';



interface HumanMessage {
  id: string;
  address: string | null;
  username: string;
  content: string;
  timestamp: number;
}

export default function ArenaPage() {
  const chatroomData = useChatroomStream();
  const { address, isConnected } = useAccount();
  const { getDepositsByAddress } = useVault();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Human chat state
  const [humanMessages, setHumanMessages] = useState<HumanMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('');

  // CVAULT-218: Prevent scroll-into-view behavior for chat input
  useEffect(() => {
    // Prevent default scroll-into-view behavior
    const preventScrollIntoView = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && (target.id === 'arena-chat-input' || target.id === 'human-message-input')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Ensure scroll position doesn't change
        requestAnimationFrame(() => {
          window.scrollTo(window.scrollX, window.scrollY);
        });
      }
    };

    // Add event listeners to prevent scroll behavior
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

    // Store scroll position before input update
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Restore scroll position after React state update
    requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
    });
  }, []);

  // CVAULT-218: Prevent scroll on input focus
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Store current scroll position
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Prevent any scroll-into-view behavior
    e.target.scrollIntoView({ block: 'nearest', behavior: 'auto' });

    // Force the input to stay in place
    setTimeout(() => {
      const input = document.getElementById('arena-chat-input');
      if (input) {
        (input as HTMLInputElement).style.scrollBehavior = 'auto';
        (input as HTMLInputElement).style.scrollMargin = '0px';
        (input as HTMLInputElement).style.scrollMarginTop = '0px';
        (input as HTMLInputElement).style.scrollMarginBottom = '0px';
      }

      // Restore scroll position
      window.scrollTo(scrollX, scrollY);
    }, 0);
  }, []);



  // Mark as client-side rendered
  useEffect(() => {
    setIsClient(true);
    // Load username from localStorage
    const savedUsername = localStorage.getItem('arena-username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Auto-scroll human chat to bottom (scroll container only, not entire page)
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

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    if (!username.trim()) {
      addToast('Please set a username first', 'error');
      return;
    }

    const newMessage: HumanMessage = {
      id: `human-${Date.now()}-${Math.random()}`,
      address: address || null,
      username: username.trim(),
      content: messageInput.trim(),
      timestamp: Date.now(),
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
  };

  const userDeposits = address ? getDepositsByAddress(address) : [];
  const userTotalDeposited = userDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(6);

  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Dual Arena - Agent Debate and Human Discussion">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

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

            {/* Username Input (if not set) */}
            {!username && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <label htmlFor="username-input" className="block text-sm font-medium mb-2">
                  Set your username to participate:
                </label>
                <div className="flex gap-2">
                  <input
                    id="username-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={20}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        localStorage.setItem('arena-username', username.trim());
                        addToast('Username saved!', 'success');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      localStorage.setItem('arena-username', username.trim());
                      addToast('Username saved!', 'success');
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
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
                    className={`flex flex-col ${msg.address === address ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {msg.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      {msg.address === address && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg ${
                        msg.address === address
                          ? 'bg-primary text-primary-foreground'
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
                    placeholder={username ? "Share your thoughts..." : "Set username above to chat..."}
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
                <li>• Local username storage</li>
                <li>• Share your analysis</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-sm">📊 Stats</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {chatroomData.messages.length} agent messages</li>
                <li>• {humanMessages.length} human messages</li>
                <li>• DeepSeek, Kimi, MiniMax, GLM, Gemini</li>
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
            Agent messages stream via SSE • Human chat is local-only
          </p>
        </footer>
      </div>
    </main>
  );
}
