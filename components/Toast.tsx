import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  onClose: () => void;
}

/**
 * Toast - Professional notification component
 * Features: Smooth animations, auto-dismiss, type-based styling
 */
export const Toast: React.FC<ToastProps> = ({ message, type, visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const styles = {
    success: 'bg-green-500/20 border-green-500/30 text-green-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
  };

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info'
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className={`glass-card px-6 py-4 border ${styles[type]} flex items-center gap-3 shadow-2xl`}>
        <i className={`fas ${icons[type]} text-lg`}></i>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

