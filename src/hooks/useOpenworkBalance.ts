'use client';

import { useTokenBalance } from './useTokenBalance';

// OPENWORK token address on Base
const OPENWORK_TOKEN_ADDRESS = '0x299c30DD5974BF4D5bFE42C340CA40462816AB07' as const;

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
  return useTokenBalance(address, OPENWORK_TOKEN_ADDRESS);
}

export default useOpenworkBalance;