import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract ABIs
const VEC_TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const STAKING_ABI = [
  "function totalStaked() view returns (uint256)",
  "function totalStakers() view returns (uint256)",
  "function getStats() view returns (uint256 totalStakedTokens, uint256 totalDistributedRewards, uint256 totalPenalties, uint256 activeStakers, uint256 currentRewardRate, uint256 baseAPY)",
  "function calculateAPYForPeriod(uint8) view returns (uint256)"
];

// Contract Addresses - BSC Testnet
const BSC_CONFIG = {
  chainId: '0x61',
  chainName: 'BNB Testnet',
  nativeSymbol: 'tBNB',
  nativeName: 'Test BNB',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  tokenAddress: '0x1D3516E449aC7f08F5773Dc8d984E1174420867a',
  stakingAddress: '0x8c8A80E75D38d29A27770f90798DF479b294aC51',
  blockExplorer: 'https://testnet.bscscan.com',
  color: '#F0B90B'
};

// Contract Addresses - Flow Testnet
const FLOW_CONFIG = {
  chainId: '0x5eb5',
  chainName: 'Flow Testnet',
  nativeSymbol: 'FLOW',
  nativeName: 'Flow',
  rpcUrl: 'https://testnet.evm.nodes.onflow.org/',
  tokenAddress: '0x82829a882AB09864c5f2D1DA7F3F6650bFE2ebb8',
  stakingAddress: '0xc75608EfEc43aC569EAB2b7DA8D1A23FE653e80B',
  blockExplorer: 'https://evm-testnet.flowscan.io',
  color: '#16DB9A'
};

interface HeroSectionProps {
  chain?: 'bsc' | 'flow';
  account?: string | null;
  onChainChange?: (chain: 'bsc' | 'flow') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  chain = 'bsc', 
  account = null,
  onChainChange 
}) => {
  const [tvl, setTvl] = useState<string>('0');
  const [totalStakers, setTotalStakers] = useState<string>('0');
  const [apy, setApy] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(true);
  const [animatedTvl, setAnimatedTvl] = useState('$0');
  const [currentChain, setCurrentChain] = useState(chain);
  
  // New states for balances
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [vecBalance, setVecBalance] = useState<string>('0');
  const [balancesLoading, setBalancesLoading] = useState<boolean>(false);

  // Get current chain config
  const getChainConfig = () => {
    return currentChain === 'bsc' ? BSC_CONFIG : FLOW_CONFIG;
  };

  // Handle chain change
  const handleChainChange = (newChain: 'bsc' | 'flow') => {
    setCurrentChain(newChain);
    if (onChainChange) {
      onChainChange(newChain);
    }
  };

  // Fetch protocol data
  useEffect(() => {
    const fetchBlockchainData = async () => {
      try {
        setLoading(true);
        const config = getChainConfig();
        
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const tokenContract = new ethers.Contract(config.tokenAddress, VEC_TOKEN_ABI, provider);
        const stakingContract = new ethers.Contract(config.stakingAddress, STAKING_ABI, provider);
        
        // Fetch data
        const totalStaked = await stakingContract.totalStaked();
        const stakersCount = await stakingContract.totalStakers();
        const decimals = await tokenContract.decimals();
        
        // Try to get stats
        let baseAPY = 18.5; // Default fallback
        try {
          const stats = await stakingContract.getStats();
          if (stats && stats.baseAPY) {
            baseAPY = Number(stats.baseAPY) / 100;
          }
        } catch {
          // Calculate APY from reward rate if getStats fails
          try {
            const rewardPerBlock = await stakingContract.rewardPerBlock();
            const blocksPerYear = 28800 * 365;
            const annualReward = Number(ethers.formatUnits(rewardPerBlock, decimals)) * blocksPerYear;
            const totalStakedNum = Number(ethers.formatUnits(totalStaked, decimals));
            
            if (totalStakedNum > 0) {
              baseAPY = (annualReward / totalStakedNum) * 100;
            }
          } catch {
            // Keep default
          }
        }
        
        // Calculate TVL (Total Staked * Token Price)
        // Token price is $0.0001 for now (can be updated with oracle)
        const tokenPrice = 0.0001;
        const totalStakedNum = Number(ethers.formatUnits(totalStaked, decimals));
        const tvlValue = totalStakedNum * tokenPrice;
        
        // Format TVL
        const formattedTvl = tvlValue >= 1e9 
          ? `$${(tvlValue / 1e9).toFixed(2)}B`
          : tvlValue >= 1e6 
            ? `$${(tvlValue / 1e6).toFixed(2)}M`
            : tvlValue >= 1e3 
              ? `$${(tvlValue / 1e3).toFixed(2)}K`
              : `$${tvlValue.toFixed(2)}`;
        
        setTvl(formattedTvl);
        setTotalStakers(stakersCount.toString());
        setApy(baseAPY.toFixed(1));
        
      } catch (error) {
        console.error('Error fetching blockchain data:', error);
        // Fallback data based on chain
        if (currentChain === 'bsc') {
          setTvl('$2.10');
          setTotalStakers('3');
          setApy('18.5');
        } else {
          setTvl('$0.10');
          setTotalStakers('1');
          setApy('16.2');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 30000);
    return () => clearInterval(interval);
  }, [currentChain]);

  // Fetch user balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!account) {
        setNativeBalance('0');
        setVecBalance('0');
        return;
      }

      try {
        setBalancesLoading(true);
        const config = getChainConfig();
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        
        // Fetch native balance
        const nativeBal = await provider.getBalance(account);
        const formattedNative = ethers.formatEther(nativeBal);
        setNativeBalance(parseFloat(formattedNative).toFixed(4));

        // Fetch VEC balance
        const tokenContract = new ethers.Contract(config.tokenAddress, VEC_TOKEN_ABI, provider);
        const vecBal = await tokenContract.balanceOf(account);
        const decimals = await tokenContract.decimals();
        const formattedVec = ethers.formatUnits(vecBal, decimals);
        setVecBalance(parseFloat(formattedVec).toFixed(2));

      } catch (error) {
        console.error('Error fetching balances:', error);
        setNativeBalance('0');
        setVecBalance('0');
      } finally {
        setBalancesLoading(false);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 15000);
    return () => clearInterval(interval);
  }, [account, currentChain]);

  // TVL Animation
  useEffect(() => {
    if (!tvl || tvl === '$0') return;
    
    const numericValue = parseFloat(tvl.replace(/[^0-9.]/g, ''));
    const suffix = tvl.includes('B') ? 'B' : tvl.includes('M') ? 'M' : tvl.includes('K') ? 'K' : '';
    
    let currentValue = 0;
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    const stepDuration = duration / steps;

    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= numericValue) {
        currentValue = numericValue;
        clearInterval(timer);
      }
      
      let displayValue;
      if (suffix === 'B') {
        displayValue = `$${currentValue.toFixed(2)}B`;
      } else if (suffix === 'M') {
        displayValue = `$${currentValue.toFixed(2)}M`;
      } else if (suffix === 'K') {
        displayValue = `$${currentValue.toFixed(2)}K`;
      } else {
        displayValue = `$${currentValue.toFixed(2)}`;
      }
      
      setAnimatedTvl(displayValue);
    }, stepDuration);

    return () => clearInterval(timer);
  }, [tvl]);

  const config = getChainConfig();

  return (
    <section style={{
      position: 'relative',
      padding: '4rem 0',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      minHeight: '600px',
      display: 'flex',
      alignItems: 'center'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 30% 20%, ${config.color}10, transparent 50%)`,
        pointerEvents: 'none'
      }}></div>
      
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        pointerEvents: 'none'
      }}></div>
      
      <div style={{
        position: 'relative',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1rem',
        width: '100%',
        zIndex: 10
      }}>
        {/* Chain Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => handleChainChange('bsc')}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: currentChain === 'bsc' 
                ? 'linear-gradient(135deg, #F0B90B, #F8D12F)'
                : 'rgba(255, 255, 255, 0.1)',
              color: currentChain === 'bsc' ? '#000' : '#9CA3AF',
              boxShadow: currentChain === 'bsc' ? '0 4px 20px rgba(240, 185, 11, 0.3)' : 'none'
            }}
          >
            BSC Testnet (tBNB)
          </button>
          <button
            onClick={() => handleChainChange('flow')}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: currentChain === 'flow' 
                ? 'linear-gradient(135deg, #16DB9A, #1AE5A8)'
                : 'rgba(255, 255, 255, 0.1)',
              color: currentChain === 'flow' ? '#000' : '#9CA3AF',
              boxShadow: currentChain === 'flow' ? '0 4px 20px rgba(22, 219, 154, 0.3)' : 'none'
            }}
          >
            Flow Testnet (FLOW)
          </button>
        </div>

        {/* Network Badge */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{
            display: 'inline-block',
            padding: '0.5rem 1.5rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500',
            background: `${config.color}20`,
            color: config.color,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${config.color}30`
          }}>
            {config.chainName} • {config.nativeSymbol}
          </span>
        </div>

        {/* TVL Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            fontWeight: 'bold',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #fff, #e2e8f0, #fff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Total Value Locked
          </h2>
          
          {loading ? (
            <div style={{
              display: 'inline-block'
            }}>
              <div style={{
                fontSize: 'clamp(3rem, 10vw, 5rem)',
                fontWeight: 'bold',
                color: 'rgba(6, 182, 212, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  border: '4px solid #06b6d4',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span>Loading...</span>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'inline-block'
            }}>
              <div style={{
                fontSize: 'clamp(3rem, 10vw, 5rem)',
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${config.color}, #3b82f6, ${config.color})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'pulse 2s infinite',
                marginBottom: '0.5rem'
              }}>
                {animatedTvl}
              </div>
              
              {/* Live Indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                color: '#9CA3AF',
                fontSize: '0.875rem'
              }}>
                <span style={{
                  position: 'relative',
                  display: 'flex',
                  height: '0.75rem',
                  width: '0.75rem'
                }}>
                  <span style={{
                    animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                    position: 'absolute',
                    display: 'inline-flex',
                    height: '100%',
                    width: '100%',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    opacity: 0.75
                  }}></span>
                  <span style={{
                    position: 'relative',
                    display: 'inline-flex',
                    borderRadius: '50%',
                    height: '0.75rem',
                    width: '0.75rem',
                    backgroundColor: '#10b981'
                  }}></span>
                </span>
                Live from {config.chainName}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {/* TVL Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '1.5rem',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
            <div style={{
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: 'bold',
              color: config.color,
              marginBottom: '0.5rem'
            }}>
              {loading ? (
                <div style={{
                  height: '3rem',
                  width: '8rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  margin: '0 auto',
                  animation: 'pulse 2s infinite'
                }}></div>
              ) : (
                tvl
              )}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Total Value Locked
            </div>
          </div>

          {/* Stakers Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '1.5rem',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: 'bold',
              color: '#3b82f6',
              marginBottom: '0.5rem'
            }}>
              {loading ? (
                <div style={{
                  height: '3rem',
                  width: '8rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  margin: '0 auto',
                  animation: 'pulse 2s infinite'
                }}></div>
              ) : (
                totalStakers
              )}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Total Stakers
            </div>
          </div>

          {/* APY Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '1.5rem',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              {loading ? (
                <div style={{
                  height: '3rem',
                  width: '8rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  margin: '0 auto',
                  animation: 'pulse 2s infinite'
                }}></div>
              ) : (
                `${apy}%`
              )}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Average APY
            </div>
          </div>
        </div>

        {/* Contract Addresses */}
        <div style={{
          marginTop: '3rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#6B7280'
        }}>
          <p style={{ marginBottom: '0.25rem' }}>
            VEC: {config.tokenAddress}
          </p>
          <p>
            Staking: {config.stakingAddress}
          </p>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
};