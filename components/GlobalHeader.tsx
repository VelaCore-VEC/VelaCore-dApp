import React from 'react';

interface GlobalHeaderProps {
  account: string | null;
  currentChain: any;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchChain: (chainId: string) => void;
  supportedChains: any[];
  connectedWalletId?: string | null;
}

const getWalletIcon = (walletId: string) => {
  switch (walletId) {
    case 'metamask': return '🦊';
    case 'trustwallet': return '🔵';
    case 'coinbase': return '💎';
    case 'binance': return '🟡';
    case 'casper': return '💎';
    case 'phantom': return '👻';
    case 'walletconnect': return '📱';
    default: return '👛';
  }
};

const getWalletName = (walletId: string) => {
  switch (walletId) {
    case 'metamask': return 'MetaMask';
    case 'trustwallet': return 'Trust';
    case 'coinbase': return 'Coinbase';
    case 'binance': return 'Binance';
    case 'casper': return 'Casper';
    case 'phantom': return 'Phantom';
    case 'walletconnect': return 'WalletConnect';
    default: return walletId;
  }
};

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  account,
  currentChain,
  onConnect,
  onDisconnect,
  onSwitchChain,
  supportedChains,
  connectedWalletId
}) => {
  return (
    <div className="bg-[#0B0E11]/95 backdrop-blur-xl border-b border-cyan-500/20 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* NETWORK SELECTOR - ONLY THIS */}
        <div className="relative group">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:border-cyan-500/30 transition-all cursor-pointer">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                currentChain.id === 'bsc' ? 'bg-yellow-400' : 'bg-green-400'
              }`}></div>
              <span className="text-sm font-medium text-white">
                {currentChain.name}
              </span>
              <i className="fas fa-chevron-down text-xs text-gray-400 ml-1"></i>
            </div>
          </div>
          
          {/* Network Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-56 bg-[#0B0E11] border border-cyan-500/30 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-2">
              <div className="text-xs text-gray-400 font-semibold px-3 py-2">SELECT NETWORK</div>
              {supportedChains.map(chain => (
                <button
                  key={chain.id}
                  onClick={() => onSwitchChain(chain.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                    currentChain.id === chain.id 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      chain.id === 'bsc' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}></div>
                    <span className="text-sm">{chain.name}</span>
                  </div>
                  {currentChain.id === chain.id && (
                    <i className="fas fa-check text-cyan-400 text-xs"></i>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* WALLET SECTION */}
        <div className="flex items-center gap-3">
          {account ? (
            <>
              {connectedWalletId && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
                  <span className="text-sm">{getWalletIcon(connectedWalletId)}</span>
                  <span className="text-sm font-medium">
                    {getWalletName(connectedWalletId)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="absolute -inset-1 bg-green-400 rounded-full animate-ping opacity-20"></div>
                </div>
                <span className="text-sm font-mono">
                  {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                </span>
              </div>
              
              <button
                onClick={onDisconnect}
                className="p-2 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition-all"
                title="Disconnect"
              >
                <i className="fas fa-power-off text-gray-400 hover:text-red-400"></i>
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/30 flex items-center gap-2"
            >
              <i className="fas fa-wallet"></i>
              <span>Connect</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Network Selector */}
      <div className="md:hidden mt-3">
        <select 
          value={currentChain.id}
          onChange={(e) => onSwitchChain(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
        >
          {supportedChains.map(chain => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};