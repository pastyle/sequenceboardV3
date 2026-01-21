import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGameConnection } from '../../hooks/useGameConnection';

const FirebaseTest: React.FC = () => {
    const { user, signIn, error: authError } = useAuth();
    const {
        game,
        roomId,
        createGame,
        joinGame,
        leaveGame,
        updateStatus,
        loading: gameLoading,
        error: gameError
    } = useGameConnection();

    const [inputRoomId, setInputRoomId] = useState('');

    useEffect(() => {
        if (user) console.log('FirebaseTest: User authenticated:', user.uid);
    }, [user]);

    useEffect(() => {
        if (game) console.log('FirebaseTest: Game updated:', game);
    }, [game]);

    useEffect(() => {
        if (roomId) console.log('FirebaseTest: Room ID set:', roomId);
    }, [roomId]);

    return (
        <div className="p-4 border rounded bg-gray-100 text-black">
            <h2 className="text-xl font-bold mb-4">Firebase Integration Test</h2>

            {/* Auth Section */}
            <div className="mb-6 p-4 bg-white rounded shadow">
                <h3 className="font-bold mb-2">Authentication</h3>
                {authError && <div className="text-red-500 mb-2">Error: {authError.message}</div>}
                {user ? (
                    <div>
                        <p className="text-green-600">Logged in as: {user.uid}</p>
                        <p className="text-sm text-gray-500">Anonymous: {user.isAnonymous ? 'Yes' : 'No'}</p>
                    </div>
                ) : (
                    <button
                        onClick={signIn}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Sign In Anonymously
                    </button>
                )}
            </div>

            {/* Game Section */}
            {user && (
                <div className="p-4 bg-white rounded shadow">
                    <h3 className="font-bold mb-2">Game Connection</h3>
                    {gameError && <div className="text-red-500 mb-2">Game Error: {gameError.message}</div>}

                    {!roomId ? (
                        <div className="flex gap-4 items-end">
                            <div>
                                <button
                                    onClick={() => createGame(user.uid, 'TestUser Host', 2, false)}
                                    disabled={gameLoading}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                                >
                                    {gameLoading ? 'Creating...' : 'Create New Game'}
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputRoomId}
                                    onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                                    placeholder="Room Code"
                                    className="border p-2 rounded"
                                />
                                <button
                                    onClick={() => joinGame(inputRoomId, user.uid, 'TestUser Joiner')}
                                    disabled={gameLoading || !inputRoomId}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
                                >
                                    {gameLoading ? 'Joining...' : 'Join Game'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-lg">Room: <span className="font-mono font-bold">{roomId}</span></p>
                                <button
                                    onClick={() => leaveGame(roomId, user.uid)}
                                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                >
                                    Leave Game
                                </button>
                            </div>

                            {game ? (
                                <div className="text-sm">
                                    <p>Status: <b className="uppercase">{game.status}</b></p>
                                    <p>Players: {Object.keys(game.players).length}</p>
                                    <ul className="list-disc pl-5 mt-2">
                                        {Object.entries(game.players).map(([uid, p]) => (
                                            <li key={uid} className={uid === user.uid ? 'font-bold text-blue-600' : ''}>
                                                {p.name} ({p.uid.substring(0, 5)}...) {p.isHost ? '[HOST]' : ''}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => updateStatus('playing')}
                                            className="bg-purple-500 text-white px-2 py-1 rounded text-xs"
                                        >
                                            Set Playing
                                        </button>
                                        <button
                                            onClick={() => updateStatus('finished')}
                                            className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
                                        >
                                            Set Finished
                                        </button>
                                    </div>

                                    <pre className="mt-4 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
                                        {JSON.stringify(game, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <p>Loading game data...</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FirebaseTest;
