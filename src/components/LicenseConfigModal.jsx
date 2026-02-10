import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Link2, Key, Loader2, CheckCircle2, AlertCircle, Cpu, ShieldAlert } from 'lucide-react';
import { Button, Input, Label } from './ui/shared';
import { useLicense } from '../lib/licensing';

const LicenseConfigModal = ({ isOpen, onClose }) => {
    const { activateLicense, licenseData } = useLicense();
    const [url, setUrl] = useState('https://mystery-license-manager.vercel.app');
    const [key, setKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

    const handleActivate = async () => {
        if (!key.trim() || !url.trim()) return;

        setIsLoading(true);
        setStatus(null);

        try {
            const result = await activateLicense(url, key);
            setStatus({
                type: 'success',
                message: `License Activated for ${result.data.customer}. System synchronized.`
            });
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.message || 'Failed to authenticate with license server.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            {/* Animated Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.2)] flex flex-col relative"
            >
                {/* Header Section */}
                <div className="p-8 pb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-zinc-500" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Access Control</h2>
                            <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.2em]">Framework Licensing v2.0</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-2 space-y-6">
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        Enter your deployment endpoint and framework activation key to synchronize your environment permissions.
                    </p>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">License Manager Endpoint</Label>
                            <div className="relative group">
                                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://license-server.com"
                                    className="pl-12 bg-black/40 border-zinc-800 focus:border-indigo-500/50 h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Framework Activation Key</Label>
                            <div className="relative group">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                                <Input
                                    type="password"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    className="pl-12 bg-black/40 border-zinc-800 focus:border-indigo-500/50 h-12 rounded-xl font-mono tracking-widest"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status Feedback */}
                    <AnimatePresence mode="wait">
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`p-4 rounded-2xl flex items-center gap-4 border ${status.type === 'success'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                    }`}
                            >
                                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
                                <p className="text-xs font-bold leading-tight">{status.message}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="pt-4 flex flex-col gap-3">
                        <Button
                            onClick={handleActivate}
                            disabled={isLoading || !key}
                            className={`h-14 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl ${isLoading
                                    ? 'bg-zinc-800 text-zinc-500'
                                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] text-white shadow-indigo-600/20'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Synchronizing...
                                </span>
                            ) : (
                                "Activate Framework"
                            )}
                        </Button>

                        <p className="text-center text-[10px] text-zinc-600 font-mono italic">
                            {licenseData ? `Status: ACTIVE [${licenseData.customer}]` : "Status: UNACTIVATED / RESTRICTED MODE"}
                        </p>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="bg-zinc-900/30 p-4 border-t border-zinc-900 flex items-center gap-4 overflow-hidden">
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-1 h-3 bg-indigo-500/20 rounded-full" />
                        ))}
                    </div>
                    <div className="text-[9px] text-zinc-600 font-mono whitespace-nowrap overflow-hidden">
                        SECURE_SYNC_PROTOCOL_V2 // RSA_2048_VERIFIED // NO_TAMPER_DETECTED
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LicenseConfigModal;
