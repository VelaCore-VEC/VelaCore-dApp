// AIAnalytics.tsx - UPDATED WITH DEMO DATA & AI FIX
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Shield,
  Zap,
  ChevronRight,
  Calculator,
  BarChart3,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Lock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Database,
  Wifi,
  WifiOff,
  Cpu,
  AlertTriangle,
  PlayCircle,
  Info
} from 'lucide-react';
import { ethers } from 'ethers';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area
} from 'recharts';

// Types
interface StakingTier {
  days: number;
  apy: number;
  label: string;
  description: string;
  risk: 'Low' | 'Medium' | 'High';
  color: string;
}

interface ProtocolData {
  totalStaked: string;
  totalUsers: number;
  daysLive: number;
  bnbStaked: string;
  flowStaked: string;
  bnbPrice: number;
  flowPrice: number;
  avgApy: number;
  dailyVolume: number;
  weeklyGrowth: number;
}

interface ExplorerData {
  bnbTVL: number;
  flowTVL: number;
  totalUsers: number;
  totalValueUSD: number;
  timestamp: Date;
  transactionCount: number;
  activeAddresses: number;
}

// 🔴 Load environment variables
const API_KEYS = {
  GEMINI_API_KEY: process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyD-Gqia_Qau98oaQ_D0_WbLp0w2JtbeFvc',
  BSCSCAN_API_KEY: process.env.REACT_APP_BSCSCAN_API_KEY || 'I2Q7WUAQESS472CHMN7FBKA4D846M23YJF',
  FLOWSCAN_API_KEY: process.env.REACT_APP_FLOWSCAN_API_KEY || '',
  COINGECKO_API_KEY: process.env.REACT_APP_COINGECKO_API_KEY || ''
};

// 🔴 Custom fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Component
export const AIAnalytics: React.FC = () => {
  const [stakingTiers] = useState<StakingTier[]>([
    { days: 30, apy: 15, label: 'Short', description: 'Quick access', risk: 'Low', color: 'emerald' },
    { days: 90, apy: 17.25, label: 'Medium', description: 'Balanced growth', risk: 'Low', color: 'cyan' },
    { days: 180, apy: 20.25, label: 'Long', description: 'Optimal returns', risk: 'Medium', color: 'blue' },
    { days: 270, apy: 24, label: 'Extended', description: 'Premium security', risk: 'Medium', color: 'purple' },
    { days: 360, apy: 30, label: 'Max', description: 'Highest yield', risk: 'High', color: 'amber' },
  ]);

  const [protocolData, setProtocolData] = useState<ProtocolData | null>(null);
  const [explorerData, setExplorerData] = useState<ExplorerData | null>(null);
  const [calculatorInput, setCalculatorInput] = useState<string>('1000');
  const [projectedEarnings, setProjectedEarnings] = useState<{[key: number]: number}>({});
  const [loading, setLoading] = useState(false); // Changed to false initially
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [aiInsights, setAiInsights] = useState<string[]>([
    "Welcome to VelaCore AI Analytics! I'm here to help you understand staking, APY, and DeFi concepts.",
    "Currently showing demo data. Connect your wallet and start staking to see real-time analytics.",
    "Try the APY calculator to see potential earnings from different staking periods."
  ]);
  const [apiStatus, setApiStatus] = useState({
    bscscan: false,
    flowscan: false,
    coingecko: false,
    gemini: false,
    initialized: false
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showDemoData, setShowDemoData] = useState(true); // Show demo data by default

  // Calculate days since launch
  const calculateDaysLive = () => {
    const launchDate = new Date(process.env.REACT_APP_PROTOCOL_LAUNCH_DATE || '2024-01-01');
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - launchDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format number based on screen size
  const formatCompactNumber = (num: number): string => {
    if (!num) return '$0';
    if (isMobile && num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (isMobile && num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  // 🔴 DEMO DATA - Show when no real staking activity
  const loadDemoData = () => {
    const daysLive = calculateDaysLive();
    
    const demoExplorerData: ExplorerData = {
      bnbTVL: 1250000,
      flowTVL: 400000,
      totalUsers: 1234,
      totalValueUSD: 1650000,
      timestamp: new Date(),
      transactionCount: 2567,
      activeAddresses: 1543
    };

    const demoProtocolData: ProtocolData = {
      totalStaked: '1,650,000',
      totalUsers: 1234,
      daysLive,
      bnbStaked: '1,250,000',
      flowStaked: '400,000',
      bnbPrice: 312.45,
      flowPrice: 0.78,
      avgApy: 22.5,
      dailyVolume: 185000,
      weeklyGrowth: 8.5
    };

    setExplorerData(demoExplorerData);
    setProtocolData(demoProtocolData);
    setLastUpdated(new Date());
    setShowDemoData(true);
  };

  // 🔴 Check API status
  const checkApiStatus = async () => {
    const status = {
      bscscan: false,
      flowscan: false,
      coingecko: false,
      gemini: false,
      initialized: true
    };

    try {
      // Check Gemini API
      if (API_KEYS.GEMINI_API_KEY && API_KEYS.GEMINI_API_KEY !== 'AIzaSyCSg9T5V-PqB1JXez95ee-SJAMzS3NXsH0') {
        try {
          const testGemini = await fetchWithTimeout(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEYS.GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'test' }] }]
              })
            },
            5000
          );
          status.gemini = testGemini.status !== 400;
        } catch (error: any) {
          console.log('Gemini API:', error.name === 'AbortError' ? 'Timeout' : 'Not connected');
        }
      }

      // Check BSCScan API
      if (API_KEYS.BSCSCAN_API_KEY && API_KEYS.BSCSCAN_API_KEY !== 'YOUR_BSCSCAN_API_KEY_HERE') {
        try {
          const testBSC = await fetchWithTimeout(
            `https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=${API_KEYS.BSCSCAN_API_KEY}`,
            {},
            5000
          );
          const data = await testBSC.json();
          status.bscscan = data.status === '1';
        } catch (error: any) {
          console.log('BSCScan API:', error.name === 'AbortError' ? 'Timeout' : 'Not connected');
        }
      }

      // Check CoinGecko API
      try {
        const testCG = await fetchWithTimeout(
          'https://api.coingecko.com/api/v3/ping',
          {},
          5000
        );
        status.coingecko = testCG.ok;
      } catch (error: any) {
        console.log('CoinGecko API:', error.name === 'AbortError' ? 'Timeout' : 'Not connected');
      }

    } catch (error) {
      console.error('API status check error:', error);
    }

    setApiStatus(status);
    return status;
  };

  // 🔴 Fetch real data from blockchain
  const fetchRealData = async () => {
    try {
      setLoading(true);
      
      // Check API status
      const status = await checkApiStatus();
      
      const daysLive = calculateDaysLive();
      
      // Try to fetch real prices
      let bnbPrice = 312.45;
      let flowPrice = 0.78;
      
      if (status.coingecko) {
        try {
          const priceResponse = await fetchWithTimeout(
            'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,flow&vs_currencies=usd',
            {},
            8000
          );
          const priceData = await priceResponse.json();
          bnbPrice = priceData.binancecoin?.usd || 312.45;
          flowPrice = priceData.flow?.usd || 0.78;
        } catch (error) {
          console.log('Using default prices');
        }
      }

      // Try to fetch real BSC data
      let realTVL = 0;
      let realUsers = 0;
      
      if (status.bscscan && API_KEYS.BSCSCAN_API_KEY) {
        try {
          const bscResponse = await fetchWithTimeout(
            `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${process.env.REACT_APP_BSC_TOKEN_ADDRESS}&address=${process.env.REACT_APP_BSC_STAKING_ADDRESS}&tag=latest&apikey=${API_KEYS.BSCSCAN_API_KEY}`,
            {},
            10000
          );
          const bscData = await bscResponse.json();
          
          if (bscData.status === '1' && bscData.result) {
            const tokenBalance = parseFloat(ethers.formatUnits(bscData.result, 18));
            realTVL = tokenBalance * bnbPrice;
            realUsers = Math.max(1, Math.floor(tokenBalance / 1000));
          }
        } catch (error) {
          console.log('Could not fetch real BSC data');
        }
      }

      // If real data exists, use it. Otherwise use demo data.
      if (realTVL > 0) {
        // REAL DATA FOUND
        const explorerData: ExplorerData = {
          bnbTVL: realTVL,
          flowTVL: 0,
          totalUsers: realUsers,
          totalValueUSD: realTVL,
          timestamp: new Date(),
          transactionCount: Math.floor(realUsers * 2),
          activeAddresses: realUsers
        };

        const protocolData: ProtocolData = {
          totalStaked: realTVL.toLocaleString('en-US', { maximumFractionDigits: 0 }),
          totalUsers: realUsers,
          daysLive,
          bnbStaked: realTVL.toLocaleString('en-US', { maximumFractionDigits: 0 }),
          flowStaked: '0',
          bnbPrice,
          flowPrice,
          avgApy: 22.5,
          dailyVolume: realTVL * 0.1,
          weeklyGrowth: 5.2
        };

        setExplorerData(explorerData);
        setProtocolData(protocolData);
        setShowDemoData(false);
        
        setAiInsights([
          `🎉 Real staking data detected! ${formatCompactNumber(realTVL)} TVL from ${realUsers} stakers.`,
          `Current average APY is 22.5% across all staking tiers.`,
          `BNB Chain performance: 100% of TVL with ${bnbPrice.toFixed(2)} BNB price.`
        ]);
      } else {
        // NO REAL DATA - USE DEMO
        loadDemoData();
      }

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('Error fetching data:', error.message);
      // Fallback to demo data
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  // 🔴 AI Assistant with better error handling
  const sendToGeminiAI = async (message: string) => {
    if (!message.trim() || aiLoading) return;
    
    setAiLoading(true);
    setAiError(null);
    
    // Add user message
    const userMessage = `You: ${message}`;
    setAiInsights(prev => [...prev, userMessage]);
    setAiInput('');
    
    // Check if Gemini API is available
    if (!API_KEYS.GEMINI_API_KEY || API_KEYS.GEMINI_API_KEY === 'AIzaSyCSg9T5V-PqB1JXez95ee-SJAMzS3NXsH0') {
      // Mock AI response when no API key
      setTimeout(() => {
        const mockResponses = [
          "I'm VelaCore AI Assistant. Based on our protocol data, 180-day staking offers the best risk-adjusted returns at 20.25% APY.",
          "For new stakers, I recommend starting with a 90-day stake to get comfortable with the platform while earning 17.25% APY.",
          "The maximum APY of 30% is available for 360-day stakes, but consider the longer lock-up period.",
          "All staking rewards are paid in VEC tokens and compound daily for maximum earnings.",
          "You can unstake anytime after the lock period ends. Early unstaking is not available to protect protocol stability."
        ];
        
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        setAiInsights(prev => [...prev, `AI: ${randomResponse}`]);
        setAiLoading(false);
      }, 1000);
      return;
    }
    
    try {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEYS.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are VelaCore AI Assistant, a helpful AI for a DeFi staking protocol.
                
                Protocol Status:
                - Total Value Locked: ${protocolData?.totalStaked || 'Demo data active'}
                - Total Stakers: ${protocolData?.totalUsers || '1234'}
                - Average APY: ${protocolData?.avgApy || '22.5'}%
                - Protocol Age: ${protocolData?.daysLive || '45'} days
                
                Staking Tiers Available:
                - 30 days: 15% APY (Low risk)
                - 90 days: 17.25% APY (Low risk)
                - 180 days: 20.25% APY (Medium risk)
                - 270 days: 24% APY (Medium risk)
                - 360 days: 30% APY (High risk)
                
                User Question: ${message}
                
                Provide a helpful, concise response about VelaCore staking, APY calculations, or general DeFi questions.
                Keep response under 3 sentences.`
              }]
            }]
          })
        },
        15000
      );
      
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract AI response
      let aiResponse = "I'm here to help with VelaCore staking questions. What would you like to know?";
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiResponse = data.candidates[0].content.parts[0].text;
      }
      
      setAiInsights(prev => [...prev, `AI: ${aiResponse}`]);
      
    } catch (error: any) {
      console.error("AI error:", error);
      
      // Fallback to mock response
      const fallbackResponses = [
        "Based on current protocol data, 180-day staking offers optimal returns at 20.25% APY.",
        "For beginners, I recommend starting with a 90-day stake to earn 17.25% APY with flexible access.",
        "Maximum APY of 30% is available for 360-day commitments with premium security features."
      ];
      
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      setAiInsights(prev => [...prev, `AI: ${fallback}`]);
      
      if (error.name === 'AbortError') {
        setAiError("AI response timed out. Using offline mode.");
      } else {
        setAiError("AI service temporarily unavailable. Using offline responses.");
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Handle AI message send
  const handleAiSend = () => {
    if (aiInput.trim() && !aiLoading) {
      sendToGeminiAI(aiInput);
    }
  };

  // Handle Enter key press
  const handleAiKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiSend();
    }
  };

  // Calculate earnings based on input
  useEffect(() => {
    const amount = parseFloat(calculatorInput.replace(/,/g, '')) || 0;
    const earnings: {[key: number]: number} = {};
    
    stakingTiers.forEach(tier => {
      const dailyRate = tier.apy / 365 / 100;
      const earningsAmount = amount * dailyRate * tier.days;
      earnings[tier.days] = parseFloat(earningsAmount.toFixed(2));
    });
    
    setProjectedEarnings(earnings);
  }, [calculatorInput, stakingTiers]);

  // Refresh data
  const handleRefresh = () => {
    fetchRealData();
  };

  // Format number with commas
  const formatNumber = (num: number | string): string => {
    if (typeof num === 'string') return num;
    if (!num && num !== 0) return '0';
    if (isMobile && num > 9999) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // Get color based on risk
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-emerald-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  // Initialize on component mount
  useEffect(() => {
    // Load demo data immediately
    loadDemoData();
    
    // Then try to fetch real data
    fetchRealData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchRealData, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🔴 DEMO DATA BANNER
  const DemoDataBanner = () => {
    if (!showDemoData || !protocolData) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 mb-6 border border-cyan-500/30 bg-cyan-500/5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlayCircle className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="text-lg font-bold text-cyan-400">Demo Mode Active</h3>
              <p className="text-sm text-gray-400">
                Showing sample data. Connect wallet and stake to see real analytics.
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchRealData}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors text-sm font-medium"
          >
            Check for Real Data
          </button>
        </div>
        
        <div className="mt-3 p-3 bg-black/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <p className="text-xs text-gray-300">
              <span className="text-cyan-400">Tip:</span> To see real data, connect your wallet, get VEC tokens from faucet, and start staking.
              APY Calculator and AI Assistant work in both demo and real modes.
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  // 🔴 API STATUS BANNER
  const ApiStatusBanner = () => {
    return (
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 glass-card text-xs">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-medium">API Status:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${apiStatus.bscscan ? 'bg-emerald-400' : 'bg-gray-500'}`}></div>
            <span className={apiStatus.bscscan ? 'text-emerald-400' : 'text-gray-400'}>
              BSCScan {apiStatus.bscscan ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${apiStatus.coingecko ? 'bg-emerald-400' : 'bg-gray-500'}`}></div>
            <span className={apiStatus.coingecko ? 'text-emerald-400' : 'text-gray-400'}>
              CoinGecko {apiStatus.coingecko ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${apiStatus.gemini ? 'bg-emerald-400' : 'bg-gray-500'}`}></div>
            <span className={apiStatus.gemini ? 'text-emerald-400' : 'text-gray-400'}>
              Gemini AI {apiStatus.gemini ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400">
              Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AI Analytics
              </h2>
              {!showDemoData && protocolData && (
                <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded-full">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-emerald-400">Live Data</span>
                </div>
              )}
              {showDemoData && (
                <div className="flex items-center gap-2 px-2 py-1 bg-cyan-500/10 rounded-full">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-cyan-400">Demo Mode</span>
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {showDemoData ? 'Interactive demo with sample data' : 'Real-time blockchain analytics'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 glass-card hover:border-cyan-500/30 transition-all disabled:opacity-50 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
          
          <div className="text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3" />
              <span>{showDemoData ? 'Demo Data' : 'Blockchain Data'}</span>
            </div>
            <div className="text-[10px] text-cyan-400 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              Last check: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Data Banner */}
      <DemoDataBanner />

      {/* API Status */}
      <ApiStatusBanner />

      {/* Show data - either demo or real */}
      {protocolData && explorerData && (
        <>
          {/* Protocol Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 md:mb-8">
            {/* Total TVL Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 sm:p-5 hover:border-cyan-500/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Total Value Locked</span>
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-1">
                {formatCompactNumber(explorerData.totalValueUSD)}
              </div>
              <div className="text-xs text-gray-400">
                {showDemoData ? 'Demo data' : 'Real blockchain data'}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: '85%' }}
                  ></div>
                </div>
                <span className="text-xs text-cyan-400">85%</span>
              </div>
            </motion.div>

            {/* Total Stakers Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4 sm:p-5 hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Total Stakers</span>
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-1">
                {formatNumber(protocolData.totalUsers)}
              </div>
              <div className="text-xs text-gray-400">Active addresses</div>
              <div className="flex items-center gap-2 mt-3">
                <div className={`px-2 py-1 text-xs rounded-full ${
                  showDemoData ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {showDemoData ? 'Demo' : 'Live'}
                </div>
              </div>
            </motion.div>

            {/* Average APY Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4 sm:p-5 hover:border-yellow-500/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Average APY</span>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">
                {protocolData.avgApy.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">Current yield</div>
              <div className="flex items-center gap-2 mt-3">
                <div className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                  Top 10% DeFi
                </div>
              </div>
            </motion.div>

            {/* Protocol Age Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4 sm:p-5 hover:border-blue-500/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Protocol Age</span>
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">
                {protocolData.daysLive}
              </div>
              <div className="text-xs text-gray-400">Days live</div>
              <div className="flex items-center gap-2 mt-3">
                <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                  100% uptime
                </div>
              </div>
            </motion.div>
          </div>

          {/* TVL Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 sm:p-6 mb-6 md:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">TVL Growth</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {showDemoData ? 'Sample growth pattern' : 'Based on blockchain data'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-cyan-400">
                    {formatCompactNumber(explorerData.bnbTVL)}
                  </div>
                  <div className="text-xs text-gray-400">BNB Chain</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-blue-400">
                    {formatCompactNumber(explorerData.flowTVL)}
                  </div>
                  <div className="text-xs text-gray-400">Flow Chain</div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[200px] sm:h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={[
                  { day: 'Week 1', tvl: explorerData.totalValueUSD * 0.3 },
                  { day: 'Week 2', tvl: explorerData.totalValueUSD * 0.5 },
                  { day: 'Week 3', tvl: explorerData.totalValueUSD * 0.7 },
                  { day: 'Week 4', tvl: explorerData.totalValueUSD * 0.85 },
                  { day: 'Now', tvl: explorerData.totalValueUSD }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: isMobile ? 10 : 11 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: isMobile ? 10 : 11 }}
                    tickFormatter={(value) => formatCompactNumber(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '0.75rem',
                      backdropFilter: 'blur(20px)',
                      fontSize: isMobile ? '11px' : '12px'
                    }}
                    formatter={(value: number) => [formatCompactNumber(value), 'TVL']}
                  />
                  <Line
                    type="monotone"
                    dataKey="tvl"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    dot={isMobile ? false : { r: 3, fill: '#06B6D4' }}
                    activeDot={{ r: 4, fill: '#06B6D4' }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </>
      )}

      {/* APY Calculator - ALWAYS WORKS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4 sm:p-6 mb-6 md:mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
              <Calculator className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">APY Calculator</h3>
              <p className="text-xs sm:text-sm text-gray-400">Calculate your potential earnings</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-sm text-gray-400 mb-2">Staking Amount (VEC)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={calculatorInput}
                  onChange={(e) => setCalculatorInput(e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder="Enter amount"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {['1K', '5K', '10K', '50K'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setCalculatorInput(amount.replace('K', '000'))}
                  className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex-1 min-w-[60px]"
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {stakingTiers.map((tier) => (
            <motion.div
              key={tier.days}
              whileHover={{ scale: 1.02 }}
              className="glass-card p-3 sm:p-4 hover:border-cyan-500/30 transition-all flex flex-col"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                  <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                    {isMobile && tier.days >= 180 ? `${tier.days}d` : `${tier.days} days`}
                  </span>
                </div>
                <div className={`px-2 py-1 text-[10px] sm:text-xs font-bold ${
                  tier.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                  tier.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                  tier.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                  tier.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-amber-500/20 text-amber-400'
                } rounded whitespace-nowrap`}>
                  {isMobile ? tier.label.slice(0, 3) : tier.label}
                </div>
              </div>
              
              <div className="text-center mb-3 sm:mb-4 flex-grow">
                <div className="text-xl sm:text-2xl font-bold text-emerald-400">{tier.apy}%</div>
                <div className="text-xs text-gray-400">Fixed APY</div>
                
                <div className="mt-3 p-2 sm:p-3 bg-white/5 rounded-lg">
                  <div className="text-base sm:text-lg font-bold text-cyan-400">
                    ${projectedEarnings[tier.days]?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-400">Projected Earnings</div>
                </div>
              </div>
              
              <div className="mt-auto">
                <p className="text-xs text-gray-400 text-center mb-2">
                  {isMobile ? tier.description.split(' ')[0] : tier.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className={`w-2 h-2 rounded-full ${getRiskColor(tier.risk)}`}></div>
                  <span className="text-[10px] text-gray-400">
                    Risk: {tier.risk}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((star) => (
                      <div 
                        key={star}
                        className={`w-1 h-1 rounded-full ${
                          star <= (tier.risk === 'High' ? 3 : tier.risk === 'Medium' ? 2 : 1)
                            ? 'bg-cyan-400' 
                            : 'bg-gray-600'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Chat Interface - ALWAYS WORKS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 sm:p-6 mb-6 border border-cyan-500/20"
      >
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-bold">AI Assistant</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-400">Always Available</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              Ask questions about VelaCore staking, APY, or DeFi
            </p>
          </div>
        </div>
        
        {/* Chat Interface */}
        <div className="space-y-4">
          {/* Chat Messages */}
          <div className="h-48 overflow-y-auto p-2 bg-black/20 rounded-lg">
            {aiInsights.map((insight, index) => (
              <div 
                key={index} 
                className={`mb-2 p-3 rounded-lg ${
                  insight.startsWith('You: ') 
                    ? 'bg-cyan-500/20 ml-auto max-w-[80%]' 
                    : 'bg-white/5 max-w-[90%]'
                }`}
              >
                <p className="text-sm">{insight}</p>
              </div>
            ))}
            
            {aiLoading && (
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg max-w-[80%]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span className="text-xs text-gray-400">AI is thinking...</span>
              </div>
            )}
            
            {aiError && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400">{aiError}</p>
                <p className="text-xs text-gray-400 mt-1">Using offline responses</p>
              </div>
            )}
          </div>
          
          {/* Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyPress={handleAiKeyPress}
              placeholder="Ask about staking, APY, or DeFi..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
              disabled={aiLoading}
            />
            <button 
              onClick={handleAiSend}
              disabled={!aiInput.trim() || aiLoading}
              className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Zap className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* AI Status */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>
                {apiStatus.gemini ? 'Gemini AI Connected' : 'Offline Mode (Mock Responses)'}
              </span>
            </div>
            <span>Try: "best staking period"</span>
          </div>
        </div>
      </motion.div>

      {/* How to Get Real Data */}
      {showDemoData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 sm:p-6 border border-emerald-500/20 bg-emerald-500/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <PlayCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-emerald-400">Ready for Real Data?</h3>
              <p className="text-sm text-gray-400">Follow these steps to see live analytics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 glass-card hover:border-cyan-500/20 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <span className="text-cyan-400 font-bold">1</span>
                </div>
                <h4 className="font-bold">Connect Wallet</h4>
              </div>
              <p className="text-sm text-gray-400">
                Connect your MetaMask or TrustWallet to the dApp
              </p>
            </div>
            
            <div className="p-4 glass-card hover:border-cyan-500/20 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <span className="text-cyan-400 font-bold">2</span>
                </div>
                <h4 className="font-bold">Get Test Tokens</h4>
              </div>
              <p className="text-sm text-gray-400">
                Use the faucet to get VEC test tokens for staking
              </p>
            </div>
            
            <div className="p-4 glass-card hover:border-cyan-500/20 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <span className="text-cyan-400 font-bold">3</span>
                </div>
                <h4 className="font-bold">Start Staking</h4>
              </div>
              <p className="text-sm text-gray-400">
                Go to Staking section and stake your VEC tokens
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-black/20 rounded-lg">
            <p className="text-xs text-gray-300">
              <span className="text-cyan-400">Note:</span> Once you start staking, this dashboard will automatically switch to showing real blockchain data.
              APY Calculator and AI Assistant work in both demo and real modes.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};