import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Shield, Key, Sliders, Save, AlertTriangle, Cpu, Globe, Box, Brain, ShieldCheck, Volume2, Mic2, Webhook, Link2, PlusCircle, Trash2, CheckCircle, Info } from 'lucide-react';
import { useConfig } from '../lib/config';
import { DEFAULT_CHIRP_VOICE, CHIRP_HD_VOICES } from '../lib/useChirpTTS';
import { useLicense } from '../lib/licensing';
import { Button, Input, Label } from './ui/shared';
import LicenseConfigModal from './LicenseConfigModal';

const SystemSettingsModal = ({ onClose }) => {
    const { settings, updateSettings } = useConfig();
    const { licenseData, hasFeature } = useLicense();
    const hasAudioSupport = hasFeature('enable_audio_support');
    const [formData, setFormData] = useState({
        aiApiKey: settings.aiApiKey || '',
        maxAIRequests: settings.maxAIRequests || 10,
        systemName: settings.systemName || 'KodeSaGa Central',
        enableThreeD: settings.enableThreeD !== undefined ? settings.enableThreeD : true,
        chirpVoiceName: settings.chirpVoiceName || DEFAULT_CHIRP_VOICE,
        integrations: settings.integrations || { webhooks: [] }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState(null); // { type, message }
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

    // Sync formData when settings change
    useEffect(() => {
        setFormData({
            aiApiKey: settings.aiApiKey || '',
            maxAIRequests: settings.maxAIRequests || 10,
            systemName: settings.systemName || 'KodeSaGa Central',
            enableThreeD: settings.enableThreeD !== undefined ? settings.enableThreeD : true,
            chirpVoiceName: settings.chirpVoiceName || DEFAULT_CHIRP_VOICE,
            integrations: settings.integrations || { webhooks: [] }
        });
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        setStatus(null);
        try {
            await updateSettings(formData);
            setStatus({ type: 'success', message: 'Intelligence parameters synchronized successfully.' });
            setTimeout(() => setStatus(null), 4000);
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: `Sync Failed: ${err.message || 'Unknown permission error'}` });
        } finally {
            setIsSaving(false);
        }
    };

    const addWebhook = () => {
        const newWebhook = {
            id: crypto.randomUUID(),
            name: 'New Integration',
            url: '',
            secret: '',
            enabled: true,
            events: ['game_completed']
        };
        setFormData(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                webhooks: [...prev.integrations.webhooks, newWebhook]
            }
        }));
    };

    const updateWebhook = (id, fields) => {
        setFormData(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                webhooks: prev.integrations.webhooks.map(w => w.id === id ? { ...w, ...fields } : w)
            }
        }));
    };

    const removeWebhook = (id) => {
        setFormData(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                webhooks: prev.integrations.webhooks.filter(w => w.id !== id)
            }
        }));
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative"
                >
                    {/* Tactical Popup Notification */}
                    <AnimatePresence>
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, x: '-50%' }}
                                animate={{ opacity: 1, y: 15, x: '-50%' }}
                                exit={{ opacity: 0, y: -20, x: '-50%' }}
                                className={`absolute top-0 left-1/2 z-[110] min-w-[340px] p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-4 ${status.type === 'success'
                                    ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 shadow-indigo-500/20'
                                    : 'bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-rose-500/20'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${status.type === 'success' ? 'bg-indigo-500/20' : 'bg-rose-500/20'}`}>
                                    {status.type === 'success' ? <Shield className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-0.5">
                                        {status.type === 'success' ? 'Protocol Sync Success' : 'System Access Failure'}
                                    </p>
                                    <p className="text-xs font-bold leading-tight">{status.message}</p>
                                </div>
                                <button onClick={() => setStatus(null)} className="p-1 hover:bg-white/5 rounded-md transition-colors">
                                    <X className="w-4 h-4 opacity-50 hover:opacity-100" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

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

                    <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {/* Licensing Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-l-2 border-emerald-500 pl-4">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Framework Credentials</h3>
                            </div>

                            <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Licensing Agreement</h4>
                                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic">
                                        Manage your KodeSaGa v2.0 license manager and activation keys.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setIsLicenseModalOpen(true)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20 min-w-[140px]"
                                >
                                    Secure Licensing
                                </Button>
                            </div>
                        </div>

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
                                    {licenseData?.num_of_tact_questions !== undefined && licenseData?.num_of_tact_questions !== null && (
                                        <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tight">
                                                License Managed: {licenseData.num_of_tact_questions} questions currently authorized.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Platform Identity */}
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
                                    placeholder="KodeSaGa Central"
                                />
                            </div>
                        </div>

                        {/* ── External Integrations (Hooks) ── */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-l-2 border-amber-500 pl-4">
                                <div className="flex items-center gap-2">
                                    <Webhook className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Integrations (LMS Hooks)</h3>
                                </div>
                                <button
                                    onClick={addWebhook}
                                    className="p-1 hover:bg-white/5 rounded-full transition-colors group"
                                    title="Add New Integration"
                                >
                                    <PlusCircle className="w-5 h-5 text-zinc-500 group-hover:text-amber-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.integrations.webhooks?.length === 0 ? (
                                    <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center">
                                        <Link2 className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                                        <p className="text-xs text-zinc-600 font-medium">No external hooks configured. Connect your LMS or reporting tool.</p>
                                    </div>
                                ) : (
                                    formData.integrations.webhooks.map((webhook) => (
                                        <div key={webhook.id} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-4 relative group">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <Input
                                                        value={webhook.name}
                                                        onChange={(e) => updateWebhook(webhook.id, { name: e.target.value })}
                                                        placeholder="Integration Name (e.g. Moodle Score Hook)"
                                                        className="h-8 text-xs font-bold bg-transparent border-none focus:ring-0 p-0 mb-1 text-white"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${webhook.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                                                        <span className="text-[10px] text-zinc-500 uppercase font-black">{webhook.enabled ? 'Active' : 'Disabled'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateWebhook(webhook.id, { enabled: !webhook.enabled })}
                                                        className={`w-8 h-4 rounded-full transition-all flex items-center px-0.5 ${webhook.enabled ? 'bg-amber-600' : 'bg-zinc-800'}`}
                                                    >
                                                        <div className={`w-3 h-3 rounded-full bg-white transition-all transform ${webhook.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeWebhook(webhook.id)}
                                                        className="p-1.5 text-zinc-600 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-[9px] text-zinc-600 uppercase font-black mb-1 block">Webhook Target URL</Label>
                                                    <Input
                                                        value={webhook.url}
                                                        onChange={(e) => updateWebhook(webhook.id, { url: e.target.value })}
                                                        placeholder="https://..."
                                                        className="h-9 text-xs bg-black/40 border-zinc-800"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[9px] text-zinc-600 uppercase font-black mb-1 block">Auth Secret / Token (Optional)</Label>
                                                    <Input
                                                        type="password"
                                                        value={webhook.secret}
                                                        onChange={(e) => updateWebhook(webhook.id, { secret: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="h-9 text-xs bg-black/40 border-zinc-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Info className="w-3 h-3 text-zinc-600" />
                                                    <p className="text-[9px] text-zinc-600 italic">Triggers on "game_completed" events.</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-3 text-[10px] font-black uppercase tracking-widest bg-zinc-800/50 hover:bg-zinc-800 hover:text-amber-400 border border-zinc-700/50"
                                                    onClick={async () => {
                                                        const { triggerWebhook } = await import('../lib/integrations');
                                                        const res = await triggerWebhook(webhook, {
                                                            test: true,
                                                            userId: 'test-agent@kodesaga.com',
                                                            score: 95,
                                                            outcome: 'success',
                                                            caseTitle: 'Test Integration Case'
                                                        });
                                                        if (res?.success) {
                                                            alert('Connection Valid: Transmission successful.');
                                                        } else {
                                                            alert(`Connection Failed: ${res?.error || 'Unknown error'}`);
                                                        }
                                                    }}
                                                >
                                                    Test Connection
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* ── Audio / Chirp TTS ── */}
                        {hasAudioSupport && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 border-l-2 border-blue-500 pl-4">
                                    <Volume2 className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Audio Narration (Chirp HD)</h3>
                                </div>

                                {/* Chirp active badge */}
                                <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <Mic2 className="w-4 h-4 text-blue-400 shrink-0" />
                                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wide">
                                        Google Chirp 3 HD — Uses the Central AI API Key above
                                    </p>
                                </div>

                                {/* Chirp voice picker */}
                                <div>
                                    <Label className="text-[10px] text-zinc-500 uppercase font-black mb-2 block">Narrator Voice</Label>
                                    <div className="relative">
                                        <Mic2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                                        <select
                                            value={formData.chirpVoiceName}
                                            onChange={(e) => setFormData({ ...formData, chirpVoiceName: e.target.value })}
                                            className="w-full pl-10 pr-8 py-2.5 bg-black/50 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                                        >
                                            {CHIRP_HD_VOICES.map(v => (
                                                <option key={v.name} value={v.name}>{v.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
                                        Selected voice will be used for all story narration across all missions.
                                        Pricing: first 1M characters/month free, then $30/1M characters.
                                    </p>
                                </div>
                            </div>
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
            {/* License Config Modal */}
            <LicenseConfigModal
                isOpen={isLicenseModalOpen}
                onClose={() => setIsLicenseModalOpen(false)}
            />
        </>
    );
};

export default SystemSettingsModal;

