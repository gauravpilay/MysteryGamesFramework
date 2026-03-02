import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Plus, Trash2, Target, CheckCircle, Pencil, Save,
    ChevronDown, ChevronUp, BookOpen, Lightbulb, Brain,
    ArrowRight, Sparkles, AlertTriangle, GripVertical, Award
} from 'lucide-react';

// Vibrant category color palette
const CATEGORY_COLORS = [
    { id: 'indigo', bg: 'bg-indigo-500/15', border: 'border-indigo-500/40', dot: 'bg-indigo-500', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
    { id: 'fuchsia', bg: 'bg-fuchsia-500/15', border: 'border-fuchsia-500/40', dot: 'bg-fuchsia-500', text: 'text-fuchsia-400', glow: 'shadow-fuchsia-500/20' },
    { id: 'emerald', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', dot: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    { id: 'amber', bg: 'bg-amber-500/15', border: 'border-amber-500/40', dot: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    { id: 'sky', bg: 'bg-sky-500/15', border: 'border-sky-500/40', dot: 'bg-sky-500', text: 'text-sky-400', glow: 'shadow-sky-500/20' },
    { id: 'rose', bg: 'bg-rose-500/15', border: 'border-rose-500/40', dot: 'bg-rose-500', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
    { id: 'violet', bg: 'bg-violet-500/15', border: 'border-violet-500/40', dot: 'bg-violet-500', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
    { id: 'cyan', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40', dot: 'bg-cyan-500', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
];

const getColor = (index) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];

// ─── Objective Row ────────────────────────────────────────────────────────────
function ObjectiveRow({ obj, catIndex, objIndex, onEdit, onDelete }) {
    const [hovered, setHovered] = useState(false);
    const color = getColor(catIndex);
    const title = typeof obj === 'string' ? obj : obj.learningObjective;
    const detail = typeof obj === 'string' ? '' : obj.objective;
    const takeaway = typeof obj === 'string' ? '' : obj.keyTakeaway;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`group relative border rounded-2xl p-5 transition-all duration-300 ${color.bg} ${color.border} hover:shadow-lg ${color.glow}`}
        >
            {/* Side accent bar */}
            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${color.dot}`} />

            <div className="flex items-start gap-4 pl-4">
                <div className="flex-1 min-w-0">
                    <p className={`font-bold text-white text-sm mb-1`}>{title}</p>
                    {detail && <p className="text-xs text-zinc-400 leading-relaxed mb-2">{detail}</p>}
                    {takeaway && (
                        <div className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${color.bg} ${color.border} border ${color.text}`}>
                            <CheckCircle className="w-3 h-3" />
                            {takeaway}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className={`flex items-center gap-1.5 shrink-0 transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={() => onEdit(objIndex)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all border border-white/5 hover:border-white/20"
                        title="Edit"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(objIndex)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500/60 hover:text-red-400 transition-all border border-red-500/10 hover:border-red-500/30"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({ cat, catIndex, onChange, onDelete }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [editingName, setEditingName] = useState(false);
    const [catNameDraft, setCatNameDraft] = useState(cat.category);
    const [editingObjIndex, setEditingObjIndex] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newObj, setNewObj] = useState({ title: '', detail: '', takeaway: '' });
    const [editDraft, setEditDraft] = useState({ title: '', detail: '', takeaway: '' });
    const nameInputRef = useRef(null);
    const color = getColor(catIndex);

    useEffect(() => {
        if (editingName && nameInputRef.current) nameInputRef.current.focus();
    }, [editingName]);

    const saveCategoryName = () => {
        if (catNameDraft.trim()) onChange({ ...cat, category: catNameDraft.trim() });
        setEditingName(false);
    };

    const addObjective = () => {
        if (!newObj.title.trim()) return;
        const updated = {
            ...cat, objectives: [...cat.objectives, {
                id: crypto.randomUUID(),
                learningObjective: newObj.title.trim(),
                objective: newObj.detail.trim(),
                keyTakeaway: newObj.takeaway.trim()
            }]
        };
        onChange(updated);
        setNewObj({ title: '', detail: '', takeaway: '' });
        setShowAddForm(false);
    };

    const deleteObjective = (idx) => {
        const newObjs = [...cat.objectives];
        newObjs.splice(idx, 1);
        onChange({ ...cat, objectives: newObjs });
    };

    const openEdit = (idx) => {
        const obj = cat.objectives[idx];
        setEditDraft({
            title: typeof obj === 'string' ? obj : obj.learningObjective,
            detail: typeof obj === 'string' ? '' : obj.objective,
            takeaway: typeof obj === 'string' ? '' : obj.keyTakeaway
        });
        setEditingObjIndex(idx);
        setShowAddForm(false);
    };

    const saveEdit = () => {
        if (!editDraft.title.trim()) return;
        const newObjs = cat.objectives.map((o, i) =>
            i === editingObjIndex
                ? { ...o, learningObjective: editDraft.title.trim(), objective: editDraft.detail.trim(), keyTakeaway: editDraft.takeaway.trim() }
                : o
        );
        onChange({ ...cat, objectives: newObjs });
        setEditingObjIndex(null);
    };

    const objCount = cat.objectives.length;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-3xl border-2 overflow-hidden shadow-2xl ${color.border} bg-zinc-950/60 backdrop-blur-sm`}
        >
            {/* Category Header */}
            <div className={`${color.bg} px-6 py-5 border-b ${color.border}`}>
                <div className="flex items-center gap-4">
                    {/* Color dot + name */}
                    <div className={`w-4 h-4 rounded-full ${color.dot} shadow-[0_0_12px_currentColor] shrink-0`} />

                    {editingName ? (
                        <input
                            ref={nameInputRef}
                            value={catNameDraft}
                            onChange={e => setCatNameDraft(e.target.value)}
                            onBlur={saveCategoryName}
                            onKeyDown={e => { if (e.key === 'Enter') saveCategoryName(); if (e.key === 'Escape') setEditingName(false); }}
                            className={`flex-1 text-xl font-black uppercase tracking-tight bg-transparent border-b-2 ${color.border} text-white outline-none pb-0.5`}
                        />
                    ) : (
                        <button
                            onClick={() => setEditingName(true)}
                            className={`flex-1 text-left text-xl font-black uppercase tracking-tight ${color.text} hover:text-white transition-colors group flex items-center gap-2`}
                        >
                            {cat.category}
                            <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                        </button>
                    )}

                    {/* Indicator badge */}
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${color.bg} border ${color.border} ${color.text}`}>
                        {objCount} {objCount === 1 ? 'objective' : 'objectives'}
                    </span>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setShowAddForm(true); setIsExpanded(true); setEditingObjIndex(null); }}
                            className={`p-2 rounded-xl ${color.bg} border ${color.border} ${color.text} hover:brightness-125 transition-all`}
                            title="Add Objective"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(cat.id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 transition-all"
                            title="Delete Category"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-all"
                        >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Objectives List */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 space-y-3">
                            {/* Objectives */}
                            <AnimatePresence>
                                {cat.objectives.length === 0 && !showAddForm && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center py-8 text-zinc-600 text-xs"
                                    >
                                        <Target className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                        <p className="font-bold uppercase tracking-widest">No objectives yet</p>
                                        <p className="mt-1 text-zinc-700">Click the + button above to add one</p>
                                    </motion.div>
                                )}
                                {cat.objectives.map((obj, idx) => (
                                    editingObjIndex === idx ? (
                                        /* Inline Edit Form */
                                        <motion.div
                                            key={`edit-${idx}`}
                                            layout
                                            initial={{ opacity: 0, scale: 0.97 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className={`border-2 ${color.border} rounded-2xl p-5 space-y-3 ${color.bg}`}
                                        >
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${color.text} mb-3 flex items-center gap-2`}>
                                                <Pencil className="w-3 h-3" /> Editing Objective
                                            </p>
                                            <input
                                                autoFocus
                                                className="w-full bg-black/60 border border-zinc-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 font-medium"
                                                placeholder="Learning Objective *"
                                                value={editDraft.title}
                                                onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))}
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <input
                                                    className="w-full bg-black/60 border border-zinc-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600"
                                                    placeholder="Detail / Description"
                                                    value={editDraft.detail}
                                                    onChange={e => setEditDraft(d => ({ ...d, detail: e.target.value }))}
                                                />
                                                <input
                                                    className="w-full bg-black/60 border border-zinc-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600"
                                                    placeholder="Key Takeaway"
                                                    value={editDraft.takeaway}
                                                    onChange={e => setEditDraft(d => ({ ...d, takeaway: e.target.value }))}
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={saveEdit}
                                                    disabled={!editDraft.title.trim()}
                                                    className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-30 ${color.dot} bg-gradient-to-r hover:brightness-110`}
                                                    style={{ background: undefined }}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Save className="w-3.5 h-3.5" /> Save Changes
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => setEditingObjIndex(null)}
                                                    className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <ObjectiveRow
                                            key={obj.id || idx}
                                            obj={obj}
                                            catIndex={catIndex}
                                            objIndex={idx}
                                            onEdit={openEdit}
                                            onDelete={deleteObjective}
                                        />
                                    )
                                ))}
                            </AnimatePresence>

                            {/* Add Objective Inline Form */}
                            <AnimatePresence>
                                {showAddForm && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.97 }}
                                        className={`border-2 border-dashed ${color.border} rounded-2xl p-5 space-y-3 ${color.bg}`}
                                    >
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${color.text} mb-3 flex items-center gap-2`}>
                                            <Sparkles className="w-3 h-3" /> New Objective
                                        </p>
                                        <input
                                            autoFocus
                                            className="w-full bg-black/60 border border-zinc-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 font-medium"
                                            placeholder="Learning Objective * (e.g. Identify phishing indicators)"
                                            value={newObj.title}
                                            onChange={e => setNewObj(d => ({ ...d, title: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && addObjective()}
                                        />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input
                                                className="w-full bg-black/60 border border-zinc-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600"
                                                placeholder="Detail / Description"
                                                value={newObj.detail}
                                                onChange={e => setNewObj(d => ({ ...d, detail: e.target.value }))}
                                            />
                                            <input
                                                className="w-full bg-black/60 border border-zinc-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600"
                                                placeholder="Key Takeaway"
                                                value={newObj.takeaway}
                                                onChange={e => setNewObj(d => ({ ...d, takeaway: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={addObjective}
                                                disabled={!newObj.title.trim()}
                                                className="flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Add Objective
                                            </button>
                                            <button
                                                onClick={() => { setShowAddForm(false); setNewObj({ title: '', detail: '', takeaway: '' }); }}
                                                className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Quick-add button when not showing form */}
                            {!showAddForm && editingObjIndex === null && (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className={`w-full py-3 rounded-2xl border-2 border-dashed ${color.border} ${color.text} text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:${color.bg} transition-all opacity-50 hover:opacity-100`}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Objective
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Main Editor Modal ────────────────────────────────────────────────────────
export default function LearningObjectivesEditor({ isOpen, objectives, onSave, onClose }) {
    const [cats, setCats] = useState(objectives || []);
    const [newCatName, setNewCatName] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const newCatRef = useRef(null);

    // Sync when opened
    useEffect(() => {
        if (isOpen) {
            setCats(objectives || []);
            setIsDirty(false);
        }
    }, [isOpen, objectives]);

    const markDirty = (updatedCats) => {
        setCats(updatedCats);
        setIsDirty(true);
    };

    const addCategory = () => {
        if (!newCatName.trim()) return;
        markDirty([...cats, {
            id: crypto.randomUUID(),
            category: newCatName.trim(),
            objectives: []
        }]);
        setNewCatName('');
        setTimeout(() => newCatRef.current?.focus(), 50);
    };

    const updateCategory = (updated) => {
        markDirty(cats.map(c => c.id === updated.id ? updated : c));
    };

    const requestDelete = (catId) => setConfirmDeleteId(catId);

    const confirmDelete = () => {
        markDirty(cats.filter(c => c.id !== confirmDeleteId));
        setConfirmDeleteId(null);
    };

    const handleSave = () => {
        onSave(cats);
        setIsDirty(false);
    };

    // Stats
    const totalObjectives = cats.reduce((sum, c) => sum + c.objectives.length, 0);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-stretch md:items-center justify-center p-0 md:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    onClick={() => {
                        if (isDirty) return; // Prevent accidental close when dirty
                        onClose();
                    }}
                />

                {/* Ambient glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 24 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                    className="relative w-full max-w-5xl h-full md:h-[90vh] bg-zinc-950 md:rounded-[2rem] flex flex-col overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(99,102,241,0.15)]"
                >
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-fuchsia-500" />

                    {/* ── Header ── */}
                    <div className="shrink-0 px-6 md:px-10 py-6 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center gap-6">
                        {/* Icon */}
                        <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 items-center justify-center shrink-0">
                            <Target className="w-7 h-7 text-indigo-400" />
                        </div>

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">
                                Learning Objectives
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.25em] mt-1">
                                Define What Players Will Learn
                            </p>
                        </div>

                        {/* Stat Pills */}
                        <div className="hidden md:flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                <BookOpen className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-black text-indigo-300">{cats.length} Categories</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20">
                                <Award className="w-4 h-4 text-fuchsia-400" />
                                <span className="text-sm font-black text-fuchsia-300">{totalObjectives} Objectives</span>
                            </div>
                        </div>

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="ml-2 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-6 md:px-10 py-8 space-y-6">

                            {/* Info banner */}
                            {cats.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative overflow-hidden rounded-3xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 p-10 text-center"
                                >
                                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                                    <Brain className="w-14 h-14 mx-auto mb-5 text-indigo-500/50" />
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                                        No Categories Yet
                                    </h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed max-w-md mx-auto mb-6">
                                        Learning objectives map what players will learn to the game's scoring.
                                        Start by creating a category like <span className="text-indigo-400 font-bold">"Cyber Security"</span> or <span className="text-indigo-400 font-bold">"Critical Thinking"</span>.
                                    </p>
                                    <div className="flex items-center justify-center gap-6 text-xs text-zinc-600 font-mono">
                                        {['Add Category', '→', 'Add Objectives', '→', 'Assign to Nodes'].map((step, i) => (
                                            <span key={i} className={step === '→' ? 'text-zinc-700' : 'text-zinc-500 font-bold uppercase tracking-widest'}>{step}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Category Cards */}
                            <AnimatePresence>
                                {cats.map((cat, idx) => (
                                    <CategoryCard
                                        key={cat.id}
                                        cat={cat}
                                        catIndex={idx}
                                        onChange={updateCategory}
                                        onDelete={requestDelete}
                                    />
                                ))}
                            </AnimatePresence>

                            {/* Add Category Form */}
                            <motion.div layout className="bg-zinc-900/40 border-2 border-dashed border-zinc-700/60 hover:border-indigo-500/40 rounded-3xl p-6 transition-colors">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-4 flex items-center gap-2">
                                    <Plus className="w-3 h-3" /> Add New Category
                                </p>
                                <div className="flex gap-3">
                                    <input
                                        ref={newCatRef}
                                        type="text"
                                        placeholder="e.g. Cyber Security Fundamentals, Critical Thinking..."
                                        value={newCatName}
                                        onChange={e => setNewCatName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCategory()}
                                        className="flex-1 bg-black/60 border border-zinc-700 hover:border-zinc-600 focus:border-indigo-500 rounded-2xl px-5 py-3 text-white text-sm outline-none transition-colors placeholder:text-zinc-600 font-medium"
                                    />
                                    <button
                                        onClick={addCategory}
                                        disabled={!newCatName.trim()}
                                        className="px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span className="hidden sm:inline">Add Category</span>
                                    </button>
                                </div>
                            </motion.div>

                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="shrink-0 px-6 md:px-10 py-5 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-600 font-mono">
                            {isDirty ? (
                                <span className="flex items-center gap-2 text-amber-400">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                    Unsaved changes
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-emerald-500">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    All changes saved
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-2xl text-zinc-400 hover:text-white font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                            >
                                {isDirty ? 'Discard' : 'Close'}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-2.5 rounded-2xl font-black text-sm uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 transition-all active:scale-95 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Objectives
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {confirmDeleteId && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80"
                            onClick={() => setConfirmDeleteId(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-zinc-950 border-2 border-red-500/20 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Delete Category?</h3>
                            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                                This will permanently remove <span className="text-white font-bold">{cats.find(c => c.id === confirmDeleteId)?.category}</span> and all its objectives.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="flex-1 py-3 rounded-2xl font-bold text-sm text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-2xl font-black text-sm text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                                >
                                    Delete All
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
}
