
import React from 'react';
import type { View } from '../../types';
import { useAppStore } from '../../store/appStore';
import { Building2, Layers, Calculator, ClipboardCheck, User, DollarSign, Save } from '../icons';

export const TopBar: React.FC = () => {
  const { view, setView, setSnapshotModalOpen } = useAppStore(state => ({ 
    view: state.view, 
    setView: state.setView,
    setSnapshotModalOpen: state.setSnapshotModalOpen
  }));

  if (view === 'landing') return null;

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Layers },
    { id: 'portfolio', label: 'Portfolio', icon: Building2 },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'financing', label: 'Financing', icon: Calculator },
    { id: 'returns', label: 'Investor Returns', icon: User },
    { id: 'audit', label: 'Math Audit', icon: ClipboardCheck },
  ];

  return (
    <header className="sticky top-4 z-30 px-4 sm:px-6 lg:px-8 mb-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="glass-panel rounded-2xl px-4 h-16 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3 pl-2 cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-sm font-bold text-primary tracking-tight leading-none">TRAY Holdings</h1>
                <span className="text-[10px] font-medium text-secondary uppercase tracking-wide">Underwriting</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-subtle/50 p-1 rounded-xl border border-white/50 overflow-x-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as View)}
                  className={`
                    relative flex items-center gap-2 px-3 lg:px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
                    ${isActive 
                      ? 'text-primary bg-white shadow-sm' 
                      : 'text-secondary hover:text-primary hover:bg-white/50'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-secondary'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 pr-2">
             <button 
                onClick={() => setSnapshotModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-xs font-bold uppercase tracking-wide"
             >
                 <Save className="w-3 h-3" /> Deal Menu
             </button>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 border border-white shadow-inner"></div>
          </div>
        </div>
      </div>
    </header>
  );
};
