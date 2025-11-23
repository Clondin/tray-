
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
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    loading: true,
    error: null,

    initAuth: () => {
        if (!auth) {
            set({ loading: false });
            return;
        }
        onAuthStateChanged(auth, (user) => {
            set({ user, loading: false });
        });
    },

    login: async () => {
        if (!auth || !googleProvider) {
            set({ error: "Firebase configuration is missing. Please update src/config/firebase.ts" });
            return;
        }
        try {
            set({ loading: true, error: null });
            await signInWithPopup(auth, googleProvider);
            // State update handled by onAuthStateChanged
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    logout: async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            set({ user: null });
        } catch (error: any) {
            set({ error: error.message });
        }
    }
}));

// Initialize listener immediately
useUserStore.getState().initAuth();
