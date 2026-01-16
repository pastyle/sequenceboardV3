import { signInAnonymously as firebaseSignInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase/config';

export const signInAnonymously = async (): Promise<User> => {
    try {
        const result = await firebaseSignInAnonymously(auth);
        return result.user;
    } catch (error) {
        console.error('Error signing in anonymously:', error);
        throw error;
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};
