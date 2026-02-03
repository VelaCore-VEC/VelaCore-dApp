import React from 'react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletId: string) => void;
  loading: boolean;
}

const WALLETS = [
  { id: 'metamask', name: 'MetaMask', icon: 'fab fa-ethereum', color: 'from-orange-500 to-yellow-500' },
  { id: 'trustwallet', name: 'Trust Wallet', icon: 'fas fa-wallet', color: 'from-blue-500 to-cyan-500' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: 'fab fa-bitcoin', color: 'from-blue-600 to-indigo-600' },
  { id: 'binance', name: 'Binance Wallet', icon: 'fab fa-btc', color: 'from-yellow-500 to-orange-500' }
];

/**
 * WalletModal - Professional wallet connection modal
 * Features: Glassmorphism, smooth animations, multiple wallet options
 */
export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative glass-card p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Connect Wallet</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Connect your wallet to access VelaCore Protocol
        </p>

        <div className="grid grid-cols-2 gap-3">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => onConnect(wallet.id)}
              disabled={loading}
              className="group relative p-4 bg-white/5 border border-white/10 rounded-xl hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${wallet.color} rounded-lg flex items-center justify-center mb-3 mx-auto shadow-lg`}>
                <i className={`${wallet.icon} text-white text-xl`}></i>
              </div>
              <div className="text-sm font-medium text-center">{wallet.name}</div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-xl transition-all duration-200"></div>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By connecting, you agree to VelaCore's Terms of Service
        </p>
      </div>
    </div>
  );
};

