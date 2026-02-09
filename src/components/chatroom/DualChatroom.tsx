'use client';

import { useState, useCallback } from 'react';
import { useChatroomStream } from '@/hooks/useChatroomStream';
import ChatRoom from './ChatRoom';
import PhaseIndicator from './PhaseIndicator';
import { ChatMessage, MessageSentiment } from '@/lib/chatroom/types';
import { PERSONAS } from '@/lib/chatroom/personas';

// Model display names mapping
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  deepseek: 'DeepSeek',
  kimi: 'Kimi',
  minimax: 'MiniMax',
  glm: 'GLM',
  gemini: 'Gemini',
};

interface HumanMessage {
  id: string;
  userId: string;
  handle: string;
  avatar: string;
  content: string;
  timestamp: number;
  quotedMessageId?: string;
  quotedMessageContent?: string;
}

export default function DualChatroom() {
  const chatroomData = useChatroomStream();
  const [humanMessages, setHumanMessages] = useState<HumanMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedMessageToQuote, setSelectedMessageToQuote] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'debate' | 'discussion'>('debate');

  // Handle window resize for responsive design
  const handleResize = useCallback(() => {
    setIsMobileView(window.innerWidth < 768);
  }, []);

  // Initialize resize listener
  useState(() => {
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  });

  // Handle sending a human message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const message: HumanMessage = {
      id: `human_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user_1', // In a real app, this would come from auth
      handle: 'You',
      avatar: '👤',
      content: newMessage,
      timestamp: Date.now(),
      quotedMessageId: selectedMessageToQuote || undefined,
      quotedMessageContent: selectedMessageToQuote 
        ? chatroomData.messages.find(m => m.id === selectedMessageToQuote)?.content 
        : undefined,
    };

    setHumanMessages(prev => [...prev, message]);
    setNewMessage('');
    setSelectedMessageToQuote(null);
  }, [newMessage, selectedMessageToQuote, chatroomData.messages]);

  // Handle quoting an agent message
  const handleQuoteMessage = useCallback((messageId: string) => {
    setSelectedMessageToQuote(messageId);
    // Switch to discussion tab on mobile when quoting
    if (isMobileView) {
      setActiveTab('discussion');
    }
    // Focus on message input
    setTimeout(() => {
      const input = document.getElementById('human-message-input');
      input?.focus();
    }, 100);
  }, [isMobileView]);

  // Handle key press for sending message
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Get model distribution for display
  const getModelDistribution = () => {
    const distribution: Record<string, number> = {};
    PERSONAS.forEach(persona => {
      distribution[persona.modelId] = (distribution[persona.modelId] || 0) + 1;
    });
    return distribution;
  };

  const modelDistribution = getModelDistribution();

  // Mobile view - tabs
  if (isMobileView) {
    return (
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="flex border-b border-border" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'debate'}
            aria-controls="debate-panel"
            id="debate-tab"
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'debate'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('debate')}
          >
            🤖 Agent Debate
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'discussion'}
            aria-controls="discussion-panel"
            id="discussion-tab"
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'discussion'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('discussion')}
          >
            💬 Human Discussion
          </button>
        </div>

        {/* Tab Panels */}
        <div className="flex-1 overflow-hidden">
          {/* Debate Panel */}
          <div
            role="tabpanel"
            id="debate-panel"
            aria-labelledby="debate-tab"
            className={`h-full ${activeTab === 'debate' ? 'block' : 'hidden'}`}
          >
            <div className="h-full flex flex-col">
              {/* Phase indicator */}
              <PhaseIndicator 
                phase={chatroomData.phase} 
                cooldownEndsAt={chatroomData.cooldownEndsAt} 
              />

              {/* Consensus info if in consensus phase */}
              {chatroomData.phase === 'CONSENSUS' && chatroomData.consensusDirection && (
                <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-yellow-400">
                        Consensus: {chatroomData.consensusDirection.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-yellow-400">
                      {Math.round(chatroomData.consensusStrength * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Chatroom */}
              <div className="flex-1 overflow-hidden">
                <ChatRoom
                  messages={chatroomData.messages}
                  phase={chatroomData.phase}
                  typingPersona={chatroomData.typingPersona}
                  cooldownEndsAt={chatroomData.cooldownEndsAt}
                  isConnected={chatroomData.isConnected}
                />
              </div>

              {/* Quote button */}
              <div className="p-3 border-t border-border">
                <button
                  onClick={() => {
                    const lastMessage = chatroomData.messages[chatroomData.messages.length - 1];
                    if (lastMessage) {
                      handleQuoteMessage(lastMessage.id);
                    }
                  }}
                  className="w-full py-2 px-4 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors text-sm"
                  disabled={chatroomData.messages.length === 0}
                >
                  Quote Last Agent Message
                </button>
              </div>
            </div>
          </div>

          {/* Discussion Panel */}
          <div
            role="tabpanel"
            id="discussion-panel"
            aria-labelledby="discussion-tab"
            className={`h-full ${activeTab === 'discussion' ? 'block' : 'hidden'}`}
          >
            <div className="h-full flex flex-col">
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {humanMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center">
                    No messages yet. Start the discussion!
                  </div>
                ) : (
                  humanMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        {msg.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold">{msg.handle}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {msg.quotedMessageContent && (
                          <div className="my-2 p-2 bg-muted rounded text-sm border-l-4 border-primary/50">
                            <div className="text-xs text-muted-foreground mb-1">Quoted agent message:</div>
                            <div className="italic">{msg.quotedMessageContent}</div>
                          </div>
                        )}
                        <div className="mt-1">{msg.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message input */}
              <div className="p-3 border-t border-border">
                {selectedMessageToQuote && (
                  <div className="mb-2 p-2 bg-muted rounded text-sm flex justify-between items-center">
                    <div className="truncate">
                      <span className="text-xs text-muted-foreground">Quoting: </span>
                      <span className="italic">
                        {chatroomData.messages.find(m => m.id === selectedMessageToQuote)?.content.substring(0, 50)}...
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedMessageToQuote(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea
                    id="human-message-input"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message here..."
                    className="flex-1 p-2 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view - side by side
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Left Panel - Agent Debate (Read-Only) */}
      <div className="lg:w-1/2 flex flex-col border border-border rounded-xl overflow-hidden">
        {/* Panel Header */}
        <div className="px-4 py-3 bg-card border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <h3 className="font-semibold">Agent Debate</h3>
            <span className="text-xs px-2 py-1 bg-muted rounded-full">Read-Only</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${chatroomData.isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {chatroomData.isConnected ? 'Live' : 'Connecting...'}
          </div>
        </div>

        {/* Phase indicator */}
        <PhaseIndicator 
          phase={chatroomData.phase} 
          cooldownEndsAt={chatroomData.cooldownEndsAt} 
        />

        {/* Consensus info if in consensus phase */}
        {chatroomData.phase === 'CONSENSUS' && chatroomData.consensusDirection && (
          <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-yellow-400">
                  Consensus: {chatroomData.consensusDirection.toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-bold text-yellow-400">
                {Math.round(chatroomData.consensusStrength * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Chatroom */}
        <div className="flex-1 overflow-hidden">
          <ChatRoom
            messages={chatroomData.messages}
            phase={chatroomData.phase}
            typingPersona={chatroomData.typingPersona}
            cooldownEndsAt={chatroomData.cooldownEndsAt}
            isConnected={chatroomData.isConnected}
          />
        </div>

        {/* Footer with model info */}
        <div className="px-4 py-2 border-t border-border bg-card/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {PERSONAS.length} AI personas across {Object.keys(modelDistribution).length} models
            </div>
            <div className="flex gap-2">
              {Object.entries(modelDistribution).map(([modelId, count]) => (
                <span key={modelId} className="px-2 py-1 bg-muted rounded">
                  {MODEL_DISPLAY_NAMES[modelId] || modelId}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Human Discussion (Interactive) */}
      <div className="lg:w-1/2 flex flex-col border border-border rounded-xl overflow-hidden">
        {/* Panel Header */}
        <div className="px-4 py-3 bg-card border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h3 className="font-semibold">Human Discussion</h3>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Interactive</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {humanMessages.length} messages
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {humanMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center">
              <div>
                <div className="text-lg mb-2">💬</div>
                <p>Start the discussion! React to agent insights,</p>
                <p>quote interesting points, or share your own analysis.</p>
              </div>
            </div>
          ) : (
            humanMessages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  {msg.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{msg.handle}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {msg.quotedMessageContent && (
                    <div className="my-2 p-3 bg-muted rounded text-sm border-l-4 border-primary/50">
                      <div className="text-xs text-muted-foreground mb-1">Quoted agent message:</div>
                      <div className="italic">{msg.quotedMessageContent}</div>
                    </div>
                  )}
                  <div className="mt-1">{msg.content}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message input */}
        <div className="p-4 border-t border-border bg-card/50">
          {selectedMessageToQuote && (
            <div className="mb-3 p-3 bg-muted rounded text-sm flex justify-between items-center">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Quoting agent message:</div>
                <div className="italic truncate">
                  {chatroomData.messages.find(m => m.id === selectedMessageToQuote)?.content}
                </div>
              </div>
              <button
                onClick={() => setSelectedMessageToQuote(null)}
                className="ml-2 text-muted-foreground hover:text-foreground"
                aria-label="Remove quote"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              id="human-message-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here... (Shift+Enter for new line, Enter to send)"
              className="flex-1 p-3 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
              <button
                onClick={() => {
                  const lastMessage = chatroomData.messages[chatroomData.messages.length - 1];
                  if (lastMessage) {
                    handleQuoteMessage(lastMessage.id);
                  }
                }}
                className="px-6 py-3 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors text-sm"
                disabled={chatroomData.messages.length === 0}
              >
                Quote Last Agent
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Tip: Click on any agent message in the left panel to quote it in your response.
          </div>
        </div>
      </div>
    </div>
  );
}