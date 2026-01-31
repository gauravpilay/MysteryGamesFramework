import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Save, Sparkles } from 'lucide-react';
import { Button, Input, Label } from './ui/shared';

const CaseMetadataModal = ({ isOpen, onClose, initialTitle, initialDescription, onSave }) => {
    const [title, setTitle] = useState(initialTitle || '');
    const [description, setDescription] = useState(initialDescription || '');

    useEffect(() => {
        setTitle(initialTitle || '');
        setDescription(initialDescription || '');
    }, [initialTitle, initialDescription]);

    const handleSave = () => {
        if (!title.trim()) {
            alert('Case title is required');
            return;
        }
        onSave({ title: title.trim(), description: description.trim() });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-indigo-500/30 rounded-3xl shadow-[0_0_80px_rgba(99,102,241,0.3)] overflow-hidden"
                >
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
                    </div>

                    {/* Header */}
                    <div className="relative border-b border-white/10 bg-black/40 backdrop-blur-xl px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                    <FileText className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                        Case Metadata
                                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                                    </h2>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                        Configure Case Identity
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-95 group"
                            >
                                <X className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-8 space-y-6">
                        {/* Title Field */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Case Title
                            </Label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., The Vanishing Protocol"
                                    className="relative bg-black/60 border-white/10 text-white placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 text-base font-medium transition-all"
                                    maxLength={100}
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-600">This appears in the dashboard and game header</span>
                                <span className={`font-mono ${title.length > 80 ? 'text-amber-500' : 'text-zinc-600'}`}>
                                    {title.length}/100
                                </span>
                            </div>
                        </div>

                        {/* Description Field */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                Case Description
                            </Label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief overview of the case for detectives..."
                                    className="relative w-full bg-black/60 border border-white/10 text-white placeholder-zinc-600 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 rounded-xl px-4 py-3 text-base font-medium transition-all resize-none focus:outline-none"
                                    rows={4}
                                    maxLength={500}
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-600">Shown on the case card in the dashboard</span>
                                <span className={`font-mono ${description.length > 400 ? 'text-amber-500' : 'text-zinc-600'}`}>
                                    {description.length}/500
                                </span>
                            </div>
                        </div>

                        {/* Preview Card */}
                        <div className="mt-8 p-6 bg-black/40 border border-white/5 rounded-2xl">
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">
                                Preview
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                                {title || 'Untitled Case'}
                            </h3>
                            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
                                {description || 'No description provided.'}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="relative border-t border-white/10 bg-black/40 backdrop-blur-xl px-8 py-6">
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="text-zinc-400 hover:text-white hover:bg-white/5 font-bold px-6 py-2.5 rounded-xl transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={!title.trim()}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CaseMetadataModal;
