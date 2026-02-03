import React, { useState, useEffect } from 'react';

interface StakingCardProps {
  account: string | null;
  balances: any;
  currentChain: any;
  stakeInfo: {
    stakedAmount: string;
    pendingReward: string;
    projectedAPY: string;
    isActive: boolean;
    unlockTime: number;
    lockupPeriod: number;
    canWithdraw: boolean;
  };
  onStake: (amount: string, lockPeriod: number) => void;
  onUnstake: () => void;
  onClaim: () => void;
  loading: boolean;
}

/**
 * StakingCard - Next-level professional staking interface
 * Features: 3 stat cards, staking form with Max button, lock period validation
 */
export const StakingCard: React.FC<StakingCardProps> = ({
  account,
  balances,
  currentChain,
  stakeInfo,
  onStake,
  onUnstake,
  onClaim,
  loading
}) => {
  const [amount, setAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const lockPeriods = [
    { label: '30 Days', value: 0, apy: '15%', days: 30 },
    { label: '90 Days', value: 1, apy: '17.25%', days: 90 },
    { label: '180 Days', value: 2, apy: '20.25%', days: 180 },
    { label: '270 Days', value: 3, apy: '24%', days: 270 },
    { label: '360 Days', value: 4, apy: '30%', days: 360 }
  ];

  // Calculate time remaining until unlock
  useEffect(() => {
    if (stakeInfo.isActive && stakeInfo.unlockTime > 0) {
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = stakeInfo.unlockTime - now;
        
        if (remaining <= 0) {
          setTimeRemaining('');
        } else {
          const days = Math.floor(remaining / 86400);
          const hours = Math.floor((remaining % 86400) / 3600);
          const minutes = Math.floor((remaining % 3600) / 60);
          
          if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h`);
          } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m`);
          } else {
            setTimeRemaining(`${minutes}m`);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [stakeInfo.isActive, stakeInfo.unlockTime]);

  const selectedAPY = lockPeriods[lockPeriod]?.apy || '15%';
  const canStake = !stakeInfo.isActive && parseFloat(balances.vec) > 0;
  const canUnstake = stakeInfo.isActive && stakeInfo.canWithdraw;
  const hasActiveStake = stakeInfo.isActive;

  if (!account) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-wallet text-4xl text-gray-500"></i>
        </div>
        <h3 className="text-2xl font-bold mb-3">Connect Wallet</h3>
        <p className="text-gray-400 mb-8">Connect your wallet to start staking VEC tokens</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Staked Card */}
        <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400 uppercase tracking-wider">Total Staked</div>
            <i className="fas fa-vault text-cyan-400/50 text-xl"></i>
          </div>
          <div className="text-3xl font-bold text-cyan-400 mb-2">{stakeInfo.stakedAmount || '0.00'} VEC</div>
          <div className="text-xs text-gray-500">Locked in vault</div>
        </div>

        {/* My Rewards Card */}
        <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400 uppercase tracking-wider">My Rewards</div>
            <i className="fas fa-bolt text-yellow-400/50 text-xl"></i>
          </div>
          <div className="text-3xl font-bold text-yellow-400 mb-2">{stakeInfo.pendingReward || '0.0000'} VEC</div>
          <div className="text-xs text-gray-500">Available to claim</div>
        </div>

        {/* Estimated APY Card */}
        <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400 uppercase tracking-wider">Estimated APY</div>
            <i className="fas fa-chart-line text-green-400/50 text-xl"></i>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">{stakeInfo.projectedAPY || selectedAPY}</div>
          <div className="text-xs text-gray-500">Annual percentage yield</div>
        </div>
      </div>

      {/* Staking Form Card */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Staking Form</h3>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${currentChain.id === 'bsc' ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
            <span className="text-sm text-gray-300">{currentChain.name}</span>
          </div>
        </div>

        {/* Active Stake Warning */}
        {hasActiveStake && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <i className="fas fa-exclamation-triangle text-yellow-400 mt-1"></i>
              <div className="flex-1">
                <div className="font-semibold text-yellow-400 mb-1">Active Stake Detected</div>
                <div className="text-sm text-gray-300 mb-2">
                  You have an active stake of {stakeInfo.stakedAmount} VEC. You can only stake once at a time.
                </div>
                {timeRemaining && (
                  <div className="text-sm text-gray-400">
                    Unlock time remaining: <span className="text-yellow-400 font-semibold">{timeRemaining}</span>
                  </div>
                )}
                {!canUnstake && timeRemaining && (
                  <div className="text-xs text-red-400 mt-2">
                    You cannot unstake until the lock period ends.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lock Period Selector */}
        {!hasActiveStake && (
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-3 font-medium">Select Lock Period</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {lockPeriods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setLockPeriod(period.value)}
                  className={`p-4 rounded-xl border transition-all ${
                    lockPeriod === period.value
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">{period.label}</div>
                  <div className="text-xs text-gray-500">{period.apy} APY</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount Input */}
        {!hasActiveStake && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-gray-400 font-medium">Amount to Stake</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Available: {balances.vec} VEC</span>
                <button
                  onClick={() => setAmount(balances.vec)}
                  className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all text-xs font-medium"
                >
                  Max
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                max={balances.vec}
                className="w-full px-4 py-4 pr-20 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all text-xl font-semibold"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-gray-400 font-medium">VEC</span>
              </div>
            </div>
            {amount && parseFloat(amount) > parseFloat(balances.vec) && (
              <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
                <i className="fas fa-exclamation-circle"></i>
                Insufficient balance
              </div>
            )}
          </div>
        )}

        {/* Projected Earnings */}
        {!hasActiveStake && amount && parseFloat(amount) > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-400">Projected Earnings ({selectedAPY} APY)</span>
              <span className="text-xl font-bold text-cyan-400">
                {((parseFloat(amount) * parseFloat(selectedAPY.replace('%', ''))) / 100).toFixed(2)} VEC
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((parseFloat(selectedAPY.replace('%', '')) / 30) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {hasActiveStake ? (
            <>
              <button
                onClick={onClaim}
                disabled={loading || parseFloat(stakeInfo.pendingReward) <= 0}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Claim Rewards'}
              </button>
              <button
                onClick={onUnstake}
                disabled={loading || !canUnstake}
                className="flex-1 py-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : canUnstake ? 'Unstake' : `Unlock in ${timeRemaining || '...'}`}
              </button>
            </>
          ) : (
            <button
              onClick={() => onStake(amount, lockPeriod)}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balances.vec) || loading || !canStake}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Stake VEC'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
