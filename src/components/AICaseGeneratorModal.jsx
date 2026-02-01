import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Brain, Sparkles, Wand2, Loader2, AlertCircle, CheckCircle, Zap,
    BookOpen, Globe, Target, Users, Puzzle, Eye, ChevronRight, ChevronLeft,
    Clock, Trophy, Lightbulb, Shield, Terminal, MessageSquare, Search,
    Lock, Grid3x3, Image as ImageIcon, Box, Fingerprint, FileText
} from 'lucide-react';
import { Button, Input, Label } from './ui/shared';
import { callAI } from '../lib/ai';
import { useConfig } from '../lib/config';

const GENRES = [
    { id: 'noir', label: 'Film Noir', icon: '🎬', desc: '1940s detective, dark atmosphere' },
    { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌃', desc: 'Futuristic, neon-lit, tech-heavy' },
    { id: 'victorian', label: 'Victorian', icon: '🎩', desc: 'Classic Sherlock Holmes era' },
    { id: 'scifi', label: 'Sci-Fi', icon: '🚀', desc: 'Space stations, alien worlds' },
    { id: 'modern', label: 'Modern', icon: '🏙️', desc: 'Contemporary urban setting' },
    { id: 'fantasy', label: 'Fantasy', icon: '🧙', desc: 'Magic, medieval kingdoms' },
    { id: 'horror', label: 'Horror', icon: '👻', desc: 'Supernatural, psychological' },
    { id: 'historical', label: 'Historical', icon: '📜', desc: 'Real historical events' }
];

const DIFFICULTY_LEVELS = [
    { id: 'beginner', label: 'Beginner', icon: '🌱', desc: 'Simple linear story, 2-3 suspects, basic puzzles', duration: '10-15 min' },
    { id: 'intermediate', label: 'Intermediate', icon: '🎯', desc: 'Branching paths, 4-5 suspects, moderate puzzles', duration: '20-30 min' },
    { id: 'advanced', label: 'Advanced', icon: '🔥', desc: 'Complex web, 6-8 suspects, challenging puzzles', duration: '40-60 min' },
    { id: 'expert', label: 'Expert', icon: '💎', desc: 'Non-linear, 8+ suspects, expert-level challenges', duration: '60+ min' }
];

const PUZZLE_TYPES = [
    { id: 'terminal', label: 'Terminal Hacking', icon: Terminal, desc: 'Code breaking, password cracking' },
    { id: 'interrogation', label: 'AI Interrogation', icon: MessageSquare, desc: 'Dynamic suspect questioning' },
    { id: 'evidence', label: 'Evidence Analysis', icon: Search, desc: 'Find and connect clues' },
    { id: 'decryption', label: 'Decryption', icon: Lock, desc: 'Decode encrypted messages' },
    { id: 'keypad', label: 'Keypad Locks', icon: Grid3x3, desc: 'Numeric code puzzles' },
    { id: 'threed', label: '3D Investigation', icon: Box, desc: 'Explore 3D crime scenes' },
    { id: 'forensics', label: 'Forensics', icon: Fingerprint, desc: 'Analyze physical evidence' },
    { id: 'logic', label: 'Logic Puzzles', icon: Lightbulb, desc: 'Deduction and reasoning' }
];

const LEARNING_CATEGORIES = [
    { id: 'cybersecurity', label: 'Cybersecurity', examples: ['Encryption', 'Social Engineering', 'Network Security'] },
    { id: 'critical-thinking', label: 'Critical Thinking', examples: ['Deduction', 'Pattern Recognition', 'Problem Solving'] },
    { id: 'history', label: 'History', examples: ['Historical Events', 'Cultural Context', 'Timeline Analysis'] },
    { id: 'science', label: 'Science', examples: ['Forensics', 'Chemistry', 'Physics'] },
    { id: 'language', label: 'Language Arts', examples: ['Reading Comprehension', 'Vocabulary', 'Communication'] },
    { id: 'ethics', label: 'Ethics & Law', examples: ['Legal Procedures', 'Moral Dilemmas', 'Justice'] },
    { id: 'custom', label: 'Custom', examples: ['Your own objectives'] }
];

const AICaseGeneratorModal = ({ isOpen, onClose, onGenerate }) => {
    const { settings } = useConfig();
    const [step, setStep] = useState(1);
    const totalSteps = 6;

    // Step 1: Learning Objectives
    const [learningCategory, setLearningCategory] = useState('');
    const [objectives, setObjectives] = useState('');

    // Step 2: Genre & Setting
    const [genre, setGenre] = useState('');
    const [customSetting, setCustomSetting] = useState('');

    // Step 3: Difficulty & Complexity
    const [difficulty, setDifficulty] = useState('');

    // Step 4: Suspects Configuration
    const [suspectCount, setSuspectCount] = useState(3);
    const [suspectComplexity, setSuspectComplexity] = useState('balanced');

    // Step 5: Puzzle Types
    const [selectedPuzzles, setSelectedPuzzles] = useState(['terminal', 'interrogation', 'evidence']);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [generationProgress, setGenerationProgress] = useState(0);

    const togglePuzzle = (puzzleId) => {
        setSelectedPuzzles(prev =>
            prev.includes(puzzleId)
                ? prev.filter(p => p !== puzzleId)
                : [...prev, puzzleId]
        );
    };

    const buildSystemPrompt = () => {
        const difficultyConfig = DIFFICULTY_LEVELS.find(d => d.id === difficulty);
        const genreInfo = GENRES.find(g => g.id === genre);

        return `You are the "Mystery Architect AI Director". Your task is to generate a complete, playable mystery game node graph that accomplishes specific LEARNING OBJECTIVES while providing an engaging narrative experience.

RETURN ONLY A VALID JSON OBJECT. NO MARKDOWN. NO EXPLANATION. NO COMMENTARY.

The JSON structure MUST follow this exact format:
{
  "nodes": [
    {
      "id": "unique-string-id",
      "type": "story | suspect | evidence | logic | terminal | interrogation | message | action | identify | question | decryption | keypad | threed",
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
        "correctAnswer": "answer for terminal/keypad nodes",
        "systemPrompt": "AI personality for interrogation nodes",
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
      "sourceHandle": "action-id or 'true'/'false' for logic nodes",
      "label": "optional edge label"
    }
  ]
}

CONFIGURATION PARAMETERS:
- Genre: ${genreInfo?.label || 'Modern'} - ${genreInfo?.desc || ''}
- Setting: ${customSetting || 'Use genre-appropriate setting'}
- Difficulty: ${difficultyConfig?.label || 'Intermediate'} - ${difficultyConfig?.desc || ''}
- Target Duration: ${difficultyConfig?.duration || '20-30 min'}
- Suspect Count: ${suspectCount}
- Suspect Complexity: ${suspectComplexity}
- Required Puzzle Types: ${selectedPuzzles.join(', ')}

CRITICAL GUIDELINES:

1. LEARNING OBJECTIVES INTEGRATION:
   - Every piece of evidence, suspect dialogue, and puzzle MUST reinforce the learning objectives
   - Create at least 3 different touchpoints where objectives are taught/tested
   - Use suspects' backgrounds and motives to naturally introduce concepts
   - Terminal/puzzle challenges should require applying learned concepts

2. STORY STRUCTURE:
   - Start with a compelling Story node that sets the scene and introduces the mystery
   - Create a clear inciting incident that hooks the player
   - Build tension through evidence discovery and suspect interactions
   - Include red herrings and plot twists appropriate to difficulty level
   - End with an Identify node for the final accusation

3. SUSPECT DESIGN (Create exactly ${suspectCount} suspects):
   - Each suspect needs: name, role, alibi, motive, personality
   - Make one suspect the actual culprit with subtle clues pointing to them
   - Create believable alibis for innocent suspects
   - Ensure suspects' backgrounds tie into learning objectives
   - Add personality traits that make interrogations interesting

4. EVIDENCE & CLUES:
   - Create ${Math.max(3, suspectCount)} Evidence nodes with unique variableIds
   - Evidence should progressively reveal the truth
   - Include both physical evidence and testimonial evidence
   - Make evidence discovery feel rewarding and logical

5. PUZZLE INTEGRATION:
   ${selectedPuzzles.includes('terminal') ? '- Include Terminal nodes with code/password challenges tied to learning objectives' : ''}
   ${selectedPuzzles.includes('interrogation') ? '- Add Interrogation nodes with AI-powered suspect questioning (include systemPrompt)' : ''}
   ${selectedPuzzles.includes('decryption') ? '- Create Decryption puzzles with encrypted messages to decode' : ''}
   ${selectedPuzzles.includes('keypad') ? '- Add Keypad locks with numeric codes hidden in evidence' : ''}
   ${selectedPuzzles.includes('threed') ? '- Include 3D Holodeck nodes for immersive crime scene exploration' : ''}

6. LOGIC & BRANCHING:
   - Use Logic nodes to check if evidence has been collected before allowing progress
   - Create meaningful choices using Action nodes
   - For ${difficulty} difficulty, create ${difficulty === 'beginner' ? 'linear' : difficulty === 'intermediate' ? 'some branching' : 'complex branching'} paths
   - Ensure all paths eventually lead to the climax

7. LAYOUT & POSITIONING:
   - Space nodes at least 350px apart on X-axis and 250px on Y-axis
   - Arrange in a logical left-to-right flow
   - Group related nodes vertically
   - Start position: (100, 100)

8. TECHNICAL REQUIREMENTS:
   - All IDs must be unique strings
   - Logic nodes use "true" and "false" as sourceHandle IDs
   - Action nodes use action.id as sourceHandle
   - Every node must be reachable from the start
   - The Identify node must be the final node

9. EDUCATIONAL QUALITY:
   - Make learning feel natural, not forced
   - Use storytelling to make concepts memorable
   - Provide context for why concepts matter
   - Include "aha!" moments when players apply knowledge

Generate a complete, playable mystery game that is both educational and thrilling.`;
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGenerationProgress(0);

        const apiKey = settings.aiApiKey;
        const provider = 'gemini';

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setGenerationProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            const userMessage = `
LEARNING OBJECTIVES:
${objectives}

GENRE & SETTING:
Genre: ${GENRES.find(g => g.id === genre)?.label || 'Modern'}
Setting: ${customSetting || 'Use genre-appropriate setting'}

CONFIGURATION:
- Difficulty: ${difficulty}
- Suspects: ${suspectCount}
- Suspect Complexity: ${suspectComplexity}
- Puzzle Types: ${selectedPuzzles.join(', ')}

Generate a complete mystery game that masterfully integrates these learning objectives into an engaging narrative.`;

            const responseText = await callAI(
                provider,
                buildSystemPrompt(),
                userMessage,
                apiKey || 'SIMULATION_MODE'
            );

            clearInterval(progressInterval);
            setGenerationProgress(95);

            // Parse response
            let jsonStr = responseText.trim();

            // Remove markdown code blocks if present
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            // Find JSON object
            const jsonStart = jsonStr.indexOf('{');
            const jsonEnd = jsonStr.lastIndexOf('}') + 1;
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd);
            }

            const data = JSON.parse(jsonStr);

            if (!data.nodes || !data.edges || data.nodes.length === 0) {
                throw new Error("AI returned an incomplete graph. Please try again.");
            }

            // Validate that we have the right number of suspects
            const suspectNodes = data.nodes.filter(n => n.type === 'suspect');
            if (suspectNodes.length < suspectCount - 1) {
                console.warn(`Expected ${suspectCount} suspects, got ${suspectNodes.length}`);
            }

            setGenerationProgress(100);

            setTimeout(() => {
                onGenerate(data.nodes, data.edges);
                onClose();
                resetForm();
            }, 500);

        } catch (err) {
            console.error("AI Generation Error:", err);
            setError(err.message || "Failed to generate case. Please check your inputs and try again.");
        } finally {
            setIsGenerating(false);
            setGenerationProgress(0);
        }
    };

    const resetForm = () => {
        setStep(1);
        setLearningCategory('');
        setObjectives('');
        setGenre('');
        setCustomSetting('');
        setDifficulty('');
        setSuspectCount(3);
        setSuspectComplexity('balanced');
        setSelectedPuzzles(['terminal', 'interrogation', 'evidence']);
        setError(null);
    };

    const canProceed = () => {
        switch (step) {
            case 1: return objectives.trim().length > 10;
            case 2: return genre !== '';
            case 3: return difficulty !== '';
            case 4: return suspectCount >= 2;
            case 5: return selectedPuzzles.length > 0;
            case 6: return true;
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
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-2 border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.2)] flex flex-col relative"
                >
                    {/* Animated Glow */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse"></div>

                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-zinc-900/90 to-black/90 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                                    <Brain className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">AI Case Director</h2>
                                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                                        Procedural Mystery Generation System
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { onClose(); resetForm(); }}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors group"
                            >
                                <X className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500 font-bold uppercase tracking-wider">Step {step} of {totalSteps}</span>
                                <span className="text-indigo-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step / totalSteps) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        {!isGenerating ? (
                            <AnimatePresence mode="wait">
                                {/* Step 1: Learning Objectives */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                                <BookOpen className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Learning Objectives</h3>
                                                <p className="text-xs text-zinc-500 mt-0.5">What should players learn from this mystery?</p>
                                            </div>
                                        </div>

                                        {/* Category Selection */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Select Category (Optional)</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {LEARNING_CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => setLearningCategory(cat.id)}
                                                        className={`p-3 rounded-xl border-2 transition-all text-left ${learningCategory === cat.id
                                                                ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className="text-sm font-bold text-white mb-1">{cat.label}</div>
                                                        <div className="text-[10px] text-zinc-500">{cat.examples[0]}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Objectives Input */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                                <Target className="w-4 h-4" />
                                                Define Learning Objectives
                                            </Label>
                                            <textarea
                                                className="w-full h-48 bg-black/50 border-2 border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-mono"
                                                placeholder="Example: 'Teach players to identify phishing emails by recognizing: 1) Suspicious sender addresses, 2) Urgent language tactics, 3) Unexpected attachments, 4) Mismatched URLs'"
                                                value={objectives}
                                                onChange={(e) => setObjectives(e.target.value)}
                                            />
                                            <p className="text-xs text-zinc-600 italic">
                                                💡 Tip: Be specific! The AI will weave these into evidence, suspect dialogues, and puzzles.
                                            </p>
                                        </div>

                                        {/* Example Templates */}
                                        <div className="grid md:grid-cols-2 gap-3">
                                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-2">
                                                <div className="text-xs font-black text-indigo-400 uppercase tracking-wider">Cybersecurity Example</div>
                                                <button
                                                    onClick={() => setObjectives("Identify common social engineering red flags: Unusual Urgency, Mismatched Domains, Unsolicited Attachments, and Authority Impersonation.")}
                                                    className="block text-left text-xs text-zinc-400 hover:text-indigo-300 transition-colors italic leading-relaxed w-full"
                                                >
                                                    "Identify social engineering red flags: Urgency, Mismatched Domains, Unsolicited Attachments..."
                                                </button>
                                            </div>
                                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                                                <div className="text-xs font-black text-emerald-400 uppercase tracking-wider">Critical Thinking Example</div>
                                                <button
                                                    onClick={() => setObjectives("Develop deductive reasoning skills: Analyze contradictions in testimonies, identify logical fallacies, and construct evidence-based conclusions.")}
                                                    className="block text-left text-xs text-zinc-400 hover:text-emerald-300 transition-colors italic leading-relaxed w-full"
                                                >
                                                    "Develop deductive reasoning: Analyze contradictions, identify fallacies..."
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 2: Genre & Setting */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                                <Globe className="w-6 h-6 text-purple-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Genre & Setting</h3>
                                                <p className="text-xs text-zinc-500 mt-0.5">Choose the atmosphere and world for your mystery</p>
                                            </div>
                                        </div>

                                        {/* Genre Selection */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Select Genre</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {GENRES.map(g => (
                                                    <button
                                                        key={g.id}
                                                        onClick={() => setGenre(g.id)}
                                                        className={`p-4 rounded-xl border-2 transition-all ${genre === g.id
                                                                ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className="text-2xl mb-2">{g.icon}</div>
                                                        <div className="text-sm font-bold text-white mb-1">{g.label}</div>
                                                        <div className="text-[10px] text-zinc-500">{g.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Custom Setting */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                Custom Setting (Optional)
                                            </Label>
                                            <textarea
                                                className="w-full h-32 bg-black/50 border-2 border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                                                placeholder="Example: 'A luxury space cruise liner orbiting Saturn, where the ship's AI has been compromised...'"
                                                value={customSetting}
                                                onChange={(e) => setCustomSetting(e.target.value)}
                                            />
                                            <p className="text-xs text-zinc-600 italic">
                                                💡 Leave blank to use a genre-appropriate setting, or describe your unique world
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 3: Difficulty & Complexity */}
                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-amber-500/10 rounded-xl">
                                                <Trophy className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Difficulty & Complexity</h3>
                                                <p className="text-xs text-zinc-500 mt-0.5">Set the challenge level and expected playtime</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {DIFFICULTY_LEVELS.map(d => (
                                                <button
                                                    key={d.id}
                                                    onClick={() => setDifficulty(d.id)}
                                                    className={`w-full p-5 rounded-xl border-2 transition-all text-left ${difficulty === d.id
                                                            ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{d.icon}</span>
                                                            <span className="text-lg font-black text-white">{d.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                            <Clock className="w-4 h-4" />
                                                            {d.duration}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-zinc-400">{d.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 4: Suspects Configuration */}
                                {step === 4 && (
                                    <motion.div
                                        key="step4"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-rose-500/10 rounded-xl">
                                                <Users className="w-6 h-6 text-rose-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Suspect Configuration</h3>
                                                <p className="text-xs text-zinc-500 mt-0.5">Design your cast of characters</p>
                                            </div>
                                        </div>

                                        {/* Suspect Count */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Number of Suspects</Label>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => setSuspectCount(Math.max(2, suspectCount - 1))}
                                                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                                >
                                                    <ChevronLeft className="w-5 h-5 text-white" />
                                                </button>
                                                <div className="flex-1 text-center">
                                                    <div className="text-4xl font-black text-white mb-1">{suspectCount}</div>
                                                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Suspects</div>
                                                </div>
                                                <button
                                                    onClick={() => setSuspectCount(Math.min(10, suspectCount + 1))}
                                                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                                >
                                                    <ChevronRight className="w-5 h-5 text-white" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-zinc-600 italic text-center">
                                                Recommended: 3-5 for balanced gameplay
                                            </p>
                                        </div>

                                        {/* Suspect Complexity */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Suspect Complexity</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: 'simple', label: 'Simple', desc: 'Clear motives, straightforward alibis' },
                                                    { id: 'balanced', label: 'Balanced', desc: 'Mix of obvious and subtle clues' },
                                                    { id: 'complex', label: 'Complex', desc: 'Layered backstories, intricate relationships' }
                                                ].map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => setSuspectComplexity(c.id)}
                                                        className={`p-4 rounded-xl border-2 transition-all ${suspectComplexity === c.id
                                                                ? 'border-rose-500 bg-rose-500/10'
                                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className="text-sm font-bold text-white mb-1">{c.label}</div>
                                                        <div className="text-[10px] text-zinc-500">{c.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 5: Puzzle Types */}
                                {step === 5 && (
                                    <motion.div
                                        key="step5"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                                <Puzzle className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Puzzle & Challenge Types</h3>
                                                <p className="text-xs text-zinc-500 mt-0.5">Select interactive elements to include</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-3">
                                            {PUZZLE_TYPES.map(puzzle => {
                                                const Icon = puzzle.icon;
                                                const isSelected = selectedPuzzles.includes(puzzle.id);
                                                return (
                                                    <button
                                                        key={puzzle.id}
                                                        onClick={() => togglePuzzle(puzzle.id)}
                                                        className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                                                ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                                                                <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-sm font-bold text-white">{puzzle.label}</span>
                                                                    {isSelected && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                                                                </div>
                                                                <p className="text-xs text-zinc-500">{puzzle.desc}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <p className="text-xs text-zinc-600 italic text-center">
                                            💡 Select at least one puzzle type. More variety = more engaging gameplay!
                                        </p>
                                    </motion.div>
                                )}

                                {/* Step 6: Review & Generate */}
                                {step === 6 && (
                                    <motion.div
                                        key="step6"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                                <Eye className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Review & Generate</h3>
                                                <p className="text-xs text-zinc-500 mt-0.5">Confirm your configuration before generation</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Learning Objectives */}
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <BookOpen className="w-4 h-4 text-indigo-400" />
                                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Learning Objectives</span>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed">{objectives}</p>
                                            </div>

                                            {/* Configuration Grid */}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Globe className="w-4 h-4 text-purple-400" />
                                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Genre</span>
                                                    </div>
                                                    <p className="text-sm text-white font-bold">{GENRES.find(g => g.id === genre)?.label}</p>
                                                    {customSetting && <p className="text-xs text-zinc-500 mt-1">{customSetting}</p>}
                                                </div>

                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Trophy className="w-4 h-4 text-amber-400" />
                                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Difficulty</span>
                                                    </div>
                                                    <p className="text-sm text-white font-bold">{DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.label}</p>
                                                    <p className="text-xs text-zinc-500 mt-1">{DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.duration}</p>
                                                </div>

                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Users className="w-4 h-4 text-rose-400" />
                                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Suspects</span>
                                                    </div>
                                                    <p className="text-sm text-white font-bold">{suspectCount} Suspects</p>
                                                    <p className="text-xs text-zinc-500 mt-1 capitalize">{suspectComplexity} complexity</p>
                                                </div>

                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Puzzle className="w-4 h-4 text-emerald-400" />
                                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Puzzles</span>
                                                    </div>
                                                    <p className="text-sm text-white font-bold">{selectedPuzzles.length} Types</p>
                                                    <p className="text-xs text-zinc-500 mt-1">
                                                        {selectedPuzzles.map(p => PUZZLE_TYPES.find(pt => pt.id === p)?.label).join(', ')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Warning/Info */}
                                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex gap-3">
                                                <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                                <div className="text-xs text-zinc-400 leading-relaxed">
                                                    <strong className="text-indigo-400">AI Director Ready:</strong> Your mystery will be procedurally generated with all learning objectives seamlessly integrated into the narrative, evidence, and challenges. Generation typically takes 10-30 seconds.
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        ) : (
                            /* Generation Progress */
                            <div className="py-16 flex flex-col items-center text-center space-y-8">
                                <div className="relative">
                                    <div className="w-32 h-32 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <Brain className="w-12 h-12 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-white">AI Director at Work</h3>
                                    <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                                        Weaving learning objectives into an engaging narrative...
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full max-w-md space-y-2">
                                    <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${generationProgress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <div className="text-xs text-zinc-500 text-center">{generationProgress}% Complete</div>
                                </div>

                                {/* Generation Steps */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
                                    {[
                                        { label: 'Story Arc', icon: FileText },
                                        { label: 'Suspects', icon: Users },
                                        { label: 'Evidence', icon: Search },
                                        { label: 'Puzzles', icon: Puzzle }
                                    ].map((item, idx) => {
                                        const Icon = item.icon;
                                        const isActive = generationProgress > (idx * 25);
                                        return (
                                            <div
                                                key={item.label}
                                                className={`p-3 rounded-xl border transition-all ${isActive
                                                        ? 'border-indigo-500/50 bg-indigo-500/10'
                                                        : 'border-white/10 bg-white/5'
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 mx-auto mb-2 ${isActive ? 'text-indigo-400' : 'text-zinc-600'}`} />
                                                <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                                                    {item.label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && !isGenerating && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 items-start text-rose-400"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold text-sm mb-1">Generation Failed</div>
                                    <p className="text-xs leading-relaxed">{error}</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Navigation */}
                    {!isGenerating && (
                        <div className="p-6 bg-zinc-900/30 border-t border-white/10 flex items-center justify-between gap-4">
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={step === 1}
                                className="flex items-center gap-2 border border-zinc-800 hover:bg-zinc-900 disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </Button>

                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Shield className="w-3.5 h-3.5" />
                                <span className="font-mono uppercase tracking-wider">AI-Powered Generation</span>
                            </div>

                            {step < totalSteps ? (
                                <Button
                                    onClick={nextStep}
                                    disabled={!canProceed()}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed px-8"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!canProceed()}
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-[0_0_30px_rgba(99,102,241,0.4)] disabled:opacity-30 disabled:cursor-not-allowed px-8 font-black uppercase tracking-wider"
                                >
                                    <Zap className="w-5 h-5" />
                                    Generate Mystery
                                </Button>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AICaseGeneratorModal;
