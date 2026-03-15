import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import {
    doc, getDoc, addDoc, collection, setDoc, deleteDoc, query, where, getDocs
} from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import { useConfig } from '../lib/config';
import { triggerAllHooks } from '../lib/integrations';
import GamePreview from '../components/GamePreview';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Fingerprint, BookOpen, RefreshCcw, BookmarkCheck, Clock, Star } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const getSaveDocId = (userId, caseId) => `${userId}_${caseId}`;

const getProgressFromDb = async (userId, caseId) => {
    if (!db) return null;
    try {
        const docRef = doc(db, 'game_progress', getSaveDocId(userId, caseId));
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data();
    } catch (e) {
        console.warn('[Player] Failed to fetch saved progress:', e);
    }
    return null;
};

const saveProgressToDb = async (userId, caseId, progressData) => {
    if (!db) {
        // Fallback to localStorage
        try {
            localStorage.setItem(`game_progress_${userId}_${caseId}`, JSON.stringify(progressData));
        } catch (e) { /* ignore */ }
        return;
    }
    const docRef = doc(db, 'game_progress', getSaveDocId(userId, caseId));
    await setDoc(docRef, {
        userId,
        caseId,
        ...progressData
    });
};

const clearProgressFromDb = async (userId, caseId) => {
    if (!db) {
        try { localStorage.removeItem(`game_progress_${userId}_${caseId}`); } catch (e) { /* ignore */ }
        return;
    }
    try {
        const docRef = doc(db, 'game_progress', getSaveDocId(userId, caseId));
        await deleteDoc(docRef);
    } catch (e) {
        console.warn('[Player] Failed to clear saved progress:', e);
    }
};

const formatSavedTime = (isoString) => {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        return d.toLocaleString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return ''; }
};
// ─────────────────────────────────────────────────────────────────────────────

const Player = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth() || {};
    const { settings } = useConfig();

    const [gameData, setGameData] = useState(null);
    const [error, setError] = useState(null);

    // Save-progress state
    const [savedProgress, setSavedProgress] = useState(null);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [resolvedProgress, setResolvedProgress] = useState(null); // null = fresh, object = resume
    const [gameReady, setGameReady] = useState(false); // after prompt decision

    // Load game data + check for existing progress
    useEffect(() => {
        const loadCaseData = async () => {
            if (!projectId) return;
            if (!user) return; // wait for user

            try {
                if (!db) { setError('Database not configured.'); return; }
                const docRef = doc(db, 'cases', projectId);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    setError('Case not found.');
                    return;
                }

                const data = docSnap.data();

                // Access Control
                if (user.role !== 'Admin' && Array.isArray(user.assignedCaseIds)) {
                    if (!user.assignedCaseIds.includes(projectId)) {
                        setError('Unauthorized: You do not have clearance for this investigation file.');
                        return;
                    }
                }

                setGameData(data);

                // Check for existing saved progress
                const userId = user?.uid || user?.email || 'anon';
                const existingProgress = await getProgressFromDb(userId, projectId);
                if (existingProgress?.currentNodeId) {
                    setSavedProgress(existingProgress);
                    setShowResumePrompt(true);
                } else {
                    setGameReady(true);
                }
            } catch (err) {
                console.error('Error loading case:', err);
                setError('Failed to load case.');
            }
        };

        loadCaseData();
    }, [projectId, user]);

    // Handle resume decision
    const handleResume = () => {
        setResolvedProgress(savedProgress);
        setShowResumePrompt(false);
        setGameReady(true);
    };

    const handleFreshStart = async () => {
        const userId = user?.uid || user?.email || 'anon';
        await clearProgressFromDb(userId, projectId);
        setResolvedProgress(null);
        setSavedProgress(null);
        setShowResumePrompt(false);
        setGameReady(true);
    };

    // Called by GamePreview when Save Progress button is clicked
    const handleSaveProgress = async (progressData) => {
        const userId = user?.uid || user?.email || 'anon';
        await saveProgressToDb(userId, projectId, progressData);
        console.log('[Player] Game progress saved.');
    };

    // Called by GamePreview when game ends
    const handleGameEnd = async (resultData) => {
        const userId = user?.uid || user?.email || 'anon';

        // If player saved and quit — just clear progress and go home (no feedback saved)
        if (resultData?.savedAndQuit) {
            navigate('/');
            return;
        }

        // Clear saved progress since game finished
        await clearProgressFromDb(userId, projectId);

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

        // Trigger External Integrations (Hooks)
        if (settings.integrations?.webhooks) {
            triggerAllHooks(settings.integrations.webhooks, 'game_completed', newResult);
        }

        if (db) {
            try {
                console.log('[PLAYER] Saving game result:', newResult);
                await addDoc(collection(db, 'game_results'), newResult);

                if (resultData.feedback) {
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
                    await addDoc(collection(db, 'game_feedback'), feedbackData);
                }
            } catch (err) {
                console.error('Failed to save game stats to DB, falling back to local storage', err);
                saveToLocalStorage(newResult);
            }
        } else {
            saveToLocalStorage(newResult);
        }

        navigate('/');
    };

    const saveToLocalStorage = (result) => {
        try {
            const existing = JSON.parse(localStorage.getItem('mystery_game_results') || '[]');
            localStorage.setItem('mystery_game_results', JSON.stringify([result, ...existing]));
        } catch (e) {
            console.error('Local storage save failed', e);
        }
    };

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-red-500 relative overflow-hidden">
                <div
                    className="absolute inset-0 z-0 opacity-40 brightness-[0.4] saturate-[0.5]"
                    style={{ backgroundImage: 'url("/neo_noir_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-[1]" />
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

    // ── Loading ───────────────────────────────────────────────────────────────
    if (!gameData) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white relative overflow-hidden">
                <div
                    className="absolute inset-0 z-0 opacity-40 brightness-[0.5] saturate-[0.8]"
                    style={{ backgroundImage: 'url("/neo_noir_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
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
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Resume Prompt ─────────────────────────────────────────────────────────
    if (showResumePrompt && savedProgress) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black overflow-hidden">
                {/* Background */}
                <div
                    className="absolute inset-0 z-0 opacity-40 brightness-[0.45] saturate-[0.7]"
                    style={{ backgroundImage: 'url("/neo_noir_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80 z-[1]" />
                {/* Ambient glows */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none z-[1]" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-900/10 rounded-full blur-[120px] pointer-events-none z-[1]" />

                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                        className="relative z-10 bg-zinc-950/95 border border-indigo-500/25 rounded-[2.5rem] p-10 max-w-xl w-full text-center overflow-hidden"
                        style={{ boxShadow: '0 0 100px rgba(79,70,229,0.15), 0 40px 80px rgba(0,0,0,0.7)' }}
                    >
                        {/* Ambient card glows */}
                        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-600/8 rounded-full blur-3xl pointer-events-none" />

                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.1 }}
                            className="flex justify-center mb-7"
                        >
                            <div className="relative w-28 h-28">
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl"
                                    animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <div className="relative w-28 h-28 bg-indigo-500/10 border-2 border-indigo-500/40 rounded-full flex items-center justify-center">
                                    <BookmarkCheck className="w-13 h-13 text-indigo-400" style={{ width: 52, height: 52 }} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Header badge */}
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-5">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Investigation In Progress</span>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-3">
                                Resume Your Case?
                            </h2>
                            <p className="text-zinc-400 text-base font-medium leading-relaxed mb-6 px-2">
                                You have an <span className="text-indigo-300 font-bold">unfinished investigation</span> saved for this case.
                                Would you like to continue where you left off, or start fresh?
                            </p>

                            {/* Save metadata */}
                            <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
                                {savedProgress.savedAt && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/80 border border-white/8 rounded-xl">
                                        <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                                        <div className="text-left">
                                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Last Saved</div>
                                            <div className="text-[11px] font-bold text-zinc-300">{formatSavedTime(savedProgress.savedAt)}</div>
                                        </div>
                                    </div>
                                )}
                                {savedProgress.score !== undefined && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/80 border border-white/8 rounded-xl">
                                        <Star className="w-4 h-4 text-amber-500 shrink-0 fill-amber-500" />
                                        <div className="text-left">
                                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Score</div>
                                            <div className="text-[11px] font-bold text-amber-400">{savedProgress.score} pts</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.22 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {/* Resume */}
                            <button
                                onClick={handleResume}
                                className="group relative py-6 flex flex-col items-center gap-3 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-300 active:scale-95 overflow-hidden shadow-xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-colors">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black tracking-[0.2em] opacity-70 mb-0.5">Pick Up Where</div>
                                    <div className="text-sm">You Left Off</div>
                                </div>
                            </button>

                            {/* Fresh Start */}
                            <button
                                onClick={handleFreshStart}
                                className="group relative py-6 flex flex-col items-center gap-3 bg-amber-500/10 hover:bg-amber-600 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-300 active:scale-95 overflow-hidden shadow-xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                                    <RefreshCcw className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black tracking-[0.2em] opacity-70 mb-0.5">Discard Progress &</div>
                                    <div className="text-sm">Start Fresh</div>
                                </div>
                            </button>
                        </motion.div>

                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-indigo-500/20 rounded-tl-[2.5rem]" />
                        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-indigo-500/20 rounded-tr-[2.5rem]" />
                        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-indigo-500/20 rounded-bl-[2.5rem]" />
                        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-indigo-500/20 rounded-br-[2.5rem]" />
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    // ── Game ──────────────────────────────────────────────────────────────────
    if (!gameReady) return null; // briefly while prompt resolves

    const userId = user?.uid || user?.email || 'anon';

    return (
        <GamePreview
            nodes={gameData.nodes || []}
            edges={gameData.edges || []}
            gameMetadata={gameData.meta || {}}
            onClose={() => navigate('/')}
            onGameEnd={handleGameEnd}
            userId={userId}
            caseId={projectId}
            savedProgress={resolvedProgress}
            onSaveProgress={handleSaveProgress}
        />
    );
};

export default Player;
