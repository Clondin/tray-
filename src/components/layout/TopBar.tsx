
import React, { useState } from 'react';
import type { View } from '../../types';
import { useAppStore } from '../../store/appStore';
import { useUserStore } from '../../store/userStore';
import { useLiveSync } from '../../hooks/useLiveSync';
import { CollaborationModal } from '../../features/collaboration/CollaborationModal';
import { Building2, Layers, Calculator, ClipboardCheck, User, DollarSign, Save, AlertTriangle, X, Check } from '../icons';

export const TopBar: React.FC = () => {
  const { view, setView, setSnapshotModalOpen } = useAppStore(state => ({ 
    view: state.view, 
    setView: state.setView,
    setSnapshotModalOpen: state.setSnapshotModalOpen
  }));

  const { user, login, logout, error, loading, clearError } = useUserStore(state => ({
      user: state.user,
      login: state.login,
      logout: state.logout,
      error: state.error,
      loading: state.loading,
      clearError: state.clearError
  }));

  // Integrate Collaboration Hook
  const { sessionId, isConnected, startSession, joinSession, leaveSession, statusMessage } = useLiveSync();
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Layers },
    { id: 'portfolio', label: 'Portfolio', icon: Building2 },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'financing', label: 'Financing', icon: Calculator },
    { id: 'returns', label: 'Investor Returns', icon: User },
    { id: 'audit', label: 'Math Audit', icon: ClipboardCheck },
  ];

  return (
    <>
    <header className="sticky top-4 z-30 px-4 sm:px-6 lg:px-8 mb-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="glass-panel rounded-2xl px-4 h-16 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3 pl-2">
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
             {/* Live Sync Button */}
             <button 
                onClick={() => setIsCollabModalOpen(true)}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors shadow-sm text-xs font-bold uppercase tracking-wide
                    ${isConnected ? 'bg-success text-white animate-pulse' : 'bg-white border border-border text-secondary hover:text-primary'}
                `}
             >
                 {isConnected ? <Check className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                 {isConnected ? 'Live' : 'Collaborate'}
             </button>

             <button 
                onClick={() => setSnapshotModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-xs font-bold uppercase tracking-wide"
             >
                 <Save className="w-3 h-3" /> Deal Menu
             </button>
             
             <div className="h-6 w-px bg-border mx-1"></div>

             {user ? (
                 <div className="flex items-center gap-2 group relative">
                     <button className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden">
                         {user.photoURL ? (
                             <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-300"></div>
                         )}
                     </button>
                     {/* Dropdown */}
                     <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-border p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                         <div className="px-3 py-2 border-b border-border mb-1">
                             <div className="text-xs font-bold text-primary truncate">{user.displayName}</div>
                             <div className="text-[10px] text-secondary truncate">{user.email}</div>
                         </div>
                         <button 
                            onClick={logout}
                            className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger-light rounded-lg transition-colors"
                         >
                             Sign Out
                         </button>
                     </div>
                 </div>
             ) : (
                 <div className="flex items-center gap-2 relative">
                     {error && (
                         <div className="absolute top-full right-0 mt-2 w-72 p-3 bg-white border-2 border-danger/20 text-danger text-xs rounded-xl shadow-xl z-50 animate-fade-in">
                             <div className="flex justify-between items-start gap-2">
                                <div className="flex gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span className="font-medium leading-relaxed">{error}</span>
                                </div>
                                <button onClick={clearError} className="text-danger/50 hover:text-danger">
                                    <X className="w-3 h-3" />
                                </button>
                             </div>
                         </div>
                     )}
                     <button 
                        onClick={login}
                        disabled={loading}
                        className={`
                            text-sm font-semibold transition-colors px-3 py-1.5 rounded-lg
                            ${error ? 'bg-danger-light text-danger hover:bg-danger/20' : 'text-secondary hover:text-primary hover:bg-surface-subtle'}
                        `}
                     >
                         {loading ? '...' : error ? 'Retry Sign In' : 'Sign In'}
                     </button>
                 </div>
             )}
          </div>
        </div>
      </div>
    </header>

    <CollaborationModal 
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        startSession={startSession}
        joinSession={joinSession}
        leaveSession={leaveSession}
        sessionId={sessionId}
        isConnected={isConnected}
        statusMessage={statusMessage}
    />
    </>
  );
};
