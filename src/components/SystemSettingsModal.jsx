import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Shield, Key, Sliders, Save, AlertTriangle, Cpu, Globe } from 'lucide-react';
import { useConfig } from '../lib/config';
import { Button, Input, Label } from './ui/shared';

const SystemSettingsModal = ({ onClose }) => {
    const { settings, updateSettings } = useConfig();
    const [formData, setFormData] = useState({
        aiApiKey: settings.aiApiKey || '',
        maxAIRequests: settings.maxAIRequests || 10,
        systemName: settings.systemName || 'Mystery Architect Central',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState(null); // { type, message }

    const handleSave = async () => {
        setIsSaving(true);
        setStatus(null);
        try {
            await updateSettings(formData);
            setStatus({ type: 'success', message: 'Intelligence parameters synchronized successfully.' });
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: `Sync Failed: ${err.message || 'Unknown permission error'}` });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <Settings className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight">System Configuration</h2>
                            <p className="text-zinc-500 text-[10px] font-mono uppercase">Global Intelligence Parameters</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                    {/* Security Info */}
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-4">
                        <div className="shrink-0 w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-indigo-300 mb-1 uppercase tracking-wide">Security Override Active</h4>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                You are modifying global keys stored in the secure encrypted database. These settings affect all active mission instances and interrogation protocols.
                            </p>
                        </div>
                    </div>

                    {/* AI Configuration */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-l-2 border-indigo-500 pl-4">
                            <Cpu className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">AI Intelligence Engine</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-[10px] text-zinc-500 uppercase font-black">Central AI API Key</Label>
                                    <span className="text-[9px] text-zinc-600 font-mono italic">Stored in Encrypted Collection</span>
                                </div>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <Input
                                        type="password"
                                        value={formData.aiApiKey}
                                        onChange={(e) => setFormData({ ...formData, aiApiKey: e.target.value })}
                                        className="pl-10 bg-black/50 border-zinc-800 focus:border-indigo-500/50"
                                        placeholder="Enter secure API key..."
                                    />
                                </div>
                                <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
                                    This key powers all Real-Time AI Interrogations. Leave blank to force simulation mode for students.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-[10px] text-zinc-500 uppercase font-black">Tactical Question Limit</Label>
                                    <span className="text-[9px] text-zinc-600 font-mono italic">Per Mission Session</span>
                                </div>
                                <div className="relative">
                                    <Sliders className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <Input
                                        type="number"
                                        value={formData.maxAIRequests}
                                        onChange={(e) => setFormData({ ...formData, maxAIRequests: parseInt(e.target.value) })}
                                        className="pl-10 bg-black/50 border-zinc-800 focus:border-indigo-500/50"
                                        min="1"
                                        max="100"
                                    />
                                </div>
                                <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
                                    Defines the maximum number of AI requests allowed per game session to manage usage quotas.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* System Identity */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-l-2 border-purple-500 pl-4">
                            <Globe className="w-4 h-4 text-purple-500" />
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Platform Identity</h3>
                        </div>

                        <div>
                            <Label className="text-[10px] text-zinc-500 uppercase font-black mb-2 block">System Codename</Label>
                            <Input
                                value={formData.systemName}
                                onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                                className="bg-black/50 border-zinc-800 focus:border-purple-500/50"
                                placeholder="Mystery Architect Central"
                            />
                        </div>
                    </div>

                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border flex items-center gap-3 ${status.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}
                        >
                            <AlertTriangle className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">{status.message}</span>
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-900 bg-zinc-900/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        Decline Changes
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[140px]"
                    >
                        {isSaving ? 'Syncing...' : (
                            <>
                                <Save className="w-4 h-4 mr-2" /> Sync Configuration
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default SystemSettingsModal;
