import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Brain, Sparkles, Loader2, CheckCircle, ChevronRight, ChevronLeft,
    BookOpen, Globe, Target, Users, Building2, MapPin, Calendar, FileText,
    Shield, Lightbulb, AlertTriangle, Rocket, Settings2
} from 'lucide-react';
import { Button, Label } from './ui/shared';
import { callAI } from '../lib/ai';
import { useConfig } from '../lib/config';

const INDUSTRIES = [
    { id: 'finance', label: 'Finance & Banking', icon: '💰' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'technology', label: 'Technology & IT', icon: '💻' },
    { id: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
    { id: 'retail', label: 'Retail & E-commerce', icon: '🛍️' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'government', label: 'Government & Public Sector', icon: '🏛️' },
    { id: 'energy', label: 'Energy & Utilities', icon: '⚡' }
];

const DIFFICULTY_LEVELS = [
    { id: 'beginner', label: 'Beginner', suspects: '2-3', questions: '2 per document' },
    { id: 'medium', label: 'Medium', suspects: '4-5', questions: '3 per document' },
    { id: 'advanced', label: 'Advanced', suspects: '6-8', questions: '4 per document' }
];

const AICaseGeneratorModalAdvanced = ({ isOpen, onClose, onGenerate }) => {
    const { settings } = useConfig();

    // Mode selection: null, 'quick', or 'advanced'
    const [mode, setMode] = useState(null);

    // Step navigation (for advanced mode)
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    // Quick Mode State
    const [quickStory, setQuickStory] = useState('');
    const [quickObjectives, setQuickObjectives] = useState('');

    // Advanced Mode State
    // Step 1: Industry Context
    const [industry, setIndustry] = useState('');
    const [customIndustry, setCustomIndustry] = useState('');
    const [topic, setTopic] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');

    // Step 2: Game Mechanics
    const [difficulty, setDifficulty] = useState('medium');
    const [suspectCount, setSuspectCount] = useState(4);
    const [enableDiversity, setEnableDiversity] = useState(true);

    // Step 3: Learning Objectives
    const [learningObjectives, setLearningObjectives] = useState([{ id: 1, objective: '' }]);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const addObjective = () => {
        setLearningObjectives([...learningObjectives, { id: Date.now(), objective: '' }]);
    };

    const updateObjective = (id, value) => {
        setLearningObjectives(learningObjectives.map(obj =>
            obj.id === id ? { ...obj, objective: value } : obj
        ));
    };

    const removeObjective = (id) => {
        if (learningObjectives.length > 1) {
            setLearningObjectives(learningObjectives.filter(obj => obj.id !== id));
        }
    };

    const buildQuickModePrompt = () => {
        return `You are the "Mystery Architect AI Director". Generate a complete, playable mystery game from the user's story description and learning objectives.

RETURN ONLY A VALID JSON OBJECT. NO MARKDOWN. NO EXPLANATION.

The JSON structure MUST follow this exact format:
{
  "nodes": [
    {
      "id": "unique-string-id",
      "type": "story | suspect | evidence | logic | terminal | interrogation | message | action | identify | question",
      "position": { "x": number, "y": number },
      "data": {
        "label": "Short Node Name",
        "text": "Full narrative text for story nodes",
        "name": "Full Name for suspect nodes",
        "role": "Suspect's role/occupation",
        "alibi": "Suspect's alibi statement",
        "motive": "Suspect's potential motive",
        "personality": "Personality traits",
        "description": "Evidence description",
        "variableId": "unique_variable_id for tracking",
        "actions": [
          { "id": "unique-action-id", "label": "Button Text", "variant": "default | primary | danger | mystic" }
        ]
      }
    }
  ],
  "edges": [
    { 
      "id": "unique-edge-id", 
      "source": "source-node-id", 
      "target": "target-node-id", 
      "sourceHandle": "action-id or 'true'/'false' for logic nodes"
    }
  ]
}

CRITICAL GUIDELINES:
1. Use the user's story as the foundation
2. Create 3-5 Suspect nodes with unique personalities
3. Include 4-6 Evidence nodes with variableIds
4. Use Logic nodes to check evidence collection
5. End with an Identify node for final accusation
6. Space nodes 350px apart on X-axis, 250px on Y-axis
7. Make it engaging and playable

Generate a complete mystery game that brings the user's vision to life.`;
    };

    const buildAdvancedModePrompt = () => {
        const validObjectives = learningObjectives.filter(obj => obj.objective.trim()).map(obj => obj.objective);
        const diffConfig = DIFFICULTY_LEVELS.find(d => d.id === difficulty);
        const industryName = industry === 'custom' ? customIndustry : INDUSTRIES.find(i => i.id === industry)?.label;

        return `You are the "Lead Game Architect & Narrative Designer" for a gamified mystery training platform.

CRITICAL: RETURN ONLY VALID JSON. NO MARKDOWN. NO EXPLANATION.

Generate a comprehensive mystery story with the following EXACT structure:

{
  "caseTitle": "string",
  "caseDescription": "string (4 lines max)",
  "mastermindIndex": number (0 to suspectCount-1, RANDOMIZED),
  "suspects": [
    {
      "id": "suspect-1",
      "name": "Full Name",
      "role": "Job Title/Role",
      "identity": {
        "age": "string",
        "gender": "string",
        "ethnicity": "string",
        "background": "string"
      },
      "alibi": "Their alibi statement",
      "motive": "Potential motive",
      "personality": "Personality traits",
      "unlockCondition": "evidence-id-required-to-unlock-this-suspect OR null for first suspect",
      "evidenceDocuments": [
        {
          "id": "evidence-1-1",
          "label": "Document Name",
          "description": "What this evidence shows",
          "imagePrompt": "Detailed prompt for AI image generation",
          "questions": [
            {
              "id": "q-1-1-1",
              "question": "Fill in the blank: The security protocol violated was ___________.",
              "correctAnswer": "Multi-Factor Authentication",
              "distractors": [
                "Single Sign-On",
                "Password Encryption",
                "Biometric Verification"
              ],
              "hint": "Look at the authentication logs (max 2 lines)",
              "correctExplanation": "Why this is correct (max 2 lines)",
              "distractorExplanations": [
                "Why distractor 1 is wrong (max 2 lines)",
                "Why distractor 2 is wrong (max 2 lines)",
                "Why distractor 3 is wrong (max 2 lines)"
              ],
              "learningObjective": "Specific objective from the list this maps to"
            }
          ]
        }
      ]
    }
  ],
  "nodes": [...],
  "edges": [...]
}

CONFIGURATION:
- Industry: ${industryName}
- Topic: ${topic}
- Location: ${location}
- Date: ${date}
- Difficulty: ${difficulty} (${diffConfig?.suspects} suspects, ${diffConfig?.questions})
- Suspect Count: ${suspectCount}
- Diverse Identities: ${enableDiversity ? 'YES - Include varied ages, genders, ethnicities to avoid bias' : 'NO'}
- Learning Objectives: ${validObjectives.join('; ')}

CORE DIRECTIVES:

1. NARRATIVE ARCHITECTURE:
   - Sequential Unlock: First suspect has unlockCondition: null
   - Each subsequent suspect unlocked by solving previous suspect's evidence
   - The Mastermind: Only ONE culprit. Set mastermindIndex randomly (0 to ${suspectCount - 1})
   - Tone: Professional, polite interrogations. Scripts max 20 lines
   - Never explicitly tell suspects what they did wrong - learner must deduce
   - Define ALL abbreviations on first use

2. INSTRUCTIONAL DESIGN:
   - Each suspect has EXACTLY 3 evidence documents
   - Each document has ${diffConfig?.questions} fill-in-the-blank questions
   - Questions written conversationally, not formally
   - Every question maps to a specific Learning Objective
   - NO repeated questions across all documents
   - Distractors MUST be structurally similar to correct answer (Medium difficulty)

3. FEEDBACK SCHEMA:
   - Hint: Max 2 lines, guides without giving answer
   - Correct Explanation: Max 2 lines, why it's right
   - Distractor Explanations: Max 2 lines each, why each is wrong

4. DIVERSITY (if enabled):
   - Vary ages (20s to 60s), genders, ethnicities
   - Avoid stereotypes - roles should not correlate with identity
   - Create realistic, professional characters

5. GAME FLOW:
   - Start with Story node introducing the case
   - First suspect node (unlockCondition: null)
   - Evidence nodes for each document (3 per suspect)
   - Question nodes for each question (linked to evidence)
   - Logic nodes to check evidence completion before unlocking next suspect
   - Suspect nodes unlock sequentially
   - Final Identify node to accuse the culprit

6. CRITICAL - RESPONSE SIZE:
   - Keep descriptions concise (1-2 sentences max)
   - Hints and explanations: MAX 2 lines each
   - MUST complete the entire JSON structure including nodes and edges
   - Prioritize structure completeness over verbose content
   - If approaching token limit, reduce description length but ALWAYS include all sections

Generate a complete, engaging mystery that teaches ${validObjectives.length} learning objectives through evidence-based deduction.`;
    };

    const handleQuickGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 800);

            const userMessage = `
STORY DESCRIPTION:
${quickStory}

LEARNING OBJECTIVES:
${quickObjectives}

Transform this into a complete, playable mystery game with engaging characters, challenging puzzles, and seamless integration of the learning objectives.`;

            const responseText = await callAI(
                'gemini',
                buildQuickModePrompt(),
                userMessage,
                settings.aiApiKey || 'SIMULATION_MODE'
            );

            clearInterval(progressInterval);
            setProgress(95);

            // Parse JSON with robust error handling
            console.log("Raw AI Response Length:", responseText.length);

            let jsonStr = responseText.trim();

            // Remove markdown code blocks
            jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Find the JSON object boundaries
            const jsonStart = jsonStr.indexOf('{');
            const jsonEnd = jsonStr.lastIndexOf('}') + 1;

            if (jsonStart === -1 || jsonEnd <= jsonStart) {
                console.error("No valid JSON object found in response");
                throw new Error("AI response doesn't contain valid JSON. Please try again.");
            }

            jsonStr = jsonStr.substring(jsonStart, jsonEnd);

            // Comprehensive JSON cleanup function
            const repairJSON = (str) => {
                let repaired = str;

                // 1. Remove trailing commas before closing brackets/braces
                repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

                // 2. Fix missing commas between array elements (common AI mistake)
                // This handles cases like: "text" "text" -> "text", "text"
                repaired = repaired.replace(/"\s+"/g, '", "');

                // 3. Fix missing commas between object properties
                repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');

                // 4. Remove any control characters that might break JSON
                repaired = repaired.replace(/[\x00-\x1F\x7F]/g, (char) => {
                    // Keep newlines, tabs, and carriage returns in strings
                    if (char === '\n') return '\\n';
                    if (char === '\r') return '\\r';
                    if (char === '\t') return '\\t';
                    return ''; // Remove other control characters
                });

                // 5. Fix unescaped quotes in strings (very common issue)
                // This is tricky - we need to escape quotes that are inside string values
                // but not the quotes that delimit strings

                return repaired;
            };

            // Apply repairs
            jsonStr = repairJSON(jsonStr);

            console.log("Cleaned JSON Length:", jsonStr.length);
            console.log("First 500 chars:", jsonStr.substring(0, 500));
            console.log("Last 500 chars:", jsonStr.substring(jsonStr.length - 500));

            let data;
            try {
                data = JSON.parse(jsonStr);
            } catch (parseErr) {
                console.error("JSON Parse Error:", parseErr);
                console.error("Problematic JSON section (around error):");

                // Try to show the problematic section
                const errorMatch = parseErr.message.match(/position (\d+)/);
                if (errorMatch) {
                    const pos = parseInt(errorMatch[1]);
                    const start = Math.max(0, pos - 200);
                    const end = Math.min(jsonStr.length, pos + 200);
                    console.error(jsonStr.substring(start, end));
                    console.error("Error at position:", pos);
                }

                throw new Error(`Invalid JSON from AI: ${parseErr.message}. Try simplifying your story description.`);
            }

            if (!data.nodes || !data.edges || data.nodes.length === 0) {
                console.error("Incomplete data structure:", {
                    hasNodes: !!data.nodes,
                    hasEdges: !!data.edges,
                    nodeCount: data.nodes?.length
                });
                throw new Error("AI returned an incomplete graph. Please try again.");
            }

            console.log("Successfully parsed:", {
                nodes: data.nodes?.length,
                edges: data.edges?.length
            });

            setProgress(100);

            setTimeout(() => {
                onGenerate(data.nodes, data.edges);
                onClose();
                resetForm();
            }, 500);

        } catch (err) {
            console.error("Generation Error:", err);
            setError(err.message || "Failed to generate. Check inputs and try again.");
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    };

    const handleAdvancedGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 800);

            const validObjectives = learningObjectives.filter(obj => obj.objective.trim());
            const industryName = industry === 'custom' ? customIndustry : INDUSTRIES.find(i => i.id === industry)?.label;
            const userMessage = `
CONTEXT:
Industry: ${industryName}
Topic: ${topic}
Location: ${location}
Date: ${date}

LEARNING OBJECTIVES:
${validObjectives.map((obj, idx) => `${idx + 1}. ${obj.objective}`).join('\n')}

GAME MECHANICS:
- Difficulty: ${difficulty}
- Number of Suspects: ${suspectCount}
- Diverse Identities: ${enableDiversity ? 'Yes' : 'No'}

Generate a complete mystery training case following all directives.`;

            const responseText = await callAI(
                'gemini',
                buildAdvancedModePrompt(),
                userMessage,
                settings.aiApiKey || 'SIMULATION_MODE'
            );

            clearInterval(progressInterval);
            setProgress(95);

            // Parse JSON with robust error handling
            console.log("Raw AI Response Length:", responseText.length);

            let jsonStr = responseText.trim();

            // Remove markdown code blocks
            jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Find the JSON object boundaries
            const jsonStart = jsonStr.indexOf('{');
            const jsonEnd = jsonStr.lastIndexOf('}') + 1;

            if (jsonStart === -1 || jsonEnd <= jsonStart) {
                console.error("No valid JSON object found in response");
                throw new Error("AI response doesn't contain valid JSON. Please try again.");
            }

            jsonStr = jsonStr.substring(jsonStart, jsonEnd);

            // Comprehensive JSON cleanup function
            const repairJSON = (str) => {
                let repaired = str;

                // 1. Remove trailing commas before closing brackets/braces
                repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

                // 2. Fix missing commas between array elements (common AI mistake)
                // This handles cases like: "text" "text" -> "text", "text"
                repaired = repaired.replace(/"\s+"/g, '", "');

                // 3. Fix missing commas between object properties
                repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');

                // 4. Remove any control characters that might break JSON
                repaired = repaired.replace(/[\x00-\x1F\x7F]/g, (char) => {
                    // Keep newlines, tabs, and carriage returns in strings
                    if (char === '\n') return '\\n';
                    if (char === '\r') return '\\r';
                    if (char === '\t') return '\\t';
                    return ''; // Remove other control characters
                });

                // 5. Fix unescaped quotes in strings (very common issue)
                // This is tricky - we need to escape quotes that are inside string values
                // but not the quotes that delimit strings

                return repaired;
            };


            console.log("Extracted JSON Length:", jsonStr.length);
            console.log("First 500 chars (before repair):", jsonStr.substring(0, 500));
            console.log("Last 500 chars (before repair):", jsonStr.substring(jsonStr.length - 500));

            // Check if response appears complete (has all required sections)
            const hasAllSections = jsonStr.includes('"suspects"') &&
                jsonStr.includes('"nodes"') &&
                jsonStr.includes('"edges"');

            if (!hasAllSections) {
                console.error("Incomplete AI response detected. Missing sections:", {
                    hasSuspects: jsonStr.includes('"suspects"'),
                    hasNodes: jsonStr.includes('"nodes"'),
                    hasEdges: jsonStr.includes('"edges"')
                });
                throw new Error("AI response is incomplete (missing suspects, nodes, or edges sections). The response may be too large. Please reduce the number of suspects, simplify learning objectives, or use a lower difficulty level.");
            }

            // Apply repairs only if response seems complete
            jsonStr = repairJSON(jsonStr);

            console.log("After repair - JSON Length:", jsonStr.length);

            let data;
            try {
                data = JSON.parse(jsonStr);
            } catch (parseErr) {
                console.error("JSON Parse Error:", parseErr);
                console.error("Problematic JSON section (around error):");

                // Try to show the problematic section
                const errorMatch = parseErr.message.match(/position (\d+)/);
                if (errorMatch) {
                    const pos = parseInt(errorMatch[1]);
                    const start = Math.max(0, pos - 200);
                    const end = Math.min(jsonStr.length, pos + 200);
                    console.error(jsonStr.substring(start, end));
                    console.error("Error at position:", pos);
                }

                throw new Error(`Invalid JSON from AI: ${parseErr.message}. The AI response may be too complex. Try simplifying your inputs or reducing the number of suspects.`);
            }

            if (!data.suspects || !data.nodes || !data.edges) {
                console.error("Incomplete data structure:", {
                    hasSuspects: !!data.suspects,
                    hasNodes: !!data.nodes,
                    hasEdges: !!data.edges
                });
                throw new Error("Incomplete response from AI. Missing suspects, nodes, or edges. Please try again.");
            }

            console.log("Successfully parsed:", {
                suspects: data.suspects?.length,
                nodes: data.nodes?.length,
                edges: data.edges?.length
            });

            setProgress(100);

            setTimeout(() => {
                onGenerate(data.nodes, data.edges, data);
                onClose();
                resetForm();
            }, 500);

        } catch (err) {
            console.error("Generation Error:", err);
            setError(err.message || "Failed to generate. Check inputs and try again.");
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    };

    const handleGenerate = () => {
        if (mode === 'quick') {
            return handleQuickGenerate();
        } else {
            return handleAdvancedGenerate();
        }
    };

    const resetForm = () => {
        setMode(null);
        setStep(1);
        setQuickStory('');
        setQuickObjectives('');
        setIndustry('');
        setCustomIndustry('');
        setTopic('');
        setLocation('');
        setDate('');
        setDifficulty('medium');
        setSuspectCount(4);
        setEnableDiversity(true);
        setLearningObjectives([{ id: 1, objective: '' }]);
        setError(null);
    };

    const canProceed = () => {
        if (mode === 'quick') {
            return quickStory.trim().length > 20 && quickObjectives.trim().length > 10;
        }

        switch (step) {
            case 1: return industry && (industry !== 'custom' || customIndustry.trim()) && topic.length > 10 && location && date;
            case 2: return difficulty && suspectCount >= 2;
            case 3: return learningObjectives.some(obj => obj.objective.trim().length > 5);
            case 4: return true;
            default: return false;
        }
    };

    const nextStep = () => {
        if (canProceed() && step < totalSteps) {
            setStep(step + 1);
            setError(null);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
            setError(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-2 border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.3)] flex flex-col relative"
                >
                    {/* Animated Top Glow */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_30px_rgba(99,102,241,0.8)] animate-pulse" />

                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-zinc-900/90 to-black/90">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl">
                                    <Brain className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Mystery Director</h2>
                                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                                        <Sparkles className="w-3 h-3 inline mr-1" />
                                        Next-Gen Story Generation
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { onClose(); resetForm(); }}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6 text-zinc-400" />
                            </button>
                        </div>

                        {/* Mode indicator or Progress Bar */}
                        {mode && !isGenerating && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                        {mode === 'quick' ? (
                                            <><Rocket className="w-3 h-3" /> Quick Mode</>
                                        ) : (
                                            <><Settings2 className="w-3 h-3" /> Advanced Mode - Step {step} of {totalSteps}</>
                                        )}
                                    </span>
                                    {mode === 'advanced' && (
                                        <span className="text-indigo-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
                                    )}
                                </div>
                                {mode === 'advanced' && (
                                    <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
                                            animate={{ width: `${(step / totalSteps) * 100}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        {!isGenerating ? (
                            <AnimatePresence mode="wait">
                                {/* Mode Selection */}
                                {!mode && (
                                    <motion.div
                                        key="mode-selection"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="space-y-8"
                                    >
                                        <div className="text-center space-y-3 mb-12">
                                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Choose Your Creation Mode</h3>
                                            <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                                                Select how you want to build your mystery. Quick Mode for instant creation, or Advanced Mode for industry-specific learning platforms.
                                            </p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                            {/* Quick Mode */}
                                            <motion.button
                                                onClick={() => setMode('quick')}
                                                className="group relative p-8 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent hover:border-indigo-500/50 transition-all overflow-hidden text-left"
                                                whileHover={{ scale: 1.01, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform" />

                                                <div className="relative z-10 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                                                            <Rocket className="w-8 h-8 text-white" />
                                                        </div>
                                                        <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full">
                                                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Fast</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-2xl font-black text-white mb-2">Quick Mode</h4>
                                                        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                                                            Describe your story and objectives in plain text. AI handles the rest.
                                                        </p>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                                <span>Natural language input</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                                <span>Instant generation</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.button>

                                            {/* Advanced Mode */}
                                            <motion.button
                                                onClick={() => setMode('advanced')}
                                                className="group relative p-8 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent hover:border-purple-500/50 transition-all overflow-hidden text-left"
                                                whileHover={{ scale: 1.01, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform" />

                                                <div className="relative z-10 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg">
                                                            <Settings2 className="w-8 h-8 text-white" />
                                                        </div>
                                                        <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full">
                                                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Pro</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-2xl font-black text-white mb-2">Advanced Mode</h4>
                                                        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                                                            Industry-specific training platform with evidence-based assessment and sequential unlocking.
                                                        </p>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                                <CheckCircle className="w-4 h-4 text-purple-400" />
                                                                <span>Industry context & objectives</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                                <CheckCircle className="w-4 h-4 text-purple-400" />
                                                                <span>Sequential suspect unlock</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-xs text-zinc-600 italic">
                                                💡 Both modes use the same powerful AI. Choose based on your preference!
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Quick Mode Content */}
                                {mode === 'quick' && (
                                    <motion.div
                                        key="quick-mode"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8 max-w-4xl mx-auto"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                                <Rocket className="w-7 h-7 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Quick Start Mode</h3>
                                                <p className="text-xs text-zinc-500 mt-0.5">Describe your vision, we'll build the mystery</p>
                                            </div>
                                        </div>

                                        {/* Story Input */}
                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Tell Us Your Story
                                            </Label>
                                            <textarea
                                                className="w-full h-40 bg-black/50 border-2 border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 resize-none"
                                                placeholder="Example: A cybersecurity breach at a tech startup. Someone leaked source code to competitors. Players must interview suspects, analyze logs, and identify the insider threat."
                                                value={quickStory}
                                                onChange={(e) => setQuickStory(e.target.value)}
                                            />
                                            <div className="text-xs text-zinc-600 text-right">{quickStory.length} characters</div>
                                        </div>

                                        {/* Objectives Input */}
                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                                <Target className="w-4 h-4" />
                                                Learning Objectives
                                            </Label>
                                            <textarea
                                                className="w-full h-32 bg-black/50 border-2 border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 resize-none"
                                                placeholder="Example: Teach players about social engineering tactics, secure coding practices, and incident response procedures."
                                                value={quickObjectives}
                                                onChange={(e) => setQuickObjectives(e.target.value)}
                                            />
                                        </div>

                                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex gap-3">
                                            <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0" />
                                            <div className="text-xs text-zinc-400 leading-relaxed">
                                                <strong className="text-indigo-400">Quick Tip:</strong> Be specific about your story and what you want players to learn. The AI will create suspects, evidence, and puzzles automatically.
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Advanced Mode Steps */}
                                {mode === 'advanced' && (
                                    <>
                                        {/* Step 1: Industry Context */}
                                        {step === 1 && (
                                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Building2 className="w-6 h-6 text-indigo-400" />
                                                    <div>
                                                        <h3 className="text-xl font-black text-white uppercase">Industry Context</h3>
                                                        <p className="text-xs text-zinc-500">Define the training scenario</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 block">Industry</Label>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            {INDUSTRIES.map(ind => (
                                                                <button
                                                                    key={ind.id}
                                                                    onClick={() => setIndustry(ind.id)}
                                                                    className={`p-3 rounded-xl border-2 transition-all ${industry === ind.id
                                                                        ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                                                        }`}
                                                                >
                                                                    <div className="text-2xl mb-1">{ind.icon}</div>
                                                                    <div className="text-xs font-bold text-white">{ind.label}</div>
                                                                </button>
                                                            ))}
                                                            {/* Custom Industry Option */}
                                                            <button
                                                                onClick={() => setIndustry('custom')}
                                                                className={`p-3 rounded-xl border-2 transition-all ${industry === 'custom'
                                                                    ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                                                                    }`}
                                                            >
                                                                <div className="text-2xl mb-1">✏️</div>
                                                                <div className="text-xs font-bold text-white">Other</div>
                                                            </button>
                                                        </div>

                                                        {/* Custom Industry Input */}
                                                        {industry === 'custom' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="mt-3"
                                                            >
                                                                <input
                                                                    type="text"
                                                                    className="w-full bg-black/50 border-2 border-indigo-500/50 rounded-xl p-3 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500"
                                                                    placeholder="Enter your industry (e.g., Hospitality, Legal Services, Agriculture)"
                                                                    value={customIndustry}
                                                                    onChange={(e) => setCustomIndustry(e.target.value)}
                                                                    autoFocus
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block flex items-center gap-2">
                                                            <FileText className="w-4 h-4" />
                                                            Topic (4-line summary)
                                                        </Label>
                                                        <textarea
                                                            className="w-full h-32 bg-black/50 border-2 border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 resize-none"
                                                            placeholder="Example: A data breach at a major financial institution exposed customer records. The investigation reveals insider involvement. Players must identify the culprit and understand security vulnerabilities."
                                                            value={topic}
                                                            onChange={(e) => setTopic(e.target.value)}
                                                            maxLength={400}
                                                        />
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block flex items-center gap-2">
                                                                <MapPin className="w-4 h-4" />
                                                                Location (City/Country)
                                                            </Label>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-black/50 border-2 border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50"
                                                                placeholder="New York, USA"
                                                                value={location}
                                                                onChange={(e) => setLocation(e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                Date
                                                            </Label>
                                                            <input
                                                                type="date"
                                                                className="w-full bg-black/50 border-2 border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                                                                value={date}
                                                                onChange={(e) => setDate(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Step 2: Game Mechanics */}
                                        {step === 2 && (
                                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Shield className="w-6 h-6 text-purple-400" />
                                                    <div>
                                                        <h3 className="text-xl font-black text-white uppercase">Game Mechanics</h3>
                                                        <p className="text-xs text-zinc-500">Configure difficulty and suspects</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 block">Difficulty Level</Label>
                                                        <div className="space-y-3">
                                                            {DIFFICULTY_LEVELS.map(d => (
                                                                <button
                                                                    key={d.id}
                                                                    onClick={() => setDifficulty(d.id)}
                                                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${difficulty === d.id
                                                                        ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-lg font-black text-white">{d.label}</span>
                                                                        <div className="text-xs text-zinc-500">
                                                                            {d.suspects} suspects • {d.questions}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 block">Number of Suspects</Label>
                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                onClick={() => setSuspectCount(Math.max(2, suspectCount - 1))}
                                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10"
                                                            >
                                                                <ChevronLeft className="w-5 h-5 text-white" />
                                                            </button>
                                                            <div className="flex-1 text-center">
                                                                <div className="text-4xl font-black text-white">{suspectCount}</div>
                                                                <div className="text-xs text-zinc-500 uppercase">Suspects</div>
                                                            </div>
                                                            <button
                                                                onClick={() => setSuspectCount(Math.min(10, suspectCount + 1))}
                                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10"
                                                            >
                                                                <ChevronRight className="w-5 h-5 text-white" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={enableDiversity}
                                                                onChange={(e) => setEnableDiversity(e.target.checked)}
                                                                className="w-5 h-5 rounded border-2 border-white/20 bg-black/50 checked:bg-indigo-500"
                                                            />
                                                            <div>
                                                                <div className="text-sm font-bold text-white">Enable Diverse Identities</div>
                                                                <div className="text-xs text-zinc-500">Vary age, gender, ethnicity to avoid cognitive bias</div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Step 3: Learning Objectives */}
                                        {step === 3 && (
                                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Target className="w-6 h-6 text-emerald-400" />
                                                    <div>
                                                        <h3 className="text-xl font-black text-white uppercase">Learning Objectives</h3>
                                                        <p className="text-xs text-zinc-500">Define what players will learn</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {learningObjectives.map((obj, idx) => (
                                                        <div key={obj.id} className="flex gap-3">
                                                            <div className="flex-1">
                                                                <Label className="text-xs font-bold text-zinc-400 mb-2 block">Objective {idx + 1}</Label>
                                                                <textarea
                                                                    className="w-full h-24 bg-black/50 border-2 border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 resize-none"
                                                                    placeholder="Example: Identify phishing email indicators including suspicious sender domains and urgent language"
                                                                    value={obj.objective}
                                                                    onChange={(e) => updateObjective(obj.id, e.target.value)}
                                                                />
                                                            </div>
                                                            {learningObjectives.length > 1 && (
                                                                <button
                                                                    onClick={() => removeObjective(obj.id)}
                                                                    className="p-2 h-10 mt-7 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-red-400"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}

                                                    <button
                                                        onClick={addObjective}
                                                        className="w-full p-3 border-2 border-dashed border-white/20 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 text-zinc-400 hover:text-emerald-400 transition-all text-sm font-bold"
                                                    >
                                                        + Add Learning Objective
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Step 4: Review */}
                                        {step === 4 && (
                                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <CheckCircle className="w-6 h-6 text-indigo-400" />
                                                    <div>
                                                        <h3 className="text-xl font-black text-white uppercase">Review & Generate</h3>
                                                        <p className="text-xs text-zinc-500">Confirm your configuration</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                        <div className="text-xs font-bold text-zinc-400 uppercase mb-2">Industry Context</div>
                                                        <div className="text-sm text-white"><strong>Industry:</strong> {INDUSTRIES.find(i => i.id === industry)?.label}</div>
                                                        <div className="text-sm text-white mt-1"><strong>Topic:</strong> {topic}</div>
                                                        <div className="text-sm text-white mt-1"><strong>Location:</strong> {location}</div>
                                                        <div className="text-sm text-white mt-1"><strong>Date:</strong> {date}</div>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                            <div className="text-xs font-bold text-zinc-400 uppercase mb-2">Game Mechanics</div>
                                                            <div className="text-sm text-white">Difficulty: {difficulty}</div>
                                                            <div className="text-sm text-white mt-1">Suspects: {suspectCount}</div>
                                                            <div className="text-sm text-white mt-1">Diversity: {enableDiversity ? 'Enabled' : 'Disabled'}</div>
                                                        </div>

                                                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                            <div className="text-xs font-bold text-zinc-400 uppercase mb-2">Learning Objectives</div>
                                                            <div className="text-sm text-white">{learningObjectives.filter(o => o.objective.trim()).length} objectives defined</div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex gap-3">
                                                        <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0" />
                                                        <div className="text-xs text-zinc-400 leading-relaxed">
                                                            <strong className="text-indigo-400">Ready to Generate:</strong> Your mystery will feature sequential suspect unlocking, evidence-based assessment with fill-in-the-blank questions, and comprehensive feedback. Generation takes 15-45 seconds.
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </>
                                )}
                            </AnimatePresence>
                        ) : (
                            <div className="py-16 flex flex-col items-center text-center space-y-8">
                                <div className="relative">
                                    <div className="w-32 h-32 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <Brain className="w-12 h-12 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-white">AI Architect at Work</h3>
                                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                                        {mode === 'quick' ? 'Building your mystery...' : 'Building sequential mystery with evidence-based assessment...'}
                                    </p>
                                </div>
                                <div className="w-full max-w-md space-y-2">
                                    <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <div className="text-xs text-zinc-500">{progress}% Complete</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!isGenerating && mode && (
                        <div className="p-6 border-t border-white/10 bg-zinc-900/50 flex items-center justify-between">
                            {mode === 'advanced' ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={prevStep}
                                        disabled={step === 1}
                                        className="gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </Button>

                                    {error && (
                                        <div className="flex items-center gap-2 text-red-400 text-xs">
                                            <AlertTriangle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    {step < 4 ? (
                                        <Button
                                            onClick={nextStep}
                                            disabled={!canProceed()}
                                            className="gap-2 bg-indigo-600 hover:bg-indigo-500"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={!canProceed()}
                                            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Generate Mystery
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setMode(null)}
                                        className="gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Back to Mode Selection
                                    </Button>

                                    {error && (
                                        <div className="flex items-center gap-2 text-red-400 text-xs">
                                            <AlertTriangle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={!canProceed()}
                                        className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Generate Mystery
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AICaseGeneratorModalAdvanced;
