'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CustomConnectButton from './CustomConnectButton';
import { useState, useRef, useEffect } from 'react';

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
  const isArena = pathname === '/arena';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const navLinks = [
    { href: '/', label: 'Dashboard', shortLabel: '📊' },
    { href: '/predict', label: 'Predict', shortLabel: '🎯' },
    { href: '/arena', label: 'Debate Arena', shortLabel: '🎭' },
    { href: '/rounds', label: 'Rounds', shortLabel: '🔄' },
  ];

  // Handle keyboard navigation for mobile menu
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      // Return focus to menu button after closing
      menuButtonRef.current?.focus();
    }
  };

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && menuButtonRef.current) {
        const target = event.target as Node;
        const mobileMenu = document.getElementById('mobile-navigation');
        const backdrop = document.getElementById('mobile-menu-backdrop');
        
        // Check if click is outside menu, backdrop, and toggle button
        if (
          mobileMenu && 
          !mobileMenu.contains(target) && 
          backdrop &&
          !backdrop.contains(target) &&
          !menuButtonRef.current.contains(target)
        ) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Focus management for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Focus the first menu item when menu opens
      const firstMenuItem = document.querySelector('#mobile-navigation a') as HTMLElement;
      firstMenuItem?.focus();
    }
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 safe-top" role="banner">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4" onKeyDown={handleMenuKeyDown}>
          <div className="flex items-center justify-between gap-2">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <span
              className="text-xl sm:text-2xl md:text-3xl flex-shrink-0"
              role="img"
              aria-label={isArena ? "Dual arena logo" : isChatroom ? "Debate arena logo" : isRounds ? "Prediction market logo" : "Lobster mascot logo"}
            >
              {isArena ? '🎭' : isChatroom ? '💬' : isRounds ? '🎯' : '🦞'}
            </span>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate">{title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden md:block">
                {subtitle}
              </p>
            </div>
          </div>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 mr-4" aria-label="Main navigation">
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
                {/* Compact market info for small tablets (640px-768px) - ultra condensed */}
                <div className="text-right hidden sm:block md:hidden" role="complementary" aria-label="Market information">
                  <div className="font-semibold text-sm" aria-label="BTC price 45,234 dollars">
                    BTC $45,234
                  </div>
                </div>

                {/* Full market info for large screens (>= 768px) - two columns */}
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
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors touch-manipulation min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
        {/* Backdrop overlay - z-50 to appear above header */}
        <div
          id="mobile-menu-backdrop"
          className={`md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out z-50 ${
            isMobileMenuOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Mobile menu - z-[51] to appear above backdrop */}
        <div
          className={`md:hidden fixed top-[72px] left-0 right-0 z-[51] transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : '-translate-y-4 opacity-0 pointer-events-none'
          }`}
        >
          <nav 
            id="mobile-navigation"
            className="mx-4 mt-2 p-4 rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-xl"
            aria-label="Mobile navigation"
            role="dialog"
            aria-modal="true"
          >
            <div className="grid grid-cols-4 gap-2 sm:gap-3" role="list">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  role="listitem"
                  className={`flex flex-col items-center gap-1 p-3 sm:p-4 rounded-lg transition-all duration-200 touch-manipulation min-h-[72px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    pathname === link.href
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  <span className="text-xl sm:text-2xl" aria-hidden="true">{link.shortLabel}</span>
                  <span className="text-xs font-medium text-center leading-tight">{link.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
        </div>
      </header>
    </>
  );
}