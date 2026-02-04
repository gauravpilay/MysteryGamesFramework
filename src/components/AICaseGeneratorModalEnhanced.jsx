import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Brain, Sparkles, Wand2, Loader2, AlertCircle, CheckCircle, Zap,
    BookOpen, Globe, Target, Users, Puzzle, Eye, ChevronRight, ChevronLeft,
    Clock, Trophy, Lightbulb, Shield, Terminal, MessageSquare, Search,
    Lock, Grid3x3, Image as ImageIcon, Box, Fingerprint, FileText, Rocket,
    Stars, Flame, Send, Play, Settings2, Layers
} from 'lucide-react';
import { Button, Input, Label } from './ui/shared';
import { callAI } from '../lib/ai';
import { useConfig } from '../lib/config';
import { generateEvidenceImagesForNodes } from '../lib/evidenceImageGenerator';

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

const AICaseGeneratorModal = ({ isOpen, onClose, onGenerate, projectId }) => {
    const { settings } = useConfig();

    // Mode selection: 'quick' or 'advanced'
    const [mode, setMode] = useState(null);
    const [step, setStep] = useState(1);
    const totalSteps = 6;

    // Quick Mode State
    const [quickStory, setQuickStory] = useState('');
    const [quickObjectives, setQuickObjectives] = useState('');

    // Advanced Mode State (existing)
    const [learningCategory, setLearningCategory] = useState('');
    const [objectives, setObjectives] = useState('');
    const [genre, setGenre] = useState('');
    const [customSetting, setCustomSetting] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [suspectCount, setSuspectCount] = useState(3);
    const [suspectComplexity, setSuspectComplexity] = useState('balanced');
    const [selectedPuzzles, setSelectedPuzzles] = useState(['terminal', 'interrogation', 'evidence']);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStage, setGenerationStage] = useState('');

    const togglePuzzle = (puzzleId) => {
        setSelectedPuzzles(prev =>
            prev.includes(puzzleId)
                ? prev.filter(p => p !== puzzleId)
                : [...prev, puzzleId]
        );
    };

    const buildQuickModePrompt = () => {
        return `You are the "Mystery Architect AI Director". Generate a complete, playable mystery game from the user's story description and learning objectives.

RETURN ONLY A VALID JSON OBJECT. NO MARKDOWN. NO EXPLANATION.

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

CRITICAL GUIDELINES:

1. STORY INTEGRATION:
   - Use the user's story as the foundation
   - Expand and enhance it with rich details
   - Create compelling characters and plot twists
   - Maintain the core narrative while adding depth

2. LEARNING OBJECTIVES:
   - Seamlessly weave learning objectives into the story
   - Create at least 3 touchpoints where concepts are taught/tested
   - Make learning feel natural, not forced
   - Use puzzles and evidence to reinforce concepts

3. GAME STRUCTURE:
   - Start with a Story node that sets the scene
   - Create 3-5 Suspect nodes with unique personalities
   - Include 4-6 Evidence nodes with variableIds
   - Add 2-3 puzzle nodes (Terminal, Interrogation, or Keypad)
   - Use Logic nodes to check evidence collection
   - End with an Identify node for final accusation

4. LAYOUT:
   - Space nodes 350px apart on X-axis, 250px on Y-axis
   - Arrange left-to-right flow
   - Start at position (100, 100)

5. QUALITY:
   - Make it engaging and playable
   - Ensure all nodes are connected
   - Create one guilty suspect with subtle clues
   - Include red herrings and plot twists

Generate a complete mystery game that brings the user's vision to life.`;
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

    const handleQuickGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGenerationProgress(0);

        const apiKey = settings.aiApiKey;
        const provider = 'gemini';

        try {
            const stages = [
                'Analyzing your story...',
                'Creating characters...',
                'Designing puzzles...',
                'Weaving learning objectives...',
                'Building narrative flow...',
                'Finalizing mystery...'
            ];

            let currentStage = 0;
            const progressInterval = setInterval(() => {
                setGenerationProgress(prev => {
                    const newProgress = Math.min(prev + 8, 90);
                    if (newProgress > currentStage * 15 && currentStage < stages.length) {
                        setGenerationStage(stages[currentStage]);
                        currentStage++;
                    }
                    return newProgress;
                });
            }, 600);

            const userMessage = `
STORY DESCRIPTION:
${quickStory}

LEARNING OBJECTIVES:
${quickObjectives}

Transform this into a complete, playable mystery game with engaging characters, challenging puzzles, and seamless integration of the learning objectives.`;

            const responseText = await callAI(
                provider,
                buildQuickModePrompt(),
                userMessage,
                apiKey || 'SIMULATION_MODE'
            );

            clearInterval(progressInterval);
            setGenerationProgress(95);
            setGenerationStage('Polishing final details...');

            // Parse response
            let jsonStr = responseText.trim();
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const jsonStart = jsonStr.indexOf('{');
            const jsonEnd = jsonStr.lastIndexOf('}') + 1;
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd);
            }

            const data = JSON.parse(jsonStr);

            if (!data.nodes || !data.edges || data.nodes.length === 0) {
                throw new Error("AI returned an incomplete graph. Please try again.");
            }

            // Generate images for evidence nodes
            setGenerationProgress(95);
            setGenerationStage('Generating evidence images...');

            const evidenceNodes = data.nodes.filter(n => n.type === 'evidence');
            if (evidenceNodes.length > 0 && projectId) {
                const imageUrls = await generateEvidenceImagesForNodes(evidenceNodes, projectId, apiKey);

                // Attach image URLs to evidence nodes
                data.nodes = data.nodes.map(node => {
                    if (node.type === 'evidence' && imageUrls.has(node.id)) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                imageUrl: imageUrls.get(node.id)
                            }
                        };
                    }
                    return node;
                });
            }

            setGenerationProgress(100);
            setGenerationStage('Complete!');

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
            setGenerationStage('');
        }
    };

    const handleGenerate = async () => {
        if (mode === 'quick') {
            return handleQuickGenerate();
        }

        setIsGenerating(true);
        setError(null);
        setGenerationProgress(0);

        const apiKey = settings.aiApiKey;
        const provider = 'gemini';

        try {
            const stages = [
                'Initializing AI Director...',
                'Crafting narrative structure...',
                'Designing suspects...',
                'Creating evidence trail...',
                'Integrating puzzles...',
                'Finalizing mystery...'
            ];

            let currentStage = 0;
            const progressInterval = setInterval(() => {
                setGenerationProgress(prev => {
                    const newProgress = Math.min(prev + 8, 90);
                    if (newProgress > currentStage * 15 && currentStage < stages.length) {
                        setGenerationStage(stages[currentStage]);
                        currentStage++;
                    }
                    return newProgress;
                });
            }, 600);

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
            setGenerationStage('Polishing final details...');

            // Parse response
            let jsonStr = responseText.trim();
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const jsonStart = jsonStr.indexOf('{');
            const jsonEnd = jsonStr.lastIndexOf('}') + 1;
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd);
            }

            const data = JSON.parse(jsonStr);

            if (!data.nodes || !data.edges || data.nodes.length === 0) {
                throw new Error("AI returned an incomplete graph. Please try again.");
            }

            const suspectNodes = data.nodes.filter(n => n.type === 'suspect');
            if (suspectNodes.length < suspectCount - 1) {
                console.warn(`Expected ${suspectCount} suspects, got ${suspectNodes.length}`);
            }

            // Generate images for evidence nodes
            setGenerationProgress(95);
            setGenerationStage('Generating evidence images...');

            const evidenceNodes = data.nodes.filter(n => n.type === 'evidence');
            if (evidenceNodes.length > 0 && projectId) {
                const imageUrls = await generateEvidenceImagesForNodes(evidenceNodes, projectId, apiKey);

                // Attach image URLs to evidence nodes
                data.nodes = data.nodes.map(node => {
                    if (node.type === 'evidence' && imageUrls.has(node.id)) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                imageUrl: imageUrls.get(node.id)
                            }
                        };
                    }
                    return node;
                });
            }

            setGenerationProgress(100);
            setGenerationStage('Complete!');

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
            setGenerationStage('');
        }
    };

    const resetForm = () => {
        setMode(null);
        setStep(1);
        setQuickStory('');
        setQuickObjectives('');
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
        if (mode === 'quick') {
            return quickStory.trim().length > 20 && quickObjectives.trim().length > 10;
        }

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
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-5xl max-h-[98vh] md:max-h-[95vh] bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border md:border-2 border-indigo-500/30 rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.3)] flex flex-col relative"
                >
                    {/* Animated Top Glow */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_30px_rgba(99,102,241,0.8)] animate-pulse" />

                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-zinc-900/90 to-black/90 backdrop-blur-xl relative overflow-hidden">
                        {/* Animated particles */}
                        <div className="absolute inset-0 opacity-20">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-indigo-400 rounded-full"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                    }}
                                    animate={{
                                        y: [0, -20, 0],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </div>

                        <div className="flex items-center justify-between mb-3 md:mb-4 relative z-10">
                            <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                                <motion.div
                                    className="p-2 md:p-3 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl md:rounded-2xl shadow-lg relative flex-shrink-0"
                                    animate={{
                                        boxShadow: [
                                            '0 0 10px rgba(99,102,241,0.3)',
                                            '0 0 25px rgba(168,85,247,0.6)',
                                            '0 0 10px rgba(99,102,241,0.3)',
                                        ],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Brain className="w-5 h-5 md:w-8 md:h-8 text-white" />
                                </motion.div>
                                <div className="min-w-0">
                                    <h2 className="text-lg md:text-3xl font-black text-white uppercase tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-200">
                                        Mystery Director
                                    </h2>
                                    <p className="text-[8px] md:text-xs font-mono text-indigo-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5 md:gap-2 truncate">
                                        <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                        Next-Gen Story Generation
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { onClose(); resetForm(); }}
                                className="p-1.5 md:p-2 hover:bg-white/10 rounded-xl transition-all group relative flex-shrink-0"
                            >
                                <X className="w-5 h-5 md:w-6 md:h-6 text-zinc-400 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* Mode indicator or Progress Bar */}
                        {mode && !isGenerating && (
                            <div className="space-y-2 relative z-10">
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
                                            className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(step / totalSteps) * 100}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
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
                                        <div className="text-center space-y-2 md:space-y-3 mb-6 md:mb-12">
                                            <h3 className="text-lg md:text-3xl font-black text-white px-4 md:px-0 uppercase tracking-tight">Choose Your Creation Mode</h3>
                                            <p className="text-xs md:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
                                                Select how you want to build your mystery. Quick Mode for instant creation, or Advanced Mode for complete control.
                                            </p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                            {/* Quick Mode */}
                                            <motion.button
                                                onClick={() => setMode('quick')}
                                                className="group relative p-4 md:p-8 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent hover:border-indigo-500/50 transition-all overflow-hidden text-left"
                                                whileHover={{ scale: 1.01, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform" />

                                                <div className="relative z-10 space-y-3 md:space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="p-3 md:p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl md:rounded-2xl shadow-lg">
                                                            <Rocket className="w-5 h-5 md:w-8 md:h-8 text-white" />
                                                        </div>
                                                        <div className="px-2 md:px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full">
                                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Fast</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-lg md:text-2xl font-black text-white mb-1 md:mb-2">Quick Mode</h4>
                                                        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed mb-3 md:mb-4">
                                                            Describe your story and objectives in plain text. AI handles the rest.
                                                        </p>

                                                        <div className="space-y-1.5 md:space-y-2 hidden xs:block">
                                                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-zinc-500">
                                                                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                                                                <span>Natural language input</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-zinc-500">
                                                                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                                                                <span>Instant generation</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.button>

                                            {/* Advanced Mode */}
                                            <motion.button
                                                onClick={() => setMode('advanced')}
                                                className="group relative p-4 md:p-8 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent hover:border-purple-500/50 transition-all overflow-hidden text-left"
                                                whileHover={{ scale: 1.01, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform" />

                                                <div className="relative z-10 space-y-3 md:space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="p-3 md:p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl md:rounded-2xl shadow-lg">
                                                            <Settings2 className="w-5 h-5 md:w-8 md:h-8 text-white" />
                                                        </div>
                                                        <div className="px-2 md:px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full">
                                                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Pro</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-lg md:text-2xl font-black text-white mb-1 md:mb-2">Advanced Wizard</h4>
                                                        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed mb-3 md:mb-4">
                                                            Step-by-step control over genre, difficulty, suspects, and puzzles.
                                                        </p>

                                                        <div className="space-y-1.5 md:space-y-2 hidden xs:block">
                                                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-zinc-500">
                                                                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                                                                <span>Full customization</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-zinc-500">
                                                                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                                                                <span>Granular control</span>
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
                                                className="w-full h-48 md:h-64 bg-black/50 border-2 border-zinc-800 rounded-2xl p-4 md:p-6 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none leading-relaxed"
                                                placeholder="Example: 'A famous scientist has been found dead in their lab at a cutting-edge research facility. The lab was locked from the inside, and there are three suspects: the ambitious assistant, the jealous colleague, and the mysterious investor. The detective must uncover who had access to the security system and what secret project the scientist was working on...'"
                                                value={quickStory}
                                                onChange={(e) => setQuickStory(e.target.value)}
                                            />
                                            <div className="flex items-center justify-between text-xs">
                                                <p className="text-zinc-600 italic flex items-center gap-2">
                                                    <Sparkles className="w-3 h-3" />
                                                    Write freely! Include characters, setting, mystery, and any plot points you want.
                                                </p>
                                                <span className={`font-mono ${quickStory.length < 20 ? 'text-zinc-700' : 'text-indigo-400'}`}>
                                                    {quickStory.length} characters
                                                </span>
                                            </div>
                                        </div>

                                        {/* Learning Objectives Input */}
                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                                <Target className="w-4 h-4" />
                                                Learning Objectives
                                            </Label>
                                            <textarea
                                                className="w-full h-32 md:h-40 bg-black/50 border-2 border-zinc-800 rounded-2xl p-4 md:p-6 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 transition-all resize-none leading-relaxed"
                                                placeholder="Example: 'Teach students about digital forensics: 1) How to analyze access logs, 2) Understanding encryption basics, 3) Recognizing insider threats, 4) Chain of custody in evidence handling'"
                                                value={quickObjectives}
                                                onChange={(e) => setQuickObjectives(e.target.value)}
                                            />
                                            <div className="flex items-center justify-between text-xs">
                                                <p className="text-zinc-600 italic flex items-center gap-2">
                                                    <Lightbulb className="w-3 h-3" />
                                                    What should players learn? Be specific!
                                                </p>
                                                <span className={`font-mono ${quickObjectives.length < 10 ? 'text-zinc-700' : 'text-purple-400'}`}>
                                                    {quickObjectives.length} characters
                                                </span>
                                            </div>
                                        </div>

                                        {/* Example Templates */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-xl space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                                        <span className="text-lg">🔒</span>
                                                    </div>
                                                    <div className="text-xs font-black text-indigo-400 uppercase tracking-wider">Cybersecurity Example</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setQuickStory("A major corporation's database has been breached. The CTO was found unconscious in the server room. Three people had access that night: the security admin, the lead developer, and an external consultant. The detective must trace the digital footprints and uncover who exploited the vulnerability.");
                                                        setQuickObjectives("Teach cybersecurity fundamentals: 1) Identifying phishing attacks, 2) Understanding SQL injection, 3) Recognizing social engineering tactics, 4) Importance of multi-factor authentication");
                                                    }}
                                                    className="block text-left text-xs text-zinc-400 hover:text-indigo-300 transition-colors italic leading-relaxed w-full p-3 bg-black/30 rounded-lg hover:bg-black/50"
                                                >
                                                    Click to load: "Corporate database breach with cybersecurity lessons..."
                                                </button>
                                            </div>

                                            <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                                        <span className="text-lg">🧠</span>
                                                    </div>
                                                    <div className="text-xs font-black text-emerald-400 uppercase tracking-wider">Critical Thinking Example</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setQuickStory("A priceless artifact has vanished from a museum during a gala. The curator, a wealthy collector, and a renowned archaeologist were all near the display case. Each has a different story about what they saw. The detective must analyze contradictions and deduce the truth.");
                                                        setQuickObjectives("Develop critical thinking skills: 1) Analyzing witness testimonies for contradictions, 2) Identifying logical fallacies, 3) Constructing evidence-based arguments, 4) Distinguishing correlation from causation");
                                                    }}
                                                    className="block text-left text-xs text-zinc-400 hover:text-emerald-300 transition-colors italic leading-relaxed w-full p-3 bg-black/30 rounded-lg hover:bg-black/50"
                                                >
                                                    Click to load: "Museum heist with critical thinking challenges..."
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info Box */}
                                        <div className="p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-xl flex gap-4">
                                            <Zap className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                                            <div className="text-xs text-zinc-400 leading-relaxed space-y-2">
                                                <p className="text-indigo-300 font-bold">AI will automatically:</p>
                                                <ul className="space-y-1 ml-4 list-disc">
                                                    <li>Create detailed suspect profiles with personalities</li>
                                                    <li>Design engaging puzzles that teach your objectives</li>
                                                    <li>Build a complete narrative flow with plot twists</li>
                                                    <li>Generate evidence that progressively reveals the truth</li>
                                                    <li>Ensure everything is playable and educational</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Advanced Mode - Existing wizard steps */}
                                {mode === 'advanced' && step === 1 && (
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
                                {mode === 'advanced' && step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4 md:space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                                <Globe className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Genre & Setting</h3>
                                                <p className="text-[10px] md:text-xs text-zinc-500 mt-0.5">Choose the atmosphere and world</p>
                                            </div>
                                        </div>

                                        {/* Genre Selection */}
                                        <div className="space-y-3">
                                            <Label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400">Select Genre</Label>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                                                {GENRES.map(g => (
                                                    <button
                                                        key={g.id}
                                                        onClick={() => setGenre(g.id)}
                                                        className={`p-3 md:p-4 rounded-xl border-2 transition-all text-left ${genre === g.id
                                                            ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className="text-xl md:text-2xl mb-1 md:mb-2">{g.icon}</div>
                                                        <div className="text-xs md:text-sm font-bold text-white mb-0.5 md:mb-1">{g.label}</div>
                                                        <div className="text-[9px] md:text-[10px] text-zinc-500 leading-tight line-clamp-2">{g.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Custom Setting */}
                                        <div className="space-y-3">
                                            <Label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                Custom Setting (Optional)
                                            </Label>
                                            <textarea
                                                className="w-full h-24 md:h-32 bg-black/50 border-2 border-zinc-800 rounded-2xl p-4 text-xs md:text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                                                placeholder="Example: 'A luxury space cruise liner orbiting Saturn...'"
                                                value={customSetting}
                                                onChange={(e) => setCustomSetting(e.target.value)}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 3: Difficulty & Complexity */}
                                {mode === 'advanced' && step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4 md:space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-amber-500/10 rounded-xl">
                                                <Trophy className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Difficulty</h3>
                                                <p className="text-[10px] md:text-xs text-zinc-500 mt-0.5">Set the challenge level</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:space-y-3">
                                            {DIFFICULTY_LEVELS.map(d => (
                                                <button
                                                    key={d.id}
                                                    onClick={() => setDifficulty(d.id)}
                                                    className={`w-full p-3 md:p-5 rounded-xl border-2 transition-all text-left ${difficulty === d.id
                                                        ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1 md:mb-2">
                                                        <div className="flex items-center gap-2 md:gap-3">
                                                            <span className="text-xl md:text-2xl">{d.icon}</span>
                                                            <span className="text-sm md:text-lg font-black text-white">{d.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-zinc-500">
                                                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                                            {d.duration}
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] md:text-sm text-zinc-400 leading-tight">{d.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 4: Suspects Configuration */}
                                {mode === 'advanced' && step === 4 && (
                                    <motion.div
                                        key="step4"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-rose-500/10 rounded-xl">
                                                <Users className="w-5 h-5 md:w-6 md:h-6 text-rose-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Suspects</h3>
                                                <p className="text-[10px] md:text-xs text-zinc-500 mt-0.5">Design your cast of characters</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <Label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 block text-center">Number of Suspects</Label>
                                                <div className="flex items-center justify-center gap-6">
                                                    <button
                                                        onClick={() => setSuspectCount(Math.max(2, suspectCount - 1))}
                                                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                                    >
                                                        <ChevronLeft className="w-5 h-5 text-white" />
                                                    </button>
                                                    <div className="text-center min-w-[60px]">
                                                        <div className="text-5xl font-black text-white">{suspectCount}</div>
                                                        {/* <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Suspects</div> */}
                                                    </div>
                                                    <button
                                                        onClick={() => setSuspectCount(Math.min(10, suspectCount + 1))}
                                                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                                    >
                                                        <ChevronRight className="w-5 h-5 text-white" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400">Suspect Complexity</Label>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                                                    {[
                                                        { id: 'simple', label: 'Simple', desc: 'Clear motives' },
                                                        { id: 'balanced', label: 'Balanced', desc: 'Mixed clues' },
                                                        { id: 'complex', label: 'Complex', desc: 'Layered stories' }
                                                    ].map(c => (
                                                        <button
                                                            key={c.id}
                                                            onClick={() => setSuspectComplexity(c.id)}
                                                            className={`p-3 md:p-4 rounded-xl border-2 transition-all text-left ${suspectComplexity === c.id
                                                                ? 'border-rose-500 bg-rose-500/10'
                                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                                }`}
                                                        >
                                                            <div className="text-xs md:text-sm font-bold text-white mb-0.5 md:mb-1">{c.label}</div>
                                                            <div className="text-[9px] md:text-[10px] text-zinc-500 leading-tight">{c.desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 5: Puzzle Types */}
                                {mode === 'advanced' && step === 5 && (
                                    <motion.div
                                        key="step5"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4 md:space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                                <Puzzle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Challenges</h3>
                                                <p className="text-[10px] md:text-xs text-zinc-500 mt-0.5">Select interactive elements</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                                            {PUZZLE_TYPES.map(puzzle => {
                                                const Icon = puzzle.icon;
                                                const isSelected = selectedPuzzles.includes(puzzle.id);
                                                return (
                                                    <button
                                                        key={puzzle.id}
                                                        onClick={() => togglePuzzle(puzzle.id)}
                                                        className={`p-2.5 md:p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                                            ? 'border-emerald-500 bg-emerald-500/10'
                                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-2 md:gap-3">
                                                            <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                                                                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center justify-between mb-0.5 md:mb-1">
                                                                    <span className="text-xs md:text-sm font-bold text-white truncate">{puzzle.label}</span>
                                                                    {isSelected && <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-emerald-400 ml-2" />}
                                                                </div>
                                                                <p className="text-[9px] md:text-xs text-zinc-500 leading-tight line-clamp-1">{puzzle.desc}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 6: Review & Generate */}
                                {mode === 'advanced' && step === 6 && (
                                    <motion.div
                                        key="step6"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4 md:space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                                <Eye className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Review</h3>
                                                <p className="text-[10px] md:text-xs text-zinc-500 mt-0.5">Finalize your mystery</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 max-h-[40vh] md:max-h-none overflow-y-auto pr-2 custom-scrollbar">
                                            {/* Learning Objectives Summary */}
                                            <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Objectives</span>
                                                </div>
                                                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">{objectives}</p>
                                            </div>

                                            {/* Configuration Grid */}
                                            <div className="grid grid-cols-2 gap-2 md:gap-4">
                                                <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Genre</div>
                                                    <div className="text-xs md:text-sm text-white font-bold">{GENRES.find(g => g.id === genre)?.label}</div>
                                                </div>
                                                <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Difficulty</div>
                                                    <div className="text-xs md:text-sm text-white font-bold">{DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.label}</div>
                                                </div>
                                                <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Suspects</div>
                                                    <div className="text-xs md:text-sm text-white font-bold">{suspectCount} Cast Members</div>
                                                </div>
                                                <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Challenges</div>
                                                    <div className="text-xs md:text-sm text-white font-bold">{selectedPuzzles.length} Types</div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex gap-3">
                                                <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                                <div className="text-[10px] md:text-xs text-zinc-400 leading-relaxed">
                                                    AI is ready to construct your narrative architecture.
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        ) : (
                            /* Enhanced Generation Progress */
                            <div className="py-20 flex flex-col items-center text-center space-y-10">
                                <div className="relative">
                                    {/* Outer rotating ring */}
                                    <motion.div
                                        className="w-40 h-40 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                    {/* Inner pulsing ring */}
                                    <motion.div
                                        className="absolute inset-4 border-4 border-purple-500/20 border-b-purple-500 rounded-full"
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    />
                                    {/* Center icon */}
                                    <motion.div
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            rotate: [0, 180, 360],
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Brain className="w-14 h-14 text-indigo-400" />
                                    </motion.div>
                                    {/* Glow effect */}
                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
                                </div>

                                <div className="space-y-4">
                                    <motion.h3
                                        className="text-3xl font-black text-white"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        AI Director at Work
                                    </motion.h3>
                                    <motion.p
                                        className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed"
                                        key={generationStage}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        {generationStage || 'Initializing...'}
                                    </motion.p>
                                </div>

                                {/* Enhanced Progress Bar */}
                                <div className="w-full max-w-lg space-y-3">
                                    <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/10 relative">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${generationProgress}%` }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <motion.div
                                                className="absolute inset-0 bg-white/30"
                                                animate={{ x: ['0%', '100%'] }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                style={{ width: '50%' }}
                                            />
                                        </motion.div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-500 font-mono">{generationProgress}% Complete</span>
                                        <span className="text-indigo-400 font-bold">Please wait...</span>
                                    </div>
                                </div>

                                {/* Fun facts while waiting */}
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl max-w-md">
                                    <p className="text-xs text-zinc-500 italic">
                                        💡 Did you know? The AI is analyzing thousands of mystery story patterns to create your unique case!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    {!isGenerating && mode && (
                        <div className="p-6 border-t border-white/10 bg-zinc-900/50 backdrop-blur-xl">
                            {error && (
                                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-300">{error}</div>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => mode === 'quick' ? setMode(null) : prevStep()}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    {mode === 'quick' || step === 1 ? 'Back to Mode Selection' : 'Previous'}
                                </Button>

                                <div className="flex gap-3">
                                    {mode === 'advanced' && step < totalSteps ? (
                                        <Button
                                            onClick={nextStep}
                                            disabled={!canProceed()}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next Step
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={!canProceed()}
                                            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-black uppercase tracking-wider px-8 shadow-lg shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                                        >
                                            <motion.div
                                                className="absolute inset-0 bg-white/20"
                                                animate={{ x: ['-100%', '100%'] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            />
                                            <span className="relative flex items-center gap-2">
                                                <Wand2 className="w-5 h-5" />
                                                Generate Mystery
                                                <Sparkles className="w-4 h-4" />
                                            </span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AICaseGeneratorModal;
