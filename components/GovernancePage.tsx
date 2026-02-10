import React from 'react';

export const GovernancePage: React.FC = () => {
  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <div className="glass-card" style={{
        padding: '3rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '8rem',
          height: '8rem',
          background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(6, 182, 212, 0.2))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem auto'
        }}>
          <i className="fas fa-vote-yea" style={{
            fontSize: '3rem',
            color: 'rgba(34, 197, 94, 0.5)'
          }}></i>
        </div>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          background: 'linear-gradient(to right, white, #9CA3AF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Protocol Governance
        </h2>
        <p style={{
          fontSize: '1.25rem',
          color: '#9CA3AF',
          marginBottom: '0.5rem'
        }}>DAO Launch: Q3 2026</p>
        <p style={{
          fontSize: '0.875rem',
          color: '#6B7280',
          maxWidth: '32rem',
          margin: '0 auto 2rem auto'
        }}>
          Shape the future of VelaCore through decentralized governance. 
          Vote on proposals, suggest improvements, and earn governance rewards.
        </p>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: '#6B7280'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
            <span>Proposal Creation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
            <span>Voting System</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
            <span>Governance Tokens</span>
          </div>
        </div>
        
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(6, 182, 212, 0.1))',
          borderRadius: '0.75rem',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#D1FAE5'
          }}>
            <i className="fas fa-lightbulb mr-2"></i>
            Governance token airdrop scheduled for Q2 2026. Early stakers will receive bonus governance tokens.
          </p>
        </div>
      </div>
    </div>
  );
};