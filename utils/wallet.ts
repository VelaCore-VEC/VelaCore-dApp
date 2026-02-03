/**
 * Wallet Utilities
 * Handles wallet provider detection and connection logic
 */

export const getEthereumProvider = (): any => {
  if (Array.isArray(window.ethereum)) {
    return window.ethereum[0];
  }
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    return window.ethereum.providers[0];
  }
  return window.ethereum;
};

export const fmtAddr = (addr: string | null): string => {
  if (!addr) return '0x000...0000';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export const getWalletProvider = (walletType: string): any => {
  switch (walletType) {
    case 'metamask':
      return getEthereumProvider();
    case 'trustwallet':
      return window.trustwallet || (window.ethereum?.isTrust ? window.ethereum : null);
    case 'coinbase':
      return window.coinbaseWalletExtension;
    case 'binance':
      return window.BinanceChain;
    default:
      return null;
  }
};

