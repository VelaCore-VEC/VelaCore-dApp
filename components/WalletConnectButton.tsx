import React, { useState } from 'react';
import { WalletModal } from './WalletModal';

interface WalletConnectButtonProps {
  currentChain: any;
  onDataRefresh: (account: string, provider: any) => Promise<void>;
  supportedChains?: any[];
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  currentChain,
  onDataRefresh,
  supportedChains = []
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [detectedWallets, setDetectedWallets] = useState<any[]>([]);

  // Import hooks dynamically
  const connectWallet = async (walletId: string) => {
    setLoading(true);
    try {
      const { useWallet } = await import('../hooks/useWallet');
      // In real implementation, you would use the hook differently
      // This is simplified for example
      console.log('Connecting wallet:', walletId);
      // Actual connection logic would go here
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
      >
        {account ? (
          <>
            <i className="fas fa-wallet mr-2"></i>
            {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
          </>
        ) : (
          <>
            <i className="fas fa-plug mr-2"></i>
            Connect Wallet
          </>
        )}
      </button>

      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={connectWallet}
        loading={loading}
        detectedWallets={detectedWallets}
      />
    </>
  );
};