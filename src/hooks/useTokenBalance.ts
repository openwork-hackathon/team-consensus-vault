'use client';

import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { CONSENSUS_TOKEN } from '@/lib/wagmi';

// Standard ERC-20 ABI for balanceOf
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface TokenBalanceResult {
  /** Formatted balance in human-readable format */
  formatted: string;
  /** Raw balance as bigint */
  value: bigint;
  /** Whether the balance is currently loading */
  isLoading: boolean;
  /** Error if balance fetch failed */
  error: Error | null;
  /** Symbol of the token */
  symbol: string;
  /** Number of decimals */
  decimals: number;
  /** Refetch function to refresh balance */
  refetch: () => void;
}

/**
 * Hook to read ERC-20 token balance for a given address
 * @param address - The wallet address to check balance for
 * @param tokenAddress - Optional custom token address (defaults to CONSENSUS token)
 * @returns TokenBalanceResult with formatted balance, loading state, and error handling
 * 
 * @example
 * ```tsx
 * const { formatted, isLoading, error, symbol } = useTokenBalance(address);
 * // formatted: "1,234.56"
 * // symbol: "CONSENSUS"
 * ```
 */
export function useTokenBalance(
  address: string | undefined,
  tokenAddress?: `0x${string}`
): TokenBalanceResult {
  const token = tokenAddress || CONSENSUS_TOKEN.address;

  // Read token decimals
  const { data: decimals } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!token,
      staleTime: 60 * 1000, // 1 minute
    },
  });

  // Read token symbol
  const { data: symbol } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!token,
      staleTime: 5 * 60 * 1000, // 5 minutes - symbol rarely changes
    },
  });

  // Read token balance
  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!token,
      staleTime: 15 * 1000, // 15 seconds - balance changes frequently
      refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    },
  });

  const tokenDecimals = decimals ?? CONSENSUS_TOKEN.decimals;
  const tokenSymbol = symbol ?? CONSENSUS_TOKEN.symbol;

  // Format the balance
  const formatted = balance
    ? formatUnits(balance, tokenDecimals)
    : '0';

  // Format with commas and limit decimal places
  const formattedWithCommas = (() => {
    if (!balance) return '0';
    const num = parseFloat(formatted);
    if (num === 0) return '0';
    
    // For large numbers, show fewer decimals
    if (num >= 1000000) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } else if (num >= 1000) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
    } else {
      return num.toLocaleString('en-US', { maximumFractionDigits: 6 });
    }
  })();

  return {
    formatted: formattedWithCommas,
    value: balance ?? BigInt(0),
    isLoading,
    error: error ? new Error(error.message) : null,
    symbol: tokenSymbol,
    decimals: tokenDecimals,
    refetch,
  };
}

export default useTokenBalance;