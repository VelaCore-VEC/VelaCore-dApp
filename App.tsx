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
 * VELA-CORE PROTOCOL - INSTITUTIONAL GRADE DeFi DASHBOARD
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

const CHAIN_CONFIGS = {
  bsc: {
    VEC_TOKEN_ADDRESS: CONFIG.VEC_TOKEN_ADDRESS,
    STAKING_CONTRACT_ADDRESS: CONFIG.STAKING_CONTRACT_ADDRESS,
    FAUCET_CONTRACT_ADDRESS: "0x9bfe0Be0C065487eBb0F66E24CDf8F9cf1D750Cf",
    CHAIN_PARAMS: BSC_TESTNET_PARAMS,
    EXPLORER_URL: 'https://testnet.bscscan.com'
  },
  flow: {
    VEC_TOKEN_ADDRESS: "0x82829a882AB09864c5f2D1DA7F3F6650bFE2ebb8",
    STAKING_CONTRACT_ADDRESS: "0xc75608EfEc43aC569EAB2b7DA8D1A23FE653e80B",
    FAUCET_CONTRACT_ADDRESS: "0x3a7A83c2ebB7CF0B253E6334A1900A9308aa0e81",
    CHAIN_PARAMS: FLOW_TESTNET_PARAMS,
    EXPLORER_URL: 'https://testnet.flowscan.io'
  }
};

declare global {
  interface Window {
    ethereum?: any;
    trustwallet?: any;
    coinbaseWalletExtension?: any;
    BinanceChain?: any;
  }
}

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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
  }, []);

  const getChainConfig = (chainId: string) => {
    return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS] || CHAIN_CONFIGS.bsc;
  };

  // Gemini AI function
  const sendToGeminiAI = async (message: string) => {
    if (!message.trim()) return;
    
    setAiLoading(true);
    
    // Add user message
    const userMessage = { text: message, isUser: true };
    setChatMessages(prev => [...prev, userMessage]);
    setAiInput('');
    
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are VelaCore AI Assistant, a helpful assistant for the VelaCore DeFi protocol. 
              Current user context: Connected to ${currentChain.name}, 
              VEC Balance: ${balances.vec}, Staked: ${balances.staked}, Pending Rewards: ${balances.rewards}.
              User question: ${message}
              
              Provide helpful, concise answers about:
              - Staking VEC tokens and APY calculations
              - Token swapping on our platform
              - NFT collection information
              - Governance and voting procedures
              - Cross-chain bridging
              - General DeFi and blockchain concepts
              
              Keep responses under 3-4 sentences.`
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the AI response
      let aiResponse = "I apologize, but I couldn't generate a response at the moment.";
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        aiResponse = data.candidates[0].content.parts[0].text;
      }
      
      // Add AI response
      setChatMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
      
    } catch (error) {
      console.error("Gemini AI error:", error);
      setChatMessages(prev => [...prev, { 
        text: "I'm experiencing connection issues. Please try again later or ask about general VelaCore features.", 
        isUser: false 
      }]);
      showToast("AI service temporarily unavailable", "error");
    } finally {
      setAiLoading(false);
    }
  };

  // Refresh Data
  const refreshData = useCallback(async (currentAccount: string, rawProvider: any) => {
    try {
      const browserProvider = new ethers.BrowserProvider(rawProvider);
      const currentConfig = getChainConfig(currentChain.id);

      const [nativeBal, vecBal, stakeInfoData] = await Promise.allSettled([
        browserProvider.getBalance(currentAccount).catch(() => 0n),
        (async () => {
          const vecContract = new ethers.Contract(currentConfig.VEC_TOKEN_ADDRESS, ERC20_ABI, browserProvider);
          return await vecContract.balanceOf(currentAccount).catch(() => 0n);
        })(),
        (async () => {
          try {
            const stakingContract = new ethers.Contract(currentConfig.STAKING_CONTRACT_ADDRESS, STAKING_ABI, browserProvider);
            const info = await stakingContract.getUserStakeInfo(currentAccount);
            return info;
          } catch {
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
      const stakeTime = Number(stakeData[2] || 0);
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
    } catch (error) {
      console.error("Refresh error:", error);
    }
  }, [currentChain]);

  // Wallet Connection
  const connectWallet = async (walletType: string) => {
    setLoading(true);
    try {
      let ethereumProvider: any = null;

      switch (walletType) {
        case 'metamask':
          if (window.ethereum?.isMetaMask && !Array.isArray(window.ethereum)) {
            ethereumProvider = window.ethereum;
          } else if (Array.isArray(window.ethereum)) {
            ethereumProvider = window.ethereum.find((provider: any) => 
              provider.isMetaMask || provider._metamask || provider.providers?.some((p: any) => p.isMetaMask)
            );
            if (!ethereumProvider) {
              ethereumProvider = window.ethereum.find((provider: any) => 
                provider.request && !provider.isTrust && !provider.isCoinbaseWallet
              );
            }
          } else if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
            ethereumProvider = window.ethereum.providers.find((provider: any) => 
              provider.isMetaMask || provider._metamask
            );
          } else if (window.ethereum && !window.ethereum.isTrust && !window.ethereum.isCoinbaseWallet) {
            ethereumProvider = window.ethereum;
          }
          break;
        case 'trustwallet':
          if (window.trustwallet) {
            ethereumProvider = window.trustwallet;
          } else if (window.ethereum?.isTrust) {
            ethereumProvider = window.ethereum;
          } else if (Array.isArray(window.ethereum)) {
            ethereumProvider = window.ethereum.find((provider: any) => provider.isTrust);
          } else if (window.ethereum?.providers) {
            ethereumProvider = window.ethereum.providers.find((provider: any) => provider.isTrust);
          }
          break;
        case 'coinbase':
          if (window.coinbaseWalletExtension) {
            ethereumProvider = window.coinbaseWalletExtension;
          } else if (window.ethereum?.isCoinbaseWallet) {
            ethereumProvider = window.ethereum;
          } else if (Array.isArray(window.ethereum)) {
            ethereumProvider = window.ethereum.find((provider: any) => provider.isCoinbaseWallet);
          } else if (window.ethereum?.providers) {
            ethereumProvider = window.ethereum.providers.find((provider: any) => provider.isCoinbaseWallet);
          }
          break;
        case 'binance':
          ethereumProvider = window.BinanceChain;
          break;
        default:
          showToast("Wallet not supported", "error");
          setLoading(false);
          return;
      }

      if (!ethereumProvider) {
        showToast(`${walletType} not detected. Please install the wallet extension.`, "error");
        setLoading(false);
        return;
      }

      const accounts = await Promise.race([
        ethereumProvider.request({ method: 'eth_requestAccounts' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts received");
      }

      const browserProvider = new ethers.BrowserProvider(ethereumProvider, 'any');
      const network = await browserProvider.getNetwork();
      const isSupportedChain = SUPPORTED_CHAINS.some(chain => Number(network.chainId) === chain.chainId);

      if (!isSupportedChain) {
        try {
          await ethereumProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: currentChain.chainIdHex }]
          });
        } catch (err: any) {
          if (err.code === 4902) {
            const currentConfig = getChainConfig(currentChain.id);
            await ethereumProvider.request({
              method: 'wallet_addEthereumChain',
              params: [currentConfig.CHAIN_PARAMS]
            });
          }
        }
      }

      setAccount(accounts[0]);
      setProvider(ethereumProvider);
      setIsWalletModalOpen(false);
      showToast("Wallet connected successfully", "success");
      await refreshData(accounts[0], ethereumProvider);
    } catch (e: any) {
      console.error("Connection error:", e);
      showToast(e.message || "Connection failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setBalances({ native: '0.0000', vec: '0', staked: '0', rewards: '0.0000' });
    setStakeInfo({
      stakedAmount: '0',
      pendingReward: '0.0000',
      projectedAPY: '0%',
      isActive: false,
      unlockTime: 0,
      lockupPeriod: 0,
      canWithdraw: false
    });
    showToast("Wallet disconnected", "info");
  };

  const switchNetwork = async (chainId: string) => {
    if (!provider) {
      showToast("Please connect wallet first", "error");
      return;
    }
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
        }
      }

      setCurrentChain(targetChain);
      if (account) {
        await refreshData(account, provider);
      }
      showToast(`Switched to ${targetChain.name}`, "success");
    } catch (error: any) {
      showToast(`Failed to switch: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      const ethereumProvider = Array.isArray(window.ethereum) 
        ? window.ethereum[0] 
        : (window.ethereum?.providers ? window.ethereum.providers[0] : window.ethereum);
      
      if (ethereumProvider) {
        try {
          const accounts = await ethereumProvider.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setProvider(ethereumProvider);
            await refreshData(accounts[0], ethereumProvider);
          }
        } catch (error) {
          console.warn("Connection check failed:", error);
        }
      }
    };
    checkConnection();
  }, [refreshData]);

  // Scroll to bottom when new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Staking Functions
  const handleStake = async (amount: string, lockPeriod: number) => {
    if (!provider || !account) {
      showToast("Please connect wallet first", "error");
      return;
    }

    if (stakeInfo.isActive) {
      showToast("You already have an active stake. Please unstake first.", "error");
      return;
    }

    if (parseFloat(amount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    if (parseFloat(amount) > parseFloat(balances.vec)) {
      showToast("Insufficient balance", "error");
      return;
    }

    setLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const currentConfig = getChainConfig(currentChain.id);
      const signer = await browserProvider.getSigner();

      const vecContract = new ethers.Contract(currentConfig.VEC_TOKEN_ADDRESS, ERC20_ABI, signer);
      const amountWei = ethers.parseUnits(amount, 18);
      
      const approveTx = await vecContract.approve(currentConfig.STAKING_CONTRACT_ADDRESS, amountWei);
      await approveTx.wait();

      const stakingContract = new ethers.Contract(currentConfig.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const stakeTx = await stakingContract.stake(amountWei, lockPeriod);
      await stakeTx.wait();

      showToast("Staked successfully!", "success");
      await refreshData(account, provider);
    } catch (error: any) {
      console.error("Stake error:", error);
      showToast(error.message || "Staking failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!provider || !account) {
      showToast("Please connect wallet first", "error");
      return;
    }

    if (!stakeInfo.isActive) {
      showToast("No active stake to unstake", "error");
      return;
    }

    if (!stakeInfo.canWithdraw) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = stakeInfo.unlockTime - now;
      if (remaining > 0) {
        const days = Math.floor(remaining / 86400);
        showToast(`Cannot unstake yet. Lock period ends in ${days} day(s).`, "error");
        return;
      }
    }

    setLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const currentConfig = getChainConfig(currentChain.id);
      const signer = await browserProvider.getSigner();

      const stakingContract = new ethers.Contract(currentConfig.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.withdraw();
      await tx.wait();

      showToast("Unstaked successfully!", "success");
      await refreshData(account, provider);
    } catch (error: any) {
      console.error("Unstake error:", error);
      showToast(error.message || "Unstaking failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!provider || !account) {
      showToast("Please connect wallet first", "error");
      return;
    }

    setLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const currentConfig = getChainConfig(currentChain.id);
      const signer = await browserProvider.getSigner();

      const stakingContract = new ethers.Contract(currentConfig.STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.claimRewards();
      await tx.wait();

      showToast("Rewards claimed successfully!", "success");
      await refreshData(account, provider);
    } catch (error: any) {
      console.error("Claim error:", error);
      showToast(error.message || "Claim failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFaucetClaim = async () => {
    if (!provider || !account) {
      showToast("Please connect wallet first", "error");
      return;
    }

    setLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const currentConfig = getChainConfig(currentChain.id);
      const signer = await browserProvider.getSigner();

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
    } finally {
      setLoading(false);
    }
  };

  // Handle AI message send
  const handleAiSend = () => {
    if (aiInput.trim() && !aiLoading) {
      sendToGeminiAI(aiInput);
    }
  };

  // Handle Enter key press for AI
  const handleAiKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiSend();
    }
  };

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
        {/* Global Header with Mobile Menu Button */}
        <div className="sticky top-0 z-30">
          <div className="flex items-center justify-between bg-[#0B0E11]/80 backdrop-blur-md border-b border-white/10 px-4 py-3 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
            <div className="text-lg font-bold text-cyan-400">VelaCore</div>
            <div className="w-10"></div> {/* Spacer */}
          </div>
          
          <GlobalHeader
            account={account}
            currentChain={currentChain}
            onConnect={() => setIsWalletModalOpen(true)}
            onDisconnect={disconnectWallet}
            onSwitchChain={switchNetwork}
            supportedChains={SUPPORTED_CHAINS}
          />
        </div>

        {/* Main Content */}
        <main className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8">
            {/* Dashboard Section */}
            {activeSection === Section.DASHBOARD && (
              <div className="space-y-6">
                <HeroSection
                  tvl="$12,500,000"
                  totalStakers="1,234"
                  apy="24.5"
                />

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
                      Get test tokens for {currentChain.name}
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

            {/* Swap Section */}
            {activeSection === Section.SWAP && (
              <SwapPage />
            )}

            {/* NFTs Section */}
            {activeSection === Section.NFT && (
              <NFTPage />
            )}

            {/* Governance Section */}
            {activeSection === Section.GOVERNANCE && (
              <GovernancePage />
            )}

            {/* Bridge Section */}
            {activeSection === 'bridge' as Section && (
              <BridgePage />
            )}

            {/* AI Analytics Section */}
            {activeSection === 'ai-analytics' as Section && (
              <div className="max-w-7xl mx-auto">
                <AIAnalytics />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Enhanced AI Chatbot */}
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
            
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="h-64 p-4 overflow-y-auto space-y-3"
            >
              {chatMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg max-w-[85%] ${
                    msg.isUser 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 ml-auto' 
                      : 'bg-white/5'
                  }`}
                >
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
            
            {/* Chat Input */}
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
                  {aiLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-paper-plane"></i>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Ask about staking, APY, tokens, or DeFi
              </p>
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
        
        /* Mobile sidebar fix */
        @media (max-width: 1024px) {
          .lg\\:ml-64 {
            margin-left: 0 !important;
          }
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  );
}