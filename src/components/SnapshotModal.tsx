
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useUserStore } from '../store/userStore';
import { Save, Download, Upload, Trash2, Check, X, Building2 } from './icons';
import { fmt } from '../utils/formatters';
import type { DealSnapshot } from '../types';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';

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

    const { user } = useUserStore(state => ({ user: state.user }));

    const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');
    const [newSnapshotName, setNewSnapshotName] = useState('');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [cloudDeals, setCloudDeals] = useState<DealSnapshot[]>([]);
    const [isLoadingCloud, setIsLoadingCloud] = useState(false);

    useEffect(() => {
        if (snapshotModalOpen && activeTab === 'cloud' && user) {
            fetchCloudDeals();
        }
    }, [snapshotModalOpen, activeTab, user]);

    const fetchCloudDeals = async () => {
        if (!user || !db) return;
        setIsLoadingCloud(true);
        try {
            const q = query(collection(db, `users/${user.uid}/deals`), orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            const deals: DealSnapshot[] = [];
            querySnapshot.forEach((doc) => {
                deals.push({ id: doc.id, ...doc.data() } as DealSnapshot);
            });
            setCloudDeals(deals);
        } catch (err) {
            console.error("Error fetching deals:", err);
        } finally {
            setIsLoadingCloud(false);
        }
    };

    const handleLocalSave = () => {
        if (!newSnapshotName.trim()) return;
        saveSnapshot(newSnapshotName);
        setNewSnapshotName('');
    };

    const handleCloudSave = async () => {
        if (!newSnapshotName.trim() || !user || !db) return;
        setIsLoadingCloud(true);
        try {
            // Construct deal object manually from store state (similar to appStore save logic)
            const state = useAppStore.getState();
            const newSnapshot: Omit<DealSnapshot, 'id'> = {
                name: newSnapshotName,
                date: new Date().toISOString(),
                assumptions: state.assumptions,
                propertyOverrides: state.propertyOverrides,
                priceAllocations: state.priceAllocations,
                financingScenario: state.financingScenario,
                refinanceScenario: state.refinanceScenario,
                investorReturnsScenario: state.investorReturnsScenario,
                globalT12PerRoom: state.globalT12PerRoom,
                globalProFormaPerRoom: state.globalProFormaPerRoom,
                portfolios: state.portfolios,
                selectedPortfolioId: state.selectedPortfolioId
            };

            await addDoc(collection(db, `users/${user.uid}/deals`), newSnapshot);
            setNewSnapshotName('');
            fetchCloudDeals(); // Refresh list
        } catch (e) {
            console.error("Error saving to cloud", e);
            setUploadError("Failed to save to cloud.");
        } finally {
            setIsLoadingCloud(false);
        }
    };

    const handleDeleteCloud = async (id: string) => {
        if (!user || !db) return;
        if (!confirm("Are you sure you want to delete this cloud deal?")) return;
        try {
            await deleteDoc(doc(db, `users/${user.uid}/deals`, id));
            fetchCloudDeals();
        } catch (e) {
            console.error("Error deleting doc", e);
        }
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
                    setActiveTab('local'); // Switch to local to see it
                } else {
                    setUploadError("Invalid deal file format.");
                }
            } catch (err) {
                setUploadError("Could not parse JSON file.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    if (!snapshotModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
            <div 
                className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setSnapshotModalOpen(false)}
            />
            <div className="relative bg-background w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
                
                <div className="px-6 py-5 border-b border-border bg-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-primary">Deal Menu</h2>
                        <p className="text-sm text-secondary">Manage your underwriting scenarios.</p>
                    </div>
                    <button onClick={() => setSnapshotModalOpen(false)} className="text-muted hover:text-primary">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border bg-surface-subtle px-6">
                    <button 
                        onClick={() => setActiveTab('local')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'local' ? 'border-accent text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                    >
                        Local Storage
                    </button>
                    <button 
                        onClick={() => setActiveTab('cloud')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cloud' ? 'border-accent text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                    >
                        Cloud Deals {user ? '' : '(Login Required)'}
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-background">
                    
                    {/* Save New Section */}
                    <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
                        <label className="block text-sm font-bold text-secondary uppercase tracking-wider mb-2">
                            Save Current Work to {activeTab === 'cloud' ? 'Cloud' : 'Local Browser'}
                        </label>
                        <div className="flex gap-3">
                            <input 
                                type="text" 
                                value={newSnapshotName}
                                onChange={(e) => setNewSnapshotName(e.target.value)}
                                placeholder={`e.g. Newark Portfolio V2 (${activeTab})`}
                                className="flex-1 form-input"
                            />
                            <button 
                                onClick={activeTab === 'cloud' ? handleCloudSave : handleLocalSave}
                                disabled={!newSnapshotName.trim() || (activeTab === 'cloud' && !user)}
                                className="px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                {isLoadingCloud ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
                                Save
                            </button>
                        </div>
                        {activeTab === 'cloud' && !user && (
                            <p className="text-xs text-danger mt-2">Please sign in (top right) to save deals to the cloud.</p>
                        )}
                    </div>

                    {/* Deals List */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-primary">{activeTab === 'cloud' ? 'Cloud Library' : 'Local Snapshots'}</h3>
                            {activeTab === 'local' && (
                                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-border rounded-lg hover:bg-surface-subtle text-primary transition-colors">
                                    <Upload className="w-3 h-3" /> Import JSON
                                    <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                                </label>
                            )}
                        </div>
                        
                        {uploadError && <div className="text-xs text-danger bg-danger-light p-2 rounded">{uploadError}</div>}

                        <div className="space-y-3">
                            {(activeTab === 'local' ? savedSnapshots : cloudDeals).length === 0 ? (
                                <div className="text-center py-12 text-muted italic border-2 border-dashed border-border-subtle rounded-xl bg-surface-subtle/30">
                                    {activeTab === 'cloud' && !user 
                                        ? "Sign in to view your cloud deals." 
                                        : activeTab === 'cloud' && isLoadingCloud 
                                            ? "Loading..." 
                                            : "No saved deals found."}
                                </div>
                            ) : (
                                (activeTab === 'local' ? savedSnapshots : cloudDeals).map(snap => (
                                    <div key={snap.id} className="flex items-center justify-between p-4 bg-white border border-border rounded-xl shadow-sm group hover:border-accent/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-surface-subtle rounded-lg text-secondary">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-primary">{snap.name}</div>
                                                <div className="text-xs text-muted">
                                                    {new Date(snap.date).toLocaleDateString()} • {snap.selectedPortfolioId} • {fmt(snap.financingScenario.manualLoanAmount)} Loan
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => { 
                                                    if(activeTab === 'local') {
                                                        loadSnapshot(snap.id);
                                                    } else {
                                                        importSnapshot(snap); // Import cloud deal to local state
                                                    }
                                                    setSnapshotModalOpen(false); 
                                                }}
                                                className="px-3 py-1.5 text-xs font-bold text-white bg-success rounded-lg hover:bg-success/90 transition-colors shadow-sm flex items-center gap-2"
                                            >
                                                <Check className="w-3 h-3" /> Load
                                            </button>
                                            <button 
                                                onClick={() => handleExport(snap)}
                                                className="p-2 text-secondary bg-surface-subtle rounded-lg hover:bg-white hover:shadow-sm transition-colors"
                                                title="Export JSON"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => activeTab === 'local' ? deleteSnapshot(snap.id) : handleDeleteCloud(snap.id)}
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
