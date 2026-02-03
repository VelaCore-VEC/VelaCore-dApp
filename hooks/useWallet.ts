import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getWalletProvider, getEthereumProvider } from '../utils/wallet';

/**
 * useWallet Hook
 * Manages wallet connection state and operations
 */
export const useWallet = (currentChain: any, onDataRefresh: (account: string, provider: any) => Promise<void>) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Check existing connection
  useEffect(() => {
    const checkConnection = async () => {
      const ethereumProvider = getEthereumProvider();
      if (ethereumProvider) {
        try {
          const accounts = await ethereumProvider.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setProvider(ethereumProvider);
            await onDataRefresh(accounts[0], ethereumProvider);
          }
        } catch (error) {
          console.warn("Connection check failed:", error);
        }
      }
    };
    checkConnection();
  }, [onDataRefresh]);

  const connect = useCallback(async (walletType: string, supportedChains: any[]) => {
    setLoading(true);
    try {
      const ethereumProvider = getWalletProvider(walletType);

      if (!ethereumProvider) {
        throw new Error(`${walletType} not detected`);
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
      const isSupportedChain = supportedChains.some(chain => Number(network.chainId) === chain.chainId);

      if (!isSupportedChain) {
        try {
          await ethereumProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: currentChain.chainIdHex }]
          });
        } catch (err: any) {
          if (err.code === 4902) {
            // Chain not added, will be handled by caller
          }
        }
      }

      setAccount(accounts[0]);
      setProvider(ethereumProvider);
      await onDataRefresh(accounts[0], ethereumProvider);
      
      return true;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentChain, onDataRefresh]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
  }, []);

  return { account, provider, loading, connect, disconnect };
};

