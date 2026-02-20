import React, { useState } from 'react';
import './SwapPage.css'; // Agar CSS module use karna ho to alag se

export const SwapPage: React.FC = () => {
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [fromToken, setFromToken] = useState<string>('ETH');
  const [toToken, setToToken] = useState<string>('USDC');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Mock function for swap
  const handleSwap = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Swap completed successfully!');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto relative">
        {/* Header Section with Stats */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 text-transparent bg-clip-text">
            Swap
          </h1>
          <p className="text-gray-400 text-lg">
            Cross-chain swaps with the best rates
          </p>
          
          {/* Live Stats */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/10">
              <span className="text-gray-400 text-sm">24h Volume</span>
              <p className="text-white font-semibold">$124.5M</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/10">
              <span className="text-gray-400 text-sm">Total Swaps</span>
              <p className="text-white font-semibold">2.4M+</p>
            </div>
          </div>
        </div>

        {/* Main Swap Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <i className="fas fa-sync-alt text-white"></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Token Swap</h3>
                  <p className="text-gray-400 text-xs">Best rates via DEX aggregator</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-white transition-colors">
                <i className="fas fa-cog"></i>
              </button>
            </div>
          </div>

          {/* Swap Form */}
          <div className="p-6 space-y-4">
            {/* From Token */}
            <div className="bg-gray-800/50 rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-400 text-sm">From</label>
                <span className="text-gray-400 text-sm">Balance: 2.5 ETH</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-3xl text-white font-semibold outline-none w-full"
                />
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-2xl px-4 py-2 transition-all">
                  <img 
                    src={`/tokens/${fromToken}.svg`} 
                    alt={fromToken}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24';
                    }}
                  />
                  <span className="text-white font-medium">{fromToken}</span>
                  <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>
              </div>
            </div>

            {/* Swap Icon */}
            <div className="relative flex justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <button className="relative w-10 h-10 rounded-full bg-gray-800 border border-white/20 flex items-center justify-center hover:rotate-180 transition-all duration-500 group">
                <i className="fas fa-arrow-down text-gray-400 group-hover:text-white"></i>
              </button>
            </div>

            {/* To Token */}
            <div className="bg-gray-800/50 rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-400 text-sm">To</label>
                <span className="text-gray-400 text-sm">Balance: 10,000 USDC</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-3xl text-white font-semibold outline-none w-full"
                  readOnly
                />
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-2xl px-4 py-2 transition-all">
                  <img 
                    src={`/tokens/${toToken}.svg`} 
                    alt={toToken}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24';
                    }}
                  />
                  <span className="text-white font-medium">{toToken}</span>
                  <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="bg-gray-800/30 rounded-xl p-3 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Exchange Rate</span>
                <span className="text-white text-sm font-medium">
                  1 ETH ≈ 3,500 USDC
                </span>
              </div>
            </div>

            {/* Slippage Tolerance */}
            <div className="bg-gray-800/30 rounded-xl p-3 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Slippage Tolerance</span>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1.0].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        slippage === value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Impact Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <i className="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
                <div>
                  <p className="text-yellow-500 text-sm font-medium">Price Impact: 0.15%</p>
                  <p className="text-gray-400 text-xs">Minimum received: 3,492.5 USDC</p>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={!fromAmount || isLoading}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all relative overflow-hidden group ${
                !fromAmount || isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Swapping...</span>
                </div>
              ) : (
                <>
                  <span className="relative z-10">Swap</span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </>
              )}
            </button>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-link text-green-400"></i>
                </div>
                <p className="text-gray-300 text-xs font-medium">Multi-chain</p>
                <p className="text-gray-500 text-xs">15+ Chains</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-chart-line text-blue-400"></i>
                </div>
                <p className="text-gray-300 text-xs font-medium">Best Rates</p>
                <p className="text-gray-500 text-xs">20+ Aggregators</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-bolt text-purple-400"></i>
                </div>
                <p className="text-gray-300 text-xs font-medium">Low Fees</p>
                <p className="text-gray-500 text-xs">0.1% Starting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-history text-gray-400"></i>
            Recent Activity
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <i className="fas fa-check text-white text-xs"></i>
                </div>
                <div>
                  <p className="text-white text-sm">Swap ETH → USDC</p>
                  <p className="text-gray-400 text-xs">2 minutes ago</p>
                </div>
              </div>
              <span className="text-green-400 text-sm font-medium">+$1,234</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};