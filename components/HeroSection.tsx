import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ── ABIs ──────────────────────────────────────────────────────
const VEC_TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];
const STAKING_ABI_H = [
  "function totalStaked() view returns (uint256)",
  "function totalStakers() view returns (uint256)",
  "function getStats() view returns (uint256,uint256,uint256,uint256,uint256,uint256)",
  "function rewardPerBlock() view returns (uint256)",
];

// ── Chain configs ──────────────────────────────────────────────
const CHAIN_CONFIGS_H = {
  bsc: {
    chainId:       '0x61',
    chainName:     'BNB Testnet',
    nativeSymbol:  'tBNB',
    rpcUrl:        process.env.REACT_APP_BSC_RPC_URL   || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    tokenAddress:  process.env.REACT_APP_BSC_TOKEN_ADDRESS   || '0x1D3516E449aC7f08F5773Dc8d984E1174420867a',
    stakingAddress:process.env.REACT_APP_BSC_STAKING_ADDRESS || '0x8c8A80E75D38d29A27770f90798DF479b294aC51',
    color:         '#F0B90B',
    buttonLabel:   'BSC Testnet (tBNB)',
    defaultTvl:    '$2.10',
    defaultStakers:'3',
    defaultApy:    '18.5',
  },
  flow: {
    chainId:       '0x221',
    chainName:     'Flow Testnet',
    nativeSymbol:  'FLOW',
    rpcUrl:        process.env.REACT_APP_FLOW_RPC_URL  || 'https://testnet.evm.nodes.onflow.org/',
    tokenAddress:  process.env.REACT_APP_FLOW_TOKEN_ADDRESS   || '0x82829a882AB09864c5f2D1DA7F3F6650bFE2ebb8',
    stakingAddress:process.env.REACT_APP_FLOW_STAKING_ADDRESS || '0xc75608EfEc43aC569EAB2b7DA8D1A23FE653e80B',
    color:         '#16DB9A',
    buttonLabel:   'Flow Testnet (FLOW)',
    defaultTvl:    '$0.10',
    defaultStakers:'1',
    defaultApy:    '16.2',
  },
  creditcoin: {
    chainId:       '0x18E83',
    chainName:     'CreditCoin Testnet',
    nativeSymbol:  'CTC',
    rpcUrl:        process.env.REACT_APP_CREDITCOIN_RPC_URL  || 'https://rpc.cc3-testnet.creditcoin.network',
    tokenAddress:  process.env.REACT_APP_CREDITCOIN_TOKEN_ADDRESS   || '0x82829a882AB09864c5f2D1DA7F3F6650bFE2ebb8',
    stakingAddress:process.env.REACT_APP_CREDITCOIN_STAKING_ADDRESS || '0xc75608EfEc43aC569EAB2b7DA8D1A23FE653e80B',
    color:         '#9333EA',
    buttonLabel:   'CreditCoin (CTC)',
    defaultTvl:    '$0.05',
    defaultStakers:'0',
    defaultApy:    '17.0',
  },
} as const;

type ChainId = keyof typeof CHAIN_CONFIGS_H;

// ── Props ──────────────────────────────────────────────────────
interface HeroSectionProps {
  chain?: ChainId;
  account?: string | null;
  onChainChange?: (chain: ChainId) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  chain = 'bsc',
  account = null,
  onChainChange,
}) => {
  const [currentChain, setCurrentChain] = useState<ChainId>(chain);
  const [tvl,          setTvl]          = useState('0');
  const [totalStakers, setTotalStakers] = useState('0');
  const [apy,          setApy]          = useState('0');
  const [loading,      setLoading]      = useState(true);
  const [animatedTvl,  setAnimatedTvl]  = useState('$0');

  // Sync prop → state
  useEffect(() => { setCurrentChain(chain); }, [chain]);

  const cfg = CHAIN_CONFIGS_H[currentChain];

  const handleChainChange = (c: ChainId) => {
    setCurrentChain(c);
    onChainChange?.(c);
  };

  // ── Fetch protocol stats ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      const { rpcUrl, tokenAddress, stakingAddress, defaultTvl, defaultStakers, defaultApy } = cfg;
      try {
        const provider       = new ethers.JsonRpcProvider(rpcUrl);
        const tokenContract  = new ethers.Contract(tokenAddress,   VEC_TOKEN_ABI, provider);
        const stakingContract= new ethers.Contract(stakingAddress, STAKING_ABI_H, provider);

        const [totalStakedBig, stakersCount, decimals] = await Promise.all([
          stakingContract.totalStaked().catch(() => 0n),
          stakingContract.totalStakers().catch(() => 0n),
          tokenContract.decimals().catch(() => 18),
        ]);

        let baseAPY = parseFloat(defaultApy);
        try {
          const stats = await stakingContract.getStats().catch(() => null);
          if (stats?.[5] && stats[5] > 0n) baseAPY = Number(stats[5]) / 100;
          else {
            const rateRaw = await stakingContract.rewardPerBlock().catch(() => 0n);
            const totalNum= Number(ethers.formatUnits(totalStakedBig, Number(decimals)));
            const annualRe= Number(rateRaw) * 28800 * 365;
            if (totalNum > 0) baseAPY = (annualRe / totalNum) * 100;
          }
        } catch { }

        const totalStakedNum = Number(ethers.formatUnits(totalStakedBig, Number(decimals)));
        const tvlValue       = totalStakedNum * 0.0001;
        const formattedTvl   = tvlValue >= 1e9 ? `$${(tvlValue/1e9).toFixed(2)}B`
          : tvlValue >= 1e6 ? `$${(tvlValue/1e6).toFixed(2)}M`
          : tvlValue >= 1e3 ? `$${(tvlValue/1e3).toFixed(2)}K`
          : `$${tvlValue.toFixed(2)}`;

        if (!cancelled) {
          setTvl(formattedTvl);
          setTotalStakers(stakersCount.toString());
          setApy(Math.min(Math.max(baseAPY, 5), 30).toFixed(1));
        }
      } catch {
        if (!cancelled) { setTvl(defaultTvl); setTotalStakers(defaultStakers); setApy(defaultApy); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [currentChain]);

  // ── TVL count-up animation ─────────────────────────────────────
  useEffect(() => {
    if (!tvl || tvl === '$0') return;
    const numVal = parseFloat(tvl.replace(/[^0-9.]/g, ''));
    const suffix  = tvl.includes('B') ? 'B' : tvl.includes('M') ? 'M' : tvl.includes('K') ? 'K' : '';
    let cur = 0;
    const steps = 60;
    const inc   = numVal / steps;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= numVal) { cur = numVal; clearInterval(timer); }
      const disp = suffix === 'B' ? `$${cur.toFixed(2)}B`
        : suffix === 'M' ? `$${cur.toFixed(2)}M`
        : suffix === 'K' ? `$${cur.toFixed(2)}K`
        : `$${cur.toFixed(2)}`;
      setAnimatedTvl(disp);
    }, 2000 / steps);
    return () => clearInterval(timer);
  }, [tvl]);

  return (
    <section style={{
      position: 'relative', padding: '4rem 0', overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      minHeight: '600px', display: 'flex', alignItems: 'center',
    }}>
      {/* BG glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 20%, ${cfg.color}10, transparent 50%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(6,182,212,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.03) 1px,transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', width: '100%', zIndex: 10 }}>

        {/* ── Chain Selector Buttons ─────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {(Object.keys(CHAIN_CONFIGS_H) as ChainId[]).map(id => {
            const c       = CHAIN_CONFIGS_H[id];
            const isActive= currentChain === id;
            const textDark = id === 'bsc' || id === 'flow';
            return (
              <button
                key={id}
                onClick={() => handleChainChange(id)}
                style={{
                  padding: '0.75rem 1.75rem', borderRadius: '9999px',
                  fontWeight: '600', fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: isActive ? c.color : 'rgba(255,255,255,0.1)',
                  color:      isActive ? (textDark ? '#000' : '#fff') : '#9CA3AF',
                  boxShadow:  isActive ? `0 4px 20px ${c.color}40` : 'none',
                  transform:  isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {c.buttonLabel}
              </button>
            );
          })}
        </div>

        {/* Network Badge */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span style={{
            display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: '9999px',
            fontSize: '0.875rem', fontWeight: '500',
            background: `${cfg.color}20`, color: cfg.color,
            backdropFilter: 'blur(10px)', border: `1px solid ${cfg.color}30`,
          }}>
            {cfg.chainName} • {cfg.nativeSymbol}
          </span>
        </div>

        {/* TVL */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem,8vw,4rem)', fontWeight: 'bold', marginBottom: '1rem',
            background: 'linear-gradient(135deg,#fff,#e2e8f0,#fff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Total Value Locked
          </h2>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontSize: 'clamp(3rem,10vw,5rem)', fontWeight: 'bold', color: 'rgba(6,182,212,0.5)' }}>
              <div style={{ width: '3rem', height: '3rem', border: '4px solid #06b6d4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span>Loading...</span>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: 'clamp(3rem,10vw,5rem)', fontWeight: 'bold',
                background: `linear-gradient(135deg,${cfg.color},#3b82f6,${cfg.color})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                animation: 'pulse 2s infinite', marginBottom: '0.5rem',
              }}>
                {animatedTvl}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#9CA3AF', fontSize: '0.875rem' }}>
                <span style={{ position: 'relative', display: 'flex', height: '0.75rem', width: '0.75rem' }}>
                  <span style={{ animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.75 }} />
                  <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '0.75rem', width: '0.75rem', backgroundColor: '#10b981' }} />
                </span>
                Live from {cfg.chainName}
              </div>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { label: 'Total Value Locked', value: loading ? null : tvl,          color: cfg.color  },
            { label: 'Total Stakers',      value: loading ? null : totalStakers, color: '#3b82f6'  },
            { label: 'Average APY',        value: loading ? null : `${apy}%`,    color: '#10b981'  },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: 'clamp(2rem,4vw,2.5rem)', fontWeight: 'bold', color: stat.color, marginBottom: '0.5rem' }}>
                {stat.value === null
                  ? <div style={{ height: '3rem', width: '8rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', margin: '0 auto', animation: 'pulse 2s infinite' }} />
                  : stat.value}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Contract addresses */}
        <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.75rem', color: '#4B5563' }}>
          <p style={{ marginBottom: '0.25rem' }}>VEC Token: {cfg.tokenAddress}</p>
          <p>Staking: {cfg.stakingAddress}</p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.7} }
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
      `}</style>
    </section>
  );
};