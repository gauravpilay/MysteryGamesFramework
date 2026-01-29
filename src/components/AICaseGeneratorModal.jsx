import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Sparkles, Wand2, Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { Button, Input, Label } from './ui/shared';
import { callAI } from '../lib/ai';
import { useConfig } from '../lib/config';

const AICaseGeneratorModal = ({ isOpen, onClose, onGenerate }) => {
    const { settings } = useConfig();
    const [step, setStep] = useState(1);
    const [objectives, setObjectives] = useState("");
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    const systemPrompt = `You are the "Mystery Architect AI". Your task is to generate a complete, playable mystery game node graph that accomplishes specific LEARNING OBJECTIVES.
    
    RETURN ONLY A VALID JSON OBJECT. NO MARKDOWN. NO EXPLANATION.
    
    The JSON structure MUST follow this format:
    {
      "nodes": [
        {
          "id": "string-uuid",
          "type": "story | suspect | evidence | logic | terminal | interrogation | message | action | identify | question",
          "position": { "x": number, "y": number },
          "data": {
            "label": "short human name",
            "text": "narrative text for story nodes",
            "name": "full name for suspect nodes",
            "role": "suspect profile role",
            "alibi": "suspect profile alibi",
            "description": "clue description for evidence",
            "variableId": "unique string for logic tracking",
            "actions": [
              { "id": "uuid", "label": "button text", "variant": "default | primary | danger | mystic" }
            ]
          }
        }
      ],
      "edges": [
        { "id": "uuid", "source": "node-id", "target": "node-id", "sourceHandle": "optional-id (e.g. action-uuid or 'true'/'false' for logic)" }
      ]
    }

    GUIDELINES:
    1. OBJECTIVE ALIGNMENT: The narrative, evidence, and challenges MUST teach or reinforce the LEARNING OBJECTIVES provided by the user.
    2. STORY FLOW: Start with a Story node. Use Action nodes or actions within nodes to branch.
    3. SUSPECTS: Create 2-3 Suspect nodes.
    4. EVIDENCE: Create 2-3 Evidence nodes that players "find". Give them unique variableIds.
    5. LOGIC: Use a Logic node to check if an Evidence variable is set before allowing progress to the climax.
    6. CLIMAX: Always end with an Identify node (Identify Culprit) where players name the killer.
    7. LAYOUT: Space nodes out by at least 300px on the X and Y axes.
    8. LOGIC HANDLES: Logic nodes use "true" and "false" as sourceHandle IDs.
    9. ACTION HANDLES: If a node has "actions" in data, the sourceHandle for the edge must match the action's id.

    The mystery should be educational, engaging, and logically sound based on the objectives.`;

    const handleGenerate = async () => {
        if (!prompt.trim() || !objectives.trim()) return;
        setIsGenerating(true);
        setError(null);

        // Check if API key exists
        const apiKey = settings.aiApiKey;
        const provider = 'gemini';

        try {
            const fullUserMessage = `LEARNING OBJECTIVES: ${objectives}\n\nSTORY THEME/PLOT: ${prompt}`;

            const responseText = await callAI(
                provider,
                systemPrompt,
                `Generate a mystery game based on these parameters:\n${fullUserMessage}`,
                apiKey || 'SIMULATION_MODE'
            );

            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            if (!data.nodes || !data.edges) {
                throw new Error("AI returned an incomplete graph. Please try again.");
            }

            onGenerate(data.nodes, data.edges);
            onClose();
        } catch (err) {
            console.error("AI Generation Error:", err);
            setError(err.message || "Failed to generate architecture.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.15)] flex flex-col relative"
                >
                    {/* Glowing Accent */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>

                    {/* Header */}
                    <div className="p-8 border-b border-white/5 bg-zinc-900/30">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <Brain className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">AI Case Architect</h2>
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                        Step {step} of 2: {step === 1 ? 'Educational Objectives' : 'Mission Parameters'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {!isGenerating ? (
                            <>
                                {step === 1 ? (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wand2 className="w-4 h-4 text-indigo-400" />
                                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">What should the player learn?</Label>
                                        </div>
                                        <textarea
                                            className="w-full h-40 bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none font-mono"
                                            placeholder="e.g. 'Difference between symmetric and asymmetric encryption', 'Social engineering red flags', 'Financial auditing basics'..."
                                            value={objectives}
                                            onChange={(e) => setObjectives(e.target.value)}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[10px] text-zinc-600 italic">
                                                The AI will weave these objectives into the evidence, suspect dialogues, and terminal challenges.
                                            </p>
                                            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2">
                                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Example Objective:</span>
                                                <button
                                                    onClick={() => setObjectives("Identify common social engineering red flags: Unusual Urgency, Mismatched Domains, and Unsolicited Attachments.")}
                                                    className="block text-left text-[11px] text-zinc-400 hover:text-indigo-300 transition-colors italic leading-relaxed"
                                                >
                                                    "Identify common social engineering red flags: Unusual Urgency, Mismatched Domains, and Unsolicited Attachments."
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-amber-400" />
                                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Story Briefing / Theme</Label>
                                        </div>
                                        <textarea
                                            className="w-full h-40 bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
                                            placeholder="Describe the setting... e.g. 'A noir detective thriller set in a floating city in 2077.'"
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                        />
                                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
                                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Example Briefing:</span>
                                            <button
                                                onClick={() => setPrompt("A cyber-heist at a luxury space-hotel. The CEO's private encryption keys were stolen from his terminal.")}
                                                className="block text-left text-[11px] text-zinc-400 hover:text-amber-300 transition-colors italic leading-relaxed"
                                            >
                                                "A cyber-heist at a luxury space-hotel. The CEO's private encryption keys were stolen from his terminal."
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 items-center text-rose-400"
                                    >
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <p className="text-xs font-medium">{error}</p>
                                    </motion.div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={step === 1 ? onClose : () => setStep(1)}
                                        className="flex-1 border border-zinc-800 hover:bg-zinc-900"
                                    >
                                        {step === 1 ? 'Abort' : 'Back'}
                                    </Button>
                                    {step === 1 ? (
                                        <Button
                                            onClick={() => setStep(2)}
                                            disabled={!objectives.trim()}
                                            className="flex-[2] bg-indigo-600 hover:bg-indigo-500 py-6"
                                        >
                                            Next: Define Narrative
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={!prompt.trim()}
                                            className="flex-[2] bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] py-6"
                                        >
                                            <Zap className="w-4 h-4 mr-2" />
                                            <span className="font-black uppercase tracking-widest">Initialize Generation</span>
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="py-12 flex flex-col items-center text-center space-y-6">
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <Brain className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Aligning Narrative with Learning Objectives</h3>
                                    <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                                        Synthesizing educational content into suspect dossiers and logical evidence chains...
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-full text-[10px] font-mono text-indigo-400 uppercase tracking-[0.2em]">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Sequencing Nodes...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer / Tip */}
                    <div className="p-6 bg-zinc-900/20 border-t border-white/5 flex items-center justify-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500/50" />
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Validated Schema Enforcement Active</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AICaseGeneratorModal;
