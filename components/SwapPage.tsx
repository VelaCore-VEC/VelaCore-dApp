import React from 'react';

export const SwapPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '32rem', margin: '0 auto' }}>
      <div className="glass-card" style={{
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '6rem',
          height: '6rem',
          background: 'linear-gradient(to bottom right, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem auto'
        }}>
          <i className="fas fa-exchange-alt" style={{
            fontSize: '2.5rem',
            color: 'rgba(6, 182, 212, 0.5)'
          }}></i>
        </div>
        <h2 style={{
          fontSize: '2.25rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          background: 'linear-gradient(to right, white, #9CA3AF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Swap Interface
        </h2>
        <p style={{
          fontSize: '1.125rem',
          color: '#9CA3AF',
          marginBottom: '0.5rem'
        }}>Coming Soon</p>
        <p style={{
          fontSize: '0.875rem',
          color: '#6B7280',
          maxWidth: '24rem',
          margin: '0 auto 2rem auto'
        }}>
          Multi-chain token swapping with optimal rates. 
          Integrated with leading DEX aggregators for best prices.
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          marginTop: '2rem',
          fontSize: '0.75rem',
          color: '#6B7280'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
            <span>Multi-chain Support</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
            <span>Best Price Routing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
            <span>Low Fees</span>
          </div>
        </div>
      </div>
    </div>
  );
};