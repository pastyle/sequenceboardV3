import { useState, useEffect, useCallback } from 'react';
import type { FirestoreGame, GameStatus } from '../types/firebase';
import {
    createGame as createGameService,
    joinGame as joinGameService,
    leaveGame as leaveGameService,
    subscribeToGame,
    updateGameStatus as updateGameStatusService,
    updateHeartbeat,
    setPlayerOffline
} from '../services/game';
import { useAuth } from './useAuth';

export const useGameConnection = (initialRoomId: string | null = null) => {
    const [game, setGame] = useState<FirestoreGame | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [roomId, setRoomId] = useState<string | null>(initialRoomId);
    const { user } = useAuth();

    // Heartbeat Loop & Disconnect Handler
    useEffect(() => {
        if (!roomId || !user) return;

        // 1. Send initial heartbeat
        updateHeartbeat(roomId, user.uid);

        // 2. Setup interval for every 5s
        const intervalId = setInterval(() => {
            updateHeartbeat(roomId, user.uid).catch(err => {
                console.error("Heartbeat failed", err);
            });
        }, 5000);

        // 3. Handle tab close / refresh
        const handleBeforeUnload = () => {
            setPlayerOffline(roomId, user.uid);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Also mark offline on unmount (e.g. navigation away)
            setPlayerOffline(roomId, user.uid);
        };
    }, [roomId, user]);

    // Subscribe to game updates when roomId changes
    useEffect(() => {
        if (!roomId) {
            setGame(null);
            return;
        }

        const unsubscribe = subscribeToGame(roomId, (updatedGame) => {
            setGame(updatedGame);
        });

        return () => unsubscribe();
    }, [roomId]);

    const createGame = useCallback(async (userUid: string, userName: string, maxPlayers: number, isPrivate: boolean, password?: string) => {
        setLoading(true);
        setError(null);
        try {
            const newRoomId = await createGameService(userUid, userName, maxPlayers, isPrivate, password);
            setRoomId(newRoomId);
            localStorage.setItem('lastGameRoomId', newRoomId);
            localStorage.setItem('lastPlayerName', userName);
            return newRoomId;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const joinGame = useCallback(async (code: string, userUid: string, userName: string, password?: string) => {
        setLoading(true);
        setError(null);
        try {
            await joinGameService(code, userUid, userName, password);
            setRoomId(code);
            localStorage.setItem('lastGameRoomId', code);
            localStorage.setItem('lastPlayerName', userName);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const leaveGame = useCallback(async (code: string, userUid: string) => {
        setLoading(true);
        try {
            await leaveGameService(code, userUid);
            setRoomId(null);
            setGame(null);
        } catch (err) {
            setError(err as Error);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateStatus = useCallback(async (status: GameStatus) => {
        if (!roomId) return;
        try {
            await updateGameStatusService(roomId, status);
        } catch (err) {
            console.error("Failed to update status", err);
        }
    }, [roomId]);

    const startGame = useCallback(async () => {
        if (!roomId) return;
        setLoading(true);
        try {
            // dynamic import to avoid circular dependency if any, or just import it at top
            const { startGame } = await import('../services/game');
            await startGame(roomId);
        } catch (err) {
            setError(err as Error);
            console.error("Failed to start game", err);
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    return {
        game,
        loading,
        error,
        roomId,
        createGame,
        joinGame,
        leaveGame,
        updateStatus,
        startGame
    };
};
