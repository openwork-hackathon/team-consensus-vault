'use client';

import { useTokenBalance } from './useTokenBalance';
import { OPENWORK_TOKEN } from '@/lib/wagmi';

/**
 * Hook to read OPENWORK token balance for a given address
 * @param address - The wallet address to check balance for
 * @returns TokenBalanceResult with formatted balance, loading state, and error handling
 * 
 * @example
 * ```tsx
 * const { formatted, isLoading, error, symbol } = useOpenworkBalance(address);
 * // formatted: "1,234.56"
 * // symbol: "OPENWORK"
 * ```
 */
export function useOpenworkBalance(address: string | undefined) {
  return useTokenBalance(address, OPENWORK_TOKEN.address);
}

export default useOpenworkBalance;