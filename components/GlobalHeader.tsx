import React from 'react';

interface GlobalHeaderProps {
  account: string | null;
  currentChain: any;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchChain: (chainId: string) => void;
  supportedChains: any[];
  connectedWalletId?: string | null;
}

const getWalletIcon = (walletId: string) => {
  switch (walletId) {
    case 'metamask': return '🦊';
    case 'trustwallet': return '🔵';
    case 'coinbase': return '💎';
    case 'binance': return '🟡';
    case 'casper': return '💎';
    case 'phantom': return '👻';
    case 'walletconnect': return '📱';
    default: return '👛';
  }
};

const getWalletName = (walletId: string) => {
  switch (walletId) {
    case 'metamask': return 'MetaMask';
    case 'trustwallet': return 'Trust';
    case 'coinbase': return 'Coinbase';
    case 'binance': return 'Binance';
    case 'casper': return 'Casper';
    case 'phantom': return 'Phantom';
    case 'walletconnect': return 'WalletConnect';
    default: return walletId;
  }
};

// Helper to get proper native symbol
const getNativeSymbol = (chainId: string) => {
  if (chainId === 'bsc' || chainId === '0x61') return 'tBNB';
  if (chainId === 'flow' || chainId === '0x5eb5') return 'FLOW';
  return 'ETH';
};

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  account,
  currentChain,
  onConnect,
  onDisconnect,
  onSwitchChain,
  supportedChains,
  connectedWalletId
}) => {
  // Get proper chain display name with symbol
  const getChainDisplayName = (chain: any) => {
    if (chain.id === 'bsc' || chain.id === '0x61') {
      return 'BNB Testnet (tBNB)';
    }
    if (chain.id === 'flow' || chain.id === '0x5eb5') {
      return 'Flow Testnet (FLOW)';
    }
    return chain.name;
  };

  return (
    <div style={{
      background: 'rgba(11, 14, 17, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
      padding: '0.75rem 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Network Selector */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '0.625rem',
                height: '0.625rem',
                borderRadius: '50%',
                background: currentChain.id === 'bsc' || currentChain.id === '0x61' 
                  ? '#F0B90B' 
                  : '#16DB9A'
              }}></div>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#fff'
              }}>
                {getChainDisplayName(currentChain)}
              </span>
              <i className="fas fa-chevron-down" style={{
                fontSize: '0.75rem',
                color: '#9CA3AF',
                marginLeft: '0.25rem'
              }}></i>
            </div>
          </div>
          
          {/* Network Dropdown */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '0.5rem',
            width: '240px',
            background: '#0B0E11',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.2s ease',
            zIndex: 50
          }}
          className="network-dropdown">
            <div style={{ padding: '0.5rem' }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#9CA3AF',
                fontWeight: '600',
                padding: '0.5rem 0.75rem'
              }}>
                SELECT NETWORK
              </div>
              {supportedChains.map(chain => (
                <button
                  key={chain.id}
                  onClick={() => onSwitchChain(chain.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ...(currentChain.id === chain.id ? {
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    } : {})
                  }}
                  onMouseEnter={(e) => {
                    if (currentChain.id !== chain.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentChain.id !== chain.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      background: chain.id === 'bsc' || chain.id === '0x61' 
                        ? '#F0B90B' 
                        : '#16DB9A'
                    }}></div>
                    <span style={{
                      fontSize: '0.875rem'
                    }}>
                      {getChainDisplayName(chain)}
                    </span>
                  </div>
                  {currentChain.id === chain.id && (
                    <i className="fas fa-check" style={{
                      color: '#06b6d4',
                      fontSize: '0.75rem'
                    }}></i>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {account ? (
            <>
              {/* Wallet Icon/Name */}
              {connectedWalletId && (
                <div style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1))',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '0.75rem'
                }}
                className="md-flex">
                  <span style={{ fontSize: '0.875rem' }}>{getWalletIcon(connectedWalletId)}</span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {getWalletName(connectedWalletId)}
                  </span>
                </div>
              )}
              
              {/* Account Display */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem'
              }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    background: '#10b981',
                    borderRadius: '50%'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    inset: '-0.25rem',
                    background: '#10b981',
                    borderRadius: '50%',
                    animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                    opacity: 0.2
                  }}></div>
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}>
                  {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                </span>
              </div>
              
              {/* Disconnect Button */}
              <button
                onClick={onDisconnect}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: '#9CA3AF'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#9CA3AF';
                }}
                title="Disconnect"
              >
                <i className="fas fa-power-off"></i>
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                border: 'none',
                borderRadius: '0.75rem',
                color: '#fff',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #0891b2, #2563eb)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #06b6d4, #3b82f6)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <i className="fas fa-wallet"></i>
              <span>Connect</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Network Selector */}
      <div style={{
        display: 'none',
        marginTop: '0.75rem'
      }}
      className="md-hide">
        <select 
          value={currentChain.id}
          onChange={(e) => onSwitchChain(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.5rem',
            color: '#fff',
            fontSize: '0.875rem'
          }}
        >
          {supportedChains.map(chain => (
            <option key={chain.id} value={chain.id} style={{ background: '#0B0E11' }}>
              {getChainDisplayName(chain)}
            </option>
          ))}
        </select>
      </div>

      {/* Styles for hover effects */}
      <style>{`
        .network-dropdown {
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s ease;
        }
        div:hover > .network-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        @media (max-width: 768px) {
          .md-flex {
            display: flex !important;
          }
          .md-hide {
            display: block !important;
          }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};