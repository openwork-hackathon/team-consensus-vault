'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40" role="banner">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className="text-2xl sm:text-3xl"
              role="img"
              aria-label={isChatroom ? "Debate arena logo" : isRounds ? "Prediction market logo" : "Lobster mascot logo"}
            >
              {isChatroom ? '💬' : isRounds ? '🎯' : '🦞'}
            </span>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">{title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                {subtitle}
              </p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 mr-6" aria-label="Main navigation">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/' ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-current={pathname === '/' ? 'page' : undefined}
            >
              Dashboard
            </Link>
            <Link 
              href="/predict" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/predict' ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-current={pathname === '/predict' ? 'page' : undefined}
            >
              Predict
            </Link>
            <Link
              href="/chatroom"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/chatroom' ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-current={pathname === '/chatroom' ? 'page' : undefined}
            >
              Crypto Chatroom
            </Link>
            <Link
              href="/rounds"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/rounds' ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-current={pathname === '/rounds' ? 'page' : undefined}
            >
              Rounds
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {showMarketInfo && (
              <>
                <div className="text-right hidden sm:block" role="complementary" aria-label="Market information">
                  <div className="text-xs text-muted-foreground">Asset</div>
                  <div className="font-semibold" aria-label="BTC/USD pair">BTC/USD</div>
                </div>
                <div className="text-right hidden sm:block" role="complementary" aria-label="Current price">
                  <div className="text-xs text-muted-foreground">Price</div>
                  <div className="font-semibold text-bullish" aria-label="Current BTC price 45,234 dollars">
                    $45,234
                  </div>
                </div>
              </>
            )}
            <div role="navigation" aria-label="Wallet connection">
              <ConnectButton />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border" aria-label="Mobile navigation">
          <Link 
            href="/" 
            className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              pathname === '/' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-primary'
            }`}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            Dashboard
          </Link>
          <Link 
            href="/predict" 
            className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              pathname === '/predict' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-primary'
            }`}
            aria-current={pathname === '/predict' ? 'page' : undefined}
          >
            Predict
          </Link>
          <Link
            href="/chatroom"
            className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              pathname === '/chatroom'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-primary'
            }`}
            aria-current={pathname === '/chatroom' ? 'page' : undefined}
          >
            Chatroom
          </Link>
          <Link
            href="/rounds"
            className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              pathname === '/rounds'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-primary'
            }`}
            aria-current={pathname === '/rounds' ? 'page' : undefined}
          >
            Rounds
          </Link>
        </nav>
      </div>
    </header>
  );
}