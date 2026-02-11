import React from 'react';
import { Menu, X } from 'lucide-react';
import { Section } from '../types';

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onMobileOpen?: () => void;
}

const menuItems = [
  { id: Section.DASHBOARD, label: 'Dashboard', icon: 'fas fa-chart-line' },
  { id: Section.STAKE, label: 'Staking', icon: 'fas fa-vault' },
  { id: Section.SWAP, label: 'Swap', icon: 'fas fa-exchange-alt' },
  { id: Section.NFT, label: 'NFTs', icon: 'fas fa-image' },
  { id: Section.GOVERNANCE, label: 'Governance', icon: 'fas fa-vote-yea' },
  { id: 'bridge' as Section, label: 'Bridge', icon: 'fas fa-bridge' },
  { id: 'ai-analytics' as Section, label: 'AI Analytics', icon: 'fas fa-brain' }
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  isMobileOpen, 
  onMobileClose,
  onMobileOpen 
}) => {
  return (
    <>
      {/* Mobile Hamburger Button - SIMPLE & VISIBLE */}
      <button
        onClick={onMobileOpen}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-[#0B0E11] border border-cyan-500/30 rounded-xl flex items-center justify-center shadow-xl"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar - SIMPLE & WORKING */}
      <div 
        className={`
          fixed left-0 top-0 h-full w-64 bg-[#0B0E11]/95 backdrop-blur-xl 
          border-r border-cyan-500/20 z-40 shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="https://velacore.github.io/VelaCore-DApp9/VelaCore-symbol-dark.svg" alt="VelaCore" className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Vela<span className="text-cyan-400">Core</span>
                </h1>
                <p className="text-xs text-gray-400">Protocol v2.0</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id as Section);
                    if (onMobileClose) onMobileClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl 
                    transition-all duration-200 text-left
                    ${isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <i className={`${item.icon} ${isActive ? 'text-cyan-400' : ''}`}></i>
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-cyan-500/20">
            <div className="text-xs text-gray-500 text-center">
              <p>© 2026 VelaCore</p>
              <p className="mt-1 text-cyan-400">Connected to BNB Chain</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};