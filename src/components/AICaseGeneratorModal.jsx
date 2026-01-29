import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Sparkles, Wand2, Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { Button, Input, Label } from './ui/shared';
import { callAI } from '../lib/ai';
import { useConfig } from '../lib/config';

const AICaseGeneratorModal = ({ isOpen, onClose, onGenerate }) => {
    const { settings } = useConfig();
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    const systemPrompt = `You are the "Mystery Architect AI". Your task is to generate a complete, playable mystery game node graph based on a user prompt.
    
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
    1. STORY FLOW: Start with a Story node. Use Action nodes or actions within nodes to branch.
    2. SUSPECTS: Create 2-3 Suspect nodes.
    3. EVIDENCE: Create 2-3 Evidence nodes that players "find". Give them unique variableIds.
    4. LOGIC: Use a Logic node to check if an Evidence variable is set before allowing progress to the climax.
    5. CLIMAX: Always end with an Identify node (Identify Culprit) where players name the killer.
    6. LAYOUT: Space nodes out by at least 300px on the X and Y axes.
    7. CONNECTIVITY: Every node must be reachable from the start node.
    8. LOGIC HANDLES: Logic nodes use "true" and "false" as sourceHandle IDs.
    9. ACTION HANDLES: If a node has "actions" in data, the sourceHandle for the edge must match the action's id.

    The mystery should be engaging, with twists and clear clues.`;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setError(null);

        // Check if API key exists
        const apiKey = settings.aiApiKey;
        const provider = 'gemini'; // Default to gemini for structure

        try {
            const responseText = await callAI(
                provider,
                systemPrompt,
                `Generate a mystery game about: ${prompt}`,
                apiKey || 'SIMULATION_MODE'
            );

            // Clean response text just in case AI adds markdown blocks
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
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Procedural Narrative Generation</p>
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
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mission Briefing Prompt</Label>
                                    </div>
                                    <textarea
                                        className="w-full h-40 bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
                                        placeholder="Explain the plot... e.g., 'A locked room murder in a futuristic space station where the only witness is a broken robot.'"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                    <p className="text-[10px] text-zinc-600 italic">
                                        The AI will generate Story nodes, Suspect dossiers, Evidence clues, and Logic gates automatically.
                                    </p>
                                </div>

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
                                        onClick={onClose}
                                        className="flex-1 border border-zinc-800 hover:bg-zinc-900"
                                    >
                                        Abort
                                    </Button>
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={!prompt.trim()}
                                        className="flex-[2] bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] py-6"
                                    >
                                        <Zap className="w-4 h-4 mr-2" />
                                        <span className="font-black uppercase tracking-widest">Initialize Generation</span>
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="py-12 flex flex-col items-center text-center space-y-6">
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <Brain className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Synthesizing Narrative Architectures</h3>
                                    <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                                        The AI is currently drafting suspect profiles, planting evidence, and constructing logical branching paths...
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
