import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ethers } from 'ethers';
import { GoogleGenAI } from "@google/genai";
import { Section, UserBalances } from './types';
import { CONFIG, BSC_TESTNET_PARAMS, ERC20_ABI, STAKING_ABI } from './constants';

const LOGO_URL = "https://velacore.github.io/VelaCore-DApp9/VelaCore-symbol-dark.svg";

// --- Internal Interfaces ---
interface EIP6963ProviderDetail {
  info: { uuid: string; name: string; icon: string; rdns: string; };
  provider: any;
}
interface LogEntry {
  id: string;
  type: 'STAKE' | 'UNSTAKE' | 'CLAIM' | 'SWAP' | 'SYSTEM' | 'AUTH' | 'EMERGENCY';
  status: 'SUCCESS' | 'PENDING' | 'ERROR';
  message: string;
  hash?: string;
  timestamp: number;
}
interface ProtocolStats {
  totalStaked: string;
  distributedRewards: string;
  totalPenalties: string;
  activeStakers: string;
  rewardRate: string;
  baseAPY: string;
}
interface DetailedStakeInfo {
  stakedAmount: string;
  pendingReward: string;
  stakeTime: number;
  unlockTime: number;
  totalClaimed: string;
  timeRemaining: number;
  penaltyAmount: string;
  lockupPeriod: number;
  projectedAPY: string;
  isActive: boolean;
  canWithdraw: boolean;
}

const MOBILE_WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'fab fa-ethereum',
    deeplink: (url: string) => `https://metamask.app.link/dapp/${encodeURIComponent(url)}`,
    appScheme: 'metamask://dapp?url=',
    universalLink: (url: string) => `https://metamask.app.link/dapp/${encodeURIComponent(url)}`,
    packageName: 'io.metamask',
    isExtension: true,
    connectionMethod: 'deeplink'
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: 'fas fa-shield-alt',
    deeplink: (url: string) => `https://link.trustwallet.com/open_url?url=${encodeURIComponent(url)}`,
    appScheme: 'trust://browser?url=',
    universalLink: (url: string) => `https://link.trustwallet.com/open_url?url=${encodeURIComponent(url)}`,
    packageName: 'com.wallet.crypto.trustapp',
    isExtension: false,
    connectionMethod: 'browser'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: 'fas fa-wallet',
    deeplink: (url: string) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`,
    appScheme: 'cbwallet://dapp?url=',
    universalLink: (url: string) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`,
    packageName: 'org.toshi',
    isExtension: false,
    connectionMethod: 'deeplink'
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: 'fas fa-ghost',
    deeplink: (url: string) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(window.location.origin)}`,
    appScheme: 'phantom://browse/',
    universalLink: (url: string) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(window.location.origin)}`,
    packageName: 'app.phantom',
    isExtension: false,
    connectionMethod: 'browser'
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    icon: 'fas fa-bolt',
    deeplink: (url: string) => `https://www.okx.com/download?deeplink=${encodeURIComponent(`okx://wallet/dapp?url=${url}`)}`,
    appScheme: 'okx://wallet/dapp?url=',
    universalLink: (url: string) => `https://www.okx.com/download?deeplink=${encodeURIComponent(`okx://wallet/dapp?url=${url}`)}`,
    packageName: 'com.okinc.okex.gp',
    isExtension: false,
    connectionMethod: 'deeplink'
  },
  {
    id: 'binance',
    name: 'Binance Wallet',
    icon: 'fas fa-chart-line',
    // Binance Wallet deeplink
    deeplink: (url: string) => `https://www.binance.com/en/download?deeplink=${encodeURIComponent(`bnc://app.binance.com/wallet/dapp?url=${url}`)}`,
    appScheme: 'bnc://app.binance.com/wallet/dapp?url=',
    universalLink: (url: string) => `https://www.binance.com/en/download?deeplink=${encodeURIComponent(`bnc://app.binance.com/wallet/dapp?url=${url}`)}`,
    packageName: 'com.binance.dev',
    isExtension: false,
    connectionMethod: 'deeplink'
  },
  {
    id: 'bitget',
    name: 'Bitget Wallet',
    icon: 'fas fa-gem',
    deeplink: (url: string) => `https://web3.bitget.com/en/wallet-download?type=0&deeplink=${encodeURIComponent(`bitkeep://dapp?url=${url}`)}`,
    appScheme: 'bitkeep://dapp?url=',
    universalLink: (url: string) => `https://web3.bitget.com/en/wallet-download?type=0&deeplink=${encodeURIComponent(`bitkeep://dapp?url=${url}`)}`,
    packageName: 'com.bitkeep.wallet',
    isExtension: false,
    connectionMethod: 'deeplink'
  }
];

const fmtAddr = (addr: string | null | undefined): string => {
  if (!addr) return '0x000...0000';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const LOCKUP_CONFIG = [
  { label: '30D', value: 0, apy: '15%', penalty: '25%', multiplier: '1.0x' },
  { label: '90D', value: 1, apy: '17.25%', penalty: '20%', multiplier: '1.15x' },
  { label: '180D', value: 2, apy: '20.25%', penalty: '15%', multiplier: '1.35x' },
  { label: '270D', value: 3, apy: '24%', penalty: '10%', multiplier: '1.6x' },
  { label: '360D', value: 4, apy: '30%', penalty: '5%', multiplier: '2.0x' },
];

// -------------------------------------------------------------------------
// BRAND UI COMPONENTS
// -------------------------------------------------------------------------

const StatCard: React.FC<{ label: string; value: string; unit: string; icon: string; color: string; trend?: string }> = ({ label, value, unit, icon, color, trend }) => (
  <div className="bg-surfaceLight/10 border border-white/[0.03] p-5 rounded-2xl shadow-lg relative group overflow-hidden transition-all duration-300 hover:border-primary/40">
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <span className="text-textMuted text-[10px] font-bold uppercase tracking-widest">{label}</span>
        <i className={`fas ${icon} ${color} text-sm opacity-50`}></i>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-extrabold text-white tabular-nums tracking-tight">{value}</h3>
        <span className={`text-[10px] font-bold ${color} opacity-70 uppercase tracking-widest`}>{unit}</span>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-success"></div>
          <span className="text-[9px] font-bold text-success uppercase tracking-widest">{trend}</span>
        </div>
      )}
    </div>
    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-primary/5 transition-all"></div>
  </div>
);

const FaucetCard: React.FC<{ 
  isConnected: boolean; 
  onRequestTokens: () => void; 
  isLoading: boolean;
  error?: string;
}> = ({ isConnected, onRequestTokens, isLoading, error }) => (
  <div className="bg-surfaceLight/10 border border-white/[0.03] p-5 rounded-2xl shadow-lg relative group overflow-hidden transition-all duration-300 hover:border-secondary/40">
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <span className="text-textMuted text-[10px] font-bold uppercase tracking-widest">VEC Testnet Faucet</span>
        <i className="fas fa-faucet text-secondary text-sm opacity-50"></i>
      </div>
      <div className="mb-4">
        <p className="text-[9px] text-white/60 mb-3">Get 10,000 VEC test tokens for protocol testing</p>
        {error && (
          <div className="p-2 bg-error/10 border border-error/20 rounded-lg mb-3">
            <p className="text-[8px] text-error font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}
      </div>
      <button
        onClick={onRequestTokens}
        disabled={!isConnected || isLoading}
        className={`w-full px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
          !isConnected 
            ? 'bg-white/5 text-white/30 cursor-not-allowed' 
            : isLoading 
              ? 'bg-secondary/30 text-secondary animate-pulse cursor-wait'
              : 'bg-secondary text-black hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] hover:scale-[1.02] active:scale-95'
        }`}
      >
        {isLoading ? (
          <>
            <i className="fas fa-circle-notch fa-spin"></i>
            Processing...
          </>
        ) : !isConnected ? (
          'Connect Wallet First'
        ) : (
          <>
            <i className="fas fa-faucet"></i>
            Request 10,000 VEC
          </>
        )}
      </button>
      <div className="mt-3 text-center">
        <span className="text-[6px] text-textMuted font-bold uppercase tracking-widest">
          {isConnected ? 'Cooldown: 24 hours per address' : 'Connect wallet to access faucet'}
        </span>
      </div>
    </div>
    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-secondary/5 transition-all"></div>
  </div>
);

const BrandButton: React.FC<{ 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'; 
  children: React.ReactNode; 
  disabled?: boolean; 
  className?: string;
  loading?: boolean;
}> = ({ onClick, variant = 'primary', children, disabled, className = "", loading }) => {
  const styles = {
    primary: "bg-primary text-black hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]",
    secondary: "bg-secondary text-black hover:shadow-[0_0_15px_rgba(251,191,36,0.4)]",
    danger: "bg-error/10 text-error border border-error/30 hover:bg-error hover:text-white",
    success: "bg-success text-black hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
    ghost: "bg-white/5 text-white border border-white/10 hover:bg-white/10"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading} 
      className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2.5 shadow-xl ${styles[variant]} ${className}`}
    >
      {loading ? <i className="fas fa-circle-notch fa-spin"></i> : children}
    </button>
  );
};

// -------------------------------------------------------------------------
// CORE VIEWS
// -------------------------------------------------------------------------

const DashboardView: React.FC<{ 
  balances: UserBalances; 
  stats: ProtocolStats; 
  logs: LogEntry[];
  isConnected: boolean;
  onFaucetRequest: () => void;
  faucetLoading: boolean;
  faucetError?: string;
}> = ({ balances, stats, logs, isConnected, onFaucetRequest, faucetLoading, faucetError }) => {
  const chartBars = [40, 25, 60, 45, 30, 80, 55, 90, 70, 45, 65, 100, 75, 40, 85, 95, 50, 40, 70, 50];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Available Node" value={balances.vec} unit="VEC" icon="fa-wallet" color="text-primary" trend="Online" />
        <StatCard label="Locked Principle" value={balances.staked} unit="VEC" icon="fa-vault" color="text-success" trend="Active" />
        <StatCard label="Neural Yield" value={balances.rewards} unit="VEC" icon="fa-bolt" color="text-secondary" />
        <StatCard label="Protocol TVL" value={stats.totalStaked} unit="VEC" icon="fa-chart-pie" color="text-purple-400" />
        <FaucetCard 
          isConnected={isConnected}
          onRequestTokens={onFaucetRequest}
          isLoading={faucetLoading}
          error={faucetError}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-surfaceLight/10 border border-white/[0.03] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
             <div>
                <h4 className="text-lg font-black uppercase tracking-tight text-white/90">Protocol Yield Flux</h4>
                <p className="text-[9px] text-textMuted font-bold uppercase tracking-widest mt-1">Real-time reward distribution metrics</p>
             </div>
             <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                {['24H', '7D', 'ALL'].map(t => (
                  <button key={t} className={`px-4 py-1.5 rounded-lg text-[9px] font-bold tracking-widest transition-all ${t === '24H' ? 'bg-primary/20 text-primary' : 'text-textMuted hover:text-white'}`}>{t}</button>
                ))}
             </div>
          </div>
          <div className="h-40 flex items-end justify-between gap-1.5 px-2">
            {chartBars.map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary/60 transition-all duration-300 relative group" style={{ height: `${h}%` }}>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{h}% NODE</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-surfaceDark/80 border border-white/[0.03] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <i className="fas fa-server text-primary"></i> Cluster Integrity
           </h4>
           <div className="space-y-3">
              {[
                { l: 'Network', v: 'BSC-97', c: 'text-primary' },
                { l: 'Validators', v: stats.activeStakers, c: 'text-success' },
                { l: 'Reward Rate', v: stats.rewardRate, c: 'text-white' },
                { l: 'Epoch APY', v: stats.baseAPY, c: 'text-secondary' },
                { l: 'Reserves', v: stats.totalPenalties, c: 'text-error' }
              ].map((item, i) => (
                <div key={i} className="flex justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.03] hover:bg-white/[0.05] transition-all">
                  <span className="text-[10px] font-bold text-textMuted uppercase tracking-tight">{item.l}</span>
                  <span className={`text-[10px] font-bold ${item.c} tabular-nums`}>{item.v}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-surfaceDark/60 border border-white/[0.03] rounded-2xl overflow-hidden">
         <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Execution Ledger</span>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
               <span className="text-[8px] font-bold text-success uppercase tracking-widest">Live Sync</span>
            </div>
         </div>
         <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {logs.length > 0 ? (
              <table className="w-full text-left">
                <tbody className="divide-y divide-white/5">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-all text-[10px]">
                      <td className="px-5 py-4 font-bold uppercase text-primary/80">{log.type}</td>
                      <td className="px-5 py-4">
                         <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${log.status === 'SUCCESS' ? 'text-success bg-success/10' : 'text-error bg-error/10'}`}>{log.status}</span>
                      </td>
                      <td className="px-5 py-4 text-textMuted italic truncate max-w-xs">{log.message}</td>
                      <td className="px-5 py-4 text-right text-white/30 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center opacity-20 text-[10px] font-bold uppercase tracking-widest">No operations detected</div>
            )}
         </div>
      </div>
    </div>
  );
};

const StakingView: React.FC<{ 
  balances: UserBalances; 
  stakeInfo: DetailedStakeInfo;
  onStake: (a: string, p: number) => void; 
  onUnstake: () => void; 
  onClaim: () => void; 
  onEmergency: () => void;
  loading: boolean; 
  isConnected: boolean 
}> = ({ balances, stakeInfo, onStake, onUnstake, onClaim, onEmergency, loading, isConnected }) => {
  const [mode, setMode] = useState<'stake' | 'unstake'>('stake');
  const [amount, setAmount] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(0);

  if (!isConnected) return (
    <div className="py-24 text-center bg-surfaceLight/5 border-2 border-dashed border-white/5 rounded-3xl max-w-2xl mx-auto shadow-2xl">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-2xl mx-auto mb-6 border border-primary/20">
        <i className="fas fa-fingerprint"></i>
      </div>
      <h3 className="text-xl font-bold uppercase tracking-widest italic text-white/90">Handshake Required</h3>
      <p className="text-textMuted text-[10px] mt-4 uppercase tracking-widest font-bold max-w-xs mx-auto opacity-50">Sync identity module to access the vault protocol</p>
      <BrandButton className="mt-10 mx-auto" onClick={() => window.dispatchEvent(new Event('open-wallet-modal'))}>Initialize Link</BrandButton>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-6xl mx-auto items-start">
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-surfaceLight/10 border border-white/[0.03] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex bg-black/40 p-1 rounded-xl mb-8 max-w-[240px] mx-auto border border-white/5">
            <button onClick={() => setMode('stake')} className={`flex-1 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${mode === 'stake' ? 'bg-primary text-black shadow-lg' : 'text-textMuted hover:text-white'}`}>Stake</button>
            <button onClick={() => setMode('unstake')} className={`flex-1 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${mode === 'unstake' ? 'bg-error text-white shadow-lg' : 'text-textMuted hover:text-white'}`}>Unstake</button>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end px-2">
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Payload Value</span>
              <button onClick={() => setAmount(mode === 'stake' ? balances.vec : balances.staked)} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
                Max: {mode === 'stake' ? balances.vec : balances.staked} VEC
              </button>
            </div>

            <div className="bg-black/60 border border-white/5 p-6 rounded-2xl flex items-center gap-6 focus-within:border-primary/40 transition-all shadow-inner">
               <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="bg-transparent text-4xl font-black w-full outline-none placeholder:text-white/5 tracking-tight text-white tabular-nums" />
               <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-surfaceDark rounded-xl flex items-center justify-center border border-white/10 shadow-lg mb-1"><img src={LOGO_URL} className="w-6 h-6" /></div>
                  <span className="text-[8px] font-bold text-white/30 tracking-widest">VEC</span>
               </div>
            </div>

            {mode === 'stake' && (
              <div className="space-y-4 animate-in slide-in-from-top-1 duration-300">
                <span className="text-[9px] font-bold text-textMuted uppercase tracking-widest px-2 opacity-50">Temporal Lock Settings</span>
                <div className="grid grid-cols-5 gap-2">
                   {LOCKUP_CONFIG.map((opt) => (
                     <button
                       key={opt.value}
                       onClick={() => setSelectedPeriod(opt.value)}
                       className={`flex flex-col items-center py-3 rounded-xl border transition-all ${selectedPeriod === opt.value ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/5' : 'bg-white/5 border-white/5 text-textMuted hover:border-white/20'}`}
                     >
                       <span className="text-[10px] font-bold mb-0.5">{opt.label}</span>
                       <span className="text-[7px] font-bold opacity-60 tracking-tighter">{opt.apy} APY</span>
                     </button>
                   ))}
                </div>
              </div>
            )}

            <BrandButton 
              variant={mode === 'stake' ? 'primary' : 'danger'} 
              className="w-full py-4 text-[11px]"
              loading={loading}
              disabled={loading || !amount || parseFloat(amount) <= 0 || (mode === 'stake' && stakeInfo.isActive)}
              onClick={() => { mode === 'stake' ? onStake(amount, selectedPeriod) : onUnstake(); setAmount(''); }}
            >
              Initialize {mode.toUpperCase()} Sequence
            </BrandButton>
            
            {stakeInfo.isActive && mode === 'stake' && (
               <p className="text-center text-[9px] text-error font-bold uppercase tracking-widest opacity-80">Existing active node detected in protocol</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="p-5 bg-surfaceDark/60 border border-white/[0.03] rounded-2xl">
              <h5 className="text-[9px] font-black uppercase tracking-widest text-success flex items-center gap-2 mb-3">
                 <i className="fas fa-shield-virus"></i> Core Shield
              </h5>
              <p className="text-[10px] text-textMuted font-medium italic leading-relaxed">Multi-layer security synthesis active for all principal balances.</p>
           </div>
           <div className="p-5 bg-surfaceDark/60 border border-white/[0.03] rounded-2xl">
              <h5 className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-3">
                 <i className="fas fa-network-wired"></i> Sub-Block Sync
              </h5>
              <p className="text-[10px] text-textMuted font-medium italic leading-relaxed">Reward accumulation synchronized with global validator blocks.</p>
           </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-4">
         <div className="bg-gradient-to-br from-surfaceLight/10 to-bgDark border border-white/[0.03] rounded-2xl p-6 text-center shadow-2xl flex flex-col justify-center min-h-[320px] relative group overflow-hidden">
            <div className="w-14 h-14 bg-secondary/10 border border-secondary/20 rounded-2xl flex items-center justify-center text-secondary text-2xl mx-auto mb-6 shadow-lg shadow-secondary/5 group-hover:scale-105 transition-transform duration-500"><i className="fas fa-bolt-lightning"></i></div>
            <p className="text-[9px] font-bold text-textMuted uppercase tracking-widest mb-3 opacity-50">Harvestable Yield</p>
            <div className="flex flex-col items-center mb-8">
               <h2 className="text-3xl font-black text-white tabular-nums tracking-tight group-hover:text-secondary transition-colors">{balances.rewards}</h2>
               <span className="text-[9px] text-secondary font-bold uppercase tracking-widest mt-1.5 opacity-80">VEC REWARDS</span>
            </div>
            <BrandButton variant="secondary" className="w-full py-4 shadow-2xl shadow-secondary/20" loading={loading} disabled={loading || parseFloat(balances.rewards) <= 0} onClick={onClaim}>
               Synchronize Harvest
            </BrandButton>
         </div>
         
         <div className="p-5 bg-surfaceDark/40 border border-white/[0.03] rounded-2xl group cursor-pointer overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[9px] font-bold uppercase tracking-widest text-error italic opacity-70">Protocol Exit</span>
               <i className="fas fa-triangle-exclamation text-error text-[10px] animate-pulse"></i>
            </div>
            <p className="text-[9px] text-textMuted font-bold leading-relaxed uppercase tracking-widest mb-5 opacity-40">Immediate core recovery. Multipliers forfeited on override.</p>
            <button onClick={onEmergency} className="w-full py-2 rounded-lg border border-error/20 text-[9px] font-bold text-error/60 hover:bg-error hover:text-white transition-all uppercase tracking-widest">
              Emergency Extraction
            </button>
         </div>

         {stakeInfo.isActive && (
            <div className="p-5 bg-primary/[0.02] border border-primary/10 rounded-2xl shadow-xl animate-in zoom-in-95 duration-500">
               <h5 className="text-[9px] font-black uppercase tracking-widest text-primary mb-5 text-center opacity-80 italic">Node Analytics</h5>
               <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold">
                     <span className="text-textMuted uppercase tracking-widest">Principal</span>
                     <span className="text-white">{stakeInfo.stakedAmount} VEC</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                     <span className="text-textMuted uppercase tracking-widest">Unlock Epoch</span>
                     <span className="text-white">{new Date(stakeInfo.unlockTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                     <span className="text-textMuted uppercase tracking-widest">Status</span>
                     <span className={stakeInfo.canWithdraw ? 'text-success' : 'text-error'}>{stakeInfo.canWithdraw ? 'AVAILABLE' : 'LOCKED'}</span>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------
// MASTER APP
// -------------------------------------------------------------------------

declare global {
  interface Window {
    ethereum?: any;
    trustwallet?: any;
    coinbaseWalletExtension?: any;
    phantom?: any;
    okxwallet?: any;
    binance?: any;
    bitkeep?: any;
  }
}

const FAUCET_ABI = [
  "function claimTokens() external",
  "function requestTokens() external",
  "function lastRequestTime(address) external view returns(uint256)",
  "function cooldownPeriod() external view returns(uint256)"
];

const FAUCET_CONTRACT_ADDRESS = "0x9bfe0Be0C065487eBb0F66E24CDf8F9cf1D750Cf";

const detectMobileOS = (): 'ios' | 'android' | 'other' => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  if (/android/i.test(userAgent)) return 'android';
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return 'ios';
  return 'other';
};

const connectToMobileWallet = (walletId: string): boolean => {
  const wallet = MOBILE_WALLETS.find(w => w.id === walletId);
  if (!wallet) return false;
  
  const currentUrl = window.location.href;
  const os = detectMobileOS();
  
  let connectionUrl = '';
  
  if (os === 'ios' && wallet.universalLink) {
    connectionUrl = wallet.universalLink(currentUrl);
  } else if (wallet.deeplink) {
    connectionUrl = wallet.deeplink(currentUrl);
  }
  
  if (!connectionUrl) return false;
  
  if (os === 'ios') {
    const iframe = document.createElement('iframe');
    iframe.src = connectionUrl;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    setTimeout(() => {
      document.body.removeChild(iframe);
      // Fallback to direct redirect
      window.location.href = connectionUrl;
    }, 100);
  } else {
    // Direct redirect for Android
    window.location.href = connectionUrl;
  }
  
  return true;
};

// Fallback connection method using window.ethereum
const fallbackConnect = async (): Promise<boolean> => {
  if (!window.ethereum) return false;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts && accounts.length > 0;
  } catch (error) {
    console.error('Fallback connection failed:', error);
    return false;
  }
};

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>(Section.DASHBOARD);
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [balances, setBalances] = useState<UserBalances>({ bnb: '0.0000', vec: '0', staked: '0', rewards: '0.0000' });
  const [stakeInfo, setStakeInfo] = useState<DetailedStakeInfo>({
    stakedAmount: '0', pendingReward: '0', stakeTime: 0, unlockTime: 0, totalClaimed: '0',
    timeRemaining: 0, penaltyAmount: '0', lockupPeriod: 0, projectedAPY: '0',
    isActive: false, canWithdraw: false
  });
  const [stats, setStats] = useState<ProtocolStats>({ totalStaked: '0', distributedRewards: '0', totalPenalties: '0', activeStakers: '0', rewardRate: '0', baseAPY: '0' });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  const [discoveredProviders, setDiscoveredProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning'; visible: boolean }>({ message: '', type: 'info', visible: false });
  const [isMobile, setIsMobile] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionMethod, setConnectionMethod] = useState<string>('');
  const [mobileOS, setMobileOS] = useState<'ios' | 'android' | 'other'>('other');
  const [isConnectingMobile, setIsConnectingMobile] = useState(false);
  const [mobileConnectionInfo, setMobileConnectionInfo] = useState<{wallet: string, timestamp: number} | null>(null);
  
  // Faucet specific state
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetError, setFaucetError] = useState<string | undefined>(undefined);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 6000);
  }, []);

  const addLog = useCallback((type: LogEntry['type'], message: string, status: LogEntry['status'] = 'SUCCESS', hash?: string) => {
    setLogs(p => [{ id: Math.random().toString(36).substr(2, 9), type, message, status, hash, timestamp: Date.now() }, ...p].slice(0, 50));
  }, []);

  // Check if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      setMobileOS(detectMobileOS());
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Monitor for mobile wallet connection completion
  useEffect(() => {
    if (isConnectingMobile && mobileConnectionInfo) {
      const checkConnection = setInterval(() => {
        // Check if we have a provider now
        if (window.ethereum && !account) {
          // Try to connect with the newly detected provider
          handleMobileConnectionComplete();
        }
      }, 1000);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (isConnectingMobile) {
          setIsConnectingMobile(false);
          setMobileConnectionInfo(null);
          showToast("Mobile connection timeout", "error");
        }
      }, 30000);

      return () => clearInterval(checkConnection);
    }
  }, [isConnectingMobile, mobileConnectionInfo]);

  useEffect(() => {
    const cleanupWebSocket = () => {
      if (window.ethereum && window.ethereum._state && window.ethereum._state.webSocket) {
        try {
          window.ethereum._state.webSocket.close();
        } catch (e) {
          console.warn('WebSocket cleanup failed:', e);
        }
      }
    };

    return cleanupWebSocket;
  }, []);

  const refreshData = useCallback(async (currentAccount: string, rawProvider: any) => {
    try {
      const browserProvider = new ethers.BrowserProvider(rawProvider);
      const bnbBal = await browserProvider.getBalance(currentAccount).catch(() => 0n);
      const vecContract = new ethers.Contract(CONFIG.VEC_TOKEN_ADDRESS, ERC20_ABI, browserProvider);
      const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, browserProvider);
      const [vecBal, rawStakeInfo, globalStats] = await Promise.all([
        vecContract.balanceOf(currentAccount).catch(() => 0n),
        stakingContract.getUserStakeInfo(currentAccount).catch(() => [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0, 0n, false, false]),
        stakingContract.getStats().catch(() => [0n, 0n, 0n, 0n, 0n, 0n])
      ]);
      const decimals = 18; // Standard VEC decimals
      setBalances({
        bnb: parseFloat(ethers.formatEther(bnbBal)).toFixed(4),
        vec: parseFloat(ethers.formatUnits(vecBal, decimals)).toFixed(2),
        staked: parseFloat(ethers.formatUnits(rawStakeInfo[0], decimals)).toFixed(2),
        rewards: parseFloat(ethers.formatUnits(rawStakeInfo[1], decimals)).toFixed(4),
      });
      setStakeInfo({
        stakedAmount: ethers.formatUnits(rawStakeInfo[0], decimals),
        pendingReward: ethers.formatUnits(rawStakeInfo[1], decimals),
        stakeTime: Number(rawStakeInfo[2]) * 1000,
        unlockTime: Number(rawStakeInfo[3]) * 1000,
        totalClaimed: ethers.formatUnits(rawStakeInfo[4], decimals),
        timeRemaining: Number(rawStakeInfo[5]),
        penaltyAmount: ethers.formatUnits(rawStakeInfo[6], decimals),
        lockupPeriod: Number(rawStakeInfo[7]),
        projectedAPY: (Number(rawStakeInfo[8]) / 100).toFixed(2) + '%',
        isActive: rawStakeInfo[9],
        canWithdraw: rawStakeInfo[10]
      });
      setStats({
        totalStaked: parseFloat(ethers.formatUnits(globalStats[0], decimals)).toFixed(2),
        distributedRewards: parseFloat(ethers.formatUnits(globalStats[1], decimals)).toFixed(2),
        totalPenalties: parseFloat(ethers.formatUnits(globalStats[2], decimals)).toFixed(2),
        activeStakers: globalStats[3].toString(),
        rewardRate: ethers.formatUnits(globalStats[4], decimals),
        baseAPY: (Number(globalStats[5]) / 100).toFixed(2) + '%',
      });
      setRetryCount(0); // Reset retry count on successful connection
    } catch (error) {
      console.error("Sync Failure", error);
      addLog('SYSTEM', 'Protocol synchronization failure', 'ERROR');
      
      if (retryCount < 3 && currentAccount && rawProvider) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setRetryCount(prev => prev + 1);
        setTimeout(() => refreshData(currentAccount, rawProvider), delay);
      }
    }
  }, [retryCount]);

  useEffect(() => {
    const onAnnouncement = (event: any) => {
      setDiscoveredProviders(prev => prev.find(p => p.info.uuid === event.detail.info.uuid) ? prev : [...prev, event.detail]);
    };
    
    window.addEventListener("eip6963:announceProvider", onAnnouncement);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.addEventListener('open-wallet-modal', () => setIsWalletModalOpen(true));
    
    // Check for existing connection on load
    const checkExistingConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setProvider(window.ethereum);
            setConnectionMethod('metamask');
            refreshData(accounts[0], window.ethereum);
          }
        } catch (error) {
          console.warn("Error checking existing connection:", error);
        }
      }
    };
    
    checkExistingConnection();
    
    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnouncement);
      window.removeEventListener('open-wallet-modal', () => setIsWalletModalOpen(true));
    };
  }, []);

  const handleMobileConnectionComplete = async () => {
    if (!window.ethereum) {
      showToast("No wallet detected after connection attempt", "error");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setProvider(window.ethereum);
        setConnectionMethod(mobileConnectionInfo?.wallet || 'mobile');
        showToast(`${mobileConnectionInfo?.wallet || 'Mobile'} connection established`, "success");
        addLog('AUTH', `ID sync: ${fmtAddr(accounts[0])} via mobile`);
        await refreshData(accounts[0], window.ethereum);
        setIsConnectingMobile(false);
        setMobileConnectionInfo(null);
      }
    } catch (error) {
      console.error("Mobile connection completion failed:", error);
      showToast("Connection approved but setup failed", "error");
    }
  };

  const connectMetaMask = async () => {
    setLoading(true);
    setLoadingLabel('Linking Neural ID');
    setConnectionMethod('metamask');
    
    try {
      // For mobile devices
      if (isMobile) {
        setIsConnectingMobile(true);
        setMobileConnectionInfo({ wallet: 'MetaMask', timestamp: Date.now() });
        
        // Show connection instructions
        showToast("Opening MetaMask... Approve connection in app", "info");
        
        // Open MetaMask with proper URL
        const currentUrl = window.location.href;
        const metamaskUrl = `https://metamask.app.link/dapp/${encodeURIComponent(currentUrl)}`;
        
        // For iOS
        if (mobileOS === 'ios') {
          const iframe = document.createElement('iframe');
          iframe.src = metamaskUrl;
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
          
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.location.href = metamaskUrl;
          }, 100);
        } else {
          // For Android
          window.location.href = metamaskUrl;
        }
        
        setLoading(false);
        setIsWalletModalOpen(false);
        return;
      }

      if (!window.ethereum) {
        showToast("MetaMask not installed. Please install MetaMask extension.", "error");
        window.open('https://metamask.io/download/', '_blank');
        setLoading(false);
        return;
      }

      if (window.ethereum._state && window.ethereum._state.webSocket) {
        try {
          window.ethereum._state.webSocket.close();
        } catch (e) {
          console.warn('Failed to cleanup old WebSocket:', e);
        }
      }

      // Request accounts
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );

      const accountsPromise = window.ethereum.request({ 
        method: 'eth_requestAccounts',
        params: [] 
      });

      const accounts = await Promise.race([accountsPromise, timeoutPromise]) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts received");
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum, 'any');
      const network = await browserProvider.getNetwork();
      
      if (Number(network.chainId) !== CONFIG.CHAIN_ID) {
        setLoadingLabel('Network Alignment');
        try {
          await window.ethereum.request({ 
            method: 'wallet_switchEthereumChain', 
            params: [{ chainId: CONFIG.CHAIN_ID_HEX }] 
          });
        } catch (err: any) {
          if (err.code === 4902) {
            await window.ethereum.request({ 
              method: 'wallet_addEthereumChain', 
              params: [BSC_TESTNET_PARAMS] 
            });
          } else {
            throw err;
          }
        }
      }

      setAccount(accounts[0]);
      setProvider(window.ethereum);
      setIsWalletModalOpen(false);
      showToast("MetaMask link established", "success");
      addLog('AUTH', `ID sync: ${fmtAddr(accounts[0])} via MetaMask`);
      await refreshData(accounts[0], window.ethereum);
      
    } catch (e: any) {
      console.error("MetaMask connection error:", e);
      let errorMessage = "Connection failed";
      
      if (e.message.includes("timeout")) {
        errorMessage = "Connection timeout. Please try again.";
      } else if (e.message.includes("rejected") || e.code === 4001) {
        errorMessage = "Connection rejected by user";
      } else if (e.message.includes("not installed") || e.message.includes("extension not found")) {
        errorMessage = "MetaMask not found. Please install it.";
      } else {
        errorMessage = e.message || "Protocol rejection";
      }
      
      showToast(errorMessage, "error");
      setIsConnectingMobile(false);
      setMobileConnectionInfo(null);
    } finally { 
      setLoading(false); 
    }
  };

  const connectMobileWallet = async (walletId: string) => {
    setLoading(true);
    setLoadingLabel(`Connecting ${walletId}`);
    setConnectionMethod(walletId);
    
    try {
      const wallet = MOBILE_WALLETS.find(w => w.id === walletId);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (isMobile) {
        setIsConnectingMobile(true);
        setMobileConnectionInfo({ wallet: wallet.name, timestamp: Date.now() });
        
        showToast(`Opening ${wallet.name}... Approve connection`, "info");
        
        const success = connectToMobileWallet(walletId);
        
        if (!success) {
          throw new Error("Failed to open wallet");
        }
        
        setIsWalletModalOpen(false);
        
        setTimeout(() => {
          showToast("Return here after approving in wallet app", "info");
        }, 2000);
        
      } else {
        showToast(`Please install ${wallet.name} on your mobile device`, "info");
        window.open('https://metamask.io/download/', '_blank');
      }
      
    } catch (error: any) {
      console.error(`Mobile wallet connection error (${walletId}):`, error);
      showToast(`Failed to connect ${walletId}`, "error");
      setIsConnectingMobile(false);
      setMobileConnectionInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async (walletType: string, customProvider?: any) => {
    if (walletType === 'metamask') {
      await connectMetaMask();
    } else if (MOBILE_WALLETS.some(w => w.id === walletType)) {
      await connectMobileWallet(walletType);
    } else if (customProvider) {
      // Handle EIP-6963 discovered providers
      setLoading(true);
      setLoadingLabel(`Connecting to ${walletType}`);
      setConnectionMethod(walletType);
      
      try {
        const accounts = await customProvider.request({ method: 'eth_requestAccounts' });
        const browserProvider = new ethers.BrowserProvider(customProvider, 'any');
        const network = await browserProvider.getNetwork();
        
        if (Number(network.chainId) !== CONFIG.CHAIN_ID) {
          setLoadingLabel('Network Alignment');
          try {
            await customProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CONFIG.CHAIN_ID_HEX }] });
          } catch (err: any) {
            if (err.code === 4902) await customProvider.request({ method: 'wallet_addEthereumChain', params: [BSC_TESTNET_PARAMS] });
            else throw err;
          }
        }
        
        setAccount(accounts[0]);
        setProvider(customProvider);
        setIsWalletModalOpen(false);
        showToast(`${walletType} link established`, "success");
        addLog('AUTH', `ID sync: ${fmtAddr(accounts[0])} via ${walletType}`);
        await refreshData(accounts[0], customProvider);
      } catch (error: any) {
        console.error(`Error connecting to ${walletType}:`, error);
        showToast(`Failed to connect to ${walletType}`, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFaucetRequest = async () => {
    if (!provider || !account) {
      showToast("Please connect wallet first", "error");
      return;
    }
    
    setFaucetLoading(true);
    setFaucetError(undefined);
    
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      
      const faucetContract = new ethers.Contract(FAUCET_CONTRACT_ADDRESS, FAUCET_ABI, signer);
      
      const network = await browserProvider.getNetwork();
      if (Number(network.chainId) !== CONFIG.CHAIN_ID) {
        setLoadingLabel('Switching to BSC Testnet');
        try {
          await window.ethereum.request({ 
            method: 'wallet_switchEthereumChain', 
            params: [{ chainId: CONFIG.CHAIN_ID_HEX }] 
          });
        } catch (err: any) {
          if (err.code === 4902) {
            await window.ethereum.request({ 
              method: 'wallet_addEthereumChain', 
              params: [BSC_TESTNET_PARAMS] 
            });
          } else {
            throw err;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      try {
        const lastRequestTime = await faucetContract.lastRequestTime(account);
        const cooldownPeriod = await faucetContract.cooldownPeriod();
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (lastRequestTime > 0n && (currentTime - Number(lastRequestTime)) < Number(cooldownPeriod)) {
          const remainingTime = Number(cooldownPeriod) - (currentTime - Number(lastRequestTime));
          const hours = Math.floor(remainingTime / 3600);
          const minutes = Math.floor((remainingTime % 3600) / 60);
          throw new Error(`Wait for cooldown. Try again in ${hours}h ${minutes}m`);
        }
      } catch (error: any) {
        console.log("Cooldown check result:", error.message);
      }
      
      setLoadingLabel('Requesting tokens from faucet');
      
      let tx;
      
      try {
        tx = await faucetContract.claimTokens({
          gasLimit: 200000 // FIX: Provide sufficient gas limit
        });
      } catch (error: any) {
        if (error.message.includes("claimTokens") || error.message.includes("function")) {
          tx = await faucetContract.requestTokens({
            gasLimit: 200000
          });
        } else {
          throw error;
        }
      }
      
      addLog('SWAP', 'Faucet request initiated', 'PENDING', tx.hash);
      
      const receipt = await tx.wait();
      
      if (!receipt || receipt.status === 0) {
        throw new Error("Transaction failed on-chain");
      }
      
      showToast("Success! 10,000 VEC tokens have been sent to your wallet.", "success");
      addLog('SWAP', '10,000 VEC tokens claimed from faucet', 'SUCCESS', tx.hash);
      
      await refreshData(account, provider);
      
    } catch (error: any) {
      console.error("Faucet request error:", error);
      
      let errorMessage = "Transaction failed";
      
      if (error.message.includes("Wait for cooldown")) {
        errorMessage = error.message;
      } else if (error.message.includes("reverted") || error.message.includes("reject")) {
        if (error.message.includes("Cooldown period")) {
          errorMessage = "Cooldown period not elapsed. Please wait before trying again.";
        } else if (error.message.includes("No tokens")) {
          errorMessage = "Faucet has insufficient tokens. Please try again later.";
        } else if (error.message.includes("Already claimed")) {
          errorMessage = "You have already claimed tokens recently.";
        } else {
          errorMessage = "Transaction rejected by contract. Please check if you're eligible.";
        }
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient BNB for gas fees. Please add BNB to your wallet.";
      } else if (error.code === 4001) {
        errorMessage = "Transaction rejected by user.";
      } else if (error.code === -32603) {
        errorMessage = "Internal JSON-RPC error. Please try again.";
      } else if (error.message.includes("network changed")) {
        errorMessage = "Network changed. Please ensure you're on BSC Testnet.";
      } else if (error.message) {
        const revertMatch = error.message.match(/revert\s*(.*)/);
        if (revertMatch && revertMatch[1]) {
          errorMessage = `Contract reverted: ${revertMatch[1]}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      setFaucetError(errorMessage);
      showToast(errorMessage, "error");
      addLog('SYSTEM', `Faucet error: ${errorMessage}`, 'ERROR');
      
    } finally {
      setFaucetLoading(false);
      setLoadingLabel('');
    }
  };

  const handleStake = async (amount: string, periodIndex: number) => {
    if (!provider || !account) return;
    if (stakeInfo.isActive) {
       showToast("Active Stake Node Detected", "error");
       return;
    }
    setLoading(true);
    setLoadingLabel('Broadcasting Node');
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const vecContract = new ethers.Contract(CONFIG.VEC_TOKEN_ADDRESS, ERC20_ABI, signer);
      const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const pAmt = ethers.parseUnits(amount, 18);
      const allowance = await vecContract.allowance(account, CONFIG.STAKING_CONTRACT_ADDRESS);
      if (allowance < pAmt) {
        setLoadingLabel('Authorizing VEC');
        const txA = await vecContract.approve(CONFIG.STAKING_CONTRACT_ADDRESS, ethers.MaxUint256);
        await txA.wait();
      }
      setLoadingLabel('Confirming Stake');
      const txS = await stakingContract.stake(pAmt, periodIndex, { gasLimit: 600000 });
      addLog('STAKE', 'Sequence broadcasted', 'PENDING', txS.hash);
      const receipt = await txS.wait();
      if (receipt.status === 0) throw new Error("Rejected.");
      showToast("VEC Secured Successfully", "success");
      addLog('STAKE', `${amount} VEC secured`, 'SUCCESS', txS.hash);
      await refreshData(account, provider);
    } catch (e: any) {
      showToast("Protocol Reverted", "error");
    } finally { setLoading(false); }
  };

  const handleUnstake = async () => {
    if (!provider || !account) return;
    setLoading(true);
    setLoadingLabel('Extracting Principal');
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.withdraw({ gasLimit: 600000 });
      addLog('UNSTAKE', 'Extraction initiated', 'PENDING', tx.hash);
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error("Reverted.");
      showToast("Vault Released", "success");
      addLog('UNSTAKE', `Extraction complete`, 'SUCCESS', tx.hash);
      await refreshData(account, provider);
    } catch (e: any) {
      showToast("Withdrawal failed", "error");
    } finally { setLoading(false); }
  };

  const handleClaim = async () => {
    if (!provider || !account) return;
    setLoading(true);
    setLoadingLabel('Harvesting Protocol');
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.claimRewards({ gasLimit: 500000 });
      addLog('CLAIM', 'Harvesting node', 'PENDING', tx.hash);
      await tx.wait();
      showToast("Harvest Secured", "success");
      addLog('CLAIM', 'Rewards collected', 'SUCCESS', tx.hash);
      await refreshData(account, provider);
    } catch (e: any) {
      showToast("Harvest error", "error");
    } finally { setLoading(false); }
  };

  const handleEmergency = async () => {
    if (!provider || !account) return;
    setLoading(true);
    setLoadingLabel('Protocol Override');
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.emergencyWithdraw({ gasLimit: 700000 });
      addLog('EMERGENCY', 'Override initiated', 'PENDING', tx.hash);
      await tx.wait();
      showToast("Emergency Exit Completed", "warning");
      await refreshData(account, provider);
    } catch (e: any) {
      showToast("Override failed", "error");
    } finally { setLoading(false); }
  };

  const detectInstalledWallets = () => {
    const installedWallets = [];
    
    if (window.ethereum) {
      installedWallets.push('metamask');
    }
    
    if (window.trustwallet) {
      installedWallets.push('trust');
    }
    
    if (window.coinbaseWalletExtension) {
      installedWallets.push('coinbase');
    }
    
    if (window.phantom?.ethereum) {
      installedWallets.push('phantom');
    }
    
    if (window.okxwallet) {
      installedWallets.push('okx');
    }
    
    return installedWallets;
  };

  return (
    <div className="min-h-screen bg-[#020203] text-white font-outfit selection:bg-primary/20 antialiased overflow-x-hidden">
      <Sidebar active={activeSection} setSection={setActiveSection} isOpen={isSidebarOpen} close={() => setIsSidebarOpen(false)} />
      
      <main className="md:ml-64 p-5 sm:p-10 lg:p-12 pt-20 md:pt-10 transition-all duration-500 relative">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-12">
          <div className="flex items-center gap-5">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden w-11 h-11 bg-surfaceLight/30 rounded-xl flex items-center justify-center border border-white/5 shadow-lg active:scale-90 transition-all"><i className="fas fa-bars-staggered text-primary"></i></button>
             <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white/90">
                  {activeSection === Section.DASHBOARD ? 'Neural Dashboard' : activeSection.toUpperCase()}
                </h2>
                <div className="flex items-center gap-3 mt-1.5">
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-success/5 rounded border border-success/10">
                      <div className="w-1 h-1 rounded-full bg-success animate-pulse"></div>
                      <span className="text-[8px] text-success font-bold uppercase tracking-widest">{account ? 'Linked' : 'Unlinked'}</span>
                   </div>
                   <p className="text-[8px] text-textMuted font-bold uppercase tracking-widest opacity-40">NODE: VEC-0X61-BSC</p>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
             {account ? (
               <div className="flex items-center gap-3.5 bg-surfaceLight/10 p-1.5 pr-4 rounded-xl border border-white/[0.03] shadow-xl backdrop-blur-xl group hover:border-primary/30 transition-all duration-300">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold border border-primary/10 text-[10px]">VC</div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-bold text-textMuted uppercase tracking-widest mb-0.5">Operator</span>
                    <span className="text-[11px] font-mono font-bold tracking-tight text-white/80">{fmtAddr(account)}</span>
                    {connectionMethod && (
                      <span className="text-[5px] font-bold text-primary uppercase tracking-widest mt-0.5 opacity-60">{connectionMethod}</span>
                    )}
                  </div>
                  <button onClick={() => { setAccount(null); setProvider(null); setConnectionMethod(''); showToast("Disconnected", "info"); }} className="ml-2 text-textMuted hover:text-error transition-all hover:scale-110"><i className="fas fa-power-off text-xs"></i></button>
               </div>
             ) : (
               <BrandButton onClick={() => setIsWalletModalOpen(true)} className="w-full sm:w-auto">Sync Module</BrandButton>
             )}
          </div>
        </header>

        <section className="max-w-6xl mx-auto pb-24">
          {activeSection === Section.DASHBOARD && (
            <DashboardView 
              balances={balances} 
              stats={stats} 
              logs={logs} 
              isConnected={!!account}
              onFaucetRequest={handleFaucetRequest}
              faucetLoading={faucetLoading}
              faucetError={faucetError}
            />
          )}
          {activeSection === Section.STAKE && <StakingView balances={balances} stakeInfo={stakeInfo} onStake={handleStake} onUnstake={handleUnstake} onClaim={handleClaim} onEmergency={handleEmergency} loading={loading} isConnected={!!account} />}
          
          {(activeSection === Section.SWAP || activeSection === Section.NFT || activeSection === Section.GOVERNANCE) && (
            <div className="text-center py-32 bg-surfaceLight/5 border-2 border-dashed border-white/5 rounded-3xl shadow-xl relative overflow-hidden group">
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-primary/20 text-2xl mx-auto mb-8 border border-white/5 group-hover:scale-105 transition-transform duration-500">
                  <i className={`fas ${activeSection === Section.SWAP ? 'fa-shuffle' : activeSection === Section.NFT ? 'fa-shield-halved' : 'fa-landmark'}`}></i>
               </div>
               <h3 className="text-xl font-bold uppercase tracking-widest italic text-white/60">Module Calibration</h3>
               <p className="text-textMuted text-[9px] mt-4 uppercase tracking-widest font-bold max-w-xs mx-auto opacity-40">System architecture undergoing scheduled maintenance for the next generation epoch.</p>
            </div>
          )}
        </section>

        {isConnectingMobile && mobileConnectionInfo && (
          <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <i className="fas fa-mobile-alt text-2xl text-primary"></i>
              </div>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-[0.4em] text-primary italic animate-pulse mb-4">
              Awaiting {mobileConnectionInfo.wallet}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-6 text-center max-w-md">
              Open {mobileConnectionInfo.wallet} app and approve the connection request
            </p>
            <div className="space-y-3 text-center">
              <p className="text-[8px] text-textMuted font-bold uppercase tracking-widest">Steps:</p>
              <ol className="text-[7px] text-white/60 space-y-1 list-decimal list-inside">
                <li>Open {mobileConnectionInfo.wallet} app</li>
                <li>Approve the connection popup</li>
                <li>Return to this window</li>
                <li>Connection will complete automatically</li>
              </ol>
            </div>
            <button 
              onClick={() => { setIsConnectingMobile(false); setMobileConnectionInfo(null); }}
              className="mt-8 px-6 py-2 bg-error/20 text-error border border-error/30 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-error hover:text-white transition-all"
            >
              Cancel Connection
            </button>
          </div>
        )}

        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-[180px] -z-10 pointer-events-none"></div>
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-secondary/[0.015] rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      </main>

      <IdentityModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
        onConnect={connectWallet} 
        loading={loading} 
        providers={discoveredProviders}
        isMobile={isMobile}
        mobileOS={mobileOS}
        installedWallets={detectInstalledWallets()}
      />
      <VELA_AI balances={balances} address={account} />
      <Toast {...toast} />
      <LoadingOverlay active={loading} label={loadingLabel} onCancel={() => setLoading(false)} />
    </div>
  );
}

const Sidebar: React.FC<{ active: Section; setSection: (s: Section) => void; isOpen: boolean; close: () => void }> = ({ active, setSection, isOpen, close }) => {
  const menuItems = [
    { id: Section.DASHBOARD, label: 'Dashboard', icon: 'fa-chart-line' },
    { id: Section.STAKE, label: 'Vault Staking', icon: 'fa-vault' },
    { id: Section.SWAP, label: 'Asset Swap', icon: 'fa-shuffle' },
    { id: Section.NFT, label: 'Vela Armory', icon: 'fa-shield-halved' },
    { id: Section.GOVERNANCE, label: 'Governance', icon: 'fa-landmark' },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] md:hidden animate-in fade-in duration-300" onClick={close} />}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-[#020203] border-r border-white/[0.03] z-[101] transition-all duration-300 ease-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6 pt-10">
          <div className="flex items-center gap-3.5 mb-14 px-2 group cursor-pointer">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-lg group-hover:rotate-6 transition-transform">
              <img src={LOGO_URL} className="w-5 h-5" alt="Logo" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter italic text-white">Vela<span className="text-primary">Core</span></h1>
              <span className="text-[7px] font-bold text-textMuted uppercase tracking-widest block opacity-50">Mainnet Handshake v1.5.5</span>
            </div>
          </div>
          <nav className="space-y-1.5 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSection(item.id); close(); }}
                className={`w-full group flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 relative ${active === item.id ? 'bg-primary/5 text-primary border border-primary/10' : 'text-textMuted hover:bg-white/[0.02] hover:text-white'}`}
              >
                <i className={`fas ${item.icon} text-sm opacity-80 transition-transform group-hover:scale-110`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                {active === item.id && <div className="absolute left-0 w-1 h-4 bg-primary rounded-full blur-[2px]"></div>}
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-8 border-t border-white/5 opacity-30">
             <p className="text-[7px] text-center text-textMuted font-bold uppercase tracking-widest">© 2025 VELACORE PROTOCOL</p>
          </div>
        </div>
      </aside>
    </>
  );
};

const IdentityModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConnect: (t: string, p?: any) => void; 
  loading: boolean; 
  providers: EIP6963ProviderDetail[];
  isMobile: boolean;
  mobileOS: 'ios' | 'android' | 'other';
  installedWallets?: string[];
}> = ({ isOpen, onClose, onConnect, loading, providers, isMobile, mobileOS, installedWallets = [] }) => {
  if (!isOpen) return null;
  
  const availableWallets = MOBILE_WALLETS.filter(wallet => {
    if (isMobile) {
      return true;
    } else {
      return wallet.id === 'metamask';
    }
  });

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/98 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#08090c] border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <h2 className="text-xl font-black uppercase tracking-widest mb-2 italic text-center text-white">ID Authentication</h2>
        <p className="text-[8px] text-textMuted font-bold text-center uppercase tracking-widest mb-8 opacity-60">
          {isMobile ? `Connect ${mobileOS.toUpperCase()} Wallet` : 'Authorize uplink with cryptographical identity'}
        </p>
        
        <div className="space-y-3 mb-6">
          <button 
            onClick={() => onConnect('metamask')} 
            disabled={loading}
            className="w-full flex items-center justify-between p-5 bg-primary/5 hover:bg-primary/10 rounded-2xl transition-all duration-200 group border border-primary/10 hover:border-primary/30 disabled:opacity-50"
          >
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg text-primary">
                  <i className="fab fa-ethereum"></i>
                </div>
                <div className="flex flex-col items-start">
                   <span className="font-bold text-[11px] uppercase tracking-widest text-white/90">MetaMask</span>
                   <span className="text-[6px] font-bold uppercase tracking-widest opacity-30 mt-0.5">
                     {isMobile ? 'Direct App Connection' : 'Browser Extension'}
                   </span>
                </div>
             </div>
             <i className="fas fa-chevron-right opacity-20 text-[10px] group-hover:opacity-100"></i>
          </button>
        </div>

        {isMobile && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-white/5"></div>
              <span className="text-[7px] font-bold uppercase tracking-widest text-white/30 px-2">Other Mobile Wallets</span>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {availableWallets
                .filter(wallet => wallet.id !== 'metamask')
                .map(wallet => (
                  <button 
                    key={wallet.id}
                    onClick={() => onConnect(wallet.id)} 
                    disabled={loading}
                    className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/5 hover:border-primary/20 disabled:opacity-50 group relative"
                    title={`Connect with ${wallet.name}`}
                  >
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-primary mb-2">
                      <i className={`${wallet.icon} text-sm`}></i>
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/80 truncate w-full text-center">{wallet.name}</span>
                    {isMobile && (
                      <span className="text-[5px] font-bold uppercase tracking-widest text-primary/50 mt-0.5">Tap to Connect</span>
                    )}
                    {installedWallets.includes(wallet.id) && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full border border-[#08090c]"></div>
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}

        {isMobile && (
          <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <p className="text-[7px] text-primary font-bold uppercase tracking-widest text-center mb-2">
              {mobileOS === 'ios' 
                ? 'iOS: Tap wallet → Open in App → Approve Connection' 
                : mobileOS === 'android'
                ? 'Android: Tap wallet → Open App → Approve Connection'
                : 'Tap wallet to open app and approve connection'
              }
            </p>
            <p className="text-[6px] text-textMuted text-center">
              Make sure to approve the connection popup in your wallet app
            </p>
          </div>
        )}

        {!isMobile && providers.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-white/5"></div>
              <span className="text-[7px] font-bold uppercase tracking-widest text-white/30 px-2">Detected Extensions</span>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>
            
            <div className="space-y-2">
              {providers.map(p => (
                <button 
                  key={p.info.uuid} 
                  onClick={() => onConnect(p.info.name, p.provider)} 
                  disabled={loading}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/5 hover:border-primary/20 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <img src={p.info.icon} className="w-7 h-7 rounded-lg" alt={p.info.name} />
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-[9px] uppercase tracking-widest text-white/90 truncate max-w-[120px]">{p.info.name}</span>
                      <span className="text-[5px] font-bold uppercase tracking-widest opacity-30 mt-0.5">EIP-6963</span>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right opacity-20 text-[8px]"></i>
                </button>
              ))}
            </div>
          </div>
        )}

        {!window.ethereum && !isMobile && (
          <div className="mt-6 p-4 bg-error/5 border border-error/10 rounded-xl">
            <p className="text-[8px] text-error font-bold uppercase tracking-widest text-center">
              MetaMask extension not detected. Install for best experience.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-[6px] text-textMuted font-bold uppercase tracking-widest text-center opacity-30">
            {isMobile 
              ? 'Select wallet for direct app connection' 
              : 'Select wallet to establish secure protocol connection'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

const VELA_AI: React.FC<{ balances: UserBalances; address: string | null }> = ({ balances, address }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{r: 'u'|'m', t: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [history, loading]);

  const askAI = async () => {
    if (!query || loading) return;
    const q = query; setQuery('');
    setHistory(p => [...p, {r: 'u', t: q}]);
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Operator Request: ${q}. Protocol Data: VEC ${balances.vec}, Staked ${balances.staked}, Rewards ${balances.rewards}.`,
        config: { systemInstruction: "You are VELA-CORE ADVISOR. Provide concise, technical DeFi strategy advice. Futuristic, professional tone. Technical context." }
      });
      setHistory(p => [...p, {r: 'm', t: res.text || 'Command returned null.'}]);
    } catch (e: any) { setHistory(p => [...p, {r: 'm', t: 'Neural sync failure.'}]); } finally { setLoading(false); }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[400] transition-all duration-400 ${isOpen ? 'w-[360px]' : 'w-14'}`}>
      {isOpen ? (
        <div className="bg-[#08090c]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden h-[480px] flex flex-col animate-in slide-in-from-bottom-2 duration-300">
           <div className="p-4 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-7 h-7 bg-primary/20 rounded-lg flex items-center justify-center text-primary text-xs shadow-lg"><i className="fas fa-microchip"></i></div>
                 <span className="font-black uppercase text-[9px] tracking-widest text-primary italic">Advisory Core</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-7 h-7 bg-white/5 rounded-lg text-textMuted hover:text-white transition-all"><i className="fas fa-times text-[10px]"></i></button>
           </div>
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar font-mono text-[10px] leading-relaxed bg-black/20">
              {history.length === 0 && <div className="h-full flex items-center justify-center opacity-10 font-black uppercase tracking-widest">Idle Unit</div>}
              {history.map((h, i) => (
                <div key={i} className={`flex ${h.r === 'u' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                  <div className={`max-w-[85%] p-3.5 rounded-xl border ${h.r === 'u' ? 'bg-primary/[0.03] text-primary border-primary/20' : 'bg-white/[0.03] text-white/80 border-white/10'}`}>
                    {h.t}
                  </div>
                </div>
              ))}
              {loading && <div className="text-primary animate-pulse text-[7px] font-black uppercase tracking-[0.4em] text-center"><i className="fas fa-spinner fa-spin"></i> Processing Neural Data...</div>}
           </div>
           <div className="p-4 bg-[#08090c] border-t border-white/5">
              <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 focus-within:border-primary/20 transition-all">
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="SYSTEM CMD..." className="bg-transparent flex-1 outline-none text-[9px] uppercase tracking-widest px-2 text-white font-mono placeholder:text-white/10" />
                <button onClick={askAI} className="w-8 h-8 bg-primary text-black rounded-lg flex items-center justify-center hover:scale-105 transition-transform"><i className="fas fa-arrow-up text-xs"></i></button>
              </div>
           </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-14 h-14 bg-primary text-black rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-300 active:scale-95 border-4 border-[#020203] group relative">
          <i className="fas fa-brain text-xl"></i>
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-[#020203]"></div>
        </button>
      )}
    </div>
  );
};

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info' | 'warning'; visible: boolean }> = ({ message, type, visible }) => {
  if (!visible) return null;
  const styles = { success: 'border-success text-success bg-success/5', error: 'border-error text-error bg-error/5', info: 'border-primary text-primary bg-primary/5', warning: 'border-secondary text-secondary bg-secondary/5' };
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-bottom-5 duration-400">
      <div className={`px-8 py-3.5 rounded-xl border backdrop-blur-2xl shadow-2xl flex items-center gap-4 ${styles[type]}`}>
        <span className="text-[10px] font-black uppercase tracking-widest italic text-white/90">{message}</span>
      </div>
    </div>
  );
};

const LoadingOverlay: React.FC<{ active: boolean; label: string; onCancel: () => void }> = ({ active, label, onCancel }) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-[2000] bg-[#020203]/98 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-500 animate-in fade-in">
      <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-primary/10 rounded-2xl animate-spin-slow"></div>
        <div className="absolute inset-1 border-2 border-primary border-t-transparent rounded-xl animate-spin"></div>
        <img src={LOGO_URL} className="w-8 h-8 animate-pulse" alt="Sync" />
      </div>
      <h3 className="text-xl font-black uppercase tracking-[0.4em] text-primary italic animate-pulse mb-3">{label}</h3>
      <p className="text-[8px] text-textMuted font-bold uppercase tracking-widest max-w-[200px] text-center leading-loose opacity-40">Synthesizing node data with BNB cluster infrastructure...</p>
    </div>
  );
};