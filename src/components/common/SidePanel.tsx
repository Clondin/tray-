import React from 'react';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/30 z-40 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-surface shadow-xl transform transition-transform"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-section font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-text-primary">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto h-[calc(100%-73px)]">
          {children}
        </div>
      </div>
    </div>
  );
};
