/**
 * Wallet utility functions for Consensus Vault
 */

/**
 * Format wallet address for display
 * Example: 0x1234...5678
 */
export function formatAddress(address: string | undefined): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format ETH amount with proper precision
 */
export function formatEthAmount(amount: string | number, decimals: number = 6): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
}

/**
 * Validate transaction amount
 */
export function validateTransactionAmount(
  amount: string,
  balance: string,
  minAmount: number = 0.0001
): { valid: boolean; error?: string } {
  const numAmount = parseFloat(amount);
  const numBalance = parseFloat(balance);

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Invalid number format' };
  }

  if (numAmount <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }

  if (numAmount < minAmount) {
    return { valid: false, error: `Minimum amount is ${minAmount} ETH` };
  }

  if (numAmount > numBalance) {
    return { valid: false, error: 'Insufficient balance' };
  }

  return { valid: true };
}

/**
 * Parse transaction error for user-friendly message
 */
export function parseTransactionError(error: unknown): string {
  if (error instanceof Error) {
    // User rejected transaction
    if (error.message.includes('user rejected')) {
      return 'Transaction was rejected';
    }

    // Insufficient funds
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }

    // Network error
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return 'Network error. Please try again';
    }

    return error.message;
  }

  return 'Transaction failed. Please try again';
}

/**
 * Calculate gas estimate for display
 */
export function estimateGasCost(gasLimit: bigint, gasPrice: bigint): string {
  const gasCost = (Number(gasLimit) * Number(gasPrice)) / 1e18;
  return gasCost.toFixed(6);
}
