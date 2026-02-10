import React from 'react';

export const NFTPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <div className="glass-card" style={{
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '6rem',
          height: '6rem',
          background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem auto'
        }}>
          <i className="fas fa-image" style={{
            fontSize: '2.5rem',
            color: 'rgba(168, 85, 247, 0.5)'
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
          NFT Marketplace
        </h2>
        <p style={{
          fontSize: '1.125rem',
          color: '#9CA3AF',
          marginBottom: '0.5rem'
        }}>Launching Q2 2026</p>
        <p style={{
          fontSize: '0.875rem',
          color: '#6B7280',
          maxWidth: '28rem',
          margin: '0 auto 2rem auto'
        }}>
          Exclusive VelaCore NFT collection with staking benefits. 
          Each NFT provides unique protocol advantages and governance rights.
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card" style={{
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{
                aspectRatio: '1/1',
                background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
                borderRadius: '0.75rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-cube" style={{
                  fontSize: '1.5rem',
                  color: 'rgba(168, 85, 247, 0.3)'
                }}></i>
              </div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>VelaCore NFT #{i}</h3>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Coming Soon</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};