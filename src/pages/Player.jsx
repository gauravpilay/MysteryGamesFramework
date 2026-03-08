import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import GamePreview from '../components/GamePreview';
import { motion } from 'framer-motion';
import { AlertTriangle, Fingerprint } from 'lucide-react';

const Player = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth() || {};
    const [gameData, setGameData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCaseData = async () => {
            if (!db || !projectId) return;
            try {
                // Wait for user data to be available for access check
                if (!user) return;

                const docRef = doc(db, "cases", projectId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    // Access Control Check
                    if (user.role !== 'Admin' && Array.isArray(user.assignedCaseIds)) {
                        if (!user.assignedCaseIds.includes(projectId)) {
                            setError("Unauthorized: You do not have clearance for this investigation file.");
                            return;
                        }
                    }

                    setGameData(data);
                } else {
                    setError("Case not found.");
                }
            } catch (error) {
                console.error("Error loading case:", error);
                setError("Failed to load case.");
            }
        };
        loadCaseData();
    }, [projectId, user]);

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
                // Save game result
                console.log("[PLAYER] Saving game result:", newResult);
                await addDoc(collection(db, "game_results"), newResult);

                // Save feedback separately if it exists
                if (resultData.feedback) {
                    console.log("[PLAYER] Feedback detected, saving to game_feedback:", resultData.feedback);
                    const feedbackData = {
                        ...resultData.feedback,
                        userId: user.email,
                        userDisplayName: user.displayName || user.email.split('@')[0],
                        caseId: projectId,
                        caseTitle: gameData?.title || 'Unknown Case',
                        score: resultData.score,
                        outcome: resultData.outcome,
                        timestamp: new Date().toISOString()
                    };
                    await addDoc(collection(db, "game_feedback"), feedbackData);
                }
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
            <div className="flex items-center justify-center h-screen bg-black text-red-500 relative overflow-hidden">
                {/* Noir Background Backdrop */}
                <div
                    className="absolute inset-0 z-0 opacity-40 brightness-[0.4] saturate-[0.5]"
                    style={{
                        backgroundImage: 'url("/neo_noir_bg.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-[1]"></div>

                <div className="text-center relative z-10 p-12 bg-zinc-950/40 backdrop-blur-xl border border-red-500/20 rounded-[40px] shadow-2xl">
                    <div className="p-5 bg-red-500/10 rounded-3xl border border-red-500/20 shadow-inner inline-block mb-6">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">System Error</h2>
                    <p className="text-zinc-400 font-medium mb-8 max-w-xs mx-auto">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-14 font-black uppercase tracking-widest text-xs rounded-2xl border border-white/5 transition-all active:scale-95"
                    >
                        Return to Command Center
                    </button>
                </div>
            </div>
        );
    }

    if (!gameData) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white relative overflow-hidden">
                {/* Noir Background Backdrop */}
                <div
                    className="absolute inset-0 z-0 opacity-40 brightness-[0.5] saturate-[0.8]"
                    style={{
                        backgroundImage: 'url("/neo_noir_bg.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                ></div>
                <div className="absolute inset-0 bg-radial-gradient(circle_at_center,_transparent_0%,_black_100%) z-[1] opacity-60"></div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Fingerprint className="w-8 h-8 text-indigo-500 opacity-50" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xs uppercase tracking-[0.4em] font-black text-indigo-400 animate-pulse">Decrypting Case Files</p>
                        <div className="h-1 w-48 bg-zinc-900 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                            />
                        </div>
                    </div>
                </div>
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
