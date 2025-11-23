
import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAppStore } from '../store/appStore';
import { useUserStore } from '../store/userStore';

// We will sync these keys. UI state (view, modalOpen) is NOT synced.
const SYNC_KEYS = [
    'assumptions',
    'propertyOverrides',
    'priceAllocations',
    'portfolios',
    'selectedPortfolioId',
    'financingScenario',
    'refinanceScenario',
    'investorReturnsScenario',
    'globalT12PerRoom',
    'globalProFormaPerRoom'
];

export const useLiveSync = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdateFromCloud, setLastUpdateFromCloud] = useState<number>(0);
    const [statusMessage, setStatusMessage] = useState<string>('');

    const { setFullState } = useAppStore();
    const { user } = useUserStore();

    // Ref to track if the current state change comes from the cloud (to avoid loops)
    const isApplyingCloudUpdate = useRef(false);
    
    // Debounce Ref
    const timeoutRef = useRef<any>(null);

    // Start a new session
    const startSession = async () => {
        if (!user || !db) {
            alert("You must be logged in to start a live session.");
            return;
        }
        
        // Generate a random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        try {
            const state = useAppStore.getState();
            const dataToSync: any = {};
            SYNC_KEYS.forEach(key => {
                dataToSync[key] = (state as any)[key];
            });

            // Create the doc
            await setDoc(doc(db, 'sessions', code), {
                ...dataToSync,
                hostId: user.uid,
                createdAt: serverTimestamp(),
                lastUpdatedBy: user.uid
            });

            setSessionId(code);
            setIsHost(true);
            setIsConnected(true);
            setStatusMessage(`Session Active: ${code}`);
        } catch (e) {
            console.error("Error starting session:", e);
            setStatusMessage("Failed to start session.");
        }
    };

    // Join existing session
    const joinSession = (code: string) => {
        if (!db) return;
        setSessionId(code);
        setIsHost(false);
        setIsConnected(true);
        setStatusMessage(`Joined Session: ${code}`);
    };

    const leaveSession = () => {
        setSessionId(null);
        setIsConnected(false);
        setStatusMessage('');
    };

    // Effect 1: Listen to Cloud Changes
    useEffect(() => {
        if (!sessionId || !db) return;

        const unsub = onSnapshot(doc(db, 'sessions', sessionId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Simple check: If I am the one who just wrote this, ignore it? 
                // Firestore "hasPendingWrites" helps, but also checking user ID helps.
                if (data.lastUpdatedBy === user?.uid && docSnap.metadata.hasPendingWrites) {
                    // This is my local write echoing back. Ignore.
                    return;
                }

                // This is a remote update
                isApplyingCloudUpdate.current = true;
                setFullState(data as any);
                
                // Small delay to reset flag to allow local editing again
                setTimeout(() => {
                    isApplyingCloudUpdate.current = false;
                }, 100);
                
                setLastUpdateFromCloud(Date.now());
            } else {
                setStatusMessage("Session ended or invalid code.");
                setIsConnected(false);
            }
        }, (err) => {
            console.error("Sync error:", err);
            setStatusMessage("Sync Error");
        });

        return () => unsub();
    }, [sessionId, user, setFullState]);

    // Effect 2: Push Local Changes to Cloud
    useEffect(() => {
        if (!sessionId || !isConnected || !db) return;

        // Subscribe to store changes
        const unsubStore = useAppStore.subscribe((state) => {
            if (isApplyingCloudUpdate.current) return; // Don't loop back

            // Debounce updates
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(async () => {
                const dataToSync: any = {};
                SYNC_KEYS.forEach(key => {
                    dataToSync[key] = (state as any)[key];
                });

                try {
                    await updateDoc(doc(db, 'sessions', sessionId), {
                        ...dataToSync,
                        lastUpdatedBy: user?.uid || 'anon',
                        updatedAt: serverTimestamp()
                    });
                } catch (e) {
                    console.error("Error syncing update:", e);
                }
            }, 500); // 500ms delay
        });

        return () => unsubStore();
    }, [sessionId, isConnected, user]);

    return {
        sessionId,
        isHost,
        isConnected,
        startSession,
        joinSession,
        leaveSession,
        statusMessage
    };
};
