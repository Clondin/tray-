
import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Save, Download, Upload, Trash2, Check, X } from './icons';
import { fmt } from '../utils/formatters';
import type { DealSnapshot } from '../types';

const SnapshotModal: React.FC = () => {
    const { 
        snapshotModalOpen, 
        setSnapshotModalOpen, 
        savedSnapshots, 
        saveSnapshot, 
        loadSnapshot, 
        deleteSnapshot,
        importSnapshot
    } = useAppStore(state => ({
        snapshotModalOpen: state.snapshotModalOpen,
        setSnapshotModalOpen: state.setSnapshotModalOpen,
        savedSnapshots: state.savedSnapshots,
        saveSnapshot: state.saveSnapshot,
        loadSnapshot: state.loadSnapshot,
        deleteSnapshot: state.deleteSnapshot,
        importSnapshot: state.importSnapshot
    }));

    const [newSnapshotName, setNewSnapshotName] = useState('');
    const [uploadError, setUploadError] = useState<string | null>(null);

    if (!snapshotModalOpen) return null;

    const handleSave = () => {
        if (!newSnapshotName.trim()) return;
        saveSnapshot(newSnapshotName);
        setNewSnapshotName('');
    };

    const handleExport = (snapshot: DealSnapshot) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${snapshot.name.replace(/\s+/g, '_')}_deal.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (json.assumptions && json.propertyOverrides) {
                    importSnapshot(json);
                    setUploadError(null);
                } else {
                    setUploadError("Invalid deal file format.");
                }
            } catch (err) {
                setUploadError("Could not parse JSON file.");
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
            <div 
                className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setSnapshotModalOpen(false)}
            />
            <div className="relative bg-background w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-slide-up flex flex-col max-h-[80vh]">
                
                <div className="px-6 py-5 border-b border-border bg-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-primary">Deal Snapshots</h2>
                        <p className="text-sm text-secondary">Save, load, or share your deal underwriting.</p>
                    </div>
                    <button onClick={() => setSnapshotModalOpen(false)} className="text-muted hover:text-primary">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-background">
                    
                    {/* Save New Section */}
                    <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
                        <label className="block text-sm font-bold text-secondary uppercase tracking-wider mb-2">Save Current Deal</label>
                        <div className="flex gap-3">
                            <input 
                                type="text" 
                                value={newSnapshotName}
                                onChange={(e) => setNewSnapshotName(e.target.value)}
                                placeholder="e.g. Newark Portfolio V2"
                                className="flex-1 form-input"
                            />
                            <button 
                                onClick={handleSave}
                                disabled={!newSnapshotName.trim()}
                                className="px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    </div>

                    {/* Saved Deals List */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-primary">Saved Deals</h3>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-border rounded-lg hover:bg-surface-subtle text-primary transition-colors">
                                <Upload className="w-3 h-3" /> Import JSON
                                <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                        
                        {uploadError && <div className="text-xs text-danger bg-danger-light p-2 rounded">{uploadError}</div>}

                        <div className="space-y-3">
                            {savedSnapshots.length === 0 ? (
                                <div className="text-center py-8 text-muted italic border-2 border-dashed border-border-subtle rounded-xl">
                                    No saved deals yet.
                                </div>
                            ) : (
                                savedSnapshots.map(snap => (
                                    <div key={snap.id} className="flex items-center justify-between p-4 bg-white border border-border rounded-xl shadow-sm group hover:border-accent/30 transition-colors">
                                        <div>
                                            <div className="font-bold text-primary">{snap.name}</div>
                                            <div className="text-xs text-muted">
                                                {new Date(snap.date).toLocaleDateString()} • {snap.selectedPortfolioId} • {fmt(snap.financingScenario.manualLoanAmount)} Loan
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => { loadSnapshot(snap.id); setSnapshotModalOpen(false); }}
                                                className="p-2 text-success bg-success-light rounded-lg hover:bg-success hover:text-white transition-colors"
                                                title="Load Deal"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleExport(snap)}
                                                className="p-2 text-secondary bg-surface-subtle rounded-lg hover:bg-white hover:shadow-sm transition-colors"
                                                title="Export JSON"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => deleteSnapshot(snap.id)}
                                                className="p-2 text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SnapshotModal;
