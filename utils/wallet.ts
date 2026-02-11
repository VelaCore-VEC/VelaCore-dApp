// utils/wallet.ts
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';

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

export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  isInstalled: () => boolean;
  getProvider: () => any;
  downloadUrl?: string;
}

// WalletConnect instance
let walletConnectConnector: any = null;

// Initialize WalletConnect
export const initWalletConnect = () => {
  if (walletConnectConnector) return walletConnectConnector;
  
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
  
  return walletConnectConnector;
};

// Connect via WalletConnect
export const connectWalletConnect = async (): Promise<{ account: string, provider: any }> => {
  try {
    const connector = initWalletConnect();
    
    if (!connector.connected) {
      await connector.createSession();
    }
    
    return new Promise((resolve, reject) => {
      connector.on('connect', (error: any, payload: any) => {
        if (error) {
          reject(error);
          return;
        }
        
        const { accounts } = payload.params[0];
        resolve({
          account: accounts[0],
          provider: connector
        });
      });
      
      connector.on('session_update', (error: any, payload: any) => {
        if (error) {
          reject(error);
          return;
        }
      });
      
      connector.on('disconnect', (error: any) => {
        if (error) {
          reject(error);
          return;
        }
      });
    });
  } catch (error) {
    console.error('WalletConnect error:', error);
    throw error;
  }
};

// Detect all wallets
export const detectAllWallets = (): WalletProvider[] => {
  const wallets: WalletProvider[] = [];
  const ethereum = window.ethereum;

  // WalletConnect (Universal)
  wallets.push({
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: 'fas fa-qrcode',
    color: 'from-blue-400 to-indigo-500',
    isInstalled: () => true, // Always available
    getProvider: () => initWalletConnect(),
    downloadUrl: 'https://walletconnect.com/'
  });

  // MetaMask detection
  if (ethereum?.isMetaMask || (Array.isArray(ethereum) && ethereum.some(p => p.isMetaMask))) {
    wallets.push({
      id: 'metamask',
      name: 'MetaMask',
      icon: 'fab fa-ethereum',
      color: 'from-orange-500 to-yellow-500',
      isInstalled: () => {
        if (ethereum?.isMetaMask) return true;
        if (Array.isArray(ethereum)) return ethereum.some(p => p.isMetaMask);
        if (ethereum?.providers) return ethereum.providers.some((p: any) => p.isMetaMask);
        return false;
      },
      getProvider: () => {
        if (ethereum?.isMetaMask) return ethereum;
        if (Array.isArray(ethereum)) return ethereum.find(p => p.isMetaMask);
        if (ethereum?.providers) return ethereum.providers.find((p: any) => p.isMetaMask);
        return ethereum;
      },
      downloadUrl: 'https://metamask.io/download/'
    });
  }

  // Trust Wallet detection
  if (window.trustwallet || ethereum?.isTrust) {
    wallets.push({
      id: 'trustwallet',
      name: 'Trust Wallet',
      icon: 'fas fa-wallet',
      color: 'from-blue-500 to-cyan-500',
      isInstalled: () => !!(window.trustwallet || ethereum?.isTrust),
      getProvider: () => window.trustwallet || ethereum,
      downloadUrl: 'https://trustwallet.com/download'
    });
  }

  // Coinbase detection
  if (window.coinbaseWalletExtension || ethereum?.isCoinbaseWallet) {
    wallets.push({
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: 'fab fa-bitcoin',
      color: 'from-blue-600 to-indigo-600',
      isInstalled: () => !!(window.coinbaseWalletExtension || ethereum?.isCoinbaseWallet),
      getProvider: () => window.coinbaseWalletExtension || ethereum,
      downloadUrl: 'https://www.coinbase.com/wallet/downloads'
    });
  }

  // Binance detection
  if (window.BinanceChain) {
    wallets.push({
      id: 'binance',
      name: 'Binance Wallet',
      icon: 'fab fa-btc',
      color: 'from-yellow-500 to-orange-500',
      isInstalled: () => !!window.BinanceChain,
      getProvider: () => window.BinanceChain,
      downloadUrl: 'https://www.binance.org/wallet'
    });
  }

  // Casper detection
  if (window.casperlabsHelper) {
    wallets.push({
      id: 'casper',
      name: 'Casper Wallet',
      icon: 'fas fa-gem',
      color: 'from-purple-600 to-pink-600',
      isInstalled: () => !!window.casperlabsHelper,
      getProvider: () => window.casperlabsHelper,
      downloadUrl: 'https://www.casperwallet.io/'
    });
  }

  // Phantom detection
  if (window.phantom || window.solana?.isPhantom) {
    wallets.push({
      id: 'phantom',
      name: 'Phantom',
      icon: 'fas fa-ghost',
      color: 'from-purple-500 to-violet-500',
      isInstalled: () => !!(window.phantom || window.solana?.isPhantom),
      getProvider: () => window.phantom || window.solana,
      downloadUrl: 'https://phantom.app/download'
    });
  }

  return wallets;
};

// Get specific wallet provider
export const getWalletProvider = (walletId: string) => {
  const wallets = detectAllWallets();
  const wallet = wallets.find(w => w.id === walletId);
  return wallet ? wallet.getProvider() : null;
};

// Quick connect
export const quickConnect = async (): Promise<{ account: string, provider: any, walletId: string } | null> => {
  try {
    const lastConnectedWallet = localStorage.getItem('velacore_lastConnectedWallet');
    if (!lastConnectedWallet) return null;

    const wallets = detectAllWallets();
    const wallet = wallets.find(w => w.id === lastConnectedWallet);
    
    if (wallet && wallet.isInstalled()) {
      const provider = wallet.getProvider();
      
      if (wallet.id === 'walletconnect') {
        if (provider.connected) {
          const accounts = provider.accounts;
          if (accounts && accounts.length > 0) {
            return {
              account: accounts[0],
              provider,
              walletId: wallet.id
            };
          }
        }
      } else {
        try {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            return {
              account: accounts[0],
              provider,
              walletId: wallet.id
            };
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