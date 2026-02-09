'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import { useOpenworkBalance } from '@/hooks/useOpenworkBalance';
import SwapWidget from './SwapWidget';

interface TokenOnboardingWizardProps {
  /** Whether the wizard is open */
  isOpen: boolean;
  /** Callback when wizard is closed */
  onClose: () => void;
  /** Callback when user skips the wizard */
  onSkip: () => void;
}

type WizardStep = 'intro' | 'connect' | 'swap' | 'complete';

/**
 * TokenOnboardingWizard Component
 * 
 * Guides first-time users through acquiring OPENWORK tokens:
 * 1. Introduction to OPENWORK tokens
 * 2. Wallet connection (if not connected)
 * 3. Using LI.FI widget to swap for OPENWORK
 * 4. Viewing new balance confirmation
 * 
 * @example
 * ```tsx
 * <TokenOnboardingWizard
 *   isOpen={showOnboarding}
 *   onClose={() => setShowOnboarding(false)}
 *   onSkip={() => setHasSkipped(true)}
 * />
 * ```
 */
export default function TokenOnboardingWizard({
  isOpen,
  onClose,
  onSkip,
}: TokenOnboardingWizardProps) {
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { formatted: openworkBalance, isLoading: balanceLoading } = useOpenworkBalance(address);
  const [currentStep, setCurrentStep] = useState<WizardStep>('intro');
  const [isSwapWidgetOpen, setIsSwapWidgetOpen] = useState(false);
  const [hasSwapped, setHasSwapped] = useState(false);

  // Check if user has OPENWORK balance
  const hasOpenworkBalance = parseFloat(openworkBalance) > 0;

  // Auto-advance steps based on user state
  useEffect(() => {
    if (!isOpen) return;

    if (!isConnected) {
      setCurrentStep('connect');
    } else if (!hasOpenworkBalance && !hasSwapped) {
      setCurrentStep('swap');
    } else if (hasOpenworkBalance) {
      setCurrentStep('complete');
    }
  }, [isOpen, isConnected, hasOpenworkBalance, hasSwapped]);

  // Handle wallet connection
  const handleConnectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  // Handle swap completion
  const handleSwapComplete = () => {
    setHasSwapped(true);
    setIsSwapWidgetOpen(false);
  };

  // Handle skip
  const handleSkip = () => {
    onSkip();
    onClose();
  };

  // Handle close
  const handleClose = () => {
    onClose();
  };

  // Reset wizard state when opening
  useEffect(() => {
    if (isOpen) {
      setHasSwapped(false);
      if (isConnected && hasOpenworkBalance) {
        setCurrentStep('complete');
      } else if (isConnected) {
        setCurrentStep('swap');
      } else {
        setCurrentStep('intro');
      }
    }
  }, [isOpen, isConnected, hasOpenworkBalance]);

  if (!isOpen) {
    return null;
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Welcome to Consensus Vault</h2>
            <p className="text-muted-foreground mb-6">
              To participate in the AI-powered trading ecosystem, you'll need OPENWORK tokens.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2">What are OPENWORK tokens?</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Governance token for the Consensus Vault ecosystem</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Required for participating in prediction markets</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Earn rewards through staking and participation</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('connect')}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </div>
        );

      case 'connect':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to get OPENWORK tokens on the Base network
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2">Requirements:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Any Ethereum wallet (MetaMask, Coinbase Wallet, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Switch to Base network (Chain ID: 8453)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Some ETH for gas fees (swap fees are minimal)</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConnectWallet}
                className="flex-1 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Connect Wallet
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        );

      case 'swap':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-bullish/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-bullish" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Get OPENWORK Tokens</h2>
            <p className="text-muted-foreground mb-6">
              Swap any token for OPENWORK using our integrated swap widget
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Your OPENWORK Balance:</span>
                {balanceLoading ? (
                  <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                ) : (
                  <span className="font-bold text-lg">{openworkBalance} OPENWORK</span>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-bullish/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <span className="text-sm">Click "Open Swap Widget" below</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-bullish/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <span className="text-sm">Select token to swap from (ETH, USDC, etc.)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-bullish/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <span className="text-sm">OPENWORK is automatically selected as destination</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-bullish/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">4</span>
                  </div>
                  <span className="text-sm">Review and confirm the swap transaction</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsSwapWidgetOpen(true)}
                className="flex-1 px-6 py-3 bg-bullish text-white rounded-lg font-semibold hover:bg-bullish/90 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Open Swap Widget
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">You're All Set!</h2>
            <p className="text-muted-foreground mb-6">
              You now have OPENWORK tokens and can participate in the ecosystem.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Your OPENWORK Balance:</span>
                {balanceLoading ? (
                  <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                ) : (
                  <span className="font-bold text-xl text-success">{openworkBalance} OPENWORK</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                You can now participate in prediction markets and earn rewards.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">What's Next?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="font-medium mb-1">Prediction Markets</div>
                  <div className="text-muted-foreground">Bet on AI consensus outcomes</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="font-medium mb-1">Staking Rewards</div>
                  <div className="text-muted-foreground">Earn yield on your OPENWORK</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Exploring
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Progress indicator
  const steps = [
    { id: 'intro', label: 'Intro' },
    { id: 'connect', label: 'Connect' },
    { id: 'swap', label: 'Swap' },
    { id: 'complete', label: 'Complete' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <>
      {/* Swap Widget */}
      <SwapWidget
        isOpen={isSwapWidgetOpen}
        onClose={() => {
          setIsSwapWidgetOpen(false);
          // Check if user now has balance after swap
          if (hasOpenworkBalance) {
            setCurrentStep('complete');
          }
        }}
      />

      {/* Onboarding Wizard Modal */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-xl font-bold">Get OPENWORK Tokens</h2>
              <p className="text-xs text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 -m-2"
              aria-label="Close onboarding wizard"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-4 pt-4">
            <div className="flex justify-between mb-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1
                      ${index < currentStepIndex ? 'bg-success text-success-foreground' :
                        index === currentStepIndex ? 'bg-primary text-primary-foreground' :
                        'bg-muted text-muted-foreground'}`}
                  >
                    {index < currentStepIndex ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`text-xs ${index === currentStepIndex ? 'font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20">
            <div className="flex items-center justify-between text-sm">
              <button
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip onboarding
              </button>
              <div className="text-xs text-muted-foreground">
                {currentStepIndex + 1} of {steps.length} steps
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}