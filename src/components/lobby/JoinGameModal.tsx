import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n';

interface JoinGameModalProps {
    roomName: string;
    isPrivate: boolean;
    initialName?: string;
    onClose: () => void;
    onJoin: (name: string, password?: string) => Promise<void>;
}

export const JoinGameModal: React.FC<JoinGameModalProps> = ({
    roomName,
    isPrivate,
    initialName = '',
    onClose,
    onJoin
}) => {
    const [name, setName] = useState(initialName);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        if (initialName) setName(initialName);
    }, [initialName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            // Require password if room is private
            if (isPrivate && !password) return;

            setError(null);
            setLoading(true);

            try {
                await onJoin(name, password || undefined);
                // Success - modal will be closed by parent
            } catch (err: any) {
                setLoading(false);
                // Show error within modal with translation
                let errorMsg = err.message || 'Unknown error';
                if (errorMsg === 'Invalid Password') errorMsg = t.error_invalidPassword;
                if (errorMsg === 'Room is full') errorMsg = t.error_roomFull;
                if (errorMsg === 'Game is defined as already playing or finished') errorMsg = t.error_gameAlreadyStarted;
                setError(errorMsg);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bg-panel p-6 rounded-lg text-white w-96 border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold mb-1">{t.lobby_joinRoom}</h2>
                <p className="text-sm text-white/50 mb-6">{t.waiting_roomCode} <span className="text-white font-mono">{roomName}</span></p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">{t.lobby_enterName}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 rounded bg-white/10 border border-white/20 focus:border-game-blue outline-none transition-colors placeholder-white/50 text-white"
                            placeholder={t.lobby_enterName}
                            maxLength={20}
                            autoFocus
                            required
                        />
                    </div>

                    {isPrivate && (
                        <div>
                            <label className="block text-sm font-bold mb-2">{t.lobby_passwordRequired}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError(null); // Clear error when user types
                                    }}
                                    className={`w-full p-3 pr-10 rounded bg-white/10 border transition-colors text-white ${error ? 'border-red-500' : 'border-white/20 focus:border-game-blue'
                                        } outline-none`}
                                    placeholder={t.lobby_passwordPlaceholder}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm mt-2 animate-in slide-in-from-top-1">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded bg-white/10 hover:bg-white/20 transition-colors font-bold"
                            disabled={loading}
                        >
                            {t.lobby_cancel}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-game-blue hover:bg-blue-600 px-4 py-3 rounded transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? t.lobby_joining : t.lobby_join}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
