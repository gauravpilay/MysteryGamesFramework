import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, User, FileText, Star, Trophy, Eye, RotateCcw, X, Target, Link as LinkIcon, Info, Sparkles, Zap, Shield } from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────────────────
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ─── Drop Slot Component ──────────────────────────────────────────────────────
const DropSlot = ({ id, label, icon: Icon, acceptedType, onDrop, currentItem, isCorrect, checked }) => {
    const [isOver, setIsOver] = useState(false);

    const border = checked
        ? (isCorrect ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.3)]')
        : (isOver ? 'border-indigo-400 bg-indigo-500/20 ring-4 ring-indigo-500/10 shadow-[0_0_25px_rgba(99,102,241,0.4)]' : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-800/40 shadow-inner');

    return (
        <div
            className={`relative w-full h-full border-2 border-dashed rounded-[2rem] transition-all duration-500 flex flex-col items-center justify-center p-3 group backdrop-blur-sm ${border}`}
            onDragOver={(e) => {
                e.preventDefault();
                setIsOver(true);
            }}
            onDragLeave={() => setIsOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsOver(false);
                const dataText = e.dataTransfer.getData('application/json');
                if (!dataText) return;
                const data = JSON.parse(dataText);
                if (data.type === acceptedType) {
                    onDrop(id, data.item);
                }
            }}
        >
            {/* Slot Pulse Effect when empty */}
            {!currentItem && !checked && (
                <div className="absolute inset-0 rounded-[2rem] bg-indigo-500/5 animate-pulse" />
            )}

            {currentItem ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full h-full relative z-10">
                    {acceptedType === 'suspect' ? (
                        <div className="flex flex-col items-center h-full">
                            {currentItem.image ? (
                                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                                    <img src={currentItem.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 left-0 right-0 px-2 text-center">
                                        <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider truncate">{currentItem.name}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex flex-col items-center justify-center border border-white/5 shadow-2xl">
                                    <User className="w-12 h-12 text-zinc-600 mb-2" />
                                    <p className="text-[10px] md:text-xs font-black text-zinc-400 text-center leading-tight truncate w-full px-2 uppercase">{currentItem.name}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full px-4 bg-gradient-to-br from-indigo-950/40 to-black/40 rounded-2xl border border-indigo-500/20 shadow-xl">
                            <p className="text-xs md:text-sm font-bold text-indigo-100 text-center leading-relaxed line-clamp-4 italic">"{currentItem.action || currentItem}"</p>
                        </div>
                    )}

                    <button
                        onClick={() => onDrop(id, null)}
                        className="absolute -top-4 -right-4 w-9 h-9 bg-zinc-900 border-2 border-white/20 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-rose-600 hover:border-white transition-all shadow-2xl z-30 group"
                    >
                        <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </motion.div>
            ) : (
                <div className="flex flex-col items-center gap-3 opacity-30 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110">
                    <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700 shadow-lg">
                        <Icon className="w-8 h-8 text-zinc-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{label}</span>
                </div>
            )}

            {checked && currentItem && (
                <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className={`absolute -top-5 -left-5 rounded-full p-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-30 ${isCorrect ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'}`}
                >
                    {isCorrect ? <CheckCircle className="w-6 h-6" /> : <X className="w-6 h-6" />}
                </motion.div>
            )}
        </div>
    );
};

// ─── Draggable Item ────────────────────────────────────────────────────────────
const DraggableItem = ({ item, type, isUsed }) => {
    return (
        <motion.div
            draggable={!isUsed}
            onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type, item }));
            }}
            whileHover={!isUsed ? { scale: 1.05, y: -8, rotate: 1 } : {}}
            whileTap={!isUsed ? { scale: 0.95 } : {}}
            className={`cursor-grab active:cursor-grabbing transition-all duration-500 ${isUsed ? 'opacity-20 grayscale scale-90 pointer-events-none' : 'opacity-100'}`}
        >
            {type === 'suspect' ? (
                <div className="w-32 md:w-36 bg-zinc-900 border border-white/10 rounded-[1.5rem] p-3 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.8)] overflow-hidden group relative">
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors duration-500" />

                    {item.image ? (
                        <div className="relative w-full h-24 md:h-28 rounded-xl overflow-hidden mb-3">
                            <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-2 left-0 right-0 px-2 text-center">
                                <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">{item.name}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-24 md:h-28 bg-gradient-to-br from-zinc-800 to-black border border-white/5 rounded-xl flex items-center justify-center mb-3">
                            <User className="w-10 h-10 text-zinc-600" />
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Suspect File</p>
                    </div>
                </div>
            ) : (
                <div className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-400/50 rounded-2xl p-4 shadow-2xl flex items-center gap-4 group transition-all duration-300">
                    <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/20 group-hover:rotate-12 transition-transform shadow-lg">
                        <Zap className="w-4 h-4 text-indigo-400 group-hover:text-indigo-200" />
                    </div>
                    <p className="text-[11px] font-bold text-indigo-100/80 leading-snug line-clamp-2 uppercase tracking-wide group-hover:text-white transition-colors italic">"{item.action}"</p>
                </div>
            )}
        </motion.div>
    );
};

// ─── Main Game Component ──────────────────────────────────────────────────────
export const CrazyWallGame = ({ node, nodes: allNodes, onComplete, addLog }) => {
    const data = node?.data || {};
    const designerConnections = data.connections || [];

    // ─── Setup Items ──────────────────────────────────────────────────────────
    const suspects = useMemo(() => {
        const suspectNodes = allNodes.filter(n => n.type === 'suspect');
        return suspectNodes.map(n => ({
            id: n.id,
            name: n.data?.name || n.data?.displayName || n.data?.label || 'Unknown',
            image: n.data?.image || n.data?.images?.[0] || n.data?.url || ''
        }));
    }, [allNodes]);

    const allReasons = useMemo(() => shuffle(
        designerConnections.map((c, i) => ({ id: `reason_${i}`, action: c.action, correctSuspectId: c.suspectId }))
    ), [designerConnections]);

    // ─── State ────────────────────────────────────────────────────────────────
    const [placedCulprit, setPlacedCulprit] = useState(null);
    const [placedAssociates, setPlacedAssociates] = useState(Array(designerConnections.length).fill(null));
    const [placedReasons, setPlacedReasons] = useState(Array(designerConnections.length).fill(null));

    const [checked, setChecked] = useState(false);
    const [results, setResults] = useState({ culpritOk: false, rows: [] });
    const [showReveal, setShowReveal] = useState(false);

    // ─── State Sync ───────────────────────────────────────────────────────────
    // If the node connections change (e.g. from editor), sync the state arrays
    useEffect(() => {
        const len = designerConnections.length;
        setPlacedAssociates(prev => {
            if (prev.length === len) return prev;
            return Array(len).fill(null);
        });
        setPlacedReasons(prev => {
            if (prev.length === len) return prev;
            return Array(len).fill(null);
        });
        setResults({ culpritOk: false, rows: [] });
        setChecked(false);
    }, [designerConnections.length]);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleDropCulprit = (slotId, suspect) => {
        setPlacedCulprit(suspect);
        setChecked(false);
    };

    const handleDropAssociate = (index, suspect) => {
        const idx = parseInt(index.split('_')[1]);
        const next = [...placedAssociates];
        next[idx] = suspect;
        setPlacedAssociates(next);
        setChecked(false);
    };

    const handleDropReason = (index, reason) => {
        const idx = parseInt(index.split('_')[1]);
        const next = [...placedReasons];
        next[idx] = reason;
        setPlacedReasons(next);
        setChecked(false);
    };

    const handleCheck = () => {
        const culpritOk = String(placedCulprit?.id) === String(data.culpritId);
        const rowResults = placedAssociates.map((assoc, idx) => {
            const reason = placedReasons[idx];
            if (!assoc || !reason) return { suspectOk: false, reasonOk: false };

            // Look for a connection that matches this suspect ID
            // We use find to see if ANY of the designer's connections for this suspect match the reason
            const match = designerConnections.find(dc => String(dc.suspectId) === String(assoc.id));
            const isMatch = match && String(match.action).trim() === String(reason.action).trim();
            return { suspectOk: isMatch, reasonOk: isMatch };
        });

        setResults({ culpritOk, rows: rowResults });
        setChecked(true);

        const allCorrect = culpritOk && rowResults.every(r => r.suspectOk);
        if (allCorrect) {
            addLog("ANALYSIS COMPLETE: Conspiracy confirmed.");
            setTimeout(() => setShowReveal(true), 1200);
        } else {
            addLog("ANALYSIS FAILED: Correlation mismatch detected.");
        }
    };

    const handleReset = () => {
        setPlacedCulprit(null);
        setPlacedAssociates(Array(designerConnections.length).fill(null));
        setPlacedReasons(Array(designerConnections.length).fill(null));
        setChecked(false);
        setResults({ culpritOk: false, rows: [] });
    };

    const isComplete = placedCulprit !== null &&
        placedAssociates.every(a => a !== null) &&
        placedReasons.every(r => r !== null);

    const usedSuspectIds = [placedCulprit?.id, ...placedAssociates.map(a => a?.id)].filter(Boolean);
    const usedReasonIds = placedReasons.map(r => r?.id).filter(Boolean);

    // ─── Render ───────────────────────────────────────────────────────────────
    if (showReveal) {
        return (
            <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute inset-0 bg-red-950/20 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[150px] rounded-full" />
                </div>
                <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10 }} className="mb-12 relative">
                    <Trophy className="w-48 h-48 text-amber-400 mx-auto drop-shadow-[0_0_50px_rgba(251,191,36,0.8)]" />
                    <motion.div animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 rounded-full bg-amber-500/30 blur-[100px] -z-10" />
                </motion.div>
                <div className="relative">
                    <h2 className="text-5xl md:text-8xl font-black text-white mb-6 uppercase tracking-[-0.05em] leading-tight italic drop-shadow-2xl">
                        PLOT <span className="text-amber-400">EXPOSED</span>
                    </h2>
                    <div className="h-2 w-48 bg-amber-500 mx-auto rounded-full mb-10 shadow-[0_0_30px_rgba(251,191,36,0.5)]" />
                </div>
                <p className="text-zinc-400 max-w-2xl text-xl mb-16 leading-relaxed font-medium">The labyrinth has been navigated. The mastermind stands naked against the truth of your deduction.</p>
                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(251,191,36,0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onComplete && onComplete(data.score || 1000)}
                    className="px-20 py-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-black font-black uppercase tracking-[0.5em] rounded-3xl transition-all shadow-2xl text-lg flex items-center gap-4 group"
                >
                    Secured Case File
                    <Shield className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </motion.button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] bg-[#050507] flex flex-col md:flex-row overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
            {/* Ambient Lighting FX */}
            <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-indigo-600/10 blur-[200px] pointer-events-none opacity-50" />
            <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-red-600/10 blur-[200px] pointer-events-none opacity-50" />

            {/* Left Sidebar - Evidence Locker */}
            <div className="w-full md:w-96 bg-zinc-950/80 backdrop-blur-3xl border-r border-white/5 flex flex-col h-full z-40 shadow-[20px_0_50px_rgba(0,0,0,0.5)] relative">
                {/* Header with vibrant accent */}
                <div className="p-8 border-b border-white/10 bg-gradient-to-br from-zinc-900/60 to-transparent relative overflow-hidden">
                    <div className="absolute top-0 right-[-20px] w-40 h-40 bg-indigo-600/10 blur-3xl rounded-full" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="p-3 bg-red-600/20 rounded-2xl border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                            <Target className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-black text-white uppercase tracking-[0.2em] leading-none mb-1">Evidence Locker</h2>
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-red-500 animate-pulse">Neural Decryption Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-12 custom-scrollbar relative">
                    <section>
                        <h3 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.4em] mb-6 flex items-center justify-between group">
                            <span className="flex items-center gap-3 group-hover:text-zinc-300 transition-colors">
                                <User className="w-4 h-4 text-indigo-400" /> Case Subjects
                            </span>
                            <span className="bg-indigo-500/10 px-2.5 py-1 rounded-full text-[9px] border border-indigo-500/20 text-indigo-300 font-bold">{suspects.length}</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-5">
                            {suspects.map(s => (
                                <DraggableItem key={s.id} item={s} type="suspect" isUsed={usedSuspectIds.includes(s.id)} />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.4em] mb-6 flex items-center justify-between group">
                            <span className="flex items-center gap-3 group-hover:text-zinc-300 transition-colors">
                                <Sparkles className="w-4 h-4 text-amber-500" /> Encrypted Dossiers
                            </span>
                            <span className="bg-amber-500/10 px-2.5 py-1 rounded-full text-[9px] border border-amber-500/20 text-amber-300 font-bold">{allReasons.length}</span>
                        </h3>
                        <div className="space-y-5">
                            {allReasons.map(r => (
                                <DraggableItem key={r.id} item={r} type="reason" isUsed={usedReasonIds.includes(r.id)} />
                            ))}
                        </div>
                    </section>
                </div>

                <div className="p-8 bg-zinc-950/50 backdrop-blur-md border-t border-white/5">
                    <button
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-3 p-5 rounded-[1.5rem] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/80 transition-all text-xs font-black uppercase tracking-[0.3em] group shadow-xl"
                    >
                        <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
                        Reset Theory
                    </button>
                </div>
            </div>

            {/* Main Plot Area */}
            <div className="flex-1 relative bg-gradient-to-b from-[#08080a] to-[#050507] overflow-y-auto custom-scrollbar flex flex-col">
                {/* Background Grid Pattern - More Visible */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '48px 48px' }} />

                <div className="relative z-10 px-12 py-24 flex flex-col items-center flex-1 max-w-7xl mx-auto w-full">

                    {/* Header Section */}
                    <div className="text-center mb-28 relative">
                        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center">
                            <div className="px-8 py-2 bg-gradient-to-r from-red-600/20 to-indigo-600/20 border border-white/10 backdrop-blur-3xl rounded-full mb-8 shadow-2xl">
                                <span className="text-[10px] font-black uppercase tracking-[0.8em] text-white/80">RECONSTRUCTION MODULE</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-[-0.04em] mb-6 italic leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                {data.label || 'THE CONSPIRACY'}
                            </h1>
                            <div className="flex items-center gap-6 mb-8">
                                <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-red-600 to-red-600 rounded-full" />
                                <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-ping" />
                                <div className="h-0.5 w-24 bg-gradient-to-l from-transparent via-red-600 to-red-600 rounded-full" />
                            </div>
                            <p className="text-zinc-500 text-lg max-w-2xl mx-auto leading-relaxed italic font-medium px-8 border-l-4 border-red-600/50 bg-white/5 py-4 rounded-r-2xl">
                                "{data.introText || 'The pieces are scattered. Link the mastermind to their web of exploitation and reveal the motive underlying the crime.'}"
                            </p>
                        </motion.div>
                    </div>

                    <div className="w-full flex flex-col items-center gap-20 relative pb-48">

                        {/* 1. MASTERMIND TARGET AREA */}
                        <div className="relative z-30 group">
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 whitespace-nowrap">
                                <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.5em] drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">The Mastermind</span>
                            </div>

                            {/* Scanning VFX around target */}
                            <div className="absolute inset-[-40px] border border-red-500/10 rounded-full animate-[spin_10s_linear_infinite] pointer-events-none" />
                            <div className="absolute inset-[-20px] border border-white/5 rounded-full pointer-events-none" />

                            <div className="w-64 h-[22rem] transform transition-all duration-700 group-hover:scale-[1.05] group-hover:rotate-[-2deg] relative">
                                <DropSlot
                                    id="culprit"
                                    label="Deduce Mastermind"
                                    icon={Target}
                                    acceptedType="suspect"
                                    currentItem={placedCulprit}
                                    onDrop={handleDropCulprit}
                                    isCorrect={results.culpritOk}
                                    checked={checked}
                                />
                            </div>

                            {/* Visual Glow */}
                            <div className={`absolute inset-0 blur-[100px] -z-10 rounded-full transition-colors duration-1000 ${checked ? (results.culpritOk ? 'bg-emerald-600/20' : 'bg-red-600/30') : 'bg-red-600/10'}`} />
                        </div>

                        {/* 2. DYNAMIC CONNECTOR THREADS */}
                        <div className="w-full max-w-5xl relative h-[150px]">
                            {/* Vertical Central Line */}
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full transition-all duration-700 
                                ${checked ? (results.culpritOk ? 'bg-emerald-500 shadow-[0_0_20px_emerald]' : 'bg-rose-600 shadow-[0_0_20px_rose]') : 'bg-gradient-to-b from-red-600/40 to-indigo-600/40 shadow-[0_0_15px_rgba(220,38,38,0.2)]'}`} />

                            {/* Horizontal Thread Branch */}
                            {placedAssociates.length > 1 && (
                                <div className={`absolute bottom-0 left-[20%] right-[20%] h-1 transition-all duration-700 rounded-full
                                    ${checked ? (results.culpritOk ? 'bg-emerald-500 shadow-[0_0_20px_emerald]' : 'bg-rose-600 shadow-[0_0_20px_rose]') : 'bg-indigo-600/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'}`} />
                            )}
                        </div>

                        {/* 3. ASSOCIATE MATRIX */}
                        <div className="flex flex-wrap justify-center gap-x-20 gap-y-24 w-full max-w-6xl relative">
                            {placedAssociates.map((_, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-10 relative group/row">

                                    {/* Connection Line from branch */}
                                    <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-1 h-24 transition-all duration-700
                                        ${checked ? (results.rows[idx]?.suspectOk ? 'bg-emerald-500 shadow-[0_0_20px_emerald]' : 'bg-rose-600 shadow-[0_0_20px_rose]') : 'bg-indigo-600/20'}`} />

                                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-white/[0.02] p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group-hover/row:bg-white/[0.04] transition-all">

                                        {/* Row Decorative Elements */}
                                        <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-500/5 blur-3xl rounded-full" />

                                        {/* Target Slot */}
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="px-4 py-1.5 bg-black/40 border border-white/5 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover/row:text-zinc-300 transition-colors">Target Subject</div>
                                            <div className="w-40 h-56 transform transition-all duration-500 group-hover/row:scale-[1.05] group-hover/row:rotate-[-1deg]">
                                                <DropSlot
                                                    id={`associate_${idx}`}
                                                    label="Subject Data"
                                                    icon={User}
                                                    acceptedType="suspect"
                                                    currentItem={placedAssociates[idx]}
                                                    onDrop={handleDropAssociate}
                                                    isCorrect={results.rows[idx]?.suspectOk}
                                                    checked={checked}
                                                />
                                            </div>
                                        </div>

                                        {/* Visual Link Hook */}
                                        <div className={`p-4 rounded-3xl border-2 transition-all duration-700 relative z-10 
                                            ${checked
                                                ? (results.rows[idx]?.suspectOk
                                                    ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_25px_emerald] scale-110'
                                                    : 'bg-rose-600/20 border-rose-500 shadow-[0_0_25px_rose] animate-shake')
                                                : 'bg-zinc-900/80 border-white/10 group-hover/row:border-indigo-500/40 opacity-40 group-hover/row:opacity-100'}`}>
                                            <LinkIcon className={`w-6 h-6 ${checked ? (results.rows[idx]?.suspectOk ? 'text-emerald-400' : 'text-rose-400') : 'text-zinc-500'}`} />
                                        </div>

                                        {/* Motive Slot */}
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="px-4 py-1.5 bg-black/40 border border-white/5 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover/row:text-zinc-300 transition-colors">Intel / Reason</div>
                                            <div className="w-64 h-32 transform transition-all duration-500 group-hover/row:scale-[1.05] group-hover/row:rotate-[1deg]">
                                                <DropSlot
                                                    id={`reason_${idx}`}
                                                    label="Motive Tile"
                                                    icon={FileText}
                                                    acceptedType="reason"
                                                    currentItem={placedReasons[idx]}
                                                    onDrop={handleDropReason}
                                                    isCorrect={results.rows[idx]?.reasonOk}
                                                    checked={checked}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Thread Highlighter - pulses if wrong */}
                                    {checked && !results.rows[idx]?.suspectOk && (
                                        <div className="absolute -inset-8 border-2 border-rose-500/20 rounded-[4rem] animate-pulse pointer-events-none" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* REVEAL ACTION BUTTON - ENHANCED */}
                        <div className="mt-24 flex flex-col items-center gap-8 group">
                            <motion.button
                                whileHover={isComplete ? {
                                    scale: 1.08,
                                    boxShadow: '0 0 70px rgba(220,38,38,0.5)',
                                    y: -5
                                } : {}}
                                whileTap={isComplete ? { scale: 0.95, y: 0 } : {}}
                                onClick={handleCheck}
                                disabled={!isComplete}
                                className={`px-24 py-7 rounded-[3rem] font-black uppercase tracking-[0.5em] flex items-center gap-6 transition-all duration-700 shadow-2xl relative overflow-hidden border-2
                                    ${isComplete
                                        ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-white/20 cursor-pointer'
                                        : 'bg-zinc-900 text-zinc-700 cursor-not-allowed border-white/5 opacity-40'}`}
                            >
                                {/* Animated Shine Flare */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />

                                {isComplete ? (
                                    <Sparkles className="w-8 h-8 animate-bounce text-white" />
                                ) : (
                                    <Eye className="w-8 h-8 opacity-20" />
                                )}
                                <span className="text-lg md:text-xl drop-shadow-lg italic">Unravel the Truth</span>
                            </motion.button>

                            {!isComplete && (
                                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-1000">
                                    <div className="flex gap-2.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                                                className="w-2 h-2 rounded-full bg-red-600/60"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[11px] uppercase font-black tracking-[0.4em] italic text-zinc-500 bg-white/[0.03] px-6 py-2 rounded-full border border-white/5">
                                        Awaiting deduction synthesis...
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrazyWallGame;
