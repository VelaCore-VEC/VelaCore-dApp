import React, { useState, useEffect } from 'react';

interface HeroSectionProps {
  tvl: string;
  totalStakers: string;
  apy: string;
}

/**
 * HeroSection - Animated TVL counter with protocol stats
 * Features: Animated ticker, gradient effects, professional metrics
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ tvl, totalStakers, apy }) => {
  const [animatedTvl, setAnimatedTvl] = useState('0');

  useEffect(() => {
    const targetValue = parseFloat(tvl.replace(/[^0-9.]/g, ''));
    let currentValue = 0;
    const duration = 2000;
    const steps = 60;
    const increment = targetValue / steps;
    const stepDuration = duration / steps;

    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= targetValue) {
        currentValue = targetValue;
        clearInterval(timer);
      }
      setAnimatedTvl(`$${currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
    }, stepDuration);

    return () => clearInterval(timer);
  }, [tvl]);

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-blue-500/5 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent_50%)]"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
              Total Value Locked
            </span>
          </h2>
          <div className="inline-block">
            <div className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              {animatedTvl}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">{apy}%</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Average APY</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{totalStakers}</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Active Stakers</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">2</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Supported Chains</div>
          </div>
        </div>
      </div>
    </section>
  );
};

