
export interface Asset {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  isNative?: boolean;
}

export interface UserBalances {
  native: string; // BNB or FLOW
  vec: string;
  staked: string;
  rewards: string;
}

export enum Section {
  DASHBOARD = 'dashboard',
  SWAP = 'swap',
  STAKE = 'stake',
  NFT = 'nft',
  GOVERNANCE = 'governance'
}

export interface NetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}
