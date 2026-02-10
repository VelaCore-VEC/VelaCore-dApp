// BridgePage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const BridgePage: React.FC = () => {
  const [fromChain, setFromChain] = useState<'BNB' | 'FLOW'>('BNB');
  const [toChain, setToChain] = useState<'BNB' | 'FLOW'>('FLOW');
  const [amount, setAmount] = useState<string>('100');
  const [bridging, setBridging] = useState<boolean>(false);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'processing' | 'complete'>('idle');

  const handleBridge = () => {
    setBridging(true);
    setBridgeStatus('processing');
    
    // Simulate bridge process
    setTimeout(() => {
      setBridgeStatus('complete');
      setBridging(false);
    }, 3000);
  };

  const switchChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
            <ArrowRightLeft className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Cross-Chain Bridge
            </h2>
            <p className="text-sm text-gray-400">
              Seamlessly transfer assets between BNB Chain and Flow Testnet
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bridge Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-bold mb-4">Bridge Assets</h3>
          
          {/* From Chain */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">From Chain</label>
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                fromChain === 'BNB' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-cyan-500'
              }`}>
                {fromChain === 'BNB' ? (
                  <i className="fab fa-bnb text-white text-lg"></i>
                ) : (
                  <i className="fas fa-water text-white text-lg"></i>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{fromChain} Chain</div>
                <div className="text-xs text-gray-400">
                  {fromChain === 'BNB' ? 'Main network' : 'High-speed layer'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Balance: 1,250</div>
                <div className="text-xs text-gray-400">VEC tokens</div>
              </div>
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center my-4">
            <button
              onClick={switchChains}
              className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30 hover:border-cyan-500/50 transition-all"
            >
              <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
            </button>
          </div>

          {/* To Chain */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">To Chain</label>
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                toChain === 'BNB' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-cyan-500'
              }`}>
                {toChain === 'BNB' ? (
                  <i className="fab fa-bnb text-white text-lg"></i>
                ) : (
                  <i className="fas fa-water text-white text-lg"></i>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{toChain} Chain</div>
                <div className="text-xs text-gray-400">
                  {toChain === 'BNB' ? 'Main network' : 'High-speed layer'}
                </div>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Amount to Bridge</label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full pl-4 pr-24 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-base"
                placeholder="Enter amount"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <span className="text-gray-400">VEC</span>
                <button 
                  onClick={() => setAmount('1000')}
                  className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* Bridge Button */}
          <button
            onClick={handleBridge}
            disabled={bridging || !amount || parseFloat(amount) <= 0}
            className={`w-full py-4 rounded-xl font-bold transition-all ${
              bridging 
                ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {bridging ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Bridging in progress...
              </div>
            ) : (
              `Bridge ${amount} VEC ${fromChain} → ${toChain}`
            )}
          </button>

          {/* Bridge Status */}
          {bridgeStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10"
            >
              <div className="flex items-center gap-3 mb-2">
                {bridgeStatus === 'processing' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium text-cyan-400">Bridging in progress</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium text-emerald-400">Bridge completed</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-300">
                {bridgeStatus === 'processing' 
                  ? 'Your assets are being securely transferred between chains. This usually takes 2-3 minutes.' 
                  : 'Your assets have been successfully bridged to the destination chain.'}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Bridge Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Security Info */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold">Bridge Security</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Multi-sig Security</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Enabled</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Encrypted Transfers</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">AES-256</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Audit Status</span>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">In Progress</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bridge Stats */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold">Bridge Statistics</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Total Volume Bridged</div>
                <div className="text-2xl font-bold text-cyan-400">$1.2M</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">Successful Bridges</div>
                <div className="text-2xl font-bold text-emerald-400">2,847</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">Average Time</div>
                <div className="text-2xl font-bold text-yellow-400">2.3 min</div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4">How It Works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-cyan-400">1</span>
                </div>
                <p className="text-sm text-gray-300">Lock your tokens on the source chain</p>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-cyan-400">2</span>
                </div>
                <p className="text-sm text-gray-300">Validators verify the transaction</p>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-cyan-400">3</span>
                </div>
                <p className="text-sm text-gray-300">Mint equivalent tokens on destination chain</p>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-cyan-400">4</span>
                </div>
                <p className="text-sm text-gray-300">Receive tokens in your wallet</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};