import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, Users, Search, HelpCircle, ArrowRight,
    CheckCircle, Sparkles, Map, Eye, Loader2, FileCheck2,
} from 'lucide-react';

const FORMAT_OPTIONS = [
    {
        id: 'pdf',
        label: 'PDF Document',
        ext: '.pdf',
        icon: '📄',
        accentLight: 'border-red-200 hover:border-red-400 bg-gradient-to-br from-red-50 to-orange-50',
        accentDark: 'border-red-500/30 hover:border-red-400/60 bg-gradient-to-br from-red-500/10 to-orange-500/5',
        iconColor: { dark: 'text-red-400', light: 'text-red-600' },
        badgeBg: { dark: 'bg-red-500/20 text-red-300', light: 'bg-red-100 text-red-700' },
        description:
            'Beautifully formatted PDF with a dark cover page, colour-coded node flow, embedded character portraits, evidence photos and question images.',
        features: [
            'Cover page · AI narrative overview',
            'Step-by-step node walkthrough',
            'Character portraits (from node images)',
            'Evidence photos & question images',
            'Full answer key & hint tracker',
            'Flow health check & suggestions',
        ],
        recommended: true,
    },
    {
        id: 'docx',
        label: 'Word Document',
        ext: '.docx',
        icon: '📝',
        accentLight: 'border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50',
        accentDark: 'border-blue-500/30 hover:border-blue-400/60 bg-gradient-to-br from-blue-500/10 to-indigo-500/5',
        iconColor: { dark: 'text-blue-400', light: 'text-blue-600' },
        badgeBg: { dark: 'bg-blue-500/20 text-blue-300', light: 'bg-blue-100 text-blue-700' },
        description:
            'Fully editable Word (.docx) file with styled headings, node walkthrough, character dossiers, evidence tracker and question bank.',
        features: [
            'Fully editable in Word / Google Docs',
            'AI narrative + styled headings',
            'Node-by-node story walkthrough',
            'Character & evidence summaries',
            'Question bank with answer key',
            'Story health check',
        ],
        recommended: false,
    },
];

// ── Progress view shown while export is running ─────────────────────────────
const ProgressView = ({ isDarkMode, progress, formatLabel }) => {
    const pct = Math.min(100, Math.max(0, progress?.pct ?? 0));
    const label = progress?.label ?? 'Starting…';

    return (
        <div className="p-8 flex flex-col items-center gap-6">
            {/* Spinning icon */}
            <div className={`p-5 rounded-full ${isDarkMode ? 'bg-indigo-500/15 ring-1 ring-indigo-500/25' : 'bg-indigo-50 ring-1 ring-indigo-200'}`}>
                <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>

            <div className="text-center w-full">
                <p className={`text-base font-black tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    Building your {formatLabel}…
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full">
                <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/8' : 'bg-zinc-100'}`}>
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400"
                        initial={{ width: '0%' }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {pct < 100 ? 'In progress' : 'Complete!'}
                    </span>
                    <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {Math.round(pct)}%
                    </span>
                </div>
            </div>

            {/* Named stages */}
            <div className={`w-full p-4 rounded-2xl flex flex-col gap-2 ${isDarkMode ? 'bg-white/4 border border-white/6' : 'bg-zinc-50 border border-zinc-100'}`}>
                {[
                    { key: 5, icon: Map, label: 'Preparing story data' },
                    { key: 20, icon: Sparkles, label: 'Generating AI narrative' },
                    { key: 50, icon: Search, label: 'Fetching node images' },
                    { key: 65, icon: Users, label: 'Structuring document' },
                    { key: 90, icon: FileCheck2, label: 'Rendering & saving' },
                ].map(({ key, icon: Icon, label: stageLabel }) => {
                    const done = pct >= key;
                    const active = pct >= key - 15 && pct < key + 20;
                    return (
                        <div key={key} className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done
                                ? isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                                : isDarkMode ? 'bg-white/5 text-zinc-600' : 'bg-zinc-100 text-zinc-300'}`}>
                                {done
                                    ? <CheckCircle className="w-3.5 h-3.5" />
                                    : <Icon className="w-3 h-3" />}
                            </div>
                            <span className={`text-xs font-medium transition-colors ${done
                                ? isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
                                : isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                {stageLabel}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Main modal ──────────────────────────────────────────────────────────────
const StoryExportModal = ({ isOpen, onClose, onExport, isDarkMode, storyStats }) => {
    const [loading, setLoading] = useState(null);   // format id being generated
    const [progress, setProgress] = useState(null); // { label, pct }

    const handleExport = useCallback(async (formatId) => {
        if (loading) return;
        setLoading(formatId);
        setProgress({ label: 'Starting…', pct: 0 });
        try {
            await onExport(formatId, ({ label, pct }) => setProgress({ label, pct }));
            setProgress({ label: 'Done!', pct: 100 });
            // Close after a brief success flash
            setTimeout(() => {
                setLoading(null);
                setProgress(null);
                onClose();
            }, 800);
        } catch {
            setLoading(null);
            setProgress(null);
        }
    }, [loading, onExport, onClose]);

    const stats = storyStats || {};
    const activeFormat = FORMAT_OPTIONS.find(f => f.id === loading);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={loading ? undefined : onClose}
                    />

                    {/* Modal panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className={`relative w-full max-w-2xl rounded-3xl shadow-[0_32px_100px_rgba(0,0,0,0.6)] overflow-hidden ${isDarkMode
                            ? 'bg-zinc-900 border border-white/10'
                            : 'bg-white border border-zinc-200'
                            }`}
                    >
                        {/* Top gradient bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500" />

                        <AnimatePresence mode="wait">
                            {loading ? (
                                /* ── Progress screen ── */
                                <motion.div
                                    key="progress"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <ProgressView
                                        isDarkMode={isDarkMode}
                                        progress={progress}
                                        formatLabel={activeFormat?.label ?? 'document'}
                                    />
                                </motion.div>
                            ) : (
                                /* ── Format selection screen ── */
                                <motion.div
                                    key="selection"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {/* Header */}
                                    <div className={`px-7 pt-7 pb-5 border-b ${isDarkMode ? 'border-white/8' : 'border-zinc-100'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-500/15 ring-1 ring-indigo-500/30' : 'bg-indigo-50 ring-1 ring-indigo-200'}`}>
                                                    <Download className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                                </div>
                                                <div>
                                                    <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                                        Export Story for Review
                                                    </h2>
                                                    <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                        Download a complete story document your creative team can annotate
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={onClose}
                                                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/8 text-zinc-500 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900'}`}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Story stats strip */}
                                        {(stats.nodeCount > 0 || stats.suspectCount > 0) && (
                                            <div className={`mt-4 p-3 rounded-2xl flex flex-wrap gap-4 ${isDarkMode ? 'bg-white/4 border border-white/6' : 'bg-zinc-50 border border-zinc-200'}`}>
                                                {[
                                                    { icon: Map, label: 'Nodes', value: stats.nodeCount || 0 },
                                                    { icon: Users, label: 'Suspects', value: stats.suspectCount || 0 },
                                                    { icon: Search, label: 'Evidence', value: stats.evidenceCount || 0 },
                                                    { icon: HelpCircle, label: 'Questions', value: stats.questionCount || 0 },
                                                    { icon: ArrowRight, label: 'Connections', value: stats.edgeCount || 0 },
                                                ].map(({ icon: Icon, label, value }) => (
                                                    <div key={label} className="flex items-center gap-2">
                                                        <Icon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                                                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{value}</span>
                                                        <span className={`text-xs ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Callout */}
                                    <div className={`mx-7 mt-5 p-4 rounded-2xl flex gap-3 ${isDarkMode ? 'bg-indigo-500/8 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                                        <Sparkles className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                        <div>
                                            <p className={`text-xs font-semibold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>What's inside</p>
                                            <p className={`text-xs mt-0.5 leading-relaxed ${isDarkMode ? 'text-indigo-400/80' : 'text-indigo-600'}`}>
                                                AI-written narrative overview + node-by-node walkthrough in exact player order — including
                                                all dialogue, questions, suspects, evidence, branching paths, <strong>character portraits</strong> and <strong>evidence photos</strong>.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Format cards */}
                                    <div className="p-7 pt-5 space-y-4">
                                        <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Choose Format</p>

                                        {FORMAT_OPTIONS.map((fmt) => (
                                            <motion.button
                                                key={fmt.id}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => handleExport(fmt.id)}
                                                className={`w-full p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden cursor-pointer ${isDarkMode ? fmt.accentDark : fmt.accentLight}`}
                                            >
                                                {fmt.recommended && (
                                                    <div className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                                                        Recommended
                                                    </div>
                                                )}

                                                <div className="flex items-start gap-4">
                                                    <div className="text-2xl leading-none mt-0.5">{fmt.icon}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{fmt.label}</span>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDarkMode ? fmt.badgeBg.dark : fmt.badgeBg.light}`}>{fmt.ext}</span>
                                                        </div>
                                                        <p className={`text-xs leading-relaxed mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{fmt.description}</p>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                            {fmt.features.map((feature) => (
                                                                <div key={feature} className="flex items-center gap-1.5">
                                                                    <CheckCircle className={`w-3 h-3 flex-shrink-0 ${isDarkMode ? fmt.iconColor.dark : fmt.iconColor.light}`} />
                                                                    <span className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{feature}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className={`flex-shrink-0 p-2 rounded-xl mt-1 ${isDarkMode ? 'bg-white/5' : 'bg-white/60'}`}>
                                                        <Download className={`w-5 h-5 ${isDarkMode ? fmt.iconColor.dark : fmt.iconColor.light}`} />
                                                    </div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="px-7 pb-6">
                                        <div className={`p-3 rounded-xl flex items-center gap-2 ${isDarkMode ? 'bg-white/3 border border-white/6' : 'bg-zinc-50 border border-zinc-100'}`}>
                                            <Eye className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                            <p className={`text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                The AI narrative is generated fresh each time. This may take 15–30 seconds depending on story size.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default StoryExportModal;
