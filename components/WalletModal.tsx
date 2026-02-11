import React, { useState } from 'react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletId: string) => Promise<void>;
  loading: boolean;
  detectedWallets?: any[];
}

const WALLETS = [
  { 
    id: 'walletconnect', 
    name: 'WalletConnect', 
    icon: '📱', 
    color: 'from-blue-400 to-indigo-500', 
    description: 'Scan QR Code with any wallet',
    bgClass: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/50'
  },
  { 
    id: 'metamask', 
    name: 'MetaMask', 
    icon: '🦊', 
    color: 'from-orange-500 to-yellow-500', 
    description: 'Browser extension',
    bgClass: 'hover:border-orange-500/30'
  },
  { 
    id: 'trustwallet', 
    name: 'Trust Wallet', 
    icon: '🔵', 
    color: 'from-blue-500 to-cyan-500', 
    description: 'Mobile & Extension',
    bgClass: 'hover:border-blue-500/30'
  },
  { 
    id: 'coinbase', 
    name: 'Coinbase', 
    icon: '💎', 
    color: 'from-blue-600 to-indigo-600', 
    description: 'Wallet & Extension',
    bgClass: 'hover:border-blue-600/30'
  },
  { 
    id: 'binance', 
    name: 'Binance', 
    icon: '🟡', 
    color: 'from-yellow-500 to-orange-500', 
    description: 'Chain Wallet',
    bgClass: 'hover:border-yellow-500/30'
  },
  { 
    id: 'casper', 
    name: 'Casper', 
    icon: '💎', 
    color: 'from-purple-600 to-pink-600', 
    description: 'Casper Wallet',
    bgClass: 'hover:border-purple-500/30'
  },
  { 
    id: 'phantom', 
    name: 'Phantom', 
    icon: '👻', 
    color: 'from-purple-500 to-violet-500', 
    description: 'Solana & EVM',
    bgClass: 'hover:border-purple-500/30'
  }
];

export const WalletModal: React.FC<WalletModalProps> = ({ 
  isOpen, 
  onClose, 
  onConnect, 
  loading 
}) => {
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleWalletClick = async (walletId: string) => {
    setError(null);
    try {
      await onConnect(walletId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-gradient-to-b from-[#0B0E11] to-[#0B0E11]/90 border border-cyan-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Connect Wallet
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Choose your preferred wallet
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white border border-white/10 hover:border-cyan-500/30"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-300 flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </div>
        )}

        {/* Wallet List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletClick(wallet.id)}
              disabled={loading}
              className={`w-full flex items-center justify-between p-4 bg-white/5 border rounded-xl hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 transition-all duration-200 disabled:opacity-50 ${
                wallet.id === 'walletconnect' 
                  ? wallet.bgClass
                  : 'border-white/10 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${wallet.color} rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                  {wallet.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">{wallet.name}</div>
                  <div className="text-xs text-gray-400">{wallet.description}</div>
                </div>
              </div>
              <i className="fas fa-arrow-right text-gray-400 group-hover:text-cyan-400"></i>
            </button>
          ))}
        </div>

        {/* Connection Status */}
        {loading && (
          <div className="mt-6 flex items-center justify-center p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            <span className="ml-3 text-sm text-cyan-300">Connecting to wallet...</span>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6 pt-6 border-t border-white/10">
          By connecting, you agree to VelaCore's Terms of Service
          <br />
          <span className="text-gray-600">Secure • Decentralized • Fast</span>
        </p>
      </div>
    </div>
  );
};