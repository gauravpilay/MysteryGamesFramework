import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import GamePreview from '../components/GamePreview';

const Player = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [gameData, setGameData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCaseData = async () => {
            if (!db || !projectId) return;
            try {
                const docRef = doc(db, "cases", projectId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setGameData(docSnap.data());
                } else {
                    setError("Case not found.");
                }
            } catch (error) {
                console.error("Error loading case:", error);
                setError("Failed to load case.");
            }
        };
        loadCaseData();
    }, [projectId]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-red-500">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!gameData) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <div className="animate-pulse">Loading Mission Data...</div>
            </div>
        );
    }

    return (
        <GamePreview
            nodes={gameData.nodes || []}
            edges={gameData.edges || []}
            gameMetadata={gameData.meta || {}}
            onClose={() => navigate('/')}
        />
    );
};

export default Player;
