import React from 'react';

interface GlobalHeaderProps {
  account: string | null;
  currentChain: any;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchChain: (chainId: string) => void;
  supportedChains: any[];
}

/**
 * GlobalHeader - Professional header with wallet connection and chain switcher
 * Features: RainbowKit-style wallet button, multi-chain switcher, logo
 */
export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  account,
  currentChain,
  onConnect,
  onDisconnect,
  onSwitchChain,
  supportedChains
}) => {
  const fmtAddr = (addr: string | null): string => {
    if (!addr) return '0x000...0000';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0B0E11]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <i className="fas fa-cube text-white text-xl"></i>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0B0E11] animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Vela<span className="text-cyan-400">Core</span>
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Protocol v2.0</p>
            </div>
          </div>

          {/* Chain Switcher */}
          {account && (
            <div className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1">
              {supportedChains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => onSwitchChain(chain.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentChain.id === chain.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      chain.id === 'bsc' ? 'bg-yellow-400' : 'bg-green-400'
                    } ${currentChain.id === chain.id ? 'animate-pulse' : ''}`}></div>
                    {chain.name}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Wallet Button */}
          <div className="flex items-center gap-3">
            {account ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-300">{fmtAddr(account)}</span>
                </div>
                <button
                  onClick={onDisconnect}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all duration-200 text-sm font-medium"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-200 text-sm font-semibold overflow-hidden"
              >
                <span className="relative z-10">Connect Wallet</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

