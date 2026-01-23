import React, { useState } from 'react';
import { useLanguage } from '../../i18n';

interface CreateGameModalProps {
    onClose: () => void;
    onCreate: (name: string, maxPlayers: number, isPrivate: boolean, password?: string) => void;
    loading: boolean;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({ onClose, onCreate, loading }) => {
    const [name, setName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(2);
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useLanguage();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            if (isPrivate && !password.trim()) {
                return;
            }
            onCreate(name, maxPlayers, isPrivate, password);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bg-panel p-6 rounded-lg text-white w-96 border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold mb-4">{t.lobby_createGame}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
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

                    <div className="mb-6">
                        <label className="block text-sm font-bold mb-2">{t.lobby_maxCapacity}</label>
                        <div className="flex gap-4">
                            {[2, 3, 4].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setMaxPlayers(num)}
                                    className={`px-4 py-2 rounded transition-colors ${maxPlayers === num
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-white/60 mt-2">
                            {maxPlayers === 2 && t.lobby_1v1}
                            {maxPlayers === 3 && t.lobby_1v1v1}
                            {maxPlayers === 4 && t.lobby_2v2}
                        </p>
                    </div>

                    <div className="mb-6 border-t border-white/10 pt-4">
                        <label className="flex items-center gap-2 cursor-pointer mb-4">
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-bold flex items-center gap-2">
                                {t.lobby_privateRoom} {isPrivate && '🔒'}
                            </span>
                        </label>

                        {isPrivate && (
                            <div className="relative">
                                <label className="block text-sm font-bold mb-2">{t.lobby_passwordRequired}</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-3 pr-10 rounded bg-white/10 border border-white/20 focus:border-game-blue outline-none transition-colors text-white"
                                        placeholder={t.lobby_passwordPlaceholder}
                                        maxLength={10}
                                        required={isPrivate}
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
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-white/60 hover:bg-white/10 rounded transition-colors"
                        >
                            {t.lobby_cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="bg-game-blue px-4 py-2 rounded hover:brightness-110 disabled:opacity-50 transition-colors"
                        >
                            {loading ? t.lobby_joining : t.lobby_create}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
