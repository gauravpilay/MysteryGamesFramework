import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Link, Trash2, GripHorizontal, StickyNote, User, Search, ImageIcon, ZoomIn } from 'lucide-react';
import { Button } from './ui/shared';

const EvidenceBoard = ({ inventory, nodes, history, onClose }) => {
    const [boardItems, setBoardItems] = useState([]); // { id, type, x, y, label, data }
    const [connections, setConnections] = useState([]); // { from, to }
    const [linkingFrom, setLinkingFrom] = useState(null);
    const [notes, setNotes] = useState([]); // { id, x, y, text }
    const [zoomedImage, setZoomedImage] = useState(null);
    const boardRef = useRef(null);

    // Sync inventory (Evidence Only) and suspects encountered into board items
    useEffect(() => {
        const encounteredSuspects = nodes.filter(n => n.type === 'suspect' && history.includes(n.id));
        // Only Evidence nodes, removing Media nodes as requested
        const collectedEvidence = nodes.filter(n => n.type === 'evidence' && inventory.has(n.id));

        const allItems = [...encounteredSuspects, ...collectedEvidence];

        setBoardItems(prev => {
            const newItems = [...prev];
            allItems.forEach(item => {
                if (!newItems.find(i => i.id === item.id)) {
                    // Random-ish starting position
                    newItems.push({
                        id: item.id,
                        type: item.type,
                        label: item.data.label || item.data.name,
                        image: item.data.image || item.data.url,
                        description: item.data.description || item.data.role || '',
                        x: Math.random() * 400 + 50,
                        y: Math.random() * 300 + 50,
                        data: item.data
                    });
                }
            });
            return newItems;
        });
    }, [inventory, history, nodes]);

    const handleDrag = (id, info, isNote = false) => {
        if (isNote) {
            setNotes(prev => prev.map(n => n.id === id ? { ...n, x: n.x + info.delta.x, y: n.y + info.delta.y } : n));
        } else {
            setBoardItems(prev => prev.map(item => item.id === id ? { ...item, x: item.x + info.delta.x, y: item.y + info.delta.y } : item));
        }
    };

    const addNote = () => {
        const id = 'note-' + Date.now();
        setNotes(prev => [...prev, { id, x: 100, y: 100, text: 'New Note' }]);
    };

    const updateNoteText = (id, text) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
    };

    const removeNote = (id) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    };

    const startLink = (id) => {
        if (linkingFrom === id) {
            setLinkingFrom(null);
        } else if (linkingFrom) {
            // Create connection
            if (linkingFrom !== id && !connections.find(c => (c.from === linkingFrom && c.to === id) || (c.from === id && c.to === linkingFrom))) {
                setConnections(prev => [...prev, { from: linkingFrom, to: id }]);
            }
            setLinkingFrom(null);
        } else {
            setLinkingFrom(id);
        }
    };

    const removeConnection = (index) => {
        setConnections(prev => prev.filter((_, i) => i !== index));
    };

    const getItemPos = (id) => {
        const item = boardItems.find(i => i.id === id) || notes.find(n => n.id === id);
        return item ? { x: item.x + 88, y: item.y + 60 } : { x: 0, y: 0 }; // Center roughly based on w-44
    };

    return (
        <div className="fixed inset-0 z-[80] bg-zinc-950/95 flex flex-col font-mono overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-amber-500 uppercase tracking-tighter italic">Investigation Board</h2>
                    <div className="h-4 w-px bg-zinc-800" />
                    <Button variant="outline" size="sm" onClick={addNote} className="gap-2 border-zinc-700 text-zinc-400 hover:text-white">
                        <Plus className="w-4 h-4" /> Add Note
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-zinc-500 uppercase">Linking: {linkingFrom ? "Select target" : "Inactive"}</span>
                    <Button variant="ghost" onClick={onClose}><X className="w-6 h-6" /></Button>
                </div>
            </div>

            {/* Board Area */}
            <div
                ref={boardRef}
                className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-zinc-900"
                style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }}
            >
                {/* Connection Lines (SVG) */}
                <svg className="absolute inset-0 pointer-events-none w-full h-full">
                    {connections.map((conn, i) => {
                        const from = getItemPos(conn.from);
                        const to = getItemPos(conn.to);
                        return (
                            <g key={i}>
                                <line
                                    x1={from.x} y1={from.y}
                                    x2={to.x} y2={to.y}
                                    stroke="red"
                                    strokeWidth="2"
                                    strokeDasharray="4 2"
                                    opacity="0.6"
                                    className="drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]"
                                />
                                <circle
                                    cx={(from.x + to.x) / 2}
                                    cy={(from.y + to.y) / 2}
                                    r="10"
                                    fill="rgba(20,20,20,0.8)"
                                    className="pointer-events-auto cursor-pointer hover:fill-red-900"
                                    onClick={(e) => { e.stopPropagation(); removeConnection(i); }}
                                />
                                <text
                                    x={(from.x + to.x) / 2}
                                    y={(from.y + to.y) / 2 + 4}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="10"
                                    className="pointer-events-none"
                                >×</text>
                            </g>
                        );
                    })}
                </svg>

                {/* Evidence Items */}
                {boardItems.map(item => (
                    <motion.div
                        key={item.id}
                        drag
                        dragMomentum={false}
                        onDrag={(e, info) => handleDrag(item.id, info)}
                        initial={{ x: item.x, y: item.y }}
                        className={`absolute w-44 p-2 bg-zinc-800 border-2 ${linkingFrom === item.id ? 'border-amber-500 scale-105' : 'border-zinc-700'} shadow-2xl cursor-grab active:cursor-grabbing group`}
                        style={{ x: item.x, y: item.y }}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1 opacity-50">
                                {item.type === 'suspect' ? <User className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                                <span className="text-[8px] uppercase font-bold">{item.type}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.image && (
                                    <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setZoomedImage(item.image); }}>
                                        <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); startLink(item.id); }}>
                                    <Link className={`w-3.5 h-3.5 ${linkingFrom === item.id ? 'text-amber-500' : 'text-zinc-400'}`} />
                                </Button>
                            </div>
                        </div>

                        {item.image ? (
                            <div className="aspect-[4/3] bg-black mb-2 overflow-hidden border border-zinc-900 relative group/img">
                                <img src={item.image} alt="" className="w-full h-full object-cover grayscale brightness-75 group-hover/img:brightness-100 group-hover/img:grayscale-0 transition-all" />
                                <div className="absolute inset-0 bg-black/40 group-hover/img:bg-transparent transition-colors pointer-events-none" />
                            </div>
                        ) : (
                            <div className="aspect-[4/3] bg-zinc-900 mb-2 flex items-center justify-center border border-zinc-950">
                                {item.type === 'suspect' ? <User className="w-8 h-8 text-zinc-800" /> : <Search className="w-8 h-8 text-zinc-800" />}
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-zinc-200 tracking-tighter uppercase truncate">
                                {item.label}
                            </div>
                            {item.description && (
                                <div className="text-[8px] text-zinc-500 leading-tight line-clamp-2 italic">
                                    {item.description}
                                </div>
                            )}
                        </div>

                        {/* Decorative Tape */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-zinc-500/10 backdrop-blur-[2px] rotate-2 border border-white/5" />
                    </motion.div>
                ))}

                {/* Custom Notes */}
                {notes.map(note => (
                    <motion.div
                        key={note.id}
                        drag
                        dragMomentum={false}
                        onDrag={(e, info) => handleDrag(note.id, info, true)}
                        initial={{ x: note.x, y: note.y }}
                        className={`absolute w-48 p-3 bg-amber-200 text-amber-900 shadow-xl cursor-grab active:cursor-grabbing border border-amber-300 ${linkingFrom === note.id ? 'ring-2 ring-amber-500' : ''}`}
                        style={{ x: note.x, y: note.y, rotate: -1 }}
                    >
                        <div className="flex items-center justify-between mb-2 border-b border-amber-300 pb-1">
                            <StickyNote className="w-3 h-3" />
                            <div className="flex gap-1">
                                <button onClick={() => startLink(note.id)} className={`p-0.5 hover:bg-amber-300 rounded ${linkingFrom === note.id ? 'bg-amber-400' : ''}`}>
                                    <Link className="w-3 h-3" />
                                </button>
                                <button onClick={() => removeNote(note.id)} className="p-0.5 hover:bg-amber-300 rounded text-red-600">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={note.text}
                            onChange={(e) => updateNoteText(note.id, e.target.value)}
                            className="bg-transparent border-none w-full text-xs font-serif resize-none focus:outline-none placeholder-amber-700/50 h-24"
                            placeholder="Type finding..."
                        />
                        <div className="absolute -bottom-2 -right-2 w-full h-full bg-black/10 -z-10 blur-sm" />
                    </motion.div>
                ))}

                {/* Empty State */}
                {boardItems.length === 0 && notes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-700 flex-col gap-4">
                        <div className="p-8 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center">
                            <Search className="w-16 h-16 opacity-20 mb-4" />
                            <h3 className="text-xl font-bold uppercase tracking-widest opacity-30">The Board is Clean</h3>
                            <p className="text-xs opacity-20 mt-2">Discover evidence or click "Add Note" to start your wall</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Magnifier Overlay */}
            <AnimatePresence>
                {zoomedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 backdrop-blur-md cursor-zoom-out"
                        onClick={() => setZoomedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                        >
                            <img src={zoomedImage} alt="Large Evidence" className="max-w-full max-h-full object-contain" />
                            <Button
                                variant="ghost"
                                className="absolute top-6 right-6 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 border border-white/10"
                                onClick={() => setZoomedImage(null)}
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hint Footer */}
            <div className="bg-zinc-950 p-2 border-t border-zinc-900 text-[9px] text-zinc-600 flex justify-center gap-8 uppercase tracking-widest shrink-0">
                <div className="flex items-center gap-1"><GripHorizontal className="w-3 h-3" /> Drag to move</div>
                <div className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Click Zoom on item image</div>
                <div className="flex items-center gap-1"><Link className="w-3 h-3" /> Link two items to connect</div>
                <div className="flex items-center gap-1">Click circle on red line to delete</div>
            </div>
        </div>
    );
};

export default EvidenceBoard;
