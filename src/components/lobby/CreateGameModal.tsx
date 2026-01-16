import React, { useState } from 'react';

interface CreateGameModalProps {
    onClose: () => void;
    onCreate: (name: string, maxPlayers: number) => void;
    loading: boolean;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({ onClose, onCreate, loading }) => {
    const [name, setName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(2);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name, maxPlayers);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bg-panel p-6 rounded-lg text-white w-96 border border-white/10">
                <h2 className="text-2xl font-bold mb-4">Create New Game</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 rounded bg-white/10 border border-white/20 focus:border-game-blue outline-none transition-colors placeholder-white/50 text-white"
                            placeholder="Enter your name"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold mb-2">Number of Players</label>
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
                            {maxPlayers === 2 && "1 vs 1 (Red vs Blue)"}
                            {maxPlayers === 3 && "1 vs 1 vs 1 (Red vs Blue vs Green)"}
                            {maxPlayers === 4 && "2 vs 2 Teams (Red vs Blue)"}
                        </p>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-white/60 hover:bg-white/10 rounded transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            disabled={loading || !name.trim()}
                        >
                            {loading ? 'Creating...' : 'Create Room'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
