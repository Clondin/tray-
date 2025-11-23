
import React, { useState } from 'react';
import { X, Layers, Upload, Check, AlertTriangle, Copy } from '../../components/icons';

interface CollaborationModalProps {
    isOpen: boolean;
    onClose: () => void;
    startSession: () => void;
    joinSession: (code: string) => void;
    leaveSession: () => void;
    sessionId: string | null;
    isConnected: boolean;
    statusMessage: string;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
    isOpen, onClose, startSession, joinSession, leaveSession, sessionId, isConnected, statusMessage
}) => {
    const [joinCode, setJoinCode] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
            <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-primary">Live Collaboration</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-secondary" /></button>
                </div>

                {isConnected ? (
                    <div className="space-y-6 text-center">
                        <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto text-success animate-pulse">
                            <Layers className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-primary">Session Active</h3>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="text-4xl font-mono font-bold text-accent tracking-wider">{sessionId}</span>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(sessionId || '')}
                                    className="p-2 text-secondary hover:text-primary"
                                    title="Copy Code"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-secondary mt-2">Share this code with others to edit this deal in real-time.</p>
                        </div>
                        <button 
                            onClick={leaveSession}
                            className="w-full py-3 bg-gray-100 text-danger font-bold rounded-xl hover:bg-danger-light transition-colors"
                        >
                            Stop Session
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <p className="text-xs text-blue-800 leading-relaxed">
                                <strong>Warning:</strong> Live sync overwrites local data with the session's latest data. Ensure you have a backup if needed.
                            </p>
                        </div>

                        <button 
                            onClick={startSession}
                            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-md flex items-center justify-center gap-2 transition-all"
                        >
                            <Upload className="w-5 h-5" /> Start New Session (Host)
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="flex-shrink-0 mx-4 text-xs text-secondary font-bold uppercase">Or Join Existing</span>
                            <div className="flex-grow border-t border-border"></div>
                        </div>

                        <div className="flex gap-3">
                            <input 
                                type="text" 
                                placeholder="Enter 6-digit Code" 
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="flex-1 text-center text-lg font-mono font-bold border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent uppercase"
                                maxLength={6}
                            />
                            <button 
                                onClick={() => joinSession(joinCode)}
                                disabled={joinCode.length < 6}
                                className="px-6 bg-white border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                            >
                                Join
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
