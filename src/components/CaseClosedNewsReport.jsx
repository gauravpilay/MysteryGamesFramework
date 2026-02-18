import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Newspaper, TrendingUp, Award, Share2, ArrowRight, Clock, Shield, AlertTriangle, CheckCircle, User, FileText, ExternalLink, Download, Check } from 'lucide-react';
import { callAI } from '../lib/ai';
import { useConfig } from '../lib/config';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const CaseClosedNewsReport = ({
    gameMetadata,
    logs,
    score,
    accusationResult,
    culpritName,
    objectiveScores,
    onClose,
    isSimultaneous = false
}) => {
    const { settings } = useConfig();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    const scrollRef = useRef(null);

    const getApiKey = () => {
        if (settings.aiApiKey) return settings.aiApiKey;
        // Fallback to dotEnv or simulation
        return import.meta.env.VITE_AI_API_KEY || 'SIMULATION_MODE';
    };

    useEffect(() => {
        const generateReport = async () => {
            setLoading(true);
            try {
                const apiKey = getApiKey();
                const provider = settings.aiProvider || 'gemini';

                const systemPrompt = `
                    You are a sensationalist news anchor for "The Midnight Chronos", a high-tech detective news network.
                    Your task is to write a "Breaking News" report about the recently concluded mystery case in a simple and concise English which anyone can understand.
                    
                    The report should include:
                    1. A catchy Headline.
                    2. A Lead Paragraph summarizing the case outcome.
                    3. A 'Details' section mentioning a few key actions the detective took (based on logs).
                    4. A 'Verdict' section describing the fate of the culprit.
                    5. 3 short 'Ticker Headlines' for the scrolling bar at the bottom.

                    Format the response as a JSON object:
                    {
                        "headline": "...",
                        "lead": "...",
                        "details": "...",
                        "verdict": "...",
                        "ticker": ["...", "...", "..."],
                        "mood": "triumphant" | "somber" | "chaotic"
                    }

                    Tone: Futuristic, cinematic, and reactive to whether the detective WON or LOST.
                `;

                const userMessage = `
                    CASE TITLE: ${gameMetadata?.title || 'Unknown Case'}
                    OUTCOME: ${accusationResult.toUpperCase()}
                    CULPRIT IDENTIFIED: ${culpritName || 'No one'}
                    FINAL SCORE: ${score}
                    DETECTIVE LOGS: ${logs.slice(0, 15).join('\n')}
                    OBJECTIVE PERFORMANCE: ${JSON.stringify(objectiveScores)}
                `;

                const response = await callAI(provider, systemPrompt, userMessage, apiKey, null, 'json');

                let parsedReport;
                try {
                    parsedReport = typeof response === 'string' ? JSON.parse(response) : response;
                } catch (e) {
                    // Fallback if AI doesn't return clean JSON
                    parsedReport = {
                        headline: "CASE CONCLUDED: INVESTIGATION ENDS",
                        lead: `The investigation into "${gameMetadata?.title}" has officially wrapped up.`,
                        details: "The detective scouring the evidence has reached a final conclusion.",
                        verdict: accusationResult === 'success' ? "The culprit has been apprehended." : "The perpetrator remains at large.",
                        ticker: ["JUST IN: Investigation closed.", "Neural links disconnecting.", "Score recorded."],
                        mood: accusationResult === 'success' ? "triumphant" : "somber"
                    };
                }

                setReport(parsedReport);
            } catch (err) {
                console.error("News Generation Error:", err);
                setError("Signal lost during report generation. Neural recon incomplete.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [gameMetadata, logs, score, accusationResult, culpritName, objectiveScores]);

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDownload = () => {
        if (!report) return;

        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        // Styles
        doc.setFillColor(15, 15, 20); // Dark background
        doc.rect(0, 0, 210, 297, 'F');

        // Header
        doc.setTextColor(220, 38, 38); // Red
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('BREAKING NEWS // THE MIDNIGHT CHRONOS', 20, 20);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text(report.headline.toUpperCase(), 20, 35, { maxWidth: 170 });

        // Case Info
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text(`CASE: ${gameMetadata?.title || 'UNKNOWN'}`, 20, 60);
        doc.text(`ARCHIVE DATE: ${timestamp}`, 20, 65);
        doc.text(`DETECTIVE YIELD: ${score} PTS`, 20, 70);

        // Lead
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'italic');
        doc.text(`"${report.lead}"`, 20, 85, { maxWidth: 170 });

        // Details
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(report.details, 20, 110, { maxWidth: 170 });

        // Verdict
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('OFFICIAL VERDICT', 20, 160);

        doc.setFillColor(report.mood === 'triumphant' ? 16 : 153, report.mood === 'triumphant' ? 185 : 27, report.mood === 'triumphant' ? 129 : 27);
        doc.rect(20, 165, 170, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(report.verdict, 25, 177, { maxWidth: 160 });

        // Footer
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text('END OF NEURAL RECONSTRUCTION // ENCRYPTED DATA TRANSFER', 105, 285, { align: 'center' });

        doc.save(`MidnightChronos_Case_${gameMetadata?.id?.slice(-4) || 'REPORT'}.pdf`);
        showNotification("Report Downloaded Successfully");
    };

    const handleTransmit = async () => {
        if (!report) return;

        const shareText = `[BREAKING NEWS] ${report.headline}\n\nCase: ${gameMetadata?.title}\nDetective Score: ${score}\n\n${report.lead}\n\n- Transmitted via Midnight Chronos`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Midnight Chronos: ${report.headline}`,
                    text: shareText,
                    url: window.location.href,
                });
                showNotification("Transmission Complete");
            } catch (err) {
                console.error("Share failed", err);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(shareText);
                showNotification("Case Summary Copied to Clipboard");
            } catch (err) {
                console.error("Clipboard failed", err);
            }
        }
    };

    // Format ticker items into a single long string
    const tickerText = report?.ticker?.join(' • ') || "SCANNING FOR NEW DATA • NEURAL LINK STABLE • RECONSTRUCTION IN PROGRESS • ";

    return (
        <div className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[200] bg-[#020202] text-white font-sans overflow-hidden flex flex-col`}>
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 z-0">
                <div className={`absolute inset-0 opacity-20 bg-gradient-to-b ${report?.mood === 'triumphant' ? 'from-emerald-900/40' : report?.mood === 'somber' ? 'from-red-900/40' : 'from-indigo-900/40'} via-black to-black`} />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                {/* Visual scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
            </div>

            {/* TOP BAR / HEADER */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                            />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Breaking News</span>
                        </div>
                        <h1 className="text-xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg">
                            Midnight <span className="text-indigo-500">Chronos</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Network Status</span>
                        <span className="text-[10px] font-bold text-emerald-400">ENCRYPTED_SIGNAL</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full md:rounded-xl flex items-center gap-2 transition-all active:scale-95 group"
                    >
                        <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Exit Report</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* NOTIFICATION OVERLAY */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`${isSimultaneous ? 'absolute' : 'fixed'} top-24 left-1/2 z-[300] bg-indigo-600 px-6 py-3 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-3`}
                    >
                        <Check className="w-4 h-4 text-white" />
                        <span className="text-sm font-bold uppercase tracking-widest text-white">{notification}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA */}
            <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto px-6 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT COLUMN: THE ARTICLE */}
                    <div className="lg:col-span-8 flex flex-col">
                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-16 h-16 border-4 border-t-indigo-500 border-indigo-500/10 rounded-full mb-6"
                                />
                                <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em] animate-pulse">Reconstructing Narrative...</p>
                            </div>
                        ) : error ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-6" />
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Neural Disconnect</h3>
                                <p className="text-zinc-400 mb-8 max-w-sm">{error}</p>
                                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold uppercase tracking-widest text-xs">Retry Uplink</button>
                            </div>
                        ) : (
                            <motion.article
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <div className={`inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-black uppercase tracking-[0.3em] ${report?.mood === 'triumphant' ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'}`}>
                                        Special Report // Case_{gameMetadata?.id?.slice(-4) || '772'}
                                    </div>
                                    <h2 className="text-4xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase drop-shadow-2xl">
                                        {report?.headline}
                                    </h2>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="w-full md:w-32 h-1 bg-indigo-500 mt-4 shrink-0" />
                                    <div className="space-y-6">
                                        <p className="text-xl md:text-3xl font-bold text-zinc-200 leading-tight italic border-l-4 border-white/20 pl-6">
                                            "{report?.lead}"
                                        </p>
                                        <div className="prose prose-invert max-w-none">
                                            <p className="text-lg text-zinc-400 leading-relaxed font-light">
                                                {report?.details}
                                            </p>
                                            <div className="h-px w-full bg-white/10 my-8" />
                                            <h4 className="text-sm font-black text-white uppercase tracking-[0.4em] mb-4">Official Verdict</h4>
                                            <div className={`p-6 bg-white/5 border-l-4 rounded-r-xl ${report?.mood === 'triumphant' ? 'border-emerald-500 bg-emerald-500/5' : 'border-red-500 bg-red-500/5'}`}>
                                                <p className="text-xl font-medium text-zinc-100 italic">
                                                    {report?.verdict}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.article>
                        )}
                    </div>

                    {/* RIGHT COLUMN: STATS & DATA */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* SCORE CARD */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-8 bg-zinc-900/50 border border-white/5 rounded-3xl backdrop-blur-xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <TrendingUp className="w-20 h-20 text-white" />
                            </div>

                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Investigation Yield</span>
                            <div className="flex items-end gap-2 mb-6">
                                <span className="text-6xl font-black text-white tracking-tighter">{score}</span>
                                <span className="text-sm font-bold text-indigo-400 uppercase mb-2">Points</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 font-bold uppercase">Detective Rank</span>
                                    <span className="text-white font-mono">{score > 800 ? 'LEGEND' : score > 500 ? 'SENIOR' : 'NOVICE'}</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (score / 1000) * 100)}%` }}
                                        className="h-full bg-indigo-600"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* CASE SUMMARY LIST */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-xl"
                        >
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Shield className="w-3 h-3 text-indigo-500" /> Case Evidence Summary
                            </h4>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Primary Suspect</p>
                                        <p className="text-sm font-bold text-white">{culpritName || 'Unidentified'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Archive Date</p>
                                        <p className="text-sm font-bold text-white">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                        <CheckCircle className={`w-5 h-5 ${accusationResult === 'success' ? 'text-emerald-500' : 'text-red-500'}`} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Final Verdict</p>
                                        <p className={`text-sm font-bold uppercase ${accusationResult === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {accusationResult === 'success' ? 'CORRECT_ACCUSATION' : 'INVESTIGATION_FAILURE'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ACTION BUTTONS */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleTransmit}
                                className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 hover:border-indigo-500/30"
                            >
                                <Share2 className="w-4 h-4 text-indigo-400" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Transmit</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 hover:border-emerald-500/30"
                            >
                                <Download className="w-4 h-4 text-emerald-400" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Download</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* TICKER FOOTER */}
            <div className="h-10 md:h-12 bg-indigo-600 flex items-center border-t border-white/10 relative z-20">
                <div className="bg-black h-full px-6 flex items-center justify-center shrink-0 z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Latest Headlines</span>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <motion.div
                        animate={{ x: [0, -1000] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="whitespace-nowrap flex items-center gap-8 py-2"
                    >
                        {[1, 2, 3].map((_, i) => (
                            <span key={i} className="text-[11px] md:text-xs font-black uppercase tracking-widest text-white/90">
                                {tickerText}
                            </span>
                        ))}
                    </motion.div>
                </div>
                <div className="hidden md:flex bg-indigo-700 h-full px-4 items-center gap-3 shrink-0">
                    <Radio className="w-3 h-3 text-white animate-pulse" />
                    <span className="text-[10px] font-bold text-white/80 font-mono">LIVE_LINK:DET_ALPHA</span>
                </div>
            </div>
        </div>
    );
};

export default CaseClosedNewsReport;
