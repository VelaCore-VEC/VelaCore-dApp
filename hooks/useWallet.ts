import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { detectAllWallets, quickConnect, getWalletProvider } from '../utils/wallet';

// Cache for wallet detection
let cachedWallets: any[] | null = null;

/**
 * Enhanced useWallet Hook with multi-wallet support
 */
export const useWallet = (currentChain: any, onDataRefresh: (account: string, provider: any) => Promise<void>) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<any[]>([]);
  const [connectedWalletId, setConnectedWalletId] = useState<string | null>(null);
  const connectionAttemptRef = useRef<boolean>(false);

  // Auto-detect wallets on mount
  useEffect(() => {
    const detectWallets = () => {
      if (cachedWallets) {
        setDetectedWallets(cachedWallets);
      } else {
        const wallets = detectAllWallets();
        cachedWallets = wallets;
        setDetectedWallets(wallets);
      }
    };

    detectWallets();

    // Listen for wallet changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setAccount(null);
        setProvider(null);
        setConnectedWalletId(null);
        localStorage.removeItem('lastConnectedWallet');
      } else if (account !== accounts[0]) {
        setAccount(accounts[0]);
        onDataRefresh(accounts[0], provider);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    // Auto-connect on page load if previously connected
    const autoConnect = async () => {
      if (connectionAttemptRef.current) return;
      
      const quickConnectResult = await quickConnect();
      if (quickConnectResult) {
        setAccount(quickConnectResult.account);
        setProvider(quickConnectResult.provider);
        setConnectedWalletId(quickConnectResult.walletId);
        await onDataRefresh(quickConnectResult.account, quickConnectResult.provider);
      }
      connectionAttemptRef.current = true;
    };

    autoConnect();

    // Add event listeners for all detected providers
    detectedWallets.forEach(wallet => {
      const walletProvider = wallet.getProvider();
      if (walletProvider && walletProvider.on) {
        walletProvider.on('accountsChanged', handleAccountsChanged);
        walletProvider.on('chainChanged', handleChainChanged);
      }
    });

    return () => {
      // Cleanup event listeners
      detectedWallets.forEach(wallet => {
        const walletProvider = wallet.getProvider();
        if (walletProvider && walletProvider.removeListener) {
          walletProvider.removeListener('accountsChanged', handleAccountsChanged);
          walletProvider.removeListener('chainChanged', handleChainChanged);
        }
      });
    };
  }, [onDataRefresh, account, provider]);

  // Enhanced connect function with timeout and better error handling
  const connect = useCallback(async (walletId: string, supportedChains: any[] = []) => {
    setLoading(true);
    try {
      const wallets = detectAllWallets();
      const wallet = wallets.find(w => w.id === walletId);
      
      if (!wallet) {
        throw new Error(`${walletId} wallet not found`);
      }

      if (!wallet.isInstalled()) {
        // Wallet not installed, open download page
        if (wallet.downloadUrl) {
          window.open(wallet.downloadUrl, '_blank');
        }
        throw new Error(`${wallet.name} is not installed`);
      }

      const ethereumProvider = wallet.getProvider();
      
      // Set timeout for connection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Connection timeout. Please try again.")), 15000)
      );

      // Request accounts
      const accountsPromise = ethereumProvider.request({ 
        method: 'eth_requestAccounts' 
      });

      const accounts = await Promise.race([accountsPromise, timeoutPromise]) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts received");
      }

      // Handle chain switching if needed
      if (walletId !== 'casper') { // Casper has different chain handling
        try {
          const browserProvider = new ethers.BrowserProvider(ethereumProvider, 'any');
          const network = await browserProvider.getNetwork();
          
          const isSupportedChain = supportedChains.length === 0 || 
            supportedChains.some(chain => Number(network.chainId) === chain.chainId);

          if (!isSupportedChain && currentChain && currentChain.chainIdHex) {
            try {
              await ethereumProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: currentChain.chainIdHex }]
              });
            } catch (switchError: any) {
              // If chain not added, suggest adding it
              if (switchError.code === 4902 && currentChain.addChainParams) {
                await ethereumProvider.request({
                  method: 'wallet_addEthereumChain',
                  params: [currentChain.addChainParams]
                });
              }
            }
          }
        } catch (chainError) {
          console.warn('Chain switch error:', chainError);
          // Continue with connection even if chain switch fails
        }
      }

      // Save connection state
      setAccount(accounts[0]);
      setProvider(ethereumProvider);
      setConnectedWalletId(walletId);
      
      // Store last connected wallet for auto-connect
      localStorage.setItem('lastConnectedWallet', walletId);
      
      // Refresh data
      await onDataRefresh(accounts[0], ethereumProvider);
      
      return { 
        success: true, 
        walletId, 
        account: accounts[0],
        provider: ethereumProvider 
      };
    } catch (error: any) {
      // Enhanced error messages
      let errorMessage = error.message || 'Connection failed';
      
      if (error.message.includes('rejected')) {
        errorMessage = 'Connection rejected by user';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please try again.';
      } else if (error.message.includes('not installed')) {
        errorMessage = `${walletId} wallet is not installed`;
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentChain, onDataRefresh]);

  // Disconnect function
  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setConnectedWalletId(null);
    localStorage.removeItem('lastConnectedWallet');
  }, []);

  // Get installed wallets
  const getInstalledWallets = useCallback(() => {
    return detectedWallets.filter(wallet => wallet.isInstalled());
  }, [detectedWallets]);

  // Get not installed wallets
  const getNotInstalledWallets = useCallback(() => {
    return detectedWallets.filter(wallet => !wallet.isInstalled());
  }, [detectedWallets]);

  return { 
    account, 
    provider, 
    loading, 
    connect, 
    disconnect,
    detectedWallets,
    connectedWalletId,
    getInstalledWallets,
    getNotInstalledWallets
  };
};