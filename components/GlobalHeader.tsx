import React, { useState, useRef, useEffect } from 'react';

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
    case 'metamask':      return '🦊';
    case 'trustwallet':   return '🔵';
    case 'coinbase':      return '💎';
    case 'binance':       return '🟡';
    case 'casper':        return '💎';
    case 'phantom':       return '👻';
    case 'walletconnect': return '📱';
    default:              return '👛';
  }
};

const getWalletName = (walletId: string) => {
  switch (walletId) {
    case 'metamask':      return 'MetaMask';
    case 'trustwallet':   return 'Trust';
    case 'coinbase':      return 'Coinbase';
    case 'binance':       return 'Binance';
    case 'casper':        return 'Casper';
    case 'phantom':       return 'Phantom';
    case 'walletconnect': return 'WalletConnect';
    default:              return walletId;
  }
};

const getChainColor = (chainId: string): string => {
  if (chainId === 'bsc'        || chainId === '0x61')    return '#F0B90B';
  if (chainId === 'flow'       || chainId === '0x221')   return '#16DB9A';
  if (chainId === 'creditcoin' || chainId === '0x18E83') return '#9333EA';
  return '#06b6d4';
};

const getChainDisplayName = (chain: any): string => {
  if (chain.id === 'bsc'        || chain.id === '0x61')    return 'BNB Testnet (tBNB)';
  if (chain.id === 'flow'       || chain.id === '0x221')   return 'Flow Testnet (FLOW)';
  if (chain.id === 'creditcoin' || chain.id === '0x18E83') return 'CreditCoin Testnet (CTC)';
  return chain.name || chain.id;
};

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  account,
  currentChain,
  onConnect,
  onDisconnect,
  onSwitchChain,
  supportedChains,
  connectedWalletId,
}) => {
  // FIX: Use React state for dropdown — CSS :hover caused stale-state issues
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const chainColor = getChainColor(currentChain.id);

  return (
    <div style={{
      background: 'rgba(11, 14, 17, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
      padding: '0.75rem 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* ── Network Dropdown ─────────────────────────────── */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${dropdownOpen ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: '#fff',
            }}
          >
            <div style={{
              width: '0.625rem',
              height: '0.625rem',
              borderRadius: '50%',
              background: chainColor,
            }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {getChainDisplayName(currentChain)}
            </span>
            <i
              className="fas fa-chevron-down"
              style={{
                fontSize: '0.75rem',
                color: '#9CA3AF',
                marginLeft: '0.25rem',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              left: 0,
              width: '270px',
              background: '#0B0E11',
              border: '1px solid rgba(6,182,212,0.3)',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 100,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '0.5rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9CA3AF',
                  fontWeight: '600',
                  padding: '0.5rem 0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Select Network
                </div>

                {supportedChains.map(chain => {
                  const isActive = currentChain.id === chain.id;
                  const color    = getChainColor(chain.id);
                  return (
                    <button
                      key={chain.id}
                      onClick={() => { onSwitchChain(chain.id); setDropdownOpen(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: isActive ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent',
                        background: isActive
                          ? 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(59,130,246,0.2))'
                          : 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: '0.875rem' }}>{getChainDisplayName(chain)}</span>
                      </div>
                      {isActive && <i className="fas fa-check" style={{ color: '#06b6d4', fontSize: '0.75rem' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Wallet ────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {account ? (
            <>
              {connectedWalletId && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: 'linear-gradient(135deg,rgba(6,182,212,0.1),rgba(59,130,246,0.1))',
                  border: '1px solid rgba(6,182,212,0.2)',
                  borderRadius: '0.75rem',
                }}>
                  <span style={{ fontSize: '0.875rem' }}>{getWalletIcon(connectedWalletId)}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{getWalletName(connectedWalletId)}</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
              }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '0.5rem', height: '0.5rem', background: '#10b981', borderRadius: '50%' }} />
                  <div style={{
                    position: 'absolute', inset: '-0.25rem',
                    background: '#10b981', borderRadius: '50%',
                    animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.2,
                  }} />
                </div>
                <span style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                  {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                </span>
              </div>

              <button
                onClick={onDisconnect}
                title="Disconnect"
                style={{
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: '#9CA3AF',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#9CA3AF';
                }}
              >
                <i className="fas fa-power-off" />
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
                border: 'none',
                borderRadius: '0.75rem',
                color: '#fff',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg,#0891b2,#2563eb)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(6,182,212,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg,#06b6d4,#3b82f6)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <i className="fas fa-wallet" />
              <span>Connect</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile fallback selector */}
      <div style={{ marginTop: '0.75rem', display: 'none' }} className="mobile-chain-select">
        <select
          value={currentChain.id}
          onChange={e => onSwitchChain(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            color: '#fff',
            fontSize: '0.875rem',
          }}
        >
          {supportedChains.map(chain => (
            <option key={chain.id} value={chain.id} style={{ background: '#0B0E11' }}>
              {getChainDisplayName(chain)}
            </option>
          ))}
        </select>
      </div>

      <style>{`
        @keyframes ping { 75%,100% { transform:scale(2); opacity:0; } }
        @media (max-width: 768px) { .mobile-chain-select { display: block !important; } }
      `}</style>
    </div>
  );
};