
import { create } from 'zustand';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

interface UserState {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    initAuth: () => void;
    clearError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    loading: true,
    error: null,

    initAuth: () => {
        if (!auth) {
            console.warn("Auth not initialized in userStore");
            set({ loading: false, error: "Firebase not connected" });
            return;
        }
        try {
            onAuthStateChanged(auth, (user) => {
                set({ user, loading: false, error: null });
            }, (error) => {
                console.error("Auth state change error:", error);
                set({ loading: false, error: error.message });
            });
        } catch (err: any) {
             set({ loading: false, error: err.message });
        }
    },

    login: async () => {
        if (!auth || !googleProvider) {
            set({ error: "Firebase configuration is missing or blocked. Check console." });
            return;
        }
        try {
            set({ loading: true, error: null });
            await signInWithPopup(auth, googleProvider);
            // State update handled by onAuthStateChanged listener
        } catch (error: any) {
            console.error("Login error:", error);
            let message = error.message || "Failed to sign in";
            
            // Map common configuration errors to helpful messages
            if (error.code === 'auth/configuration-not-found') {
                message = "Auth not enabled. Go to Firebase Console > Authentication and click 'Get Started'.";
            } else if (error.code === 'auth/operation-not-allowed') {
                message = "Google Sign-In disabled. Enable it in Firebase Console > Authentication > Sign-in method.";
            } else if (error.code === 'auth/popup-closed-by-user') {
                message = "Sign-in cancelled.";
            } else if (error.code === 'auth/unauthorized-domain') {
                const domain = window.location.hostname;
                message = `Domain (${domain}) is not authorized. Add it in Firebase Console > Authentication > Settings > Authorized Domains.`;
            }

            set({ error: message, loading: false });
        }
    },

    logout: async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            set({ user: null, error: null });
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    clearError: () => set({ error: null })
}));

// Initialize listener immediately
useUserStore.getState().initAuth();
