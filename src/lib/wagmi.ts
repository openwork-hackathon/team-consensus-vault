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
