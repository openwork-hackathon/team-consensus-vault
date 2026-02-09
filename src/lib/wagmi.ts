import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

// Validate WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId && typeof window !== 'undefined') {
  console.warn(
    'WalletConnect Project ID not configured. ' +
    'Please set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your environment variables. ' +
    'Get your project ID at https://cloud.walletconnect.com'
  );
}

export const config = getDefaultConfig({
  appName: 'Consensus Vault',
  projectId: projectId || 'YOUR_PROJECT_ID',
  chains: [base],
  ssr: true,
});

// CONSENSUS Token Configuration
export const CONSENSUS_TOKEN = {
  address: '0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa' as `0x${string}`,
  symbol: 'CONSENSUS',
  decimals: 18,
  name: 'CONSENSUS',
} as const;

// OPENWORK Token Configuration
export const OPENWORK_TOKEN = {
  address: '0x299c30DD5974BF4D5bFE42C340CA40462816AB07' as `0x${string}`,
  symbol: 'OPENWORK',
  decimals: 18,
  name: 'OPENWORK',
} as const;

// Token URLs
export const TOKEN_URLS = {
  mintClub: 'https://mint.club/token/base/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa',
  baseScan: 'https://basescan.org/token/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa',
  openworkBaseScan: 'https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07',
} as const;
