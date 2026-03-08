import { NetworkConfig } from './types';

/**
 * VELA-CORE PROTOCOL v1.3.0 - CONSTANTS & SCHEMATICS
 * --------------------------------------------------
 * BSC + Flow + CreditCoin
 * All sensitive values from .env — never hardcode secrets.
 */

export const CONFIG = {
  CHAIN_ID:     97,
  CHAIN_ID_HEX: '0x61',
  RPC_URL:      process.env.REACT_APP_BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  EXPLORER_URL: 'https://testnet.bscscan.com',

  // Legacy references (BSC, kept for backward compatibility)
  VEC_TOKEN_ADDRESS:        process.env.REACT_APP_BSC_TOKEN_ADDRESS   || '0x1D3516E449aC7f08F5773Dc8d984E1174420867a',
  STAKING_CONTRACT_ADDRESS: process.env.REACT_APP_BSC_STAKING_ADDRESS || '0x8c8A80E75D38d29A27770f90798DF479b294aC51',

  BNB_RPC_URL:        process.env.REACT_APP_BSC_RPC_URL        || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  FLOW_RPC_URL:       process.env.REACT_APP_FLOW_RPC_URL       || 'https://testnet.evm.nodes.onflow.org/',
  CREDITCOIN_RPC_URL: process.env.REACT_APP_CREDITCOIN_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network',

  GEMINI_API_KEY:  process.env.REACT_APP_GEMINI_API_KEY  || '',
  BSCSCAN_API_KEY: process.env.REACT_APP_BSCSCAN_API_KEY || '',
};

// ── Network Params ─────────────────────────────────────────────────────────────

export const BSC_TESTNET_PARAMS: NetworkConfig = {
  chainId:           '0x61',
  chainName:         'BNB Smart Chain Testnet',
  nativeCurrency:    { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
  rpcUrls:           [CONFIG.BNB_RPC_URL],
  blockExplorerUrls: ['https://testnet.bscscan.com'],
};

export const FLOW_TESTNET_PARAMS: NetworkConfig = {
  chainId:           '0x221',
  chainName:         'Flow Testnet',
  nativeCurrency:    { name: 'FLOW', symbol: 'FLOW', decimals: 18 },
  rpcUrls:           [CONFIG.FLOW_RPC_URL],
  blockExplorerUrls: ['https://evm-testnet.flowscan.io'],
};

export const CREDITCOIN_TESTNET_PARAMS: NetworkConfig = {
  chainId:           '0x18E83',   // 102019 in hex
  chainName:         'CreditCoin Testnet',
  nativeCurrency:    { name: 'CTC', symbol: 'CTC', decimals: 18 },
  rpcUrls:           [CONFIG.CREDITCOIN_RPC_URL],
  blockExplorerUrls: ['https://creditcoin-testnet.blockscout.com'],
};

// ── ABIs ──────────────────────────────────────────────────────────────────────

export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

export const STAKING_ABI = [
  // Core Logic
  'function stake(uint256 amount, uint8 lockupPeriod)',
  'function withdraw()',
  'function claimRewards()',
  'function emergencyWithdraw()',
  // State Variables
  'function totalStaked() view returns (uint256)',
  'function totalStakers() view returns (uint256)',
  'function totalRewardsDistributed() view returns (uint256)',
  'function totalPenaltiesCollected() view returns (uint256)',
  'function rewardPerBlock() view returns (uint256)',
  'function minStakeAmount() view returns (uint256)',
  'function maxStakeAmount() view returns (uint256)',
  // Views
  'function pendingRewards(address user) view returns (uint256)',
  'function getUserStakeInfo(address user) view returns (uint256 stakedAmount, uint256 pendingReward, uint256 stakeTime, uint256 unlockTime, uint256 totalClaimedRewards, uint256 timeRemaining, uint256 penaltyAmount, uint256 lockupPeriod, uint256 projectedAPY, bool isActive, bool canWithdraw)',
  'function getStats() view returns (uint256 totalStakedTokens, uint256 totalDistributedRewards, uint256 totalPenalties, uint256 activeStakers, uint256 currentRewardRate, uint256 baseAPY)',
  'function calculateAPYForPeriod(uint8 period) view returns (uint256)',
  // Events
  'event Staked(address indexed user, uint256 amount, uint8 lockupPeriod, uint256 unlockTime, uint256 projectedAPY)',
  'event Withdrawn(address indexed user, uint256 amount, uint256 penalty, bool earlyWithdrawal)',
  'event RewardClaimed(address indexed user, uint256 amount)',
];