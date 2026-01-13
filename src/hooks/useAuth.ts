import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { subscribeToAuthChanges, signInAnonymously } from '../services/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        setLoading(true);
        try {
            await signInAnonymously();
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    return { user, loading, error, signIn };
};
