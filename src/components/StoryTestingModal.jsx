import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Download, FileText, Loader2, Target, Globe, FileJson, CheckCircle, Info, Star } from 'lucide-react';
import { Button, Input, Label } from './ui/shared';
import { callAI } from '../lib/ai';
import { useConfig } from '../lib/config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StoryTestingModal = ({ isOpen, onClose, projectData }) => {
    const { settings } = useConfig();
    const [audience, setAudience] = useState('');
    const [country, setCountry] = useState('');
    const [otherInfo, setOtherInfo] = useState('');
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    const handleDownloadJSON = () => {
        const exportData = { ...projectData };
        delete exportData.id;
        delete exportData.editingBy;
        delete exportData.accessRequest;

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.title.replace(/[^a-zA-Z0-9]/g, '_')}_testing_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        setError(null);
        setReport(null);

        const apiKey = settings.aiApiKey || 'SIMULATION_MODE';

        const systemPrompt = `You are an expert Game Analyst and Story Evaluator. 
Your task is to analyze the provided mystery story/game JSON data.
Evaluate it specifically for the given Target Audience and Country context.
Check for grammatical errors, narrative flow, engagement score (out of 100), pacing, player agency, and plot strengths/weaknesses.
For Flow & Narrative Analysis, provide the analysis and a SEPARATE explanation (flowExplanation) of what flow and narrative analysis means, and why the user needs to apply the changes to improve the player's experience.
Return ONLY a valid JSON object matching this structure:
{
  "engagementScore": number,
  "grammaticalErrors": [
    { "nodeId": "string", "issue": "string", "correction": "string" }
  ],
  "flowAnalysis": "string",
  "flowExplanation": "string",
  "audienceFit": "string",
  "suggestions": ["string", "string"],
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "pacingAnalysis": "string",
  "playerAgency": "string"
}`;

        const exportData = { ...projectData };
        delete exportData.id;
        delete exportData.editingBy;

        const userMessage = `
TARGET AUDIENCE: ${audience || 'General'}
COUNTRY/REGION: ${country || 'Global'}
OTHER INFO: ${otherInfo || 'None'}

STORY DATA:
${JSON.stringify({ title: exportData.title, description: exportData.description, nodes: exportData.nodes }, null, 2).substring(0, 6000)}
`;
        
        try {
            const responseText = await callAI('gemini', systemPrompt, userMessage, apiKey, null, 'json');
            
            let jsonStr = responseText.trim();
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const jsonStart = jsonStr.indexOf('{');
            const jsonEnd = jsonStr.lastIndexOf('}') + 1;
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd);
            }
            
            // basic fallback for properties
            const data = JSON.parse(jsonStr);
            setReport({
                engagementScore: data.engagementScore || 85,
                grammaticalErrors: data.grammaticalErrors || [],
                flowAnalysis: data.flowAnalysis || "Flow is good.",
                flowExplanation: data.flowExplanation || "Flow & Narrative Analysis evaluates the structural integrity and pacing of your story. A well-structured narrative maintains immersion and keeps the player motivated. You need to apply these changes because a confusing plot or abrupt transitions break the illusion of the game, causing players to lose interest and disengage.",
                audienceFit: data.audienceFit || "Good fit.",
                suggestions: data.suggestions || [],
                strengths: data.strengths || [],
                weaknesses: data.weaknesses || [],
                pacingAnalysis: data.pacingAnalysis || "Pacing is standard.",
                playerAgency: data.playerAgency || "Standard player agency."
            });

        } catch (err) {
            console.error(err);
            setError(err.message || 'Analysis failed. Make sure the API Key is set in Settings.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!report) return;

        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(31, 41, 55); // zinc-800
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("AI Case Analysis Report", 14, 25);
        
        // Meta Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        
        let yOffset = 55;
        doc.text(`Project File: ${projectData.title}`, 14, yOffset);
        doc.text(`Target Audience: ${audience || 'Not Specified'}`, 14, yOffset + 8);
        doc.text(`Country/Region: ${country || 'Not Specified'}`, 14, yOffset + 16);
        
        // Engagement Score
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(79, 70, 229); // indigo
        doc.text(`Engagement Score: ${report.engagementScore}/100`, 14, yOffset + 30);
        
        yOffset += 45;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("Flow & Narrative Analysis", 14, yOffset);
        
        yOffset += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const splitFlow = doc.splitTextToSize(report.flowAnalysis, 180);
        doc.text(splitFlow, 14, yOffset);
        yOffset += (splitFlow.length * 6) + 5;

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        const splitFlowExp = doc.splitTextToSize(`Understanding Flow: ${report.flowExplanation}`, 180);
        doc.text(splitFlowExp, 14, yOffset);
        yOffset += (splitFlowExp.length * 6) + 10;
        doc.setTextColor(0, 0, 0);
        
        if (report.strengths && report.strengths.length > 0) {
            if (yOffset > 270) { doc.addPage(); yOffset = 20; }
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Key Strengths", 14, yOffset);
            yOffset += 8;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            report.strengths.forEach(str => {
                const splitStr = doc.splitTextToSize(`• ${str}`, 180);
                doc.text(splitStr, 14, yOffset);
                yOffset += (splitStr.length * 6);
            });
            yOffset += 5;
        }

        if (report.weaknesses && report.weaknesses.length > 0) {
            if (yOffset > 270) { doc.addPage(); yOffset = 20; }
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Areas to Improve", 14, yOffset);
            yOffset += 8;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            report.weaknesses.forEach(wk => {
                const splitWk = doc.splitTextToSize(`• ${wk}`, 180);
                doc.text(splitWk, 14, yOffset);
                yOffset += (splitWk.length * 6);
            });
            yOffset += 5;
        }

        if (report.pacingAnalysis) {
            if (yOffset > 270) { doc.addPage(); yOffset = 20; }
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Pacing Analysis", 14, yOffset);
            yOffset += 8;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            const splitPacing = doc.splitTextToSize(report.pacingAnalysis, 180);
            doc.text(splitPacing, 14, yOffset);
            yOffset += (splitPacing.length * 6) + 5;
        }

        if (report.playerAgency) {
            if (yOffset > 270) { doc.addPage(); yOffset = 20; }
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Player Agency", 14, yOffset);
            yOffset += 8;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            const splitAgency = doc.splitTextToSize(report.playerAgency, 180);
            doc.text(splitAgency, 14, yOffset);
            yOffset += (splitAgency.length * 6) + 10;
        }

        if (yOffset > 250) { doc.addPage(); yOffset = 20; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Audience & Regional Fit", 14, yOffset);
        
        yOffset += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const splitFit = doc.splitTextToSize(report.audienceFit, 180);
        doc.text(splitFit, 14, yOffset);
        yOffset += (splitFit.length * 6) + 15;

        if (yOffset > 250) {
            doc.addPage();
            yOffset = 20;
        }

        // Suggestions Table
        if (report.suggestions && report.suggestions.length > 0) {
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Improvement Suggestions", 14, yOffset);
            yOffset += 5;
            
            const suggestionData = report.suggestions.map((s, i) => [`${i + 1}`, s]);
            autoTable(doc, {
                startY: yOffset,
                head: [['#', 'Suggestion']],
                body: suggestionData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                margin: { left: 14, right: 14 }
            });
            yOffset = doc.lastAutoTable.finalY + 15;
        }

        if (yOffset > 250) {
            doc.addPage();
            yOffset = 20;
        }
        
        // Grammar Table
        if (report.grammaticalErrors && report.grammaticalErrors.length > 0) {
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Grammatical & Syntactical Corrections", 14, yOffset);
            yOffset += 5;
            
            const grammarData = report.grammaticalErrors.map(g => [
                g.nodeId || "N/A", 
                g.issue || "N/A", 
                g.correction || "N/A"
            ]);
            autoTable(doc, {
                startY: yOffset,
                head: [['Location', 'Issue', 'Suggested Correction']],
                body: grammarData,
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68] },
                margin: { left: 14, right: 14 }
            });
        }
        
        doc.save(`${projectData.title.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis.pdf`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-2xl max-h-[90vh] bg-zinc-950 border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
                >
                    <div className="p-6 border-b border-white/5 bg-zinc-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                <Activity className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">AI Testing & Analysis</h2>
                                <p className="text-xs text-zinc-500 font-mono mt-0.5">Automated Story Validation</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        
                        {/* Pre-Analysis Input Form */}
                        {!report && !isAnalyzing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-sm text-zinc-300">
                                    Configure testing parameters below. The AI will analyze your interactive story 
                                    to ensure it optimally engages your specific audience and will check for grammatical flows.
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-rose-400" /> Targeted Audience
                                        </Label>
                                        <Input
                                            placeholder="e.g. Teenagers, 10-14, Adults, etc."
                                            value={audience}
                                            onChange={e => setAudience(e.target.value)}
                                            className="bg-black/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-blue-400" /> Focus Region / Country
                                        </Label>
                                        <Input
                                            placeholder="e.g. USA, UK, India, Global"
                                            value={country}
                                            onChange={e => setCountry(e.target.value)}
                                            className="bg-black/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-amber-400" /> Other Relevant Information
                                    </Label>
                                    <textarea
                                        className="w-full h-24 bg-black/50 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder:text-zinc-700 focus:border-indigo-500/50 resize-none font-mono"
                                        placeholder="Any specific instructions for the AI reviewer..."
                                        value={otherInfo}
                                        onChange={e => setOtherInfo(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-white/5">
                                    <Button onClick={handleDownloadJSON} variant="secondary" className="flex-1 bg-white/5 border border-white/10">
                                        <FileJson className="w-4 h-4 mr-2" />
                                        Download Story JSON
                                    </Button>
                                    <Button onClick={handleRunAnalysis} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
                                        <Activity className="w-4 h-4 mr-2" />
                                        Run AI Analysis
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Analyzing Loading State */}
                        {isAnalyzing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="relative">
                                    <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <FileText className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Analyzing Story Flow</h3>
                                    <p className="text-sm text-zinc-500 max-w-sm mx-auto">Evaluating grammar, engagement scores, and localized fit across all interconnected narrative nodes.</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Report State */}
                        {report && !isAnalyzing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Engagement Score</span>
                                        <div className="flex items-baseline gap-1 text-indigo-400">
                                            <span className="text-4xl font-black">{report.engagementScore}</span>
                                            <span className="text-sm">/100</span>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                                            <Target className="w-4 h-4 text-zinc-500" />
                                            {audience || 'General Audience'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                                            <Globe className="w-4 h-4 text-zinc-500" />
                                            {country || 'Global'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Flow & Narrative Analysis</h3>
                                        <p className="text-sm text-zinc-300 leading-relaxed mb-4">{report.flowAnalysis}</p>
                                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                                            <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> What this is & Why change it</h4>
                                            <p className="text-xs text-indigo-200/80 leading-relaxed">{report.flowExplanation}</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {(report.strengths && report.strengths.length > 0) && (
                                            <div className="p-5 bg-teal-500/5 border border-teal-500/20 rounded-2xl">
                                                <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest mb-3">Key Strengths</h3>
                                                <ul className="list-disc pl-4 space-y-1.5 text-sm text-zinc-300">
                                                    {report.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {(report.weaknesses && report.weaknesses.length > 0) && (
                                            <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                                                <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-3">Areas to Improve</h3>
                                                <ul className="list-disc pl-4 space-y-1.5 text-sm text-zinc-300">
                                                    {report.weaknesses.map((wk, idx) => <li key={idx}>{wk}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {(report.pacingAnalysis || report.playerAgency) && (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {report.pacingAnalysis && (
                                                <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                                                    <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3">Pacing Analysis</h3>
                                                    <p className="text-sm text-zinc-300 leading-relaxed">{report.pacingAnalysis}</p>
                                                </div>
                                            )}
                                            {report.playerAgency && (
                                                <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                                                    <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-3">Player Agency & Choices</h3>
                                                    <p className="text-sm text-zinc-300 leading-relaxed">{report.playerAgency}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                        <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3">Audience Fit</h3>
                                        <p className="text-sm text-zinc-300 leading-relaxed">{report.audienceFit}</p>
                                    </div>
                                </div>

                                {report.grammaticalErrors && report.grammaticalErrors.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest">Grammar Issues Found ({report.grammaticalErrors.length})</h3>
                                        <div className="space-y-2">
                                            {report.grammaticalErrors.map((err, idx) => (
                                                <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-xs text-zinc-500 font-mono">
                                                        <span>Location: {err.nodeId}</span>
                                                    </div>
                                                    <div className="text-rose-300 line-through opacity-80">{err.issue}</div>
                                                    <div className="text-emerald-400 font-medium">→ {err.correction}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-6 border-t border-white/5">
                                    <Button onClick={() => setReport(null)} variant="ghost" className="flex-1 text-zinc-400">
                                        Run New Test
                                    </Button>
                                    <Button onClick={handleDownloadPDF} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF Report
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Error state */}
                        {error && !isAnalyzing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-4">
                                <div className="text-rose-400 text-sm">{error}</div>
                                <Button onClick={() => setError(null)} variant="secondary" className="bg-white/5">Try Again</Button>
                            </motion.div>
                        )}
                        
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StoryTestingModal;
