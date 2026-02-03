import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Section, UserBalances } from './types';
import { CONFIG, BSC_TESTNET_PARAMS, ERC20_ABI, STAKING_ABI } from './constants';
import { GlobalHeader } from './components/GlobalHeader';
import { HeroSection } from './components/HeroSection';
import { StakingCard } from './components/StakingCard';
import { WalletModal } from './components/WalletModal';
import { Toast } from './components/Toast';
import { Sidebar } from './components/Sidebar';

/**
 * =========================================================================
 * VELA-CORE PROTOCOL - INSTITUTIONAL GRADE DeFi DASHBOARD
 * =========================================================================
 * 
 * Design: Deep Space Theme with Glassmorphism
 * Features:
 * - Multi-chain support (BNB, Flow)
 * - Professional wallet integration
 * - Animated TVL counter
 * - Advanced staking interface
 * - Production-ready code
 * 
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

// Main App Component
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

  // Protocol Stats (Mock data - replace with real data)
  const [protocolStats, setProtocolStats] = useState({
    tvl: '$12,500,000',
    totalStakers: '1,234',
    apy: '24.5'
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
  }, []);

  const getChainConfig = (chainId: string) => {
    return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS] || CHAIN_CONFIGS.bsc;
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

  // Wallet Connection - Fixed to properly detect specific wallets
  const connectWallet = async (walletType: string) => {
    setLoading(true);
    try {
      let ethereumProvider: any = null;

      switch (walletType) {
        case 'metamask':
          // First check if MetaMask is available directly
          if (window.ethereum?.isMetaMask && !Array.isArray(window.ethereum)) {
            ethereumProvider = window.ethereum;
          } else if (Array.isArray(window.ethereum)) {
            // Find MetaMask in the array
            ethereumProvider = window.ethereum.find((provider: any) => 
              provider.isMetaMask || provider._metamask || provider.providers?.some((p: any) => p.isMetaMask)
            );
            // If not found, try to find by checking for MetaMask-specific properties
            if (!ethereumProvider) {
              ethereumProvider = window.ethereum.find((provider: any) => 
                provider.request && !provider.isTrust && !provider.isCoinbaseWallet
              );
            }
          } else if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
            // Find MetaMask in providers array
            ethereumProvider = window.ethereum.providers.find((provider: any) => 
              provider.isMetaMask || provider._metamask
            );
          } else if (window.ethereum && !window.ethereum.isTrust && !window.ethereum.isCoinbaseWallet) {
            // Fallback: use ethereum if it's not Trust or Coinbase
            ethereumProvider = window.ethereum;
          }
          break;
        case 'trustwallet':
          // Check for Trust Wallet specifically
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
          // Check for Coinbase Wallet specifically
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
          // Binance has its own provider
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

  // Switch Network
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

  // Check existing connection
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

  // Staking Functions
  const handleStake = async (amount: string, lockPeriod: number) => {
    if (!provider || !account) {
      showToast("Please connect wallet first", "error");
      return;
    }

    // Check if user already has an active stake
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

      // Approve first
      const vecContract = new ethers.Contract(currentConfig.VEC_TOKEN_ADDRESS, ERC20_ABI, signer);
      const amountWei = ethers.parseUnits(amount, 18);
      
      const approveTx = await vecContract.approve(currentConfig.STAKING_CONTRACT_ADDRESS, amountWei);
      await approveTx.wait();

      // Then stake
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

    // Check if lock period has ended
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

  // Faucet Function
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

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white font-['Inter',sans-serif] antialiased">
      {/* Deep Space Background with Gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0B0E11]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B0E11]"></div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Layout */}
      <div className="lg:ml-64">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 glass-card flex items-center justify-center rounded-lg hover:bg-white/10 transition-all"
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-white`}></i>
        </button>

        {/* Global Header */}
        <GlobalHeader
          account={account}
          currentChain={currentChain}
          onConnect={() => setIsWalletModalOpen(true)}
          onDisconnect={disconnectWallet}
          onSwitchChain={switchNetwork}
          supportedChains={SUPPORTED_CHAINS}
        />

        {/* Main Content */}
        <main className="relative">
        {/* Hero Section */}
        {activeSection === Section.DASHBOARD && (
          <HeroSection
            tvl={protocolStats.tvl}
            totalStakers={protocolStats.totalStakers}
            apy={protocolStats.apy}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8">
          {/* Dashboard Section */}
          {activeSection === Section.DASHBOARD && (
            <div className="space-y-6">
              {/* Hero Section */}
              <HeroSection
                tvl={protocolStats.tvl}
                totalStakers={protocolStats.totalStakers}
                apy={protocolStats.apy}
              />

              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-400 uppercase tracking-wider">Native Balance</div>
                    <i className="fas fa-wallet text-cyan-400/50"></i>
                  </div>
                  <div className="text-3xl font-bold">{balances.native} {currentChain.nativeCurrency.symbol}</div>
                </div>
                <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-400 uppercase tracking-wider">VEC Balance</div>
                    <i className="fas fa-coins text-cyan-400/50"></i>
                  </div>
                  <div className="text-3xl font-bold text-cyan-400">{balances.vec} VEC</div>
                </div>
                <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-400 uppercase tracking-wider">Staked</div>
                    <i className="fas fa-lock text-blue-400/50"></i>
                  </div>
                  <div className="text-3xl font-bold text-blue-400">{balances.staked} VEC</div>
                </div>
              </div>

              {/* Additional Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Faucet Card */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <i className="fas fa-faucet text-cyan-400"></i>
                    VEC Faucet
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">Get test tokens for {currentChain.name}</p>
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

          {/* Swap Section - Uniswap Style */}
          {activeSection === Section.SWAP && (
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <i className="fas fa-exchange-alt text-cyan-400"></i>
                    Swap Tokens
                  </h2>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                    <i className="fas fa-cog"></i>
                  </button>
                </div>

                {/* From Token */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400 font-medium">From</label>
                    <span className="text-xs text-gray-500">Balance: {balances.vec} VEC</span>
                  </div>
                  <div className="glass-card p-4 flex items-center gap-4">
                    <input
                      type="number"
                      placeholder="0.0"
                      className="flex-1 text-3xl font-bold bg-transparent text-white placeholder-gray-600 focus:outline-none"
                    />
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-coins text-white text-xs"></i>
                      </div>
                      <span className="font-semibold">VEC</span>
                      <i className="fas fa-chevron-down text-xs text-gray-400"></i>
                    </button>
                  </div>
                </div>

                {/* Swap Arrow Button */}
                <div className="flex justify-center -my-2 relative z-10">
                  <button className="w-12 h-12 bg-white/10 hover:bg-white/20 border-4 border-[#0B0E11] rounded-full flex items-center justify-center transition-all hover:scale-110">
                    <i className="fas fa-arrow-down text-cyan-400"></i>
                  </button>
                </div>

                {/* To Token */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400 font-medium">To</label>
                    <span className="text-xs text-gray-500">Balance: {balances.native} {currentChain.nativeCurrency.symbol}</span>
                  </div>
                  <div className="glass-card p-4 flex items-center gap-4">
                    <input
                      type="number"
                      placeholder="0.0"
                      className="flex-1 text-3xl font-bold bg-transparent text-white placeholder-gray-600 focus:outline-none"
                    />
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <i className="fab fa-btc text-white text-xs"></i>
                      </div>
                      <span className="font-semibold">{currentChain.nativeCurrency.symbol}</span>
                      <i className="fas fa-chevron-down text-xs text-gray-400"></i>
                    </button>
                  </div>
                </div>

                {/* Swap Info */}
                <div className="glass-card p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price</span>
                    <span className="text-white">1 VEC = 0.001 {currentChain.nativeCurrency.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Slippage Tolerance</span>
                    <span className="text-white">0.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Network Fee</span>
                    <span className="text-white">~0.001 {currentChain.nativeCurrency.symbol}</span>
                  </div>
                </div>

                {/* Swap Button */}
                <button className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={!account}>
                  {!account ? 'Connect Wallet' : 'Swap'}
                </button>
              </div>
            </div>
          )}

          {/* NFTs Section */}
          {activeSection === Section.NFT && (
            <div className="space-y-6">
              <div className="glass-card p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <i className="fas fa-image text-cyan-400"></i>
                  NFT Collection
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card p-4 hover:scale-105 transition-transform">
                      <div className="aspect-square bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl mb-4 flex items-center justify-center">
                        <i className="fas fa-image text-4xl text-gray-500"></i>
                      </div>
                      <h3 className="font-bold mb-2">NFT #{i}</h3>
                      <p className="text-sm text-gray-400">Coming Soon</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Governance Section - Professional Coming Soon */}
          {activeSection === Section.GOVERNANCE && (
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-16 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <i className="fas fa-vote-yea text-6xl text-cyan-400/50"></i>
                </div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Governance
                </h2>
                <p className="text-xl text-gray-400 mb-2">Coming Soon</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  DAO voting and proposal features will be available in the next update. 
                  Participate in protocol governance and shape the future of VelaCore.
                </p>
                <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-400"></i>
                    <span>Proposal Creation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-400"></i>
                    <span>Voting System</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-400"></i>
                    <span>Governance Tokens</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bridge Section */}
          {activeSection === 'bridge' as Section && (
            <div className="space-y-6">
              <div className="glass-card p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <i className="fas fa-bridge text-cyan-400"></i>
                  Cross-Chain Bridge
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6">
                    <label className="block text-sm text-gray-400 mb-2">From Chain</label>
                    <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50">
                      <option>BNB Smart Chain</option>
                      <option>Flow Testnet</option>
                    </select>
                  </div>
                  <div className="glass-card p-6">
                    <label className="block text-sm text-gray-400 mb-2">To Chain</label>
                    <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50">
                      <option>Flow Testnet</option>
                      <option>BNB Smart Chain</option>
                    </select>
                  </div>
                </div>
                <div className="glass-card p-6 mt-6">
                  <label className="block text-sm text-gray-400 mb-2">Amount</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <button className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-semibold">
                  Bridge Tokens
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
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
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-card p-8">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-center text-gray-400 font-medium">Processing transaction...</p>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.5rem;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        
        .glass-card:hover {
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.2);
        }

        /* Responsive adjustments handled by Tailwind classes */

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes zoom-in {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }

        @keyframes slide-in-from-bottom-5 {
          from { transform: translate(-50%, 100%); }
          to { transform: translate(-50%, 0); }
        }

        .animate-in {
          animation: fade-in 0.2s ease-out;
        }

        .fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .zoom-in {
          animation: zoom-in 0.2s ease-out;
        }

        .slide-in-from-bottom-5 {
          animation: slide-in-from-bottom-5 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
