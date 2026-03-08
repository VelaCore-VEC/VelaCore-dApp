import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { Section, UserBalances } from './types';
import { CONFIG, BSC_TESTNET_PARAMS, FLOW_TESTNET_PARAMS, CREDITCOIN_TESTNET_PARAMS, ERC20_ABI, STAKING_ABI } from './constants';
import { GlobalHeader } from './components/GlobalHeader';
import { HeroSection } from './components/HeroSection';
import { StakingCard } from './components/StakingCard';
import { WalletModal } from './components/WalletModal';
import { Toast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { AIAnalytics } from './components/AIAnalytics';
import { SwapPage } from './components/SwapPage';
import { NFTPage } from './components/NFTPage';
import { GovernancePage } from './components/GovernancePage';
import { BridgePage } from './components/BridgePage';

/**
 * =========================================================================
 * VELA-CORE PROTOCOL v1.3.0
 * BSC + Flow + CreditCoin — 3-Chain Support
 * =========================================================================
 */

// ── Chain Configurations ────────────────────────────────────────────────────

const SUPPORTED_CHAINS = [
  {
    id: 'bsc',
    name: 'BNB Testnet',
    chainId: 97,
    chainIdHex: '0x61',
    rpcUrl: process.env.REACT_APP_BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    explorerUrl: 'https://testnet.bscscan.com',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
  },
  {
    id: 'flow',
    name: 'Flow Testnet',
    chainId: 545,
    chainIdHex: '0x221',
    rpcUrl: process.env.REACT_APP_FLOW_RPC_URL || 'https://testnet.evm.nodes.onflow.org/',
    explorerUrl: 'https://evm-testnet.flowscan.io',
    nativeCurrency: { name: 'FLOW', symbol: 'FLOW', decimals: 18 },
  },
  {
    id: 'creditcoin',
    name: 'CreditCoin Testnet',
    chainId: 102019,
    chainIdHex: '0x18E83',
    rpcUrl: process.env.REACT_APP_CREDITCOIN_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network',
    explorerUrl: 'https://creditcoin-testnet.blockscout.com',
    nativeCurrency: { name: 'CTC', symbol: 'CTC', decimals: 18 },
  },
];

const CHAIN_CONFIGS = {
  bsc: {
    VEC_TOKEN_ADDRESS:        process.env.REACT_APP_BSC_TOKEN_ADDRESS   || '0x1D3516E449aC7f08F5773Dc8d984E1174420867a',
    STAKING_CONTRACT_ADDRESS: process.env.REACT_APP_BSC_STAKING_ADDRESS || '0x8c8A80E75D38d29A27770f90798DF479b294aC51',
    FAUCET_CONTRACT_ADDRESS:  process.env.REACT_APP_BSC_FAUCET_ADDRESS  || '0x9bfe0Be0C065487eBb0F66E24CDf8F9cf1D750Cf',
    CHAIN_PARAMS: BSC_TESTNET_PARAMS,
    EXPLORER_URL: 'https://testnet.bscscan.com',
    RPC_URL: process.env.REACT_APP_BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  },
  flow: {
    VEC_TOKEN_ADDRESS:        process.env.REACT_APP_FLOW_TOKEN_ADDRESS   || '0x82829a882AB09864c5f2D1DA7F3F6650bFE2ebb8',
    STAKING_CONTRACT_ADDRESS: process.env.REACT_APP_FLOW_STAKING_ADDRESS || '0xc75608EfEc43aC569EAB2b7DA8D1A23FE653e80B',
    FAUCET_CONTRACT_ADDRESS:  process.env.REACT_APP_FLOW_FAUCET_ADDRESS  || '0x3a7A83c2ebB7CF0B253E6334A1900A9308aa0e81',
    CHAIN_PARAMS: FLOW_TESTNET_PARAMS,
    EXPLORER_URL: 'https://evm-testnet.flowscan.io',
    RPC_URL: process.env.REACT_APP_FLOW_RPC_URL || 'https://testnet.evm.nodes.onflow.org/',
  },
  creditcoin: {
    VEC_TOKEN_ADDRESS:        process.env.REACT_APP_CREDITCOIN_TOKEN_ADDRESS   || '0x82829a882AB09864c5f2D1DA7F3F6650bFE2ebb8',
    STAKING_CONTRACT_ADDRESS: process.env.REACT_APP_CREDITCOIN_STAKING_ADDRESS || '0xc75608EfEc43aC569EAB2b7DA8D1A23FE653e80B',
    FAUCET_CONTRACT_ADDRESS:  '',  // Not deployed yet
    CHAIN_PARAMS: CREDITCOIN_TESTNET_PARAMS,
    EXPLORER_URL: 'https://creditcoin-testnet.blockscout.com',
    RPC_URL: process.env.REACT_APP_CREDITCOIN_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network',
  },
};

// ── Gemini AI ───────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// ── Wallet Types ────────────────────────────────────────────────────────────

interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  isInstalled: () => boolean;
  getProvider: () => any;
  downloadUrl?: string;
  priority: number;
}

declare global {
  interface Window {
    ethereum?: any;
    trustwallet?: any;
    coinbaseWalletExtension?: any;
    BinanceChain?: any;
    casperlabsHelper?: any;
    phantom?: any;
    solana?: any;
  }
}

// ── WalletConnect ────────────────────────────────────────────────────────────

let walletConnectConnector: any = null;

const initWalletConnect = () => {
  if (walletConnectConnector) return walletConnectConnector;
  try {
    const WalletConnect = require('@walletconnect/client').default;
    const QRCodeModal   = require('@walletconnect/qrcode-modal').default;
    walletConnectConnector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: QRCodeModal,
      clientMeta: { description: 'VelaCore Protocol', url: 'https://velacore.io', icons: [], name: 'VelaCore' },
    });
  } catch (e) {
    console.warn('WalletConnect not installed. Run: npm install @walletconnect/client @walletconnect/qrcode-modal');
  }
  return walletConnectConnector;
};

// ── Wallet Detection ──────────────────────────────────────────────────────────

const detectAllWallets = (): WalletProvider[] => {
  const wallets: WalletProvider[] = [];
  const ethereum = window.ethereum;

  // WalletConnect
  wallets.push({
    id: 'walletconnect', name: 'WalletConnect', icon: 'fas fa-qrcode',
    color: 'from-blue-400 to-indigo-500', priority: 100,
    isInstalled: () => true, getProvider: () => initWalletConnect(),
    downloadUrl: 'https://walletconnect.com/',
  });

  // MetaMask
  let metamaskProvider: any = null;
  if (ethereum?.providers)
    metamaskProvider = ethereum.providers.find((p: any) => p.isMetaMask === true && p.isTrust !== true && p.isCoinbaseWallet !== true);
  if (!metamaskProvider && Array.isArray(ethereum))
    metamaskProvider = ethereum.find((p: any) => p.isMetaMask === true && p.isTrust !== true && p.isCoinbaseWallet !== true);
  if (!metamaskProvider && ethereum?.isMetaMask === true) metamaskProvider = ethereum;
  if (metamaskProvider) wallets.push({
    id: 'metamask', name: 'MetaMask', icon: 'fab fa-ethereum',
    color: 'from-orange-500 to-yellow-500', priority: 90,
    isInstalled: () => true, getProvider: () => metamaskProvider,
    downloadUrl: 'https://metamask.io/download/',
  });

  // Trust Wallet
  let trustProvider: any = window.trustwallet || (ethereum?.isTrust === true ? ethereum : null)
    || ethereum?.providers?.find((p: any) => p.isTrust === true);
  if (trustProvider) wallets.push({
    id: 'trustwallet', name: 'Trust Wallet', icon: 'fas fa-wallet',
    color: 'from-blue-500 to-cyan-500', priority: 80,
    isInstalled: () => true, getProvider: () => trustProvider,
    downloadUrl: 'https://trustwallet.com/download',
  });

  // Coinbase
  let coinbaseProvider: any = window.coinbaseWalletExtension || (ethereum?.isCoinbaseWallet === true ? ethereum : null);
  if (coinbaseProvider) wallets.push({
    id: 'coinbase', name: 'Coinbase Wallet', icon: 'fab fa-bitcoin',
    color: 'from-blue-600 to-indigo-600', priority: 70,
    isInstalled: () => true, getProvider: () => coinbaseProvider,
    downloadUrl: 'https://www.coinbase.com/wallet/downloads',
  });

  // Binance
  if (window.BinanceChain) wallets.push({
    id: 'binance', name: 'Binance Wallet', icon: 'fab fa-btc',
    color: 'from-yellow-500 to-orange-500', priority: 60,
    isInstalled: () => true, getProvider: () => window.BinanceChain,
    downloadUrl: 'https://www.binance.org/wallet',
  });

  // Casper
  if (window.casperlabsHelper) wallets.push({
    id: 'casper', name: 'Casper Wallet', icon: 'fas fa-gem',
    color: 'from-purple-600 to-pink-600', priority: 50,
    isInstalled: () => true, getProvider: () => window.casperlabsHelper,
    downloadUrl: 'https://www.casperwallet.io/',
  });

  // Phantom
  if (window.phantom || window.solana?.isPhantom) wallets.push({
    id: 'phantom', name: 'Phantom', icon: 'fas fa-ghost',
    color: 'from-purple-500 to-violet-500', priority: 40,
    isInstalled: () => true, getProvider: () => window.phantom || window.solana,
    downloadUrl: 'https://phantom.app/download',
  });

  // Generic
  if (ethereum && !Array.isArray(ethereum) && !metamaskProvider && !trustProvider && !coinbaseProvider) {
    wallets.push({
      id: 'generic', name: 'Browser Wallet', icon: 'fas fa-globe',
      color: 'from-green-500 to-teal-500', priority: 10,
      isInstalled: () => true, getProvider: () => ethereum,
      downloadUrl: 'https://ethereum.org/en/wallets/find-wallet/',
    });
  }

  return wallets.sort((a, b) => b.priority - a.priority);
};

const quickConnect = async (): Promise<{ account: string; provider: any; walletId: string } | null> => {
  try {
    const lastConnectedWallet = localStorage.getItem('velacore_lastConnectedWallet');
    if (!lastConnectedWallet) return null;
    const wallets  = detectAllWallets();
    const wallet   = wallets.find(w => w.id === lastConnectedWallet);
    if (wallet?.isInstalled()) {
      const prov = wallet.getProvider();
      if (wallet.id === 'walletconnect') {
        if (prov?.connected && prov.accounts?.length > 0) return { account: prov.accounts[0], provider: prov, walletId: wallet.id };
      } else {
        try {
          const accounts = await prov.request({ method: 'eth_accounts' });
          if (accounts?.length > 0) return { account: accounts[0], provider: prov, walletId: wallet.id };
        } catch { }
      }
    }
    return null;
  } catch { return null; }
};

// ── Default shapes ─────────────────────────────────────────────────────────────

const emptyBal: UserBalances = { native: '0.0000', vec: '0', staked: '0', rewards: '0.0000' };
const emptyStake = {
  stakedAmount: '0', pendingReward: '0.0000', projectedAPY: '0%',
  isActive: false, unlockTime: 0, lockupPeriod: 0, canWithdraw: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>(Section.DASHBOARD);
  const [account,       setAccount]       = useState<string | null>(null);
  const [provider,      setProvider]      = useState<any>(null);
  const [currentChain,  setCurrentChain]  = useState(SUPPORTED_CHAINS[0]);

  // ── Per-chain balances ─────────────────────────────────────────────────────
  const [bscBalances,        setBscBalances]        = useState<UserBalances>({ ...emptyBal });
  const [flowBalances,       setFlowBalances]       = useState<UserBalances>({ ...emptyBal });
  const [creditcoinBalances, setCreditcoinBalances] = useState<UserBalances>({ ...emptyBal });

  // ── Per-chain stake info ───────────────────────────────────────────────────
  const [bscStakeInfo,        setBscStakeInfo]        = useState({ ...emptyStake });
  const [flowStakeInfo,       setFlowStakeInfo]       = useState({ ...emptyStake });
  const [creditcoinStakeInfo, setCreditcoinStakeInfo] = useState({ ...emptyStake });

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [loading,           setLoading]           = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ message: '', type: 'info', visible: false });
  const [isMobileMenuOpen,  setIsMobileMenuOpen]  = useState(false);
  const [isChatOpen,        setIsChatOpen]        = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: "Hello! I'm VelaCore AI Assistant. Ask me about staking, APY, or protocol features.", isUser: false },
  ]);
  const [aiInput,           setAiInput]           = useState('');
  const [aiLoading,         setAiLoading]         = useState(false);
  const [detectedWallets,   setDetectedWallets]   = useState<WalletProvider[]>([]);
  const [connectedWalletId, setConnectedWalletId] = useState<string | null>(null);

  const chatContainerRef    = useRef<HTMLDivElement>(null);
  const connectionAttempted = useRef(false);

  // ── Accessors ──────────────────────────────────────────────────────────────

  const getCurrentBalances = () => {
    if (currentChain.id === 'flow')       return flowBalances;
    if (currentChain.id === 'creditcoin') return creditcoinBalances;
    return bscBalances;
  };

  const getCurrentStakeInfo = () => {
    if (currentChain.id === 'flow')       return flowStakeInfo;
    if (currentChain.id === 'creditcoin') return creditcoinStakeInfo;
    return bscStakeInfo;
  };

  const getChainConfig = (chainId: string) =>
    CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS] || CHAIN_CONFIGS.bsc;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
  }, []);

  // ── Provider priority fix ──────────────────────────────────────────────────

  useEffect(() => {
    try {
      if (window.ethereum?.providers) {
        const providers   = window.ethereum.providers;
        const mmIdx       = providers.findIndex((p: any) => p.isMetaMask === true);
        const twIdx       = providers.findIndex((p: any) => p.isTrust === true);
        if (mmIdx > twIdx && mmIdx !== -1 && twIdx !== -1)
          [providers[mmIdx], providers[twIdx]] = [providers[twIdx], providers[mmIdx]];
      }
    } catch { }
    setDetectedWallets(detectAllWallets());
  }, []);

  // ── Auto-connect ───────────────────────────────────────────────────────────

  useEffect(() => {
    const autoConnect = async () => {
      if (connectionAttempted.current) return;
      try {
        const result = await quickConnect();
        if (result) {
          setAccount(result.account);
          setProvider(result.provider);
          setConnectedWalletId(result.walletId);
          await refreshAllChainData(result.account, result.provider);
          showToast('Auto-connected', 'success');
        }
      } catch { } finally { connectionAttempted.current = true; }
    };
    autoConnect();
  }, []);

  // ── Wallet events ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!provider) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnectWallet();
      else if (account !== accounts[0]) {
        setAccount(accounts[0]);
        refreshAllChainData(accounts[0], provider);
        showToast('Account changed', 'info');
      }
    };
    const handleChainChanged = () => window.location.reload();
    const handleDisconnect   = () => disconnectWallet();
    if (provider.on) {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged',    handleChainChanged);
      provider.on('disconnect',      handleDisconnect);
    }
    return () => {
      if (provider.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged',    handleChainChanged);
        provider.removeListener('disconnect',      handleDisconnect);
      }
    };
  }, [provider, account]);

  // ── Ethereum changed ───────────────────────────────────────────────────────

  useEffect(() => {
    const handleEthereumChanged = () => setDetectedWallets(detectAllWallets());
    window.ethereum?.on?.('connect',    handleEthereumChanged);
    window.ethereum?.on?.('disconnect', handleEthereumChanged);
    return () => {
      window.ethereum?.removeListener?.('connect',    handleEthereumChanged);
      window.ethereum?.removeListener?.('disconnect', handleEthereumChanged);
    };
  }, []);

  // ── Chat scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [chatMessages]);

  // ── Gemini AI ──────────────────────────────────────────────────────────────

  const sendToGeminiAI = async (message: string) => {
    if (!message.trim()) return;
    setAiLoading(true);
    setChatMessages(prev => [...prev, { text: message, isUser: true }]);
    setAiInput('');
    try {
      const currentBalances = getCurrentBalances();
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are VelaCore AI. Network: ${currentChain.name}. VEC: ${currentBalances.vec}, Staked: ${currentBalances.staked}. Question: ${message} Keep response under 3 sentences.`,
            }],
          }],
        }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
        || "I apologize, but I couldn't generate a response at the moment.";
      setChatMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
    } catch {
      setChatMessages(prev => [...prev, { text: "I'm experiencing connection issues. Please try again later.", isUser: false }]);
    } finally { setAiLoading(false); }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH ALL 3 CHAINS
  // ═══════════════════════════════════════════════════════════════════════════

  const refreshAllChainData = useCallback(async (currentAccount: string, _walletProvider: any) => {
    try {
      const decimals = 18;

      // Independent RPC providers for each chain
      const bscRpcProv = new ethers.JsonRpcProvider(SUPPORTED_CHAINS[0].rpcUrl);
      const flowRpcProv = new ethers.JsonRpcProvider(SUPPORTED_CHAINS[1].rpcUrl);
      const ctcRpcProv  = new ethers.JsonRpcProvider(SUPPORTED_CHAINS[2].rpcUrl);

      const bscCfg  = CHAIN_CONFIGS.bsc;
      const flowCfg = CHAIN_CONFIGS.flow;
      const ctcCfg  = CHAIN_CONFIGS.creditcoin;

      console.log('Refreshing BSC, Flow & CreditCoin for:', currentAccount);

      // Fetch all 3 chains in parallel
      const [
        bscNative, bscVec, bscStake,
        flowNative, flowVec, flowStake,
        ctcNative, ctcVec, ctcStake,
      ] = await Promise.allSettled([
        // BSC
        bscRpcProv.getBalance(currentAccount).catch(() => 0n),
        new ethers.Contract(bscCfg.VEC_TOKEN_ADDRESS, ERC20_ABI, bscRpcProv).balanceOf(currentAccount).catch(() => 0n),
        new ethers.Contract(bscCfg.STAKING_CONTRACT_ADDRESS, STAKING_ABI, bscRpcProv).getUserStakeInfo(currentAccount).catch(() => [0n,0n,0n,0n,0n,0n,0n,0,0n,false,false]),
        // Flow
        flowRpcProv.getBalance(currentAccount).catch(() => 0n),
        new ethers.Contract(flowCfg.VEC_TOKEN_ADDRESS, ERC20_ABI, flowRpcProv).balanceOf(currentAccount).catch(() => 0n),
        new ethers.Contract(flowCfg.STAKING_CONTRACT_ADDRESS, STAKING_ABI, flowRpcProv).getUserStakeInfo(currentAccount).catch(() => [0n,0n,0n,0n,0n,0n,0n,0,0n,false,false]),
        // CreditCoin
        ctcRpcProv.getBalance(currentAccount).catch(() => 0n),
        new ethers.Contract(ctcCfg.VEC_TOKEN_ADDRESS, ERC20_ABI, ctcRpcProv).balanceOf(currentAccount).catch(() => 0n),
        new ethers.Contract(ctcCfg.STAKING_CONTRACT_ADDRESS, STAKING_ABI, ctcRpcProv).getUserStakeInfo(currentAccount).catch(() => [0n,0n,0n,0n,0n,0n,0n,0,0n,false,false]),
      ]);

      const now = Math.floor(Date.now() / 1000);

      // ── BSC ─────────────────────────────────────────────────────────────────
      const bscNatBig = bscNative.status === 'fulfilled' ? bscNative.value as bigint : 0n;
      const bscVecBig = bscVec.status   === 'fulfilled' ? bscVec.value   as bigint : 0n;
      const bscSd     = bscStake.status === 'fulfilled' ? bscStake.value as any[]  : [0n,0n,0n,0n,0n,0n,0n,0,0n,false,false];
      setBscBalances({
        native:  parseFloat(ethers.formatUnits(bscNatBig, decimals)).toFixed(4),
        vec:     parseFloat(ethers.formatUnits(bscVecBig, decimals)).toFixed(2),
        staked:  parseFloat(ethers.formatUnits(bscSd[0]||0n, decimals)).toFixed(2),
        rewards: parseFloat(ethers.formatUnits(bscSd[1]||0n, decimals)).toFixed(4),
      });
      setBscStakeInfo({
        stakedAmount:  parseFloat(ethers.formatUnits(bscSd[0]||0n, decimals)).toFixed(2),
        pendingReward: parseFloat(ethers.formatUnits(bscSd[1]||0n, decimals)).toFixed(4),
        projectedAPY:  bscSd[8] > 0n ? (Number(bscSd[8])/100).toFixed(2)+'%' : '0%',
        isActive:      Boolean(bscSd[9]),
        unlockTime:    Number(bscSd[3]||0),
        lockupPeriod:  Number(bscSd[7]||0),
        canWithdraw:   Boolean(bscSd[10]) || (Number(bscSd[3]||0) > 0 && now >= Number(bscSd[3]||0)),
      });
      console.log('BSC balances:', { native: ethers.formatUnits(bscNatBig, decimals), vec: ethers.formatUnits(bscVecBig, decimals) });

      // ── Flow ─────────────────────────────────────────────────────────────────
      const flowNatBig = flowNative.status === 'fulfilled' ? flowNative.value as bigint : 0n;
      const flowVecBig = flowVec.status   === 'fulfilled' ? flowVec.value   as bigint : 0n;
      const flowSd     = flowStake.status === 'fulfilled' ? flowStake.value as any[]  : [0n,0n,0n,0n,0n,0n,0n,0,0n,false,false];
      setFlowBalances({
        native:  parseFloat(ethers.formatUnits(flowNatBig, decimals)).toFixed(4),
        vec:     parseFloat(ethers.formatUnits(flowVecBig, decimals)).toFixed(2),
        staked:  parseFloat(ethers.formatUnits(flowSd[0]||0n, decimals)).toFixed(2),
        rewards: parseFloat(ethers.formatUnits(flowSd[1]||0n, decimals)).toFixed(4),
      });
      setFlowStakeInfo({
        stakedAmount:  parseFloat(ethers.formatUnits(flowSd[0]||0n, decimals)).toFixed(2),
        pendingReward: parseFloat(ethers.formatUnits(flowSd[1]||0n, decimals)).toFixed(4),
        projectedAPY:  flowSd[8] > 0n ? (Number(flowSd[8])/100).toFixed(2)+'%' : '0%',
        isActive:      Boolean(flowSd[9]),
        unlockTime:    Number(flowSd[3]||0),
        lockupPeriod:  Number(flowSd[7]||0),
        canWithdraw:   Boolean(flowSd[10]) || (Number(flowSd[3]||0) > 0 && now >= Number(flowSd[3]||0)),
      });
      console.log('Flow balances:', { native: ethers.formatUnits(flowNatBig, decimals), vec: ethers.formatUnits(flowVecBig, decimals) });

      // ── CreditCoin ────────────────────────────────────────────────────────────
      const ctcNatBig = ctcNative.status === 'fulfilled' ? ctcNative.value as bigint : 0n;
      const ctcVecBig = ctcVec.status   === 'fulfilled' ? ctcVec.value   as bigint : 0n;
      const ctcSd     = ctcStake.status === 'fulfilled' ? ctcStake.value as any[]  : [0n,0n,0n,0n,0n,0n,0n,0,0n,false,false];
      setCreditcoinBalances({
        native:  parseFloat(ethers.formatUnits(ctcNatBig, decimals)).toFixed(4),
        vec:     parseFloat(ethers.formatUnits(ctcVecBig, decimals)).toFixed(2),
        staked:  parseFloat(ethers.formatUnits(ctcSd[0]||0n, decimals)).toFixed(2),
        rewards: parseFloat(ethers.formatUnits(ctcSd[1]||0n, decimals)).toFixed(4),
      });
      setCreditcoinStakeInfo({
        stakedAmount:  parseFloat(ethers.formatUnits(ctcSd[0]||0n, decimals)).toFixed(2),
        pendingReward: parseFloat(ethers.formatUnits(ctcSd[1]||0n, decimals)).toFixed(4),
        projectedAPY:  ctcSd[8] > 0n ? (Number(ctcSd[8])/100).toFixed(2)+'%' : '0%',
        isActive:      Boolean(ctcSd[9]),
        unlockTime:    Number(ctcSd[3]||0),
        lockupPeriod:  Number(ctcSd[7]||0),
        canWithdraw:   Boolean(ctcSd[10]) || (Number(ctcSd[3]||0) > 0 && now >= Number(ctcSd[3]||0)),
      });
      console.log('CreditCoin balances:', { native: ethers.formatUnits(ctcNatBig, decimals), vec: ethers.formatUnits(ctcVecBig, decimals) });

    } catch (error) { console.error('refreshAllChainData error:', error); }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECT WALLET
  // ═══════════════════════════════════════════════════════════════════════════

  const connectWallet = async (walletId: string) => {
    setLoading(true);
    try {
      const wallets = detectAllWallets();
      const wallet  = wallets.find(w => w.id === walletId);
      if (!wallet) throw new Error(`${walletId} wallet not found`);

      // ── WalletConnect ────────────────────────────────────────────────────────
      if (walletId === 'walletconnect') {
        const connector = initWalletConnect();
        if (!connector) throw new Error('WalletConnect libraries not installed. Run: npm install @walletconnect/client @walletconnect/qrcode-modal');
        if (!connector.connected) await connector.createSession();
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('WalletConnect timeout')), 60000);
          connector.on('connect', async (error: any, payload: any) => {
            clearTimeout(timeout);
            if (error) { reject(error); return; }
            const { accounts } = payload.params[0];
            setAccount(accounts[0]); setProvider(connector); setConnectedWalletId('walletconnect');
            localStorage.setItem('velacore_lastConnectedWallet', 'walletconnect');
            setIsWalletModalOpen(false);
            showToast('Connected via WalletConnect', 'success');
            await refreshAllChainData(accounts[0], connector);
            setLoading(false); resolve(true);
          });
        });
      }

      // ── MetaMask ──────────────────────────────────────────────────────────────
      if (walletId === 'metamask') {
        let exactProvider: any = null;
        if (window.ethereum?.providers)
          exactProvider = window.ethereum.providers.find((p: any) => p.isMetaMask === true && p.isTrust !== true && p.isCoinbaseWallet !== true);
        if (!exactProvider && Array.isArray(window.ethereum))
          exactProvider = window.ethereum.find((p: any) => p.isMetaMask === true && p.isTrust !== true && p.isCoinbaseWallet !== true);
        if (!exactProvider && window.ethereum?.isMetaMask === true) exactProvider = window.ethereum;
        if (!exactProvider) throw new Error('MetaMask not detected. Please install MetaMask.');
        try {
          const accounts = await exactProvider.request({ method: 'eth_requestAccounts' });
          if (!accounts?.length) throw new Error('No accounts received');
          setAccount(accounts[0]); setProvider(exactProvider); setConnectedWalletId('metamask');
          localStorage.setItem('velacore_lastConnectedWallet', 'metamask');
          setIsWalletModalOpen(false);
          showToast('Connected to MetaMask', 'success');
          await refreshAllChainData(accounts[0], exactProvider);
        } catch (e: any) { if (e.code === 4001) throw new Error('Connection rejected'); throw e; }
        return;
      }

      // ── Trust Wallet ──────────────────────────────────────────────────────────
      if (walletId === 'trustwallet') {
        let exactProvider: any = window.trustwallet || (window.ethereum?.isTrust === true ? window.ethereum : null)
          || window.ethereum?.providers?.find((p: any) => p.isTrust === true);
        if (!exactProvider) throw new Error('Trust Wallet not detected');
        const accounts = await exactProvider.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]); setProvider(exactProvider); setConnectedWalletId('trustwallet');
        localStorage.setItem('velacore_lastConnectedWallet', 'trustwallet');
        setIsWalletModalOpen(false);
        showToast('Connected to Trust Wallet', 'success');
        await refreshAllChainData(accounts[0], exactProvider);
        return;
      }

      // ── Coinbase ──────────────────────────────────────────────────────────────
      if (walletId === 'coinbase') {
        let exactProvider: any = window.coinbaseWalletExtension || (window.ethereum?.isCoinbaseWallet === true ? window.ethereum : null);
        if (!exactProvider) throw new Error('Coinbase Wallet not detected');
        const accounts = await exactProvider.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]); setProvider(exactProvider); setConnectedWalletId('coinbase');
        localStorage.setItem('velacore_lastConnectedWallet', 'coinbase');
        setIsWalletModalOpen(false);
        showToast('Connected to Coinbase Wallet', 'success');
        await refreshAllChainData(accounts[0], exactProvider);
        return;
      }

      // ── Binance ────────────────────────────────────────────────────────────────
      if (walletId === 'binance') {
        if (!window.BinanceChain) throw new Error('Binance Wallet not detected');
        const accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]); setProvider(window.BinanceChain); setConnectedWalletId('binance');
        localStorage.setItem('velacore_lastConnectedWallet', 'binance');
        setIsWalletModalOpen(false);
        showToast('Connected to Binance Wallet', 'success');
        await refreshAllChainData(accounts[0], window.BinanceChain);
        return;
      }

      // ── Casper ────────────────────────────────────────────────────────────────
      if (walletId === 'casper') {
        if (!window.casperlabsHelper) throw new Error('Casper Wallet not detected');
        const accounts = await window.casperlabsHelper.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]); setProvider(window.casperlabsHelper); setConnectedWalletId('casper');
        localStorage.setItem('velacore_lastConnectedWallet', 'casper');
        setIsWalletModalOpen(false);
        showToast('Connected to Casper Wallet', 'success');
        return;
      }

      // ── Phantom ────────────────────────────────────────────────────────────────
      if (walletId === 'phantom') {
        const prov = window.phantom || window.solana;
        if (!prov) throw new Error('Phantom Wallet not detected');
        const accounts = await prov.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]); setProvider(prov); setConnectedWalletId('phantom');
        localStorage.setItem('velacore_lastConnectedWallet', 'phantom');
        setIsWalletModalOpen(false);
        showToast('Connected to Phantom Wallet', 'success');
        await refreshAllChainData(accounts[0], prov);
        return;
      }

      // ── Generic ────────────────────────────────────────────────────────────────
      const prov    = wallet.getProvider();
      const accounts = await prov.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]); setProvider(prov); setConnectedWalletId(walletId);
      localStorage.setItem('velacore_lastConnectedWallet', walletId);
      setIsWalletModalOpen(false);
      showToast(`Connected to ${wallet.name}`, 'success');
      await refreshAllChainData(accounts[0], prov);

    } catch (error: any) {
      const msg = error.code === 4001 ? 'Connection rejected by user'
        : error.message?.includes('timeout') ? 'Connection timeout'
        : (error.message || 'Connection failed');
      showToast(msg, 'error');
    } finally { setLoading(false); }
  };

  // ── Disconnect ─────────────────────────────────────────────────────────────

  const disconnectWallet = () => {
    setAccount(null); setProvider(null); setConnectedWalletId(null);
    setBscBalances({ ...emptyBal });        setFlowBalances({ ...emptyBal });        setCreditcoinBalances({ ...emptyBal });
    setBscStakeInfo({ ...emptyStake });     setFlowStakeInfo({ ...emptyStake });     setCreditcoinStakeInfo({ ...emptyStake });
    localStorage.removeItem('velacore_lastConnectedWallet');
    showToast('Wallet disconnected', 'info');
  };

  // ── Switch Network ─────────────────────────────────────────────────────────

  const switchNetwork = async (chainId: string) => {
    if (!provider) { showToast('Please connect wallet first', 'error'); return; }
    if (currentChain.id === chainId) return;
    setLoading(true);
    try {
      const targetChain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      if (!targetChain) throw new Error('Chain not supported');
      const cfg = getChainConfig(chainId);
      try {
        await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetChain.chainIdHex }] });
      } catch (switchError: any) {
        if (switchError.code === 4902)
          await provider.request({ method: 'wallet_addEthereumChain', params: [cfg.CHAIN_PARAMS] });
        else throw switchError;
      }
      setCurrentChain(targetChain);
      showToast(`Switched to ${targetChain.name}`, 'success');
    } catch (error: any) { showToast(`Failed to switch: ${error.message}`, 'error'); }
    finally { setLoading(false); }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STAKING FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════


  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATE CHAIN — har transaction se pehle wallet sahi chain pe switch karo
  // ═══════════════════════════════════════════════════════════════════════════

  const validateChain = async (): Promise<boolean> => {
    if (!provider) { showToast('Please connect wallet first', 'error'); return false; }
    try {
      const walletChainIdRaw = await provider.request({ method: 'eth_chainId' });
      const walletHex = (walletChainIdRaw as string).toLowerCase();
      const targetHex = currentChain.chainIdHex.toLowerCase();

      // Already on correct chain
      if (walletHex === targetHex) return true;

      showToast(`Switching to ${currentChain.name}...`, 'info');
      const cfg = getChainConfig(currentChain.id);

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: currentChain.chainIdHex }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [cfg.CHAIN_PARAMS],
            });
          } catch (addErr: any) {
            if (
              addErr.message?.includes('same RPC endpoint') ||
              addErr.message?.includes('already exists') ||
              addErr.code === -32603
            ) {
              try {
                await provider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: currentChain.chainIdHex }],
                });
              } catch { /* ignore */ }
            } else {
              showToast(`Could not add ${currentChain.name}: ${addErr.message}`, 'error');
              return false;
            }
          }
        } else if (switchErr.code === 4001) {
          showToast('Network switch rejected by user', 'error');
          return false;
        } else {
          showToast(`Please switch to ${currentChain.name} in your wallet`, 'error');
          return false;
        }
      }

      // Switch ke baad 1.5s wait karo — chainId verify nahi karte
      // kyunki MetaMask different chainId se register kar sakta hai same network ko
      await new Promise(r => setTimeout(r, 1500));
      showToast(`Switched to ${currentChain.name} ✓`, 'success');
      return true;
    } catch (e: any) {
      showToast(`Network error: ${e.message}`, 'error');
      return false;
    }
  };

  const handleStake = async (amount: string, lockPeriod: number) => {
    if (!provider || !account) { showToast('Please connect wallet first', 'error'); return; }
    if (!(await validateChain())) return;
    const currentStakeInfo = getCurrentStakeInfo();
    const currentBalances  = getCurrentBalances();
    if (currentStakeInfo.isActive) { showToast('You already have an active stake on this chain', 'error'); return; }
    if (parseFloat(amount) <= 0)   { showToast('Please enter a valid amount', 'error'); return; }
    if (parseFloat(amount) > parseFloat(currentBalances.vec)) { showToast('Insufficient balance', 'error'); return; }

    setLoading(true);
    try {
      const cfg             = getChainConfig(currentChain.id);
      // Fresh provider banao switch ke baad — purana cached state avoid karo
      const browserProvider = new ethers.BrowserProvider(provider, "any");

      const signer          = await browserProvider.getSigner();
      const amountWei       = ethers.parseUnits(amount, 18);

      console.log(`Staking on ${currentChain.id}`, { token: cfg.VEC_TOKEN_ADDRESS, staking: cfg.STAKING_CONTRACT_ADDRESS, amount, lockPeriod });

      const vecContract = new ethers.Contract(cfg.VEC_TOKEN_ADDRESS, ERC20_ABI, signer);
      const approveTx   = await vecContract.approve(cfg.STAKING_CONTRACT_ADDRESS, amountWei);
      await approveTx.wait();

      const stakingContract = new ethers.Contract(cfg.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const stakeTx         = await stakingContract.stake(amountWei, lockPeriod);
      await stakeTx.wait();

      showToast('Staked successfully!', 'success');
      await refreshAllChainData(account, provider);
    } catch (error: any) { console.error('Stake error:', error); showToast(error.message || 'Staking failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleUnstake = async () => {
    if (!provider || !account) { showToast('Please connect wallet first', 'error'); return; }
    if (!(await validateChain())) return;
    const currentStakeInfo = getCurrentStakeInfo();
    if (!currentStakeInfo.isActive) { showToast('No active stake on this chain', 'error'); return; }
    if (!currentStakeInfo.canWithdraw) {
      const remaining = currentStakeInfo.unlockTime - Math.floor(Date.now() / 1000);
      if (remaining > 0) {
        showToast(`Cannot unstake yet. Lock ends in ${Math.floor(remaining/86400)}d ${Math.floor((remaining%86400)/3600)}h`, 'error');
        return;
      }
    }
    setLoading(true);
    try {
      const cfg             = getChainConfig(currentChain.id);
      const browserProvider = new ethers.BrowserProvider(provider, "any");

      const signer          = await browserProvider.getSigner();
      console.log(`Unstaking on ${currentChain.id}`, { staking: cfg.STAKING_CONTRACT_ADDRESS });
      const stakingContract = new ethers.Contract(cfg.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.withdraw();
      await tx.wait();
      showToast('Unstaked successfully!', 'success');
      await refreshAllChainData(account, provider);
    } catch (error: any) { console.error('Unstake error:', error); showToast(error.message || 'Unstaking failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleClaim = async () => {
    if (!provider || !account) { showToast('Please connect wallet first', 'error'); return; }
    if (!(await validateChain())) return;
    const currentBalances = getCurrentBalances();
    if (parseFloat(currentBalances.rewards) <= 0) { showToast('No rewards to claim', 'error'); return; }
    setLoading(true);
    try {
      const cfg             = getChainConfig(currentChain.id);
      const browserProvider = new ethers.BrowserProvider(provider, "any");

      const signer          = await browserProvider.getSigner();
      console.log(`Claiming on ${currentChain.id}`, { staking: cfg.STAKING_CONTRACT_ADDRESS, rewards: currentBalances.rewards });
      const stakingContract = new ethers.Contract(cfg.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.claimRewards();
      await tx.wait();
      showToast('Rewards claimed successfully!', 'success');
      await refreshAllChainData(account, provider);
    } catch (error: any) { console.error('Claim error:', error); showToast(error.message || 'Claim failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleFaucetClaim = async () => {
    if (!provider || !account) { showToast('Please connect wallet first', 'error'); return; }
    const cfg = getChainConfig(currentChain.id);
    // CreditCoin has no faucet deployed yet
    if (!cfg.FAUCET_CONTRACT_ADDRESS) {
      showToast(`Faucet not available on ${currentChain.name} yet`, 'error');
      return;
    }
    if (!(await validateChain())) return;
    setLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(provider, "any");

      const signer          = await browserProvider.getSigner();
      console.log(`Faucet claim on ${currentChain.id}`, { faucet: cfg.FAUCET_CONTRACT_ADDRESS });
      const faucetContract  = new ethers.Contract(cfg.FAUCET_CONTRACT_ADDRESS, ['function claimTokens() external'], signer);
      const tx = await faucetContract.claimTokens({ gasLimit: 300000 });
      await tx.wait();
      showToast('Tokens claimed successfully!', 'success');
      await refreshAllChainData(account, provider);
    } catch (error: any) { console.error('Faucet error:', error); showToast(error.message || 'Claim failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleAiSend      = () => { if (aiInput.trim() && !aiLoading) sendToGeminiAI(aiInput); };
  const handleAiKeyPress  = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSend(); } };

  const currentBalances  = getCurrentBalances();
  const currentStakeInfo = getCurrentStakeInfo();

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white font-sans antialiased">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0B0E11]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.1),transparent_50%)]"></div>
        {/* CreditCoin glow when active */}
        {currentChain.id === 'creditcoin' && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_60%)]"></div>
        )}
      </div>

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        onMobileOpen={() => setIsMobileMenuOpen(true)}
      />

      {/* Main */}
      <div className="lg:ml-64">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30">
          <div className="flex items-center justify-between bg-[#0B0E11]/80 backdrop-blur-md border-b border-white/10 px-4 py-3 lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <i className="fas fa-bars text-xl"></i>
            </button>
            <div className="text-lg font-bold text-cyan-400">VelaCore</div>
            <div className="w-10"></div>
          </div>

          <GlobalHeader
            account={account}
            currentChain={currentChain}
            onConnect={() => setIsWalletModalOpen(true)}
            onDisconnect={disconnectWallet}
            onSwitchChain={switchNetwork}
            supportedChains={SUPPORTED_CHAINS}
            connectedWalletId={connectedWalletId}
          />
        </div>

        {/* Content */}
        <main className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8">

            {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
            {activeSection === Section.DASHBOARD && (
              <div className="space-y-6">
                <HeroSection
                  chain={currentChain.id as 'bsc' | 'flow' | 'creditcoin'}
                  account={account}
                  onChainChange={(newChain) => {
                    const chain = SUPPORTED_CHAINS.find(c => c.id === newChain);
                    if (chain) setCurrentChain(chain);
                  }}
                />

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-400 uppercase tracking-wide">NATIVE BALANCE</div>
                      <i className="fas fa-wallet text-cyan-400/50"></i>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {currentBalances.native} {currentChain.nativeCurrency.symbol}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">on {currentChain.name}</div>
                  </div>

                  <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-400 uppercase tracking-wide">VEC BALANCE</div>
                      <i className="fas fa-coins text-cyan-400/50"></i>
                    </div>
                    <div className="text-3xl font-bold text-cyan-400">
                      {currentBalances.vec} VEC
                    </div>
                    <div className="text-xs text-cyan-400/70 mt-1">on {currentChain.name}</div>
                  </div>

                  <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-400 uppercase tracking-wide">STAKED</div>
                      <i className="fas fa-lock text-blue-400/50"></i>
                    </div>
                    <div className="text-3xl font-bold text-blue-400">
                      {currentBalances.staked} VEC
                    </div>
                    <div className="text-xs text-blue-400/70 mt-1">on {currentChain.name}</div>
                  </div>
                </div>

                {/* Faucet + Rewards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <i className="fas fa-faucet text-cyan-400"></i>
                      VEC Faucet
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">Get 5,000 VEC test tokens for {currentChain.name}</p>
                    {currentChain.id === 'creditcoin' && (
                      <p className="text-xs text-yellow-400 mb-3 flex items-center gap-1">
                        <i className="fas fa-exclamation-triangle"></i>
                        Faucet not deployed on CreditCoin yet
                      </p>
                    )}
                    <button
                      onClick={handleFaucetClaim}
                      disabled={!account || loading || currentChain.id === 'creditcoin'}
                      className="w-full mt-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : currentChain.id === 'creditcoin' ? 'Not Available' : 'Claim 5,000 VEC'}
                    </button>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <i className="fas fa-bolt text-yellow-400"></i>
                      Pending Rewards
                    </h3>
                    <div className="text-4xl font-bold text-yellow-400 mb-2">{currentBalances.rewards} VEC</div>
                    <p className="text-sm text-gray-400 mb-4">Available on {currentChain.name}</p>
                    <button
                      onClick={handleClaim}
                      disabled={!account || loading || parseFloat(currentBalances.rewards) <= 0}
                      className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 'Claim Rewards'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STAKE ──────────────────────────────────────────────────────── */}
            {activeSection === Section.STAKE && (
              <div className="max-w-5xl mx-auto">
                <StakingCard
                  account={account}
                  balances={currentBalances}
                  currentChain={currentChain}
                  stakeInfo={currentStakeInfo}
                  onStake={handleStake}
                  onUnstake={handleUnstake}
                  onClaim={handleClaim}
                  loading={loading}
                />
              </div>
            )}

            {/* ── OTHER SECTIONS ─────────────────────────────────────────────── */}
            {activeSection === Section.SWAP       && <SwapPage />}
            {activeSection === Section.NFT        && <NFTPage />}
            {activeSection === Section.GOVERNANCE && <GovernancePage />}
            {activeSection === 'bridge'      as Section && <BridgePage />}
            {activeSection === 'ai-analytics' as Section && <div className="max-w-7xl mx-auto"><AIAnalytics /></div>}
          </div>
        </main>
      </div>

      {/* ── AI Chatbot ────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
        >
          <i className={`fas ${isChatOpen ? 'fa-times' : 'fa-comment'} text-white text-xl`}></i>
        </button>

        {isChatOpen && (
          <div className="absolute bottom-20 right-0 w-80 bg-[#0B0E11] border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20">
              <h3 className="font-bold">VelaCore AI Assistant</h3>
              <p className="text-xs text-cyan-400">{currentChain.name} • Powered by Google Gemini</p>
            </div>
            <div ref={chatContainerRef} className="h-64 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg max-w-[85%] ${msg.isUser ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 ml-auto' : 'bg-white/5'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg max-w-[85%]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-xs text-gray-400">AI is thinking...</span>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text" value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={handleAiKeyPress}
                  placeholder={`Ask about ${currentChain.name}...`}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  disabled={aiLoading}
                />
                <button
                  onClick={handleAiSend}
                  disabled={!aiInput.trim() || aiLoading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">BSC • Flow • CreditCoin</p>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={(walletId: string) => connectWallet(walletId) as Promise<void>}
        loading={loading}
        detectedWallets={detectedWallets}
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300 font-medium">Processing on {currentChain.name}...</p>
          </div>
        </div>
      )}

      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1rem;
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          border-color: rgba(6,182,212,0.3);
          box-shadow: 0 8px 32px rgba(6,182,212,0.2);
        }
        @media (max-width: 1024px) { .lg\\:ml-64 { margin-left: 0 !important; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.5); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.7); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}