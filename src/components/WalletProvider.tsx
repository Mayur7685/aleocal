// Aleo Wallet Provider for AleoCal
// Supports Leo Wallet and other Aleo-compatible wallets
import React, { useMemo } from 'react';
import { WalletProvider as AleoWalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
import { DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from 'aleo-adapters';

// Import wallet adapter styles
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  // Configure wallets - Leo Wallet is the primary supported wallet
  const wallets = useMemo(() => {
    const adapters = [];

    // Leo Wallet - most popular Aleo wallet
    try {
      adapters.push(new LeoWalletAdapter({
        appName: 'AleoCal',
      }));
    } catch (e) {
      console.warn('Failed to initialize Leo Wallet adapter:', e);
    }

    return adapters;
  }, []);

  return (
    <AleoWalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.UponRequest}
      network={WalletAdapterNetwork.TestnetBeta}
      autoConnect={false}
    >
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </AleoWalletProvider>
  );
};

export default WalletProvider;
