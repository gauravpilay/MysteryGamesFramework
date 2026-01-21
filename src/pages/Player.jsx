import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
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

    const { user } = useAuth() || {}; // Handle potential null if not wrapped (though it should be)

    const handleGameEnd = async (resultData) => {
        if (!user || !user.email) {
            navigate('/');
            return;
        }

        const newResult = {
            ...resultData,
            userId: user.email,
            userDisplayName: user.displayName || user.email.split('@')[0],
            caseId: projectId,
            caseTitle: gameData?.title || 'Unknown Case',
            playedAt: new Date().toISOString(),
        };

        if (db) {
            try {
                await addDoc(collection(db, "game_results"), newResult);
            } catch (err) {
                console.error("Failed to save game stats to DB, falling back to local storage", err);
                saveToLocalStorage(newResult);
            }
        } else {
            // Offline / Mock Mode
            saveToLocalStorage(newResult);
        }

        navigate('/');
    };

    const saveToLocalStorage = (result) => {
        try {
            const existing = JSON.parse(localStorage.getItem('mystery_game_results') || '[]');
            localStorage.setItem('mystery_game_results', JSON.stringify([result, ...existing]));
        } catch (e) {
            console.error("Local storage save failed", e);
        }
    };



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
            onGameEnd={handleGameEnd}
        />
    );
};

export default Player;
