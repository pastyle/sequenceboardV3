import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n';

interface JoinGameModalProps {
    roomName: string;
    isPrivate: boolean;
    initialName?: string;
    onClose: () => void;
    onJoin: (name: string, password?: string) => void;
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
    const { t } = useLanguage();

    useEffect(() => {
        if (initialName) setName(initialName);
    }, [initialName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            if (isPrivate && !password) return;
            onJoin(name, password);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bg-panel p-6 rounded-lg text-white w-96 border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold mb-1">{t.lobby_joinGame}</h2>
                <p className="text-sm text-white/50 mb-6">Room: <span className="text-white font-mono">{roomName}</span></p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">{t.lobby_enterName}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 rounded bg-white/10 border border-white/20 focus:border-game-blue outline-none transition-colors placeholder-white/50 text-white"
                            placeholder={t.lobby_enterName}
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
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 pr-10 rounded bg-white/10 border border-white/20 focus:border-game-blue outline-none transition-colors text-white"
                                    placeholder={t.lobby_enterPasswordFor}
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
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-white/60 hover:bg-white/10 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || (isPrivate && !password)}
                            className="bg-game-blue px-6 py-2 rounded hover:brightness-110 disabled:opacity-50 transition-colors font-bold"
                        >
                            {t.lobby_join}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
