'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface GuestUser {
  id: string;
  username: string;
  isGuest: true;
  createdAt: number;
}

interface GuestContextType {
  guestUser: GuestUser | null;
  isGuestMode: boolean;
  createGuestUser: (username: string) => void;
  clearGuestUser: () => void;
  generateGuestId: () => string;
  getStoredUsername: () => string | null;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'cvault-guest-user';
const USERNAME_STORAGE_KEY = 'arena-username';

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate a unique guest ID
  const generateGuestId = useCallback(() => {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Get stored username from localStorage
  const getStoredUsername = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(USERNAME_STORAGE_KEY);
  }, []);

  // Load guest user from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the stored guest user
        if (parsed && parsed.id && parsed.username && parsed.isGuest) {
          setGuestUser(parsed);
        }
      }
    } catch (error) {
      console.error('[guest] Failed to load guest user:', error);
    }
    setIsInitialized(true);
  }, []);

  // Create a new guest user
  const createGuestUser = useCallback((username: string) => {
    const newGuest: GuestUser = {
      id: generateGuestId(),
      username: username.trim(),
      isGuest: true,
      createdAt: Date.now(),
    };

    setGuestUser(newGuest);
    
    // Also save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newGuest));
      localStorage.setItem(USERNAME_STORAGE_KEY, username.trim());
    }
  }, [generateGuestId]);

  // Clear guest user
  const clearGuestUser = useCallback(() => {
    setGuestUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
  }, []);

  const isGuestMode = !!guestUser;

  // Don't render children until we've checked localStorage
  if (!isInitialized) {
    return null;
  }

  return (
    <GuestContext.Provider
      value={{
        guestUser,
        isGuestMode,
        createGuestUser,
        clearGuestUser,
        generateGuestId,
        getStoredUsername,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
}

// Hook for components that want to handle guest mode optionally
export function useGuestOptional() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    return {
      guestUser: null,
      isGuestMode: false,
      createGuestUser: () => {},
      clearGuestUser: () => {},
      generateGuestId: () => `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      getStoredUsername: () => null,
    };
  }
  return context;
}
