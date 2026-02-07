'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Deposit {
  id: string;
  amount: string;
  timestamp: number;
  address: string;
}

interface VaultContextType {
  deposits: Deposit[];
  totalValueLocked: string;
  addDeposit: (amount: string, address: string) => void;
  getDepositsByAddress: (address: string) => Deposit[];
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  const addDeposit = useCallback((amount: string, address: string) => {
    const newDeposit: Deposit = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount,
      timestamp: Date.now(),
      address: address.toLowerCase(),
    };

    setDeposits((prev) => [...prev, newDeposit]);
  }, []);

  const getDepositsByAddress = useCallback((address: string) => {
    return deposits.filter((d) => d.address === address.toLowerCase());
  }, [deposits]);

  // Calculate total value locked from all deposits
  const totalValueLocked = deposits.reduce((sum, deposit) => {
    return sum + parseFloat(deposit.amount);
  }, 0).toFixed(6);

  return (
    <VaultContext.Provider value={{ deposits, totalValueLocked, addDeposit, getDepositsByAddress }}>
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
