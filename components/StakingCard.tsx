import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

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
 * Features: Network-specific data, real-time updates, chain-aware validation
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
  const [showFaucetMessage, setShowFaucetMessage] = useState(false);

  // Chain-specific configurations
  const chainColors = {
    bsc: {
      primary: '#F0B90B',
      secondary: '#F8D12F',
      bg: 'rgba(240, 185, 11, 0.1)',
      text: '#F0B90B'
    },
    flow: {
      primary: '#16DB9A',
      secondary: '#1AE5A8',
      bg: 'rgba(22, 219, 154, 0.1)',
      text: '#16DB9A'
    }
  };

  const colors = chainColors[currentChain.id as keyof typeof chainColors] || chainColors.bsc;

  // Lock periods with chain-specific notes
  const lockPeriods = [
    { 
      label: '30 Days', 
      value: 0, 
      apy: '15%', 
      days: 30,
      multiplier: '1.0x',
      note: 'Minimum lock'
    },
    { 
      label: '90 Days', 
      value: 1, 
      apy: '17.25%', 
      days: 90,
      multiplier: '1.15x',
      note: '15% bonus'
    },
    { 
      label: '180 Days', 
      value: 2, 
      apy: '20.25%', 
      days: 180,
      multiplier: '1.35x',
      note: '35% bonus'
    },
    { 
      label: '270 Days', 
      value: 3, 
      apy: '24%', 
      days: 270,
      multiplier: '1.6x',
      note: '60% bonus'
    },
    { 
      label: '360 Days', 
      value: 4, 
      apy: '30%', 
      days: 360,
      multiplier: '2.0x',
      note: '100% bonus'
    }
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

  // Check if user needs faucet
  useEffect(() => {
    if (account && parseFloat(balances.vec) === 0 && currentChain) {
      setShowFaucetMessage(true);
    } else {
      setShowFaucetMessage(false);
    }
  }, [account, balances.vec, currentChain]);

  const selectedPeriod = lockPeriods[lockPeriod];
  const selectedAPY = selectedPeriod?.apy || '15%';
  
  // Chain-specific validations
  const canStake = !stakeInfo.isActive && parseFloat(balances.vec) > 0;
  const canUnstake = stakeInfo.isActive && stakeInfo.canWithdraw;
  const hasActiveStake = stakeInfo.isActive;
  
  // Format numbers with proper decimal places
  const formatBalance = (value: string, decimals: number = 2) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals);
  };

  // Calculate projected earnings
  const calculateProjectedEarnings = () => {
    if (!amount || parseFloat(amount) <= 0) return '0.00';
    const apyValue = parseFloat(selectedAPY.replace('%', ''));
    return ((parseFloat(amount) * apyValue) / 100).toFixed(2);
  };

  // Handle Max button click
  const handleMaxClick = () => {
    setAmount(balances.vec);
  };

  if (!account) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        padding: '3rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '5rem',
          height: '5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <i className="fas fa-wallet" style={{ fontSize: '2rem', color: '#6B7280' }}></i>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Connect Wallet</h3>
        <p style={{ color: '#9CA3AF', marginBottom: '2rem' }}>
          Connect your wallet to start staking VEC tokens on {currentChain?.name || 'BNB Testnet'}
        </p>
        <div style={{
          display: 'inline-block',
          padding: '0.5rem 1.5rem',
          background: `${colors.bg}`,
          border: `1px solid ${colors.primary}30`,
          borderRadius: '2rem',
          color: colors.text,
          fontSize: '0.875rem'
        }}>
          <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
          Make sure you're on {currentChain?.name}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 3 Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Total Staked Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '1.5rem',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.borderColor = `${colors.primary}30`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Staked
            </div>
            <i className="fas fa-vault" style={{ color: `${colors.primary}80`, fontSize: '1.25rem' }}></i>
          </div>
          <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: colors.primary, marginBottom: '0.5rem' }}>
            {formatBalance(stakeInfo.stakedAmount)} VEC
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            Locked in vault • {currentChain?.name}
          </div>
        </div>

        {/* My Rewards Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '1.5rem',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.borderColor = '#FBBF2480';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              My Rewards
            </div>
            <i className="fas fa-bolt" style={{ color: '#FBBF2480', fontSize: '1.25rem' }}></i>
          </div>
          <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#FBBF24', marginBottom: '0.5rem' }}>
            {formatBalance(stakeInfo.pendingReward, 4)} VEC
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            Available to claim
          </div>
        </div>

        {/* Estimated APY Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '1.5rem',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.borderColor = '#10B98180';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Estimated APY
            </div>
            <i className="fas fa-chart-line" style={{ color: '#10B98180', fontSize: '1.25rem' }}></i>
          </div>
          <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#10B981', marginBottom: '0.5rem' }}>
            {stakeInfo.projectedAPY !== '0%' ? stakeInfo.projectedAPY : selectedAPY}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            Annual percentage yield
          </div>
        </div>
      </div>

      {/* Faucet Message */}
      {showFaucetMessage && (
        <div style={{
          padding: '1rem',
          background: `${colors.bg}`,
          border: `1px solid ${colors.primary}30`,
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <i className="fas fa-info-circle" style={{ color: colors.primary, fontSize: '1.25rem' }}></i>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: '600', color: colors.text }}>No VEC tokens on {currentChain?.name}? </span>
            <span style={{ color: '#9CA3AF' }}>
              Use the faucet to get 5,000 test VEC tokens and start staking!
            </span>
          </div>
          <button
            onClick={() => document.querySelector('[data-faucet-button]')?.dispatchEvent(new Event('click', { bubbles: true }))}
            style={{
              padding: '0.5rem 1rem',
              background: colors.primary,
              border: 'none',
              borderRadius: '0.75rem',
              color: '#000',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.secondary;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.primary;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Get VEC Tokens
          </button>
        </div>
      )}

      {/* Staking Form Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        padding: '2rem'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Staking Form</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem'
          }}>
            <div style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              background: colors.primary,
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>{currentChain?.name}</span>
          </div>
        </div>

        {/* Active Stake Warning */}
        {hasActiveStake && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '0.75rem'
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#F59E0B', marginTop: '0.25rem' }}></i>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#F59E0B', marginBottom: '0.25rem' }}>
                  Active Stake Detected
                </div>
                <div style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>
                  You have an active stake of <span style={{ color: colors.primary, fontWeight: '600' }}>{stakeInfo.stakedAmount} VEC</span> on {currentChain?.name}. 
                  You can only stake once at a time.
                </div>
                {timeRemaining && (
                  <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
                    Unlock time remaining: <span style={{ color: colors.primary, fontWeight: '600' }}>{timeRemaining}</span>
                  </div>
                )}
                {!canUnstake && timeRemaining && (
                  <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.5rem' }}>
                    ⚠️ You cannot unstake until the lock period ends.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lock Period Selector */}
        {!hasActiveStake && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              color: '#9CA3AF',
              marginBottom: '0.75rem',
              fontWeight: '500'
            }}>
              Select Lock Period
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.75rem'
            }}>
              {lockPeriods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setLockPeriod(period.value)}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: lockPeriod === period.value 
                      ? `1px solid ${colors.primary}80`
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    background: lockPeriod === period.value 
                      ? `${colors.bg}`
                      : 'rgba(255, 255, 255, 0.05)',
                    color: lockPeriod === period.value ? colors.text : '#9CA3AF',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (lockPeriod !== period.value) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (lockPeriod !== period.value) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {period.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{period.apy} APY</div>
                  <div style={{
                    position: 'absolute',
                    top: '0.25rem',
                    right: '0.25rem',
                    fontSize: '0.625rem',
                    background: lockPeriod === period.value ? colors.primary : 'rgba(255,255,255,0.1)',
                    color: lockPeriod === period.value ? '#000' : '#9CA3AF',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem'
                  }}>
                    {period.multiplier}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount Input */}
        {!hasActiveStake && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <label style={{ fontSize: '0.875rem', color: '#9CA3AF', fontWeight: '500' }}>
                Amount to Stake
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  Available: {formatBalance(balances.vec)} VEC
                </span>
                <button
                  onClick={handleMaxClick}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: `${colors.bg}`,
                    color: colors.text,
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${colors.primary}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${colors.bg}`;
                  }}
                >
                  Max
                </button>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                max={balances.vec}
                step="any"
                style={{
                  width: '100%',
                  padding: '1rem',
                  paddingRight: '5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: amount && parseFloat(amount) > parseFloat(balances.vec)
                    ? '1px solid #EF4444'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = `${colors.primary}80`;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                  if (!(parseFloat(amount) > parseFloat(balances.vec))) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <div style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#9CA3AF', fontWeight: '500' }}>VEC</span>
              </div>
            </div>
            {amount && parseFloat(amount) > parseFloat(balances.vec) && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fas fa-exclamation-circle"></i>
                Insufficient balance
              </div>
            )}
          </div>
        )}

        {/* Projected Earnings */}
        {!hasActiveStake && amount && parseFloat(amount) > 0 && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: `linear-gradient(135deg, ${colors.bg}, rgba(59, 130, 246, 0.1))`,
            border: `1px solid ${colors.primary}30`,
            borderRadius: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
                Projected Earnings ({selectedAPY} APY)
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: colors.primary
              }}>
                {calculateProjectedEarnings()} VEC
              </span>
            </div>
            <div style={{
              height: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min((parseFloat(selectedAPY.replace('%', '')) / 30) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${colors.primary}, #3B82F6)`,
                borderRadius: '9999px',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {hasActiveStake ? (
            <>
              <button
                onClick={onClaim}
                disabled={loading || parseFloat(stakeInfo.pendingReward) <= 0}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: loading || parseFloat(stakeInfo.pendingReward) <= 0 ? 0.5 : 1,
                  pointerEvents: loading || parseFloat(stakeInfo.pendingReward) <= 0 ? 'none' : 'auto'
                }}
                onMouseEnter={(e) => {
                  if (!loading && parseFloat(stakeInfo.pendingReward) > 0) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && parseFloat(stakeInfo.pendingReward) > 0) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10B981, #059669)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Claim Rewards'
                )}
              </button>
              <button
                onClick={onUnstake}
                disabled={loading || !canUnstake}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: canUnstake 
                    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                    : 'rgba(239, 68, 68, 0.2)',
                  border: canUnstake ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.75rem',
                  color: canUnstake ? '#fff' : '#EF4444',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: loading || !canUnstake ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading && canUnstake) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626, #B91C1C)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && canUnstake) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Processing...</span>
                  </div>
                ) : canUnstake ? (
                  'Unstake'
                ) : (
                  `Unlock in ${timeRemaining || '...'}`
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => onStake(amount, lockPeriod)}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balances.vec) || loading || !canStake}
              style={{
                width: '100%',
                padding: '1rem',
                background: `linear-gradient(135deg, ${colors.primary}, #3B82F6)`,
                border: 'none',
                borderRadius: '0.75rem',
                color: '#000',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balances.vec) || loading || !canStake ? 0.5 : 1,
                pointerEvents: !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balances.vec) || loading || !canStake ? 'none' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (canStake && amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(balances.vec)) {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${colors.secondary}, #2563EB)`;
                  e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}80`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (canStake && amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(balances.vec)) {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primary}, #3B82F6)`;
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Processing...</span>
                </div>
              ) : (
                'Stake VEC'
              )}
            </button>
          )}
        </div>

        {/* Additional Info */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#6B7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <span>
            <i className="fas fa-shield-alt" style={{ marginRight: '0.25rem', color: colors.primary }}></i>
            Early withdrawal penalty applies
          </span>
          <span>
            <i className="fas fa-clock" style={{ marginRight: '0.25rem', color: colors.primary }}></i>
            Rewards auto-compound
          </span>
          <span>
            <i className="fas fa-gas-pump" style={{ marginRight: '0.25rem', color: colors.primary }}></i>
            Gas: {currentChain?.nativeCurrency?.symbol || 'tBNB'}
          </span>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};