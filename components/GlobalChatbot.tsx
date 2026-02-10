// GlobalChatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  Sparkles,
  Loader2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface GlobalChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const GlobalChatbot: React.FC<GlobalChatbotProps> = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm VelaCore AI Assistant. I can help you with staking strategies, protocol information, and multi-chain bridging. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Gemini API Integration Skeleton
  const sendMessageToGemini = async (userMessage: string): Promise<string> => {
    // TODO: Replace with actual Google Gemini API integration
    // const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
    // const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
      // Prepare context about VelaCore
      const context = `
        You are VelaCore AI Assistant, a helpful chatbot for the VelaCore DeFi protocol.
        
        Key Information:
        - Protocol is ${calculateDaysLive()} days old (launched Feb 1, 2026)
        - Fixed APY tiers: 30 days (15%), 90 days (17.25%), 180 days (20.25%), 270 days (24%), 360 days (30%)
        - Multi-chain support: BNB Smart Chain (main) and Flow Testnet
        - Total Value Locked: $125,000
        - Total stakers: 1,234
        - Smart contracts verified on BscScan
        - Audit status: In progress
        - Security: Enterprise-grade BNB Chain security
        
        Current user query: "${userMessage}"
        
        Respond helpfully and professionally, focusing on staking, security, and multi-chain features.
      `;

      // Mock response for development
      // In production, uncomment the actual API call below
      
      /*
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: context
            }]
          }]
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
      */

      // Simulated responses for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const responses = [
        `Based on VelaCore's fixed APY tiers, I recommend the 180-day staking option at 20.25% APY. It offers excellent returns while maintaining reasonable liquidity access.`,
        `VelaCore is secured by BNB Smart Chain's enterprise-grade infrastructure. All contracts are verified on BscScan, with comprehensive audit completion scheduled for Q2 2026.`,
        `Our multi-chain bridge supports seamless transfers between BNB Chain and Flow Testnet. Bridge fees are minimal (0.1%) with average completion time of 5 minutes.`,
        `The protocol has been live for ${calculateDaysLive()} days with $125,000 TVL across ${1234} stakers. Growth has been consistent at approximately 15% week-over-week.`,
        `For optimal security, always verify contract addresses: BNB Staking: 0x1D3516E449aC7f08F5773Dc8d984E1174420867a, Flow Staking: 0xc75608EfEc43aC569EAB2b7DA8D1A23FE653e80B`,
        `Fixed APY means your returns are guaranteed regardless of market conditions. The 30% APY for 360-day staking is our highest offering, perfect for long-term investors.`
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return "I apologize, but I'm having trouble connecting to the AI service. Please try again or check the console for more details.";
    }
  };

  const calculateDaysLive = () => {
    const launchDate = new Date('2026-02-01');
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - launchDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const aiResponse = await sendMessageToGemini(userMessage);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error in chat:', error);
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I encountered an error. Please try again or contact support for immediate assistance.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Quick prompts
  const quickPrompts = [
    'What are the APY rates?',
    'How secure is VelaCore?',
    'How do I bridge tokens?',
    'Best staking strategy?',
    'Contract addresses?'
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full shadow-2xl shadow-cyan-500/30 flex items-center justify-center hover:shadow-cyan-500/50 transition-all"
        aria-label="Open AI Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 md:w-7 md:h-7 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
        )}
        
        {/* Live indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse border-2 border-[#0B0E11]"></div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 md:bottom-28 md:right-8 z-50 w-full max-w-sm md:max-w-md"
          >
            <div className="glass-card border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden backdrop-blur-xl">
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                        <Bot className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-white">VelaCore AI Assistant</h3>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <p className="text-xs text-cyan-400">Powered by Google Gemini</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onToggle}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Close chat"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="h-64 md:h-80 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-cyan-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl p-3 bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-sm text-gray-400">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about staking, security, or bridging..."
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm md:text-base"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-gray-400 text-center">
                  AI Assistant available on all pages • Real-time data integration
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};