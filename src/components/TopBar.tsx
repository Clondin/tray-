
import React from 'react';
import type { View } from '../types';
import { Building2 } from './icons';

export const TopBar: React.FC<{ view: View; setView: (view: View) => void; }> = ({ view, setView }) => {
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'portfolio', label: 'Portfolio Builder' },
    { id: 'stress', label: 'Stress Test' },
    { id: 'financing', label: 'Financing' },
  ];
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex-1 flex items-center justify-start">
            <div className="flex items-center">
              <Building2 className="w-7 h-7 text-rose-500 mr-2" />
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">ProForma</h1>
            </div>
          </div>
          <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-8">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={`relative py-2 text-sm font-semibold transition-colors ${
                  view === item.id 
                    ? 'text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {item.label}
                {view === item.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-full"></span>}
              </button>
            ))}
          </nav>
          <div className="flex-1 flex items-center justify-end">
          </div>
        </div>
      </div>
    </header>
  );
};
