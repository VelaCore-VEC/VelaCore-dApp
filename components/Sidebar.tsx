import React from 'react';
import { Section } from '../types';

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  { id: Section.DASHBOARD, label: 'Dashboard', icon: 'fas fa-chart-line' },
  { id: Section.STAKE, label: 'Staking', icon: 'fas fa-vault' },
  { id: Section.SWAP, label: 'Swap', icon: 'fas fa-exchange-alt' },
  { id: Section.NFT, label: 'NFTs', icon: 'fas fa-image' },
  { id: Section.GOVERNANCE, label: 'Governance', icon: 'fas fa-vote-yea' },
  { id: 'bridge' as Section, label: 'Bridge', icon: 'fas fa-bridge' }
];

/**
 * Sidebar - Professional left sidebar with glassmorphism
 * Features: Active state highlighting, smooth transitions, responsive
 */
export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, isMobileOpen, onMobileClose }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onMobileClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 glass-card border-r border-white/10 z-40 transform transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <i className="fas fa-cube text-white text-lg"></i>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0B0E11] animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Vela<span className="text-cyan-400">Core</span>
              </h1>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Protocol v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <i className={`${item.icon} text-lg ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'}`}></i>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-gray-500 text-center">
            <p>VelaCore Protocol</p>
            <p className="mt-1">© 2024 All Rights Reserved</p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
};

