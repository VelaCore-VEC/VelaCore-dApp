import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { Section, UserBalances } from './types';
import { CONFIG, BSC_TESTNET_PARAMS, ERC20_ABI, STAKING_ABI } from './constants';
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
 * VELA-CORE PROTOCOL - COMPLETE FIXED VERSION
 * WITH CORRECT CONTRACT ADDRESSES FOR BSC AND FLOW
 * =========================================================================
 */

// Chain Configurations
const FLOW_TESTNET_PARAMS = {
  chainId: '0x221',
  chainName: 'Flow Testnet',
  nativeCurrency: { name: 'FLOW', symbol: 'FLOW', decimals: 18 },
  rpcUrls: ['https://rest-testnet.onflow.org'],
  blockExplorerUrls: ['https://testnet.flowscan.io/']
};

const SUPPORTED_CHAINS = [
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    chainId: 97,
    chainIdHex: '0x61',
    rpcUrl: 'https://bsc-testnet.publicnode.com',
    explorerUrl: 'https://testnet.bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
  },
  {
    id: 'flow',
    name: 'Flow Testnet',
    chainId: 545,
    chainIdHex: '0x221',
    rpcUrl: 'https://rest-testnet.onflow.org',
    explorerUrl: 'https://testnet.flowscan.io',
    nativeCurrency: { name: 'FLOW', symbol: 'FLOW', decimals: 18 }
  }
];

// ============================================
// CORRECT CONTRACT ADDRESSES - VERIFIED
// ============================================
const CHAIN_CONFIGS = {
  bsc: {
    VEC_TOKEN_ADDRESS: "0x1D3516E449aC7f08F5773Dc8d984E1174420867a", // CORRECT BSC TOKEN
    STAKING_CONTRACT_ADDRESS: "0x8c8A80E75D38d29A27770f90798DF479b294aC51", // CORRECT BSC STAKING
    FAUCET_CONTRACT_ADDRESS: "0x9bfe0Be0C065487eBb0F66E24CDf8F9cf1D750Cf", // CORRECT BSC FAUCET
    CHAIN_PARAMS: BSC_TESTNET_PARAMS,
    EXPLORER_URL: 'https://testnet.bscscan.com'
  },
  flow: {
    VEC_TOKEN_ADDRESS: "0x82829a882AB09864c5f2D1DA7F3F6650bFE2ebb8", // CORRECT FLOW TOKEN
    STAKING_CONTRACT_ADDRESS: "0xc75608EfEc43aC569EAB2b7DA8D1A23FE653e80B", // CORRECT FLOW STAKING
    FAUCET_CONTRACT_ADDRESS: "0x3a7A83c2ebB7CF0B253E6334A1900A9308aa0e81", // CORRECT FLOW FAUCET
    CHAIN_PARAMS: FLOW_TESTNET_PARAMS,
    EXPLORER_URL: 'https://testnet.flowscan.io'
  }
};

// Wallet Types
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

// Global window interface
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

// WalletConnect Setup
let walletConnectConnector: any = null;

const initWalletConnect = () => {
  if (walletConnectConnector) return walletConnectConnector;
  
  try {
    const WalletConnect = require('@walletconnect/client').default;
    const QRCodeModal = require('@walletconnect/qrcode-modal').default;
    
    walletConnectConnector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: QRCodeModal,
      clientMeta: {
        description: 'VelaCore Protocol',
        url: 'https://velacore.io',
        icons: ['https://velacore.io/icon.png'],
        name: 'VelaCore'
      }
    });
  } catch (e) {
    console.warn('WalletConnect not installed. Run: npm install @walletconnect/client @walletconnect/qrcode-modal');
  }
  
  return walletConnectConnector;
};

// ============================================
// WALLET DETECTION - COMPLETE FIXED VERSION
// ============================================
const detectAllWallets = (): WalletProvider[] => {
  const wallets: WalletProvider[] = [];
  const ethereum = window.ethereum;

  // 1. WALLETCONNECT - Universal QR Code
  wallets.push({
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: 'fas fa-qrcode',
    color: 'from-blue-400 to-indigo-500',
    isInstalled: () => true,
    getProvider: () => initWalletConnect(),
    downloadUrl: 'https://walletconnect.com/',
    priority: 100
  });

  // 2. METAMASK - Exact Detection
  let metamaskProvider = null;
  
  if (ethereum?.providers) {
    metamaskProvider = ethereum.providers.find((p: any) => 
      p.isMetaMask === true && p.isTrust !== true && p.isCoinbaseWallet !== true
    );
  }
  
  if (!metamaskProvider && Array.isArray(ethereum)) {
    metamaskProvider = ethereum.find((p: any) => 
      p.isMetaMask === true && p.isTrust !== true && p.isCoinbaseWallet !== true
    );
  }
  
  if (!metamaskProvider && ethereum?.isMetaMask === true) {
    metamaskProvider = ethereum;
  }

  if (metamaskProvider) {
    wallets.push({
      id: 'metamask',
      name: 'MetaMask',
      icon: 'fab fa-ethereum',
      color: 'from-orange-500 to-yellow-500',
      isInstalled: () => true,
      getProvider: () => metamaskProvider,
      downloadUrl: 'https://metamask.io/download/',
      priority: 90
    });
  }

  // 3. TRUST WALLET - Exact Detection
  let trustProvider = null;
  
  if (window.trustwallet) {
    trustProvider = window.trustwallet;
  }
  
  if (!trustProvider && ethereum?.isTrust === true) {
    trustProvider = ethereum;
  }
  
  if (!trustProvider && ethereum?.providers) {
    trustProvider = ethereum.providers.find((p: any) => p.isTrust === true);
  }

  if (trustProvider) {
    wallets.push({
      id: 'trustwallet',
      name: 'Trust Wallet',
      icon: 'fas fa-wallet',
      color: 'from-blue-500 to-cyan-500',
      isInstalled: () => true,
      getProvider: () => trustProvider,
      downloadUrl: 'https://trustwallet.com/download',
      priority: 80
    });
  }

  // 4. COINBASE WALLET
  let coinbaseProvider = null;
  
  if (window.coinbaseWalletExtension) {
    coinbaseProvider = window.coinbaseWalletExtension;
  }
  
  if (!coinbaseProvider && ethereum?.isCoinbaseWallet === true) {
    coinbaseProvider = ethereum;
  }

  if (coinbaseProvider) {
    wallets.push({
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: 'fab fa-bitcoin',
      color: 'from-blue-600 to-indigo-600',
      isInstalled: () => true,
      getProvider: () => coinbaseProvider,
      downloadUrl: 'https://www.coinbase.com/wallet/downloads',
      priority: 70
    });
  }

  // 5. BINANCE WALLET
  if (window.BinanceChain) {
    wallets.push({
      id: 'binance',
      name: 'Binance Wallet',
      icon: 'fab fa-btc',
      color: 'from-yellow-500 to-orange-500',
      isInstalled: () => true,
      getProvider: () => window.BinanceChain,
      downloadUrl: 'https://www.binance.org/wallet',
      priority: 60
    });
  }

  // 6. CASPER WALLET
  if (window.casperlabsHelper) {
    wallets.push({
      id: 'casper',
      name: 'Casper Wallet',
      icon: 'fas fa-gem',
      color: 'from-purple-600 to-pink-600',
      isInstalled: () => true,
      getProvider: () => window.casperlabsHelper,
      downloadUrl: 'https://www.casperwallet.io/',
      priority: 50
    });
  }

  // 7. PHANTOM WALLET
  if (window.phantom || window.solana?.isPhantom) {
    wallets.push({
      id: 'phantom',
      name: 'Phantom',
      icon: 'fas fa-ghost',
      color: 'from-purple-500 to-violet-500',
      isInstalled: () => true,
      getProvider: () => window.phantom || window.solana,
      downloadUrl: 'https://phantom.app/download',
      priority: 40
    });
  }

  // 8. GENERIC PROVIDER (last resort)
  if (ethereum && !Array.isArray(ethereum) && !metamaskProvider && !trustProvider && !coinbaseProvider) {
    wallets.push({
      id: 'generic',
      name: 'Browser Wallet',
      icon: 'fas fa-globe',
      color: 'from-green-500 to-teal-500',
      isInstalled: () => true,
      getProvider: () => ethereum,
      downloadUrl: 'https://ethereum.org/en/wallets/find-wallet/',
      priority: 10
    });
  }

  return wallets.sort((a, b) => b.priority - a.priority);
};

// Quick Connect
const quickConnect = async (): Promise<{ account: string, provider: any, walletId: string } | null> => {
  try {
    const lastConnectedWallet = localStorage.getItem('velacore_lastConnectedWallet');
    if (!lastConnectedWallet) return null;

    const wallets = detectAllWallets();
    const wallet = wallets.find(w => w.id === lastConnectedWallet);
    
    if (wallet && wallet.isInstalled()) {
      const provider = wallet.getProvider();
      
      if (wallet.id === 'walletconnect') {
        if (provider?.connected) {
          const accounts = provider.accounts;
          if (accounts && accounts.length > 0) {
            return { account: accounts[0], provider, walletId: wallet.id };
          }
        }
      } else {
        try {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            return { account: accounts[0], provider, walletId: wallet.id };
          }
        } catch (e) {
          console.log('Quick connect failed:', e);
        }
      }
    }
    return null;
  } catch (error) {
    console.warn('Quick connect failed:', error);
    return null;
  }
};

// Gemini AI configuration
const GEMINI_API_KEY = "AIzaSyCSg9T5V-PqB1JXez95ee-SJAMzS3NXsH0";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>(Section.DASHBOARD);
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [currentChain, setCurrentChain] = useState(SUPPORTED_CHAINS[0]);
  const [balances, setBalances] = useState<UserBalances>({
    native: '0.0000',
    vec: '0',
    staked: '0',
    rewards: '0.0000'
  });
  const [stakeInfo, setStakeInfo] = useState({
    stakedAmount: '0',
    pendingReward: '0.0000',
    projectedAPY: '0%',
    isActive: false,
    unlockTime: 0,
    lockupPeriod: 0,
    canWithdraw: false
  });
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{text: string, isUser: boolean}>>([
    { text: "Hello! I'm VelaCore AI Assistant. Ask me about staking, APY, or protocol features.", isUser: false }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<WalletProvider[]>([]);
  const [connectedWalletId, setConnectedWalletId] = useState<string | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const connectionAttemptedRef = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
  }, []);

  const getChainConfig = (chainId: string) => {
    return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS] || CHAIN_CONFIGS.bsc;
  };

  // ============================================
  // FIX: Provider Priority - Trust Wallet Override
  // ============================================
  useEffect(() => {
    try {
      if (window.ethereum?.providers) {
        const providers = window.ethereum.providers;
        const metamaskIndex = providers.findIndex((p: any) => p.isMetaMask === true);
        const trustIndex = providers.findIndex((p: any) => p.isTrust === true);
        
        if (metamaskIndex > trustIndex && metamaskIndex !== -1 && trustIndex !== -1) {
          [providers[metamaskIndex], providers[trustIndex]] = [providers[trustIndex], providers[metamaskIndex]];
        }
      }
    } catch (e) {
      console.warn('Provider reordering failed:', e);
    }
    
    const wallets = detectAllWallets();
    setDetectedWallets(wallets);
    console.log('Detected wallets:', wallets.map(w => w.name));
  }, []);

  // Auto-connect on page load
  useEffect(() => {
    const autoConnect = async () => {
      if (connectionAttemptedRef.current) return;
      try {
        const quickConnectResult = await quickConnect();
        if (quickConnectResult) {
          setAccount(quickConnectResult.account);
          setProvider(quickConnectResult.provider);
          setConnectedWalletId(quickConnectResult.walletId);
          await refreshData(quickConnectResult.account, quickConnectResult.provider);
          showToast(`Auto-connected`, 'success');
        }
      } catch (error) {
        console.log('Auto-connect failed:', error);
      } finally {
        connectionAttemptedRef.current = true;
      }
    };
    autoConnect();
  }, []);

  // Gemini AI function
  const sendToGeminiAI = async (message: string) => {
    if (!message.trim()) return;
    setAiLoading(true);
    const userMessage = { text: message, isUser: true };
    setChatMessages(prev => [...prev, userMessage]);
    setAiInput('');
    
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are VelaCore AI Assistant. Current: ${currentChain.name}, VEC: ${balances.vec}, Staked: ${balances.staked}. Question: ${message} Keep response under 3 sentences.`
            }]
          }]
        })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      let aiResponse = "I apologize, but I couldn't generate a response at the moment.";
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiResponse = data.candidates[0].content.parts[0].text;
      }
      setChatMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
    } catch (error) {
      console.error("Gemini AI error:", error);
      setChatMessages(prev => [...prev, { text: "I'm experiencing connection issues. Please try again later.", isUser: false }]);
    } finally {
      setAiLoading(false);
    }
  };

  // ============================================
  // REFRESH DATA - WITH CORRECT CONTRACT ADDRESSES
  // ============================================
  const refreshData = useCallback(async (currentAccount: string, rawProvider: any) => {
    try {
      const browserProvider = new ethers.BrowserProvider(rawProvider);
      const currentConfig = getChainConfig(currentChain.id);

      console.log(`Refreshing data for chain: ${currentChain.id}`);
      console.log(`Token Address: ${currentConfig.VEC_TOKEN_ADDRESS}`);
      console.log(`Staking Address: ${currentConfig.STAKING_CONTRACT_ADDRESS}`);
      console.log(`Faucet Address: ${currentConfig.FAUCET_CONTRACT_ADDRESS}`);

      const [nativeBal, vecBal, stakeInfoData] = await Promise.allSettled([
        browserProvider.getBalance(currentAccount).catch(() => 0n),
        (async () => {
          try {
            const vecContract = new ethers.Contract(currentConfig.VEC_TOKEN_ADDRESS, ERC20_ABI, browserProvider);
            const balance = await vecContract.balanceOf(currentAccount);
            console.log(`VEC Balance for ${currentChain.id}:`, ethers.formatUnits(balance, 18));
            return balance;
          } catch (error) {
            console.error(`Error fetching VEC balance on ${currentChain.id}:`, error);
            return 0n;
          }
        })(),
        (async () => {
          try {
            const stakingContract = new ethers.Contract(currentConfig.STAKING_CONTRACT_ADDRESS, STAKING_ABI, browserProvider);
            const info = await stakingContract.getUserStakeInfo(currentAccount);
            console.log(`Stake Info for ${currentChain.id}:`, info);
            return info;
          } catch (error) {
            console.error(`Error fetching stake info on ${currentChain.id}:`, error);
            return [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0, 0n, false, false];
          }
        })()
      ]);

      const decimals = 18;
      const nativeBalance = nativeBal.status === 'fulfilled' ? nativeBal.value : 0n;
      const vecBalance = vecBal.status === 'fulfilled' ? vecBal.value : 0n;
      
      let stakeData: any[] = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0, 0n, false, false];
      if (stakeInfoData.status === 'fulfilled') {
        stakeData = stakeInfoData.value as any[];
      }

      const stakedAmount = BigInt(stakeData[0] || 0);
      const pendingReward = BigInt(stakeData[1] || 0);
      const unlockTime = Number(stakeData[3] || 0);
      const lockupPeriod = Number(stakeData[7] || 0);
      const projectedAPY = BigInt(stakeData[8] || 0);
      const isActive = Boolean(stakeData[9] || false);
      const canWithdraw = Boolean(stakeData[10] || false);

      const now = Math.floor(Date.now() / 1000);
      const canWithdrawNow = unlockTime > 0 && now >= unlockTime;

      setBalances({
        native: parseFloat(ethers.formatUnits(nativeBalance, decimals)).toFixed(4),
        vec: parseFloat(ethers.formatUnits(vecBalance, decimals)).toFixed(2),
        staked: parseFloat(ethers.formatUnits(stakedAmount, decimals)).toFixed(2),
        rewards: parseFloat(ethers.formatUnits(pendingReward, decimals)).toFixed(4)
      });

      setStakeInfo({
        stakedAmount: parseFloat(ethers.formatUnits(stakedAmount, decimals)).toFixed(2),
        pendingReward: parseFloat(ethers.formatUnits(pendingReward, decimals)).toFixed(4),
        projectedAPY: projectedAPY > 0n ? (Number(projectedAPY) / 100).toFixed(2) + '%' : '0%',
        isActive: isActive,
        unlockTime: unlockTime,
        lockupPeriod: lockupPeriod,
        canWithdraw: canWithdrawNow || canWithdraw
      });

      console.log('Updated balances:', {
        native: parseFloat(ethers.formatUnits(nativeBalance, decimals)).toFixed(4),
        vec: parseFloat(ethers.formatUnits(vecBalance, decimals)).toFixed(2),
        staked: parseFloat(ethers.formatUnits(stakedAmount, decimals)).toFixed(2),
        rewards: parseFloat(ethers.formatUnits(pendingReward, decimals)).toFixed(4)
      });

    } catch (error) {
      console.error("Refresh error:", error);
    }
  }, [currentChain]);

  // ============================================
  // CONNECT WALLET - COMPLETE FIXED VERSION
  // ============================================
  const connectWallet = async (walletId: string) => {
    setLoading(true);
    try {
      const wallets = detectAllWallets();
      const wallet = wallets.find(w => w.id === walletId);
      
      if (!wallet) throw new Error(`${walletId} wallet not found`);

      // ===== WALLETCONNECT =====
      if (walletId === 'walletconnect') {
        try {
          const connector = initWalletConnect();
          
          if (!connector) {
            throw new Error('WalletConnect libraries not installed. Run: npm install @walletconnect/client @walletconnect/qrcode-modal');
          }
          
          if (!connector.connected) {
            await connector.createSession();
          }

          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("WalletConnect timeout"));
            }, 60000);

            connector.on('connect', async (error: any, payload: any) => {
              clearTimeout(timeout);
              if (error) { reject(error); return; }
              const { accounts } = payload.params[0];
              setAccount(accounts[0]);
              setProvider(connector);
              setConnectedWalletId('walletconnect');
              localStorage.setItem('velacore_lastConnectedWallet', 'walletconnect');
              setIsWalletModalOpen(false);
              showToast('Connected via WalletConnect', 'success');
              await refreshData(accounts[0], connector);
              setLoading(false);
              resolve(true);
            });
          });
        } catch (wcError: any) {
          console.error('WalletConnect error:', wcError);
          throw new Error(wcError.message || 'Failed to connect via WalletConnect');
        }
      }

      // ===== METAMASK - EXACT PROVIDER =====
      if (walletId === 'metamask') {
        let metamaskExactProvider = null;
        
        if (window.ethereum?.providers) {
          metamaskExactProvider = window.ethereum.providers.find((p: any) => 
            p.isMetaMask === true && p.isTrust !== true && p.isCoinbaseWallet !== true
          );
        }
        
        if (!metamaskExactProvider && Array.isArray(window.ethereum)) {
          metamaskExactProvider = window.ethereum.find((p: any) => 
            p.isMetaMask === true && p.isTrust !== true && p.isCoinbaseWallet !== true
          );
        }
        
        if (!metamaskExactProvider && window.ethereum?.isMetaMask === true) {
          metamaskExactProvider = window.ethereum;
        }

        if (!metamaskExactProvider) {
          throw new Error('MetaMask not detected. Please install MetaMask.');
        }

        try {
          const accounts = await metamaskExactProvider.request({ method: 'eth_requestAccounts' });
          if (!accounts || accounts.length === 0) throw new Error('No accounts received');
          
          setAccount(accounts[0]);
          setProvider(metamaskExactProvider);
          setConnectedWalletId('metamask');
          localStorage.setItem('velacore_lastConnectedWallet', 'metamask');
          setIsWalletModalOpen(false);
          showToast('Connected to MetaMask', 'success');
          await refreshData(accounts[0], metamaskExactProvider);
          setLoading(false);
          return;
        } catch (mmError: any) {
          if (mmError.code === 4001) throw new Error('Connection rejected');
          throw mmError;
        }
      }

      // ===== TRUST WALLET =====
      if (walletId === 'trustwallet') {
        let trustExactProvider = null;
        
        if (window.trustwallet) {
          trustExactProvider = window.trustwallet;
        }
        
        if (!trustExactProvider && window.ethereum?.isTrust === true) {
          trustExactProvider = window.ethereum;
        }
        
        if (!trustExactProvider && window.ethereum?.providers) {
          trustExactProvider = window.ethereum.providers.find((p: any) => p.isTrust === true);
        }

        if (!trustExactProvider) {
          throw new Error('Trust Wallet not detected');
        }

        const accounts = await trustExactProvider.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setProvider(trustExactProvider);
        setConnectedWalletId('trustwallet');
        localStorage.setItem('velacore_lastConnectedWallet', 'trustwallet');
        setIsWalletModalOpen(false);
        showToast('Connected to Trust Wallet', 'success');
        await refreshData(accounts[0], trustExactProvider);
        setLoading(false);
        return;
      }

      // ===== COINBASE WALLET =====
      if (walletId === 'coinbase') {
        let coinbaseExactProvider = null;
        
        if (window.coinbaseWalletExtension) {
          coinbaseExactProvider = window.coinbaseWalletExtension;
        } else if (window.ethereum?.isCoinbaseWallet === true) {
          coinbaseExactProvider = window.ethereum;
        }

        if (!coinbaseExactProvider) {
          throw new Error('Coinbase Wallet not detected');
        }

        const accounts = await coinbaseExactProvider.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setProvider(coinbaseExactProvider);
        setConnectedWalletId('coinbase');
        localStorage.setItem('velacore_lastConnectedWallet', 'coinbase');
        setIsWalletModalOpen(false);
        showToast('Connected to Coinbase Wallet', 'success');
        await refreshData(accounts[0], coinbaseExactProvider);
        setLoading(false);
        return;
      }

      // ===== BINANCE WALLET =====
      if (walletId === 'binance') {
        if (!window.BinanceChain) throw new Error('Binance Wallet not detected');
        const accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setProvider(window.BinanceChain);
        setConnectedWalletId('binance');
        localStorage.setItem('velacore_lastConnectedWallet', 'binance');
        setIsWalletModalOpen(false);
        showToast('Connected to Binance Wallet', 'success');
        await refreshData(accounts[0], window.BinanceChain);
        setLoading(false);
        return;
      }

      // ===== CASPER WALLET =====
      if (walletId === 'casper') {
        if (!window.casperlabsHelper) throw new Error('Casper Wallet not detected');
        const accounts = await window.casperlabsHelper.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setProvider(window.casperlabsHelper);
        setConnectedWalletId('casper');
        localStorage.setItem('velacore_lastConnectedWallet', 'casper');
        setIsWalletModalOpen(false);
        showToast('Connected to Casper Wallet', 'success');
        setLoading(false);
        return;
      }

      // ===== PHANTOM WALLET =====
      if (walletId === 'phantom') {
        const provider = window.phantom || window.solana;
        if (!provider) throw new Error('Phantom Wallet not detected');
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setProvider(provider);
        setConnectedWalletId('phantom');
        localStorage.setItem('velacore_lastConnectedWallet', 'phantom');
        setIsWalletModalOpen(false);
        showToast('Connected to Phantom Wallet', 'success');
        await refreshData(accounts[0], provider);
        setLoading(false);
        return;
      }

      // ===== GENERIC WALLET =====
      const provider = wallet.getProvider();
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      setAccount(accounts[0]);
      setProvider(provider);
      setConnectedWalletId(walletId);
      localStorage.setItem('velacore_lastConnectedWallet', walletId);
      setIsWalletModalOpen(false);
      showToast(`Connected to ${wallet.name}`, 'success');
      await refreshData(accounts[0], provider);
      
    } catch (error: any) {
      console.error('Connection error:', error);
      let errorMessage = error.message || 'Connection failed';
      if (error.code === 4001) errorMessage = 'Connection rejected by user';
      else if (error.message?.includes('timeout')) errorMessage = 'Connection timeout';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle wallet events
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnectWallet();
      else if (account !== accounts[0]) {
        setAccount(accounts[0]);
        refreshData(accounts[0], provider);
        showToast("Account changed", "info");
      }
    };

    const handleChainChanged = () => window.location.reload();
    const handleDisconnect = () => disconnectWallet();

    if (provider.on) {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      provider.on('disconnect', handleDisconnect);
    }

    return () => {
      if (provider.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
        provider.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [provider, account, refreshData]);

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setConnectedWalletId(null);
    setBalances({ native: '0.0000', vec: '0', staked: '0', rewards: '0.0000' });
    setStakeInfo({
      stakedAmount: '0', pendingReward: '0.0000', projectedAPY: '0%',
      isActive: false, unlockTime: 0, lockupPeriod: 0, canWithdraw: false
    });
    localStorage.removeItem('velacore_lastConnectedWallet');
    showToast("Wallet disconnected", "info");
  };

  const switchNetwork = async (chainId: string) => {
    if (!provider) { showToast("Please connect wallet first", "error"); return; }
    if (currentChain.id === chainId) return;
    setLoading(true);
    try {
      const targetChain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      if (!targetChain) throw new Error("Chain not supported");
      const targetChainConfig = getChainConfig(chainId);
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChain.chainIdHex }]
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [targetChainConfig.CHAIN_PARAMS]
          });
        } else throw switchError;
      }
      setCurrentChain(targetChain);
      if (account) await refreshData(account, provider);
      showToast(`Switched to ${targetChain.name}`, "success");
    } catch (error: any) {
      showToast(`Failed to switch: ${error.message}`, "error");
    } finally { setLoading(false); }
  };

  // ============================================
  // STAKING FUNCTIONS - WITH CORRECT CONTRACT ADDRESSES
  // ============================================
  const handleStake = async (amount: string, lockPeriod: number) => {
    if (!provider || !account) { showToast("Please connect wallet first", "error"); return; }
    if (stakeInfo.isActive) { showToast("You already have an active stake", "error"); return; }
    if (parseFloat(amount) <= 0) { showToast("Please enter a valid amount", "error"); return; }
    if (parseFloat(amount) > parseFloat(balances.vec)) { showToast("Insufficient balance", "error"); return; }

    setLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const currentConfig = getChainConfig(currentChain.id);
      const signer = await browserProvider.getSigner();

      console.log(`Staking on ${currentChain.id}`);
      console.log(`Token Address: ${currentConfig.VEC_TOKEN_ADDRESS}`);
      console.log(`Staking Address: ${currentConfig.STAKING_CONTRACT_ADDRESS}`);
      console.log(`Amount: ${amount} VEC`);
      console.log(`Lock Period: ${lockPeriod} days`);

      // Approve tokens
      const vecContract = new ethers.Contract(currentConfig.VEC_TOKEN_ADDRESS, ERC20_ABI, signer);
      const amountWei = ethers.parseUnits(amount, 18);
      
      console.log('Approving tokens...');
      const approveTx = await vecContract.approve(currentConfig.STAKING_CONTRACT_ADDRESS, amountWei);
      await approveTx.wait();
      console.log('Approval successful');

      // Stake tokens
      const stakingContract = new ethers.Contract(currentConfig.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      console.log('Staking tokens...');
      const stakeTx = await stakingContract.stake(amountWei, lockPeriod);
      await stakeTx.wait();
      console.log('Staking successful');

      showToast("Staked successfully!", "success");
      await refreshData(account, provider);
    } catch (error: any) {
      console.error("Stake error:", error);
      showToast(error.message || "Staking failed", "error");
    } finally { setLoading(false); }
  };

  const handleUnstake = async () => {
    if (!provider || !account) { showToast("Please connect wallet first", "error"); return; }
    if (!stakeInfo.isActive) { showToast("No active stake", "error"); return; }
    if (!stakeInfo.canWithdraw) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = stakeInfo.unlockTime - now;
      if (remaining > 0) {
        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        showToast(`Cannot unstake yet. Lock period ends in ${days}d ${hours}h`, "error");
        return;
      }
    }

    setLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const currentConfig = getChainConfig(currentChain.id);
      const signer = await browserProvider.getSigner();

      console.log(`Unstaking on ${currentChain.id}`);
      console.log(`Staking Address: ${currentConfig.STAKING_CONTRACT_ADDRESS}`);

      const stakingContract = new ethers.Contract(currentConfig.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.withdraw();
      await tx.wait();

      showToast("Unstaked successfully!", "success");
      await refreshData(account, provider);
    } catch (error: any) {
      console.error("Unstake error:", error);
      showToast(error.message || "Unstaking failed", "error");
    } finally { setLoading(false); }
  };

  const handleClaim = async () => {
    if (!provider || !account) { showToast("Please connect wallet first", "error"); return; }
    if (parseFloat(balances.rewards) <= 0) { showToast("No rewards to claim", "error"); return; }

    setLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const currentConfig = getChainConfig(currentChain.id);
      const signer = await browserProvider.getSigner();

      console.log(`Claiming rewards on ${currentChain.id}`);
      console.log(`Staking Address: ${currentConfig.STAKING_CONTRACT_ADDRESS}`);
      console.log(`Rewards amount: ${balances.rewards} VEC`);

      const stakingContract = new ethers.Contract(currentConfig.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.claimRewards();
      await tx.wait();

      showToast("Rewards claimed successfully!", "success");
      await refreshData(account, provider);
    } catch (error: any) {
      console.error("Claim error:", error);
      showToast(error.message || "Claim failed", "error");
    } finally { setLoading(false); }
  };

  const handleFaucetClaim = async () => {
    if (!provider || !account) { showToast("Please connect wallet first", "error"); return; }

    setLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const currentConfig = getChainConfig(currentChain.id);
      const signer = await browserProvider.getSigner();

      console.log(`Claiming from faucet on ${currentChain.id}`);
      console.log(`Faucet Address: ${currentConfig.FAUCET_CONTRACT_ADDRESS}`);

      const faucetContract = new ethers.Contract(
        currentConfig.FAUCET_CONTRACT_ADDRESS,
        ["function claimTokens() external"],
        signer
      );

      const tx = await faucetContract.claimTokens({ gasLimit: 300000 });
      await tx.wait();

      showToast("Tokens claimed successfully!", "success");
      await refreshData(account, provider);
    } catch (error: any) {
      console.error("Faucet error:", error);
      showToast(error.message || "Claim failed", "error");
    } finally { setLoading(false); }
  };

  const handleAiSend = () => { if (aiInput.trim() && !aiLoading) sendToGeminiAI(aiInput); };
  const handleAiKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSend(); } };

  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [chatMessages]);

  useEffect(() => {
    const handleEthereumChanged = () => { setDetectedWallets(detectAllWallets()); };
    if (window.ethereum) {
      window.ethereum.on?.('connect', handleEthereumChanged);
      window.ethereum.on?.('disconnect', handleEthereumChanged);
    }
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('connect', handleEthereumChanged);
        window.ethereum.removeListener('disconnect', handleEthereumChanged);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white font-sans antialiased">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0B0E11]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.1),transparent_50%)]"></div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        onMobileOpen={() => setIsMobileMenuOpen(true)}
      />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30">
          <div className="flex items-center justify-between bg-[#0B0E11]/80 backdrop-blur-md border-b border-white/10 px-4 py-3 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
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

        {/* Main Content Area */}
        <main className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8">
            {/* Dashboard Section */}
            {activeSection === Section.DASHBOARD && (
              <div className="space-y-6">
                <HeroSection tvl="$12,500,000" totalStakers="1,234" apy="24.5" />

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['Native Balance', 'VEC Balance', 'Staked'].map((title, index) => (
                    <div key={index} className="glass-card p-6 hover:scale-[1.02] transition-transform">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-gray-400 uppercase tracking-wide">{title}</div>
                        <i className={`fas ${
                          index === 0 ? 'fa-wallet text-cyan-400/50' : 
                          index === 1 ? 'fa-coins text-cyan-400/50' : 
                          'fa-lock text-blue-400/50'
                        }`}></i>
                      </div>
                      <div className={`text-3xl font-bold ${
                        index === 1 ? 'text-cyan-400' : 
                        index === 2 ? 'text-blue-400' : 'text-white'
                      }`}>
                        {index === 0 ? `${balances.native} ${currentChain.nativeCurrency.symbol}` : 
                         index === 1 ? `${balances.vec} VEC` : 
                         `${balances.staked} VEC`}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Faucet Card */}
                  <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <i className="fas fa-faucet text-cyan-400"></i>
                      VEC Faucet
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Get 5,000 VEC test tokens for {currentChain.name}
                    </p>
                    <button
                      onClick={handleFaucetClaim}
                      disabled={!account || loading}
                      className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 'Claim 5,000 VEC'}
                    </button>
                  </div>

                  {/* Rewards Card */}
                  <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <i className="fas fa-bolt text-yellow-400"></i>
                      Pending Rewards
                    </h3>
                    <div className="text-4xl font-bold text-yellow-400 mb-2">{balances.rewards} VEC</div>
                    <p className="text-sm text-gray-400 mb-4">Available to claim</p>
                    <button
                      onClick={handleClaim}
                      disabled={!account || loading || parseFloat(balances.rewards) <= 0}
                      className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 'Claim Rewards'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Staking Section */}
            {activeSection === Section.STAKE && (
              <div className="max-w-5xl mx-auto">
                <StakingCard
                  account={account}
                  balances={balances}
                  currentChain={currentChain}
                  stakeInfo={stakeInfo}
                  onStake={handleStake}
                  onUnstake={handleUnstake}
                  onClaim={handleClaim}
                  loading={loading}
                />
              </div>
            )}

            {/* Other Sections */}
            {activeSection === Section.SWAP && <SwapPage />}
            {activeSection === Section.NFT && <NFTPage />}
            {activeSection === Section.GOVERNANCE && <GovernancePage />}
            {activeSection === 'bridge' as Section && <BridgePage />}
            {activeSection === 'ai-analytics' as Section && (
              <div className="max-w-7xl mx-auto"><AIAnalytics /></div>
            )}
          </div>
        </main>
      </div>

      {/* AI Chatbot */}
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
              <p className="text-xs text-cyan-400">Powered by Google Gemini</p>
            </div>
            
            <div ref={chatContainerRef} className="h-64 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg max-w-[85%] ${
                  msg.isUser ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 ml-auto' : 'bg-white/5'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg max-w-[85%]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-xs text-gray-400">AI is thinking...</span>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={handleAiKeyPress}
                  placeholder="Ask about VelaCore..."
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
              <p className="text-xs text-gray-500 mt-2 text-center">Ask about staking, APY, tokens, or DeFi</p>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={connectWallet}
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
          <div className="glass-card p-8">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-center text-gray-300 font-medium">Processing transaction...</p>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.2);
        }
        @media (max-width: 1024px) { .lg\\:ml-64 { margin-left: 0 !important; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.5); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.7); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}