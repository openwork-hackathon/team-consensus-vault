'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CustomConnectButton from './CustomConnectButton';
import { useState } from 'react';

interface NavigationProps {
  title?: string;
  subtitle?: string;
  showMarketInfo?: boolean;
}

export default function Navigation({
  title = "Consensus Vault",
  subtitle = "AI Multi-Model Trading Intelligence",
  showMarketInfo = true
}: NavigationProps) {
  const pathname = usePathname();
  const isChatroom = pathname === '/chatroom';
  const isRounds = pathname === '/rounds';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Dashboard', shortLabel: '📊' },
    { href: '/predict', label: 'Predict', shortLabel: '🎯' },
    { href: '/chatroom', label: 'Chatroom', shortLabel: '💬' },
    { href: '/rounds', label: 'Rounds', shortLabel: '🔄' },
  ];

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 safe-top" role="banner">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <span
              className="text-xl sm:text-2xl md:text-3xl flex-shrink-0"
              role="img"
              aria-label={isChatroom ? "Debate arena logo" : isRounds ? "Prediction market logo" : "Lobster mascot logo"}
            >
              {isChatroom ? '💬' : isRounds ? '🎯' : '🦞'}
            </span>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate">{title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden md:block">
                {subtitle}
              </p>
            </div>
          </div>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-4 mr-4" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-lg touch-manipulation min-h-[44px] flex items-center ${
                  pathname === link.href ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                }`}
                aria-current={pathname === link.href ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {showMarketInfo && (
              <>
                <div className="text-right hidden md:block" role="complementary" aria-label="Market information">
                  <div className="text-xs text-muted-foreground">Asset</div>
                  <div className="font-semibold text-sm" aria-label="BTC/USD pair">BTC/USD</div>
                </div>
                <div className="text-right hidden md:block" role="complementary" aria-label="Current price">
                  <div className="text-xs text-muted-foreground">Price</div>
                  <div className="font-semibold text-bullish text-sm" aria-label="Current BTC price 45,234 dollars">
                    $45,234
                  </div>
                </div>
              </>
            )}
            <div role="navigation" aria-label="Wallet connection">
              <CustomConnectButton />
            </div>
            
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Navigation */}
        <nav 
          className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} mt-3 pt-3 border-t border-border`}
          aria-label="Mobile navigation"
        >
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg transition-colors touch-manipulation min-h-[64px] ${
                  pathname === link.href
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
                aria-current={pathname === link.href ? 'page' : undefined}
              >
                <span className="text-xl sm:text-2xl" aria-hidden="true">{link.shortLabel}</span>
                <span className="text-xs font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}