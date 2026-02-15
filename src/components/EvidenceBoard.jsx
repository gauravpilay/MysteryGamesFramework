import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Link, Trash2, GripHorizontal, StickyNote, User, Search, ImageIcon, ZoomIn, Briefcase, ChevronRight, ChevronLeft, Type, FileText } from 'lucide-react';
import { Button } from './ui/shared';

const EvidenceBoard = ({
    inventory,
    nodes,
    history,
    onClose,
    onOpenDossier,
    boardItems,
    setBoardItems,
    connections,
    setConnections,
    notes,
    setNotes,
    isSimultaneous = false
}) => {
    const [linkingFrom, setLinkingFrom] = useState(null);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const boardRef = useRef(null);

    // Get all unlocked resources
    const allUnlockedSuspects = nodes.filter(n => n.type === 'suspect' && history.includes(n.id));
    const allUnlockedEvidence = nodes.filter(n => (n.type === 'evidence' || n.type === 'email') && inventory.has(n.id));

    const addItemToBoard = (item) => {
        if (boardItems.find(i => i.id === item.id)) return;

        setBoardItems(prev => [...prev, {
            id: item.id,
            type: item.type,
            label: item.data.displayName || item.data.label || item.data.name,
            image: item.data.image || item.data.url || (item.type === 'email' ? item.data.images?.[0] : null),
            description: item.data.description || item.data.role || item.data.subject || '',
            x: 100 + Math.random() * 200,
            y: 100 + Math.random() * 200,
            data: item.data
        }]);
    };

    const handleDrag = (id, info, isNote = false) => {
        if (isNote) {
            setNotes(prev => prev.map(n => n.id === id ? { ...n, x: n.x + info.delta.x, y: n.y + info.delta.y } : n));
        } else {
            setBoardItems(prev => prev.map(item => item.id === id ? { ...item, x: item.x + info.delta.x, y: item.y + info.delta.y } : item));
        }
    };

    const addNote = () => {
        const id = 'note-' + Date.now();
        setNotes(prev => [...prev, { id, x: 250, y: 150, text: 'New Case Note...' }]);
    };

    const updateNoteText = (id, text) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
    };

    const removeNote = (id) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    };

    const removeItem = (id) => {
        setBoardItems(prev => prev.filter(i => i.id !== id));
        setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    };

    const startLink = (id) => {
        if (linkingFrom === id) {
            setLinkingFrom(null);
        } else if (linkingFrom) {
            // Create connection
            if (linkingFrom !== id && !connections.find(c => (c.from === linkingFrom && c.to === id) || (c.from === id && c.to === linkingFrom))) {
                setConnections(prev => [...prev, { from: linkingFrom, to: id, label: "" }]);
            }
            setLinkingFrom(null);
        } else {
            setLinkingFrom(id);
        }
    };

    const updateConnectionLabel = (index, label) => {
        setConnections(prev => {
            const next = [...prev];
            next[index] = { ...next[index], label };
            return next;
        });
    };

    const removeConnection = (index) => {
        setConnections(prev => prev.filter((_, i) => i !== index));
    };

    const getItemPos = (id) => {
        const item = boardItems.find(i => i.id === id) || notes.find(n => n.id === id);
        return item ? { x: item.x + 88, y: item.y + 60 } : { x: 0, y: 0 };
    };

    return (
        <div className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[200] bg-zinc-950/98 flex font-mono overflow-hidden`}>
            {/* Sidebar / Toolkit */}
            <motion.div
                initial={false}
                animate={{
                    width: sidebarOpen ? (window.innerWidth < 768 ? '100%' : 320) : (window.innerWidth < 768 ? 0 : 64),
                    x: sidebarOpen ? 0 : (window.innerWidth < 768 ? -320 : 0)
                }}
                className={`h-full bg-zinc-950 border-r border-zinc-800 flex flex-col z-[210] shadow-2xl absolute md:relative transition-all duration-300 ${!sidebarOpen && window.innerWidth < 768 ? 'pointer-events-none' : 'pointer-events-auto'}`}
            >
                <div className="p-4 border-b border-zinc-900 flex items-center justify-between overflow-hidden">
                    <AnimatePresence mode="wait">
                        {sidebarOpen ? (
                            <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-amber-500" />
                                <span className="font-black text-xs uppercase tracking-widest text-zinc-400 whitespace-nowrap">Evidence Locker</span>
                            </motion.div>
                        ) : (
                            <div key="closed" className="w-full flex justify-center">
                                <Briefcase className="w-5 h-5 text-amber-500" />
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6">
                    {/* General Tools */}
                    <div className="space-y-2">
                        {sidebarOpen && <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 px-1">Utility</h3>}
                        <Button
                            variant="secondary"
                            onClick={addNote}
                            className={`w-full gap-3 justify-start bg-zinc-900 border-zinc-800 text-amber-500 hover:text-amber-400 ${!sidebarOpen && 'px-0 justify-center'}`}
                        >
                            <StickyNote className="w-4 h-4" />
                            {sidebarOpen && <span>Add Sticky Note</span>}
                        </Button>
                    </div>

                    {/* Suspects */}
                    <div className="space-y-3">
                        {sidebarOpen && <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 px-1">Unlocked Suspects ({allUnlockedSuspects.length})</h3>}
                        <div className="grid grid-cols-1 gap-2">
                            {allUnlockedSuspects.map(s => {
                                const onBoard = boardItems.some(i => i.id === s.id);
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => !onBoard && addItemToBoard(s)}
                                        className={`group p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-3
                                            ${onBoard ? 'bg-zinc-900/50 border-zinc-800 opacity-40 cursor-not-allowed' : 'bg-zinc-900 border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                                            <User className={`w-4 h-4 ${onBoard ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                        </div>
                                        {sidebarOpen && (
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] font-bold text-zinc-200 truncate">{s.data.name}</div>
                                                <div className="text-[8px] text-zinc-500 truncate">{s.data.role}</div>
                                            </div>
                                        )}
                                        {sidebarOpen && !onBoard && <Plus className="w-3 h-3 text-zinc-600 group-hover:text-amber-500" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Evidence */}
                    <div className="space-y-3">
                        {sidebarOpen && <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 px-1">Evidence Files ({allUnlockedEvidence.length})</h3>}
                        <div className="grid grid-cols-1 gap-2">
                            {allUnlockedEvidence.map(e => {
                                const onBoard = boardItems.some(i => i.id === e.id);
                                return (
                                    <div
                                        key={e.id}
                                        onClick={() => !onBoard && addItemToBoard(e)}
                                        className={`group p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-3
                                            ${onBoard ? 'bg-zinc-900/50 border-zinc-800 opacity-40 cursor-not-allowed' : 'bg-zinc-900 border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center shrink-0">
                                            <Search className={`w-4 h-4 ${onBoard ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                        </div>
                                        {sidebarOpen && (
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] font-bold text-zinc-200 truncate">{e.data.displayName || e.data.label}</div>
                                                <div className="text-[8px] text-zinc-400 truncate opacity-50 italic">{e.type === 'email' ? 'Intercepted Email' : 'Captured Clue'}</div>
                                            </div>
                                        )}
                                        {sidebarOpen && !onBoard && <Plus className="w-3 h-3 text-zinc-600 group-hover:text-amber-500" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white z-30 md:flex"
                >
                    {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            </motion.div >

            {/* Mobile Sidebar Toggle Button */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className={`${isSimultaneous ? 'absolute' : 'fixed'} bottom-20 right-6 w-14 h-14 bg-amber-500 rounded-full shadow-2xl flex items-center justify-center text-black z-[205] active:scale-95 transition-transform`}
                >
                    <Plus className="w-8 h-8" />
                </button>
            )}

            {/* Main Board Container */}
            < div className="flex-1 flex flex-col bg-zinc-950 relative" >
                {/* Board Header */}
                < div className="p-3 md:p-4 border-b border-zinc-900 flex items-center justify-between relative z-10 bg-zinc-950/50 backdrop-blur-md" >
                    <h2 className="text-sm md:text-xl font-black text-zinc-600 uppercase tracking-tighter italic truncate mr-4">
                        <span className="text-amber-500">Neural</span> Investigative Canvas
                    </h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-red-500/10 hover:text-red-500 px-2 h-9">
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                </div >

                {/* Board Area */}
                < div
                    ref={boardRef}
                    className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-zinc-900"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }}
                >
                    {/* Connection Lines (SVG) */}
                    < svg className="absolute inset-0 pointer-events-none w-full h-full" >
                        {
                            connections.map((conn, i) => {
                                const from = getItemPos(conn.from);
                                const to = getItemPos(conn.to);
                                const midX = (from.x + to.x) / 2;
                                const midY = (from.y + to.y) / 2;

                                return (
                                    <g key={i} className="pointer-events-none">
                                        <line
                                            x1={from.x} y1={from.y}
                                            x2={to.x} y2={to.y}
                                            stroke="#ef4444"
                                            strokeWidth="2"
                                            strokeDasharray="8 4"
                                            opacity="0.4"
                                            className="drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                                        />
                                        {/* Connection Label Point */}
                                        <foreignObject
                                            x={midX - 30}
                                            y={midY - 15}
                                            width="60"
                                            height="30"
                                            className="pointer-events-auto"
                                        >
                                            <div className="group relative flex items-center justify-center h-full">
                                                <div className="w-6 h-6 rounded-full bg-zinc-950 border border-red-900/50 flex items-center justify-center hover:bg-red-950 transition-colors cursor-pointer"
                                                    onClick={() => removeConnection(i)}>
                                                    <X className="w-3 h-3 text-red-500" />
                                                </div>
                                            </div>
                                        </foreignObject>
                                    </g>
                                );
                            })
                        }
                    </svg >

                    {/* Linkage Labels (Separate from SVG to handle inputs better) */}
                    {
                        connections.map((conn, i) => {
                            const from = getItemPos(conn.from);
                            const to = getItemPos(conn.to);
                            const midX = (from.x + to.x) / 2;
                            const midY = (from.y + to.y) / 2;

                            return (
                                <div
                                    key={`label-${i}`}
                                    className="absolute pointer-events-auto"
                                    style={{
                                        left: midX,
                                        top: midY + 15, // Offset below the delete button
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    <div className="bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 shadow-xl backdrop-blur-sm min-w-[80px]">
                                        <input
                                            type="text"
                                            placeholder="Add connection note..."
                                            value={conn.label}
                                            onChange={(e) => updateConnectionLabel(i, e.target.value)}
                                            className="bg-transparent border-none text-[8px] text-zinc-300 focus:outline-none w-full text-center placeholder:opacity-30 uppercase font-black"
                                        />
                                    </div>
                                </div>
                            );
                        })
                    }

                    {/* Evidence & Suspect Items */}
                    {
                        boardItems.map(item => (
                            <motion.div
                                key={item.id}
                                drag
                                dragMomentum={false}
                                onDrag={(e, info) => handleDrag(item.id, info)}
                                initial={{ x: item.x, y: item.y }}
                                animate={{ x: item.x, y: item.y }}
                                className={`absolute w-32 md:w-44 p-1.5 md:p-2 bg-zinc-800 border-2 ${linkingFrom === item.id ? 'border-amber-500 scale-105' : 'border-zinc-700'} shadow-2xl cursor-grab active:cursor-grabbing group z-10`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1 opacity-50">
                                        {item.type === 'suspect' ? <User className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                                        <span className="text-[8px] uppercase font-bold">{item.type}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:text-red-500" onClick={() => removeItem(item.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                        {item.type === 'suspect' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 p-0 text-indigo-400 hover:text-indigo-300"
                                                onClick={() => onOpenDossier(item.id)}
                                                title="Open Dossier"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => startLink(item.id)}>
                                            <Link className={`w-3.5 h-3.5 ${linkingFrom === item.id ? 'text-amber-500' : 'text-zinc-400'}`} />
                                        </Button>
                                        {item.image && (
                                            <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => setZoomedImage(item.image)}>
                                                <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {item.image ? (
                                    <div className="aspect-[4/3] bg-black mb-2 overflow-hidden border border-zinc-900 relative group/img">
                                        <img src={item.image} alt="" className="w-full h-full object-cover grayscale brightness-75 group-hover/img:brightness-100 group-hover/img:grayscale-0 transition-all shadow-inner" />
                                    </div>
                                ) : (
                                    <div className="aspect-[4/3] bg-zinc-900 mb-2 flex items-center justify-center border border-zinc-950">
                                        {item.type === 'suspect' ? <User className="w-8 h-8 text-zinc-800 opacity-20" /> : <Search className="w-8 h-8 text-zinc-800 opacity-20" />}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-zinc-200 tracking-tighter uppercase truncate leading-tight">
                                        {item.label}
                                    </div>
                                    {item.description && (
                                        <div className="text-[8px] text-zinc-500 leading-tight line-clamp-2 italic opacity-60">
                                            {item.description}
                                        </div>
                                    )}
                                </div>

                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-zinc-300/5 backdrop-blur-[2px] rotate-2 border border-white/5" />
                            </motion.div>
                        ))
                    }

                    {/* Sticky Notes */}
                    {
                        notes.map(note => (
                            <motion.div
                                key={note.id}
                                drag
                                dragMomentum={false}
                                onDrag={(e, info) => handleDrag(note.id, info, true)}
                                initial={{ x: note.x, y: note.y }}
                                animate={{ x: note.x, y: note.y }}
                                className={`absolute w-40 md:w-52 p-2 md:p-3 bg-amber-200 text-amber-900 shadow-2xl cursor-grab active:cursor-grabbing border-l-4 md:border-l-8 border-amber-300 ring-1 ring-amber-400/30 ${linkingFrom === note.id ? 'ring-4 ring-amber-500' : ''} z-10`}
                                style={{ rotate: -1 }}
                            >
                                <div className="flex items-center justify-between mb-2 border-b border-amber-300/50 pb-1">
                                    <StickyNote className="w-3 h-3 opacity-50" />
                                    <div className="flex gap-2">
                                        <button onClick={() => startLink(note.id)} className={`p-1 hover:bg-amber-300 rounded transition-colors ${linkingFrom === note.id ? 'text-amber-600' : 'text-amber-800'}`}>
                                            <Link className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => removeNote(note.id)} className="p-1 hover:bg-amber-300 rounded text-red-600/70 hover:text-red-700 transition-colors">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={note.text}
                                    onChange={(e) => updateNoteText(note.id, e.target.value)}
                                    className="bg-transparent border-none w-full text-xs font-serif resize-none focus:outline-none placeholder-amber-700/50 h-24 leading-relaxed tracking-tight"
                                    placeholder="Type deduction..."
                                />
                                <div className="absolute -bottom-2 -right-2 w-full h-full bg-black/5 -z-10 blur-sm" />
                            </motion.div>
                        ))
                    }

                    {/* Empty State Overlay */}
                    {
                        boardItems.length === 0 && notes.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-12 rounded-[3rem] flex flex-col items-center max-w-md text-center">
                                    <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                                        <Briefcase className="w-10 h-10 text-zinc-700 opacity-50" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-zinc-700 opacity-50 mb-4">Board Offline</h3>
                                    <p className="text-xs text-zinc-600 uppercase tracking-widest leading-relaxed">
                                        Use the <span className="text-amber-500">Evidence Locker</span> on the left to deploy clues and suspects onto the neural net.
                                    </p>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >

            {/* Magnifier Overlay */}
            < AnimatePresence >
                {zoomedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[250] bg-black/98 flex items-center justify-center p-8 backdrop-blur-xl cursor-zoom-out`}
                        onClick={() => setZoomedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-6xl max-h-[90vh] w-full flex items-center justify-center overflow-hidden rounded-3xl border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.9)]"
                        >
                            <img src={zoomedImage} alt="Analysis" className="max-w-full max-h-full object-contain" />
                            <div className="absolute top-8 right-8 flex gap-4">
                                <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Optical Analysis // Enhanced
                                </div>
                                <Button
                                    variant="ghost"
                                    className="bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full p-3 border border-red-500/20 transition-all"
                                    onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >

            {/* Global Instruction Bar */}
            < div className={`${isSimultaneous ? 'absolute' : 'fixed'} bottom-4 left-1/2 -translate-x-1/2 px-4 md:px-6 py-2 bg-zinc-950/80 border border-zinc-800 rounded-full backdrop-blur-xl flex items-center gap-4 md:gap-8 text-[7px] md:text-[9px] text-zinc-500 uppercase tracking-widest z-50 shadow-2xl w-[90%] md:w-auto overflow-x-auto no-scrollbar`} >
                <div className="flex items-center gap-2 shrink-0"><GripHorizontal className="w-3 h-3 md:w-4 md:h-4 text-zinc-700" /> Drag</div>
                <div className="flex items-center gap-2 shrink-0"><Link className="w-3 h-3 md:w-4 md:h-4 text-zinc-700" /> Link</div>
                <div className="flex items-center gap-2 shrink-0"><Type className="w-3 h-3 md:w-4 md:h-4 text-amber-500" /> Label</div>
                <div className="flex items-center gap-2 shrink-0"><Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-900" /> Remove</div>
            </div >
        </div >
    );
};

export default EvidenceBoard;
