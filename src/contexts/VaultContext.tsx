'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Deposit {
  id: string;
  amount: string;
  timestamp: number;
  address: string;
  txHash?: string; // Optional transaction hash for on-chain verification
}

interface VaultContextType {
  deposits: Deposit[];
  totalValueLocked: string;
  addDeposit: (amount: string, address: string, txHash?: string) => void;
  removeDeposit: (amount: string, address: string) => void;
  getDepositsByAddress: (address: string) => Deposit[];
  getDepositHistory: (address: string) => Deposit[];
  getTotalDepositors: () => number;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [depositHistory, setDepositHistory] = useState<Deposit[]>([]);

  const addDeposit = useCallback((amount: string, address: string, txHash?: string) => {
    const newDeposit: Deposit = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount,
      timestamp: Date.now(),
      address: address.toLowerCase(),
      txHash,
    };

    setDeposits((prev) => [...prev, newDeposit]);
    setDepositHistory((prev) => [...prev, newDeposit]);
  }, []);

  const removeDeposit = useCallback((amount: string, address: string) => {
    const withdrawAmount = parseFloat(amount);
    let remaining = withdrawAmount;

    setDeposits((prev) => {
      const userDeposits = prev.filter((d) => d.address === address.toLowerCase());
      const otherDeposits = prev.filter((d) => d.address !== address.toLowerCase());

      // Remove deposits in FIFO order (oldest first) until we've withdrawn enough
      const updatedUserDeposits = [];
      for (const deposit of userDeposits) {
        const depositAmount = parseFloat(deposit.amount);

        if (remaining <= 0) {
          // No more to withdraw, keep this deposit
          updatedUserDeposits.push(deposit);
        } else if (depositAmount <= remaining) {
          // Withdraw entire deposit
          remaining -= depositAmount;
          // Don't add to updated list (effectively removing it)
        } else {
          // Partial withdrawal - keep the remainder
          updatedUserDeposits.push({
            ...deposit,
            amount: (depositAmount - remaining).toFixed(6),
          });
          remaining = 0;
        }
      }

      return [...otherDeposits, ...updatedUserDeposits];
    });
  }, []);

  const getDepositsByAddress = useCallback((address: string) => {
    return deposits.filter((d) => d.address === address.toLowerCase());
  }, [deposits]);

  const getDepositHistory = useCallback((address: string) => {
    return depositHistory
      .filter((d) => d.address === address.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }, [depositHistory]);

  const getTotalDepositors = useCallback(() => {
    const uniqueAddresses = new Set(deposits.map((d) => d.address));
    return uniqueAddresses.size;
  }, [deposits]);

  // Calculate total value locked from all deposits
  const totalValueLocked = deposits.reduce((sum, deposit) => {
    return sum + parseFloat(deposit.amount);
  }, 0).toFixed(6);

  return (
    <VaultContext.Provider
      value={{
        deposits,
        totalValueLocked,
        addDeposit,
        removeDeposit,
        getDepositsByAddress,
        getDepositHistory,
        getTotalDepositors,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
