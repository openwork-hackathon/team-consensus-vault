'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface HumanChatInputProps {
  onSendMessage: (content: string) => void;
  isRateLimited: boolean;
  rateLimitRemainingMs: number;
  disabled?: boolean;
}

export default function HumanChatInput({
  onSendMessage,
  isRateLimited,
  rateLimitRemainingMs,
  disabled = false,
}: HumanChatInputProps) {
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { address } = useAccount();

  const MAX_CHARS = 500;
  const isOverLimit = charCount > MAX_CHARS;

  useEffect(() => {
    // CVAULT-218: Auto-focus input on mount, but prevent scrolling to keep input at bottom
    if (inputRef.current && !disabled) {
      // Store current scroll position
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      inputRef.current.focus({
        preventScroll: true
      });

      // Ensure scroll position hasn't changed
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY);
      });
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isRateLimited || isOverLimit || disabled) {
      return;
    }

    onSendMessage(message.trim());
    setMessage('');
    setCharCount(0);

    // CVAULT-218: Refocus input after sending, but prevent scrolling
    if (inputRef.current) {
      // Store current scroll position
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      inputRef.current.focus({
        preventScroll: true
      });

      // Ensure scroll position hasn't changed
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: Insert newline at cursor position
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const value = target.value;
        
        // Insert newline at cursor position
        const newValue = value.substring(0, start) + '\n' + value.substring(end);
        setMessage(newValue);
        setCharCount(newValue.length);
        
        // Set cursor position after the inserted newline
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 1;
          // Trigger resize to accommodate new line
          target.style.height = 'auto';
          target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
        });
      } else {
        // Enter alone submits the form
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    setCharCount(value.length);

    // CVAULT-218: Auto-resize textarea without causing scroll
    const target = e.target;
    // Store current scroll position
    const currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const currentScrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

    // Reset height to auto to get the correct scrollHeight
    target.style.height = 'auto';
    // Set new height based on content
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;

    // Restore scroll position to prevent viewport from moving
    if (document.documentElement.scrollTop !== currentScroll) {
      document.documentElement.scrollTop = currentScroll;
      document.documentElement.scrollLeft = currentScrollLeft;
    }
    if (document.body.scrollTop !== currentScroll) {
      document.body.scrollTop = currentScroll;
      document.body.scrollLeft = currentScrollLeft;
    }

    // Prevent any scroll-into-view behavior
    window.scrollTo(window.scrollX, window.scrollY);
  };

  // Format rate limit remaining time
  const formatRemainingTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-2">
        {/* Wallet info bar */}
        {address && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
            <span className="font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        )}

        {/* Input area */}
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={
                disabled
                  ? 'Connect your wallet to chat...'
                  : isRateLimited
                  ? `Wait ${formatRemainingTime(rateLimitRemainingMs)}...`
                  : 'Type a message...'
              }
              disabled={disabled || isRateLimited}
              maxLength={MAX_CHARS + 50} // Allow slight overflow to show error
              rows={1}
              className={`
                w-full px-3 py-2.5 sm:py-2 
                bg-background border rounded-lg 
                text-sm sm:text-sm
                placeholder:text-muted-foreground/60
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                disabled:opacity-50 disabled:cursor-not-allowed
                resize-none min-h-[44px] max-h-[120px]
                transition-all
                ${isOverLimit ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-border'}
              `}
              style={{
                height: 'auto',
                overflow: 'hidden',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                // CVAULT-218: Store scroll position before resize
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;
                // Reset height to auto to get the correct scrollHeight
                target.style.height = 'auto';
                // Set new height based on content
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                // Restore scroll position to prevent viewport from moving
                window.scrollTo(scrollX, scrollY);
              }}
              aria-label="Message input"
              aria-describedby="char-count rate-limit-status"
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim() || isRateLimited || isOverLimit || disabled}
            className={`
              px-4 sm:px-5 py-2.5 sm:py-2 
              rounded-lg font-medium text-sm
              transition-all duration-200
              min-h-[44px] min-w-[44px]
              flex items-center justify-center
              touch-manipulation
              ${
                !message.trim() || isRateLimited || isOverLimit || disabled
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
              }
            `}
            aria-label="Send message"
          >
            {isRateLimited ? (
              <span className="tabular-nums">{formatRemainingTime(rateLimitRemainingMs)}</span>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-1">
          <div id="rate-limit-status" className="text-xs">
            {isRateLimited ? (
              <span className="text-yellow-500">
                Rate limited: {formatRemainingTime(rateLimitRemainingMs)} remaining
              </span>
            ) : (
              <span className="text-muted-foreground/60">
                Press Enter to send, Shift+Enter for new line
              </span>
            )}
          </div>
          
          <div
            id="char-count"
            className={`text-xs tabular-nums ${
              isOverLimit
                ? 'text-red-500 font-medium'
                : charCount > MAX_CHARS * 0.9
                ? 'text-yellow-500'
                : 'text-muted-foreground/60'
            }`}
          >
            {charCount}/{MAX_CHARS}
          </div>
        </div>
      </div>
    </form>
  );
}
