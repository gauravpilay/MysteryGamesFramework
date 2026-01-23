import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Card } from './ui/shared';
import { X, User, Search, Terminal, MessageSquare, FileText, ArrowRight, ShieldAlert, CheckCircle, AlertTriangle, Volume2, VolumeX, Image as ImageIcon, Briefcase, Star, MousePointerClick, Bell, HelpCircle, Clock, ZoomIn, LayoutGrid, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EvidenceBoard from './EvidenceBoard';
import AdvancedTerminal from './AdvancedTerminal';

const BackgroundEffect = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <style>
            {`
            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }
            .animate-scanline {
                animation: scanline 8s linear infinite;
            }
            `}
        </style>
        {/* Dark Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80"></div>

        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)',
            backgroundSize: '40px 40px'
        }}></div>

        {/* Scanline Animation */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent h-screen w-full animate-scanline opacity-20 pointer-events-none mix-blend-overlay"></div>

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_50%,_black_100%)] opacity-80"></div>
    </div>
);

const TypewriterText = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const index = useRef(0);

    const parseRichText = (input) => {
        if (!input) return "";
        // Bold: **text**
        let parsed = input.replace(/\*\*(.*?)\*\*/g, '<b class="text-white font-black drop-shadow-sm">$1</b>');

        // Colors: [red]text[/red], [blue]text[/blue], etc.
        const colors = ['red', 'blue', 'green', 'yellow', 'indigo', 'orange', 'emerald', 'amber', 'rose', 'cyan'];
        colors.forEach(color => {
            const regex = new RegExp(`\\[${color}\\](.*?)\\[\\/${color}\\]`, 'g');
            // Mapping colors to Tailwind classes
            const colorMap = {
                red: 'text-red-500',
                blue: 'text-blue-400',
                green: 'text-emerald-400',
                yellow: 'text-amber-300',
                indigo: 'text-indigo-400',
                orange: 'text-orange-400',
                emerald: 'text-emerald-400',
                amber: 'text-amber-400',
                rose: 'text-rose-500',
                cyan: 'text-cyan-400'
            };
            parsed = parsed.replace(regex, `<span class="${colorMap[color]} font-bold">$1</span>`);
        });

        // Handle unclosed bold tags for a smoother typing experience
        if (parsed.includes('**') && !parsed.includes('</b>')) {
            parsed = parsed.replace(/\*\*(.*)$/, '<b class="text-white font-black">$1</b>');
        }

        return parsed;
    };

    useEffect(() => {
        setDisplayedText('');
        index.current = 0;

        if (!text) {
            if (onComplete) onComplete();
            return;
        }

        const timer = setInterval(() => {
            if (index.current < text.length) {
                setDisplayedText(text.slice(0, index.current + 1));
                index.current++;
            } else {
                clearInterval(timer);
                if (onComplete) onComplete();
            }
        }, 12); // Slightly faster for longer texts

        return () => clearInterval(timer);
    }, [text]);

    return (
        <span className="relative">
            <span dangerouslySetInnerHTML={{ __html: parseRichText(displayedText) }} />
            <span className="animate-pulse text-indigo-500 ml-1">_</span>
        </span>
    );
};

// -- MINIGAME COMPONENTS --

const LockpickMinigame = ({ node, onSuccess, onFail }) => {
    const [pins, setPins] = useState(Array(parseInt(node.data.difficulty === 'hard' ? 7 : node.data.difficulty === 'medium' ? 5 : 3)).fill(false));
    const [currentPin, setCurrentPin] = useState(0);
    const [barPos, setBarPos] = useState(0);
    const [movingRight, setMovingRight] = useState(true);
    const requestRef = useRef();

    // Game Loop for Bar Movement
    useEffect(() => {
        const speed = node.data.difficulty === 'hard' ? 2 : 1.5;
        const animate = () => {
            setBarPos(prev => {
                let next = prev + (movingRight ? speed : -speed);
                if (next >= 100) { setMovingRight(false); next = 100; }
                if (next <= 0) { setMovingRight(true); next = 0; }
                return next;
            });
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [movingRight, node.data.difficulty]);

    const handlePick = () => {
        // Sweet spot is centered around 50% usually, or random? Random is better.
        // For simplicity, let's say the target zone moves or is static.
        // Static center is easiest for V1.
        const targetStart = 40;
        const targetEnd = 60;

        if (barPos >= targetStart && barPos <= targetEnd) {
            const newPins = [...pins];
            newPins[currentPin] = true;
            setPins(newPins);
            if (currentPin + 1 >= pins.length) {
                setTimeout(onSuccess, 500);
            } else {
                setCurrentPin(p => p + 1);
            }
        } else {
            // Failure reset
            setPins(pins.map(() => false));
            setCurrentPin(0);
            onFail();
        }
    };

    return (
        <div className="p-8 bg-zinc-900 h-full flex flex-col items-center justify-center border-t-4 border-amber-500">
            <h2 className="text-2xl font-black text-amber-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                <div className="p-2 border border-amber-500 rounded-lg"><Clock className="w-6 h-6" /></div>
                Lockpick Interface
            </h2>

            <div className="flex gap-4 mb-12">
                {pins.map((isSet, i) => (
                    <div key={i} className={`w-8 h-12 rounded-t-lg transition-all duration-300 ${isSet ? 'bg-amber-500 mt-0 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'bg-zinc-800 mt-8 border-b-4 border-zinc-900'} border-x border-t border-white/10`}></div>
                ))}
            </div>

            <div className="w-full max-w-lg h-12 bg-black rounded-full border border-zinc-700 relative overflow-hidden mb-8" onClick={handlePick}>
                {/* Target Zone */}
                <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-green-500/20 border-x border-green-500/50 flex items-center justify-center">
                    <div className="w-1 h-full bg-green-500/50"></div>
                </div>

                {/* Moving Bar */}
                <div
                    className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_15px_white]"
                    style={{ left: `${barPos}%` }}
                ></div>
            </div>

            <p className="text-zinc-500 text-sm font-mono tracking-widest mb-4">CLICK WHEN ALIGNED</p>
        </div>
    );
};

const KeypadMinigame = ({ node, onSuccess }) => {
    const [input, setInput] = useState("");
    const [error, setError] = useState(false);

    const handlePress = (key) => {
        if (key === 'C') {
            setInput("");
            setError(false);
        } else if (key === 'Enter') {
            if (input === node.data.passcode) {
                onSuccess();
            } else {
                setError(true);
                setTimeout(() => {
                    setInput("");
                    setError(false);
                }, 1000);
            }
        } else {
            if (input.length < 8) setInput(prev => prev + key);
        }
    };

    return (
        <div className="p-8 bg-zinc-900 h-full flex flex-col items-center justify-center border-t-4 border-slate-500">
            <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
                <div className={`bg-black h-16 mb-6 rounded border font-mono text-3xl flex items-center justify-end px-4 tracking-widest ${error ? 'border-red-500 text-red-500 animate-pulse' : 'border-emerald-900/50 text-emerald-500'}`}>
                    {error ? "ACCESS DENIED" : input.replace(/./g, '•') || "ENTER CODE"}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'Enter'].map(key => (
                        <button
                            key={key}
                            onClick={() => handlePress(key)}
                            className={`w-16 h-16 rounded text-xl font-bold transition-all active:scale-95
                                ${key === 'Enter' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
                                    key === 'C' ? 'bg-red-900/50 hover:bg-red-800 text-red-200' :
                                        'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'}`}
                        >
                            {key === 'Enter' ? '⏎' : key}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DecryptionMinigame = ({ node, onSuccess }) => {
    const target = (node.data.targetPhrase || "PASSWORD").toUpperCase();
    const [revealed, setRevealed] = useState(Array(target.length).fill(false));
    const [chars, setChars] = useState(Array(target.length).fill('A'));

    // Cycle characters
    useEffect(() => {
        const interval = setInterval(() => {
            setChars(prev => prev.map((char, i) => {
                if (revealed[i]) return target[i];
                return String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }));
        }, 50); // Fast cycle
        return () => clearInterval(interval);
    }, [revealed, target]);

    const handleLock = (index) => {
        // In this minigame, you have to click the column to lock it? 
        // Or wait for it to be right? That's impossible at 50ms.
        // Let's make it: Click any "Lock" button stops a column. 
        // Actually simpler: "Matrix Code Match". 
        // User clicks "Inject Code" button when the *Highlighted* letter matches the target letter below it.
        // Let's do a simple "Click to Reveal" but with a cooldown or "Hacking Progress".

        // Revised Logic: User types the letter to lock it (Typing Game). 
        // Most intuitive for desktop/laptop.
    };

    // Typing listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            const char = e.key.toUpperCase();
            // Find first unrevealed index
            const nextIndex = revealed.findIndex(r => !r);
            if (nextIndex !== -1 && char === target[nextIndex]) {
                setRevealed(prev => {
                    const next = [...prev];
                    next[nextIndex] = true;
                    // Check success
                    if (next.every(r => r)) setTimeout(onSuccess, 500);
                    return next;
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [revealed, target, onSuccess]);

    return (
        <div className="p-8 bg-black h-full flex flex-col items-center justify-center font-mono border-t-4 border-lime-500">
            <h2 className="text-lime-500 mb-8 tracking-widest animate-pulse">DECRYPTION IN PROGRESS...</h2>

            <div className="flex gap-2">
                {chars.map((char, i) => (
                    <div key={i} className={`w-12 h-16 flex items-center justify-center text-3xl border rounded transition-colors duration-200
                        ${revealed[i] ? 'bg-lime-900/20 border-lime-500 text-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.4)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                        {revealed[i] ? target[i] : char}
                    </div>
                ))}
            </div>

            <p className="mt-12 text-zinc-500 text-xs tracking-widest">
                TYPE THE CHARACTERS TO LOCK SIGNAL
            </p>
        </div>
    );
};

const GamePreview = ({ nodes, edges, onClose, gameMetadata, onGameEnd }) => {
    // Game State
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [isContentReady, setIsContentReady] = useState(false);
    const [inventory, setInventory] = useState(new Set());
    const [history, setHistory] = useState([]); // Array of distinct visited node IDs
    const [logs, setLogs] = useState([]);
    const [missionStarted, setMissionStarted] = useState(false);
    // Generic Modal State: can hold a node object or null
    const [activeModalNode, setActiveModalNode] = useState(null);
    // Accusation State
    const [showAccuseModal, setShowAccuseModal] = useState(false);
    const [accusationResult, setAccusationResult] = useState(null); // 'success' | 'failure' | null | 'timeout'
    const [activeAccusationNode, setActiveAccusationNode] = useState(null);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [showEvidenceBoard, setShowEvidenceBoard] = useState(false);
    const [boardItems, setBoardItems] = useState([]);
    const [boardConnections, setBoardConnections] = useState([]);
    const [boardNotes, setBoardNotes] = useState([]);
    const [isConfronting, setIsConfronting] = useState(false);

    // Logic/Outputs State
    const [nodeOutputs, setNodeOutputs] = useState({});

    // Timer State
    const initialTime = (gameMetadata?.timeLimit || 15) * 60; // Convert minutes to seconds
    const [timeLeft, setTimeLeft] = useState(initialTime);

    // Scoring State
    const [score, setScore] = useState(0);
    const [playerObjectiveScores, setPlayerObjectiveScores] = useState({}); // { objId: score }
    const [scoredNodes, setScoredNodes] = useState(new Set());
    const [userAnswers, setUserAnswers] = useState(new Set()); // Set of selected option IDs for Question Nodes

    // Timer Logic
    useEffect(() => {
        if (!missionStarted || accusationResult) return; // Stop if not started or game ended

        if (timeLeft <= 0) {
            setAccusationResult('timeout');
            setShowAccuseModal(true); // Re-use the modal to show failure
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [missionStarted, timeLeft, accusationResult]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Track visited nodes in history
    useEffect(() => {
        if (currentNodeId) {
            setHistory(prev => {
                if (prev.includes(currentNodeId)) return prev;
                return [...prev, currentNodeId];
            });
        }
    }, [currentNodeId]);

    const currentNode = useMemo(() =>
        nodes.find(n => n.id === currentNodeId),
        [currentNodeId, nodes]
    );

    const addLog = (msg) => {
        setLogs(prev => [`> ${msg}`, ...prev].slice(0, 50));
    };

    const rewardObjectivePoints = (node, points) => {
        const objIds = node.data.learningObjectiveIds || (node.data.learningObjectiveId ? [node.data.learningObjectiveId] : []);
        if (objIds.length === 0) return;

        const objectives = gameMetadata?.learningObjectives || gameMetadata?.meta?.learningObjectives;

        setPlayerObjectiveScores(prev => {
            const newScores = { ...prev };
            objIds.forEach(id => {
                let displayName = id;
                if (objectives) {
                    const [catId, idxStr] = id.split(':');
                    const cat = objectives.find(c => c.id === catId);
                    if (cat && cat.objectives && cat.objectives[parseInt(idxStr)]) {
                        const objEntry = cat.objectives[parseInt(idxStr)];
                        displayName = typeof objEntry === 'string' ? objEntry : (objEntry.learningObjective || id);
                    }
                }
                newScores[displayName] = (newScores[displayName] || 0) + points;
            });
            return newScores;
        });
    };

    // Initialize Game
    useEffect(() => {
        // Find a suitable start node logic:
        // 1. Explicit ID 'start'
        let start = nodes.find(n => n.id.toLowerCase().includes('start'));

        // 2. Look for "Briefing" or "Start" in label (Common conventions)
        if (!start) {
            start = nodes.find(n => {
                const label = (n.data?.label || '').toLowerCase();
                return label.includes('briefing') || label === 'start' || label === 'mission start';
            });
        }

        // 3. Topology: Root Nodes (sorted by visual position)
        if (!start) {
            const targets = new Set(edges.map(e => e.target));
            const roots = nodes.filter(n => !targets.has(n.id));

            if (roots.length > 0) {
                // Sort by Y (top to bottom), then X to find top-left node
                roots.sort((a, b) => {
                    const ax = a.position?.x || 0;
                    const ay = a.position?.y || 0;
                    const bx = b.position?.x || 0;
                    const by = b.position?.y || 0;
                    if (Math.abs(ay - by) > 100) return ay - by; // distinct rows
                    return ax - bx;
                });
                start = roots[0];
            }
        }

        // 4. Fallback: Top-most node overall (Cycle handling or weird state)
        if (!start && nodes.length > 0) {
            const sortedAll = [...nodes].sort((a, b) => {
                const ay = a.position?.y || 0;
                const by = b.position?.y || 0;
                return ay - by;
            });
            start = sortedAll[0];
        }

        if (start) {
            setCurrentNodeId(start.id);

            // Auto-Start Mission if not explicitly a "Briefing" node
            // This ensures the timer starts for games beginning with other node types (media, terminal, etc.)
            const isBriefing = (start.data?.label || '').toLowerCase().includes('briefing');
            if (!isBriefing) {
                setMissionStarted(true);
            }

            // If start node is a modal type, open it immediately
            if (['media', 'suspect', 'terminal', 'evidence', 'message'].includes(start.type)) {
                setActiveModalNode(start);
                setInventory(prev => new Set([...prev, start.id]));
            }

            addLog(`System initialized. Session started at ${new Date().toLocaleTimeString()}`);
            addLog(`Loaded ${nodes.length} nodes and ${edges.length} connections.`);
        }
    }, [nodes, edges]);

    // Scoring Logic (Visit-based)
    useEffect(() => {
        if (!currentNode || !currentNode.data.score) return;

        // Terminal nodes award score on hack success, not visit.
        if (currentNode.type === 'terminal') return;

        if (!scoredNodes.has(currentNode.id)) {
            setScore(s => s + currentNode.data.score);

            // Objective Scoring
            rewardObjectivePoints(currentNode, currentNode.data.score);

            setScoredNodes(prev => new Set([...prev, currentNode.id]));
            addLog(`SCORE REWARD: +${currentNode.data.score} Points`);
        }
    }, [currentNode, scoredNodes]);



    // Navigation Options (Outgoing Edges) with Logic Look-ahead
    // We compute this whenever state changes to "see through" logic nodes
    const options = useMemo(() => {
        if (!currentNodeId) return [];

        const rawEdges = edges.filter(e => e.source === currentNodeId);
        const resolvedOptions = [];
        const processedLogicNodes = new Set(); // Prevent infinite recursion

        // Recursive helper to look through logic nodes for the *effective* target
        const resolveEdgeTarget = (edge) => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!targetNode) return null;

            // Atomic Node (Terminal, Visible Node) -> Return as is
            if (!['logic', 'music', 'setter'].includes(targetNode.type)) {
                return edge;
            }

            // Logic/Music Node -> Evaluate and continue
            if (targetNode.type === 'logic') {
                if (processedLogicNodes.has(targetNode.id)) return null; // Cycle guard
                processedLogicNodes.add(targetNode.id);

                // Use our evaluateLogic helper
                // Note: We need to define evaluateLogic BEFORE this useMemo or use a separate helper
                // Since evaluateLogic uses state variables, we might need to inline part of it or move it up.
                // Ideally, evaluateLogic should be pure or we extract the logic.

                // Re-implementing simplified logic evaluation here to avoid hoisting issues 
                // (since evaluateLogic is defined below in original code)
                const { variable, operator, value, condition } = targetNode.data;
                let isTrue = false;

                if (variable) {
                    let actualValue = undefined;
                    if (nodeOutputs[variable] !== undefined) actualValue = nodeOutputs[variable];
                    else if (inventory.has(variable)) actualValue = true;

                    if (actualValue === undefined) isTrue = false;
                    else {
                        const sVal = String(actualValue).toLowerCase();
                        const tVal = String(value || '').toLowerCase();
                        if (!value && (operator === '==' || !operator)) isTrue = true;
                        else if (operator === '!=') isTrue = sVal != tVal;
                        else if (operator === '>') isTrue = parseFloat(actualValue) > parseFloat(value);
                        else if (operator === '<') isTrue = parseFloat(actualValue) < parseFloat(value);
                        else if (operator === 'contains') isTrue = sVal.includes(tVal);
                        else isTrue = sVal == tVal;
                    }
                } else {
                    // Check logic condition using the component Helper if possible, or reimplement
                    // Note: checkLogicCondition is stable and defined early in component? 
                    // No, checkLogicCondition is defined in render. We must rely on dependency.
                    if (!condition || condition === 'always_true') isTrue = true;
                    else if (condition === 'always_false') isTrue = false;
                    else if (inventory.has(condition)) isTrue = true;
                    // Full checkLogicCondition is complex, we'll assume inventory basic check here for preview performance
                    // or rely on a simplified version. Most commonly it's inventory check.
                    // The user asked for "keys are set", which is inventory or set variable.

                    // Handle 'visited:' and 'has:' prefixes briefly
                    if (condition.startsWith('visited:')) isTrue = history.includes(condition.split(':')[1]);
                    else if (condition.startsWith('has:')) isTrue = inventory.has(condition.split(':')[1]);
                }

                // Find next edge based on result
                const logicEdges = edges.filter(e => e.source === targetNode.id);
                const trueEdge = logicEdges.find(e => e.sourceHandle === 'true' || e.label === 'True' || e.label === 'true');
                const falseEdge = logicEdges.find(e => e.sourceHandle === 'false' || e.label === 'False' || e.label === 'false');

                let nextEdge = isTrue ? trueEdge : falseEdge;
                // Fallback
                if (!nextEdge && logicEdges.length > 0) {
                    nextEdge = isTrue ? logicEdges[0] : (logicEdges.length > 1 ? logicEdges[1] : null);
                }

                if (nextEdge) return resolveEdgeTarget(nextEdge);
                return null; // Dead end logic path (Hidden option)
            }

            if (targetNode.type === 'music' || targetNode.type === 'setter') {
                // Music/Setter always passes through
                const outEdges = edges.filter(e => e.source === targetNode.id);
                if (outEdges.length > 0) return resolveEdgeTarget(outEdges[0]);
                return null;
            }

            return edge;
        };

        // Process all immediate edges
        rawEdges.forEach(edge => {
            // We use a clean set for each branch to allow diamond patterns, 
            // but prevent loops within one branch.
            processedLogicNodes.clear();
            const resolved = resolveEdgeTarget(edge);
            if (resolved) {
                // We create a "Virtual Edge" that looks like it comes from Current -> Resolved Target
                // We preserve the original label if the resolved edge doesn't have one? 
                // Mostly we just want the target ID.
                // We use the ID of the resolved edge to ensure keys are unique? No, resolved edge might be far away.
                // We want to verify uniqueness of TARGETS.
                resolvedOptions.push({
                    ...edge, // Keep original source info (handles etc)
                    target: resolved.target, // Point to the final destination
                    id: edge.id + '_resolved_' + resolved.id // Unique ID
                });
            }
        });

        // Filter duplicates (multiple logic paths leading to same node)
        const uniqueTargets = [];
        const seenTargets = new Set();
        resolvedOptions.forEach(opt => {
            if (!seenTargets.has(opt.target)) {
                seenTargets.add(opt.target);
                uniqueTargets.push(opt);
            }
        });

        return uniqueTargets;
    }, [currentNodeId, edges, inventory, nodeOutputs, history, nodes]);

    // Helper to evaluate logic conditions
    const checkLogicCondition = (condition) => {
        if (!condition || condition === 'always_true') return true;
        if (condition === 'always_false') return false;

        // Check for boolean operators (simple implementation)
        if (condition.includes(' && ')) {
            return condition.split(' && ').every(c => checkLogicCondition(c.trim()));
        }
        if (condition.includes(' || ')) {
            return condition.split(' || ').some(c => checkLogicCondition(c.trim()));
        }

        // PREV keyword: Check if the previous node was completed
        if (condition === 'PREV' || condition === 'previous_task') {
            const prevNodeId = history[history.length - 1];
            return prevNodeId && inventory.has(prevNodeId);
        }

        // Check visited status
        if (condition.startsWith('visited:')) {
            const targetId = condition.split(':')[1];
            return history.includes(targetId);
        }

        // Check collected status (Inventory)
        if (condition.startsWith('has:')) {
            const targetId = condition.split(':')[1];
            return inventory.has(targetId);
        }

        // Legacy/Direct ID checks
        // Hardcoded check for tutorial/sample usage
        if (condition === 'has_usb_drive' && (inventory.has('evidence-1') || inventory.has('sample-evidence-usb') || Array.from(inventory).some(i => i.toLowerCase().includes('usb')))) return true;

        // Cyber Case Hardcode
        if (condition === 'keycard_match_ken') {
            // Logic: Needs Keycard OR Logs (providing Access Code)
            if (inventory.has('evidence-cctv') || inventory.has('term-logs')) return true;
        }

        // Default: Check if the condition string matches an item in inventory
        return inventory.has(condition);
    };

    // Effect to handle "Auto-traverse" nodes (Logic) or State Updates (Evidence)
    useEffect(() => {
        if (!currentNode) return;

        // 1. Evidence & Suspects: Auto-collect
        if (currentNode.type === 'evidence' || currentNode.type === 'suspect') {
            const flag = currentNode.data.variableId || currentNode.data.condition || currentNode.id;
            if (!inventory.has(flag)) {
                setInventory(prev => new Set([...prev, flag]));
                if (currentNode.type === 'evidence') {
                    addLog(`EVIDENCE ACQUIRED: ${currentNode.data.label}`);
                } else {
                    addLog(`SUSPECT ENCOUNTERED: ${currentNode.data.name}`);
                }
            }
        }

        // 2. Logic: Auto-redirect (Start Node Fallback)
        if (currentNode.type === 'logic') {
            const isTrue = evaluateLogic(currentNode);

            // Find edges
            const trueEdge = options.find(e => e.sourceHandle === 'true' || e.label === 'True' || e.label === 'true');
            const falseEdge = options.find(e => e.sourceHandle === 'false' || e.label === 'False' || e.label === 'false');

            // WHILE (Wait) Handling
            if (currentNode.data.logicType === 'while' && !isTrue) {
                return;
            }

            let nextEdge = isTrue ? trueEdge : falseEdge;

            // Fallback for unlabeled edges
            if (!nextEdge && options.length > 0) {
                // If logic handled recursively in option click, this usually won't run, 
                // but for initial load or special cases:
                nextEdge = isTrue ? options[0] : (options.length > 1 ? options[1] : null);
            }

            if (nextEdge) {
                // Immediate transition to avoid rendering the logic node screen
                // We use a minimal timeout to ensure state stability but effectively instant
                setTimeout(() => setCurrentNodeId(nextEdge.target), 0);
            } else {
                addLog(`LOGIC STOP: No path for result ${isTrue}`);
            }
        }

        // 3. Setter: Auto-update and redirect
        if (currentNode.type === 'setter') {
            const { variableId, operation, value } = currentNode.data;
            if (variableId) {
                let valToSet = value;
                if (String(value).toLowerCase() === 'true') valToSet = true;
                if (String(value).toLowerCase() === 'false') valToSet = false;

                let currentVal = nodeOutputs[variableId];
                if (currentVal === undefined && inventory.has(variableId)) currentVal = true;

                let finalVal = valToSet;
                if (operation === 'toggle') finalVal = !currentVal;
                else if (operation === 'increment') finalVal = (parseInt(currentVal) || 0) + (parseInt(value) || 1);
                else if (operation === 'decrement') finalVal = (parseInt(currentVal) || 0) - (parseInt(value) || 1);

                setNodeOutputs(prev => ({ ...prev, [variableId]: finalVal }));

                // Sync Inventory
                if (finalVal === true) setInventory(prev => new Set([...prev, variableId]));
                else if (finalVal === false) setInventory(prev => {
                    const next = new Set(prev);
                    next.delete(variableId);
                    return next;
                });

                addLog(`SETTER (Auto): ${variableId} = ${finalVal}`);
            }

            // Move Next
            const outEdges = options;
            if (outEdges.length > 0) {
                setTimeout(() => setCurrentNodeId(outEdges[0].target), 0);
            }
        }

        // Reset content ready state on new node
        setIsContentReady(false);

    }, [currentNode, inventory, options, nodeOutputs]);

    // ...

    // Helper to evaluate logic for a given node
    const evaluateLogic = (node, inv = inventory, out = nodeOutputs) => {
        const { logicType, variable, operator, value, condition } = node.data;
        let isTrue = false;

        if (variable) {
            let actualValue = undefined;
            if (out[variable] !== undefined) actualValue = out[variable];
            else if (inv.has(variable)) actualValue = true;

            if (actualValue === undefined) {
                isTrue = false;
            } else {
                const sVal = String(actualValue).toLowerCase();
                const tVal = String(value || '').toLowerCase();

                if (!value && (operator === '==' || !operator)) isTrue = true;
                else if (operator === '!=') isTrue = sVal != tVal;
                else if (operator === '>') isTrue = parseFloat(actualValue) > parseFloat(value);
                else if (operator === '<') isTrue = parseFloat(actualValue) < parseFloat(value);
                else if (operator === 'contains') isTrue = sVal.includes(tVal);
                else isTrue = sVal == tVal;
            }
            addLog(`LOGIC (${logicType}): ${variable} [${actualValue}] ${operator} ${value} = ${isTrue}`);
        } else {
            // Check legacy condition against inventory (using safe inv reference)
            if (!condition || condition === 'always_true') isTrue = true;
            else if (condition === 'always_false') isTrue = false;
            else if (condition.startsWith('has:')) isTrue = inv.has(condition.split(':')[1]);
            else isTrue = inv.has(condition);

            addLog(`LOGIC CHECK: ${condition || 'Default'} = ${isTrue}`);
        }
        return isTrue;
    };

    const handleOptionClick = (targetId) => {
        let loopCount = 0;
        const maxLoops = 20; // Safety brake
        const intermediateIds = [];

        // Simulation State for immediate consistency in same-tick logic chains
        const localInventory = new Set(inventory);
        const localOutputs = { ...nodeOutputs };
        let stateChanged = false;

        // Recursive resolution function (iterative implementation)
        const resolveNextNode = (startId) => {
            let currId = startId;
            let currNode = nodes.find(n => n.id === currId);

            while (currNode && (['music', 'logic', 'setter'].includes(currNode.type)) && loopCount < maxLoops) {
                loopCount++;
                intermediateIds.push(currNode.id);

                // Handle Music
                if (currNode.type === 'music') {
                    if (currNode.data.url) {
                        setAudioSource(currNode.data.url);
                        addLog(`AUDIO: Background track started.`);
                    }
                    const outEdges = edges.filter(e => e.source === currNode.id);
                    if (outEdges.length > 0) {
                        currId = outEdges[0].target;
                        currNode = nodes.find(n => n.id === currId);
                    } else break;
                }
                // Handle Setter
                else if (currNode.type === 'setter') {
                    const { variableId, operation, value } = currNode.data;
                    if (variableId) {
                        stateChanged = true;
                        let valToSet = value;

                        // Parse boolean strings
                        if (String(value).toLowerCase() === 'true') valToSet = true;
                        if (String(value).toLowerCase() === 'false') valToSet = false;

                        // Check current value
                        const currentVal = localOutputs[variableId] !== undefined ? localOutputs[variableId] : (localInventory.has(variableId) ? true : undefined);

                        if (operation === 'toggle') {
                            valToSet = !currentVal;
                        } else if (operation === 'increment') {
                            valToSet = (parseInt(currentVal) || 0) + (parseInt(value) || 1);
                        } else if (operation === 'decrement') {
                            valToSet = (parseInt(currentVal) || 0) - (parseInt(value) || 1);
                        }

                        // Update Local State
                        localOutputs[variableId] = valToSet;
                        // Sync Inventory for boolean flags
                        if (valToSet === true) localInventory.add(variableId);
                        else if (valToSet === false) localInventory.delete(variableId);

                        addLog(`SETTER: ${variableId} = ${valToSet} (${operation})`);
                    }

                    const outEdges = edges.filter(e => e.source === currNode.id);
                    if (outEdges.length > 0) {
                        currId = outEdges[0].target;
                        currNode = nodes.find(n => n.id === currId);
                    } else break;
                }
                // Handle Logic
                else if (currNode.type === 'logic') {
                    const isTrue = evaluateLogic(currNode, localInventory, localOutputs);
                    const nodeOptions = edges.filter(e => e.source === currNode.id);

                    if (currNode.data.logicType === 'while' && !isTrue) {
                        break;
                    }

                    const trueEdge = nodeOptions.find(e => e.sourceHandle === 'true' || e.label === 'True' || e.label === 'true');
                    const falseEdge = nodeOptions.find(e => e.sourceHandle === 'false' || e.label === 'False' || e.label === 'false');

                    let nextEdge = isTrue ? trueEdge : falseEdge;

                    if (!nextEdge && nodeOptions.length > 0) {
                        nextEdge = isTrue ? nodeOptions[0] : (nodeOptions.length > 1 ? nodeOptions[1] : null);
                    }

                    if (nextEdge) {
                        currId = nextEdge.target;
                        currNode = nodes.find(n => n.id === currId);
                    } else {
                        addLog(`LOGIC STOP: No path for result ${isTrue}`);
                        break; // Dead end
                    }
                }
            }
            return { nodeId: currId, node: currNode };
        };

        const result = resolveNextNode(targetId);
        const nextNodeId = result.nodeId;
        const nextNode = result.node;

        // Commit State Changes
        if (stateChanged) {
            setInventory(localInventory);
            setNodeOutputs(localOutputs);
        }

        // Add current and intermediates to history
        setHistory(prev => {
            const newHistory = [...prev, currentNodeId]; // Log where we came from
            return [...newHistory, ...intermediateIds];
        });

        setCurrentNodeId(nextNodeId);

        // If it's a type that requires a popup, set it as active modal AND add to inventory
        if (nextNode && ['suspect', 'evidence', 'terminal', 'message', 'media', 'notification', 'question', 'lockpick', 'decryption', 'keypad'].includes(nextNode.type)) {
            setActiveModalNode(nextNode);
            if (nextNode.type === 'question') setUserAnswers(new Set()); // Reset answers
            if (nextNode.type === 'lockpick') { /* Initialize specific state if needed here, mostly handled in component */ }

            // Collect IDs: Node IDs + any custom logic variableIds
            const idsToAdd = [nextNodeId, ...intermediateIds];

            // Check connected nodes for custom IDs
            [nextNode, ...intermediateIds.map(id => nodes.find(n => n.id === id))].forEach(n => {
                if (n && n.data?.variableId) idsToAdd.push(n.data.variableId);
                // Legacy support for condition on evidence
                if (n && n.type === 'evidence' && n.data.condition) idsToAdd.push(n.data.condition);
            });

            setInventory(prev => new Set([...prev, ...idsToAdd]));
        } else if (nextNode && nextNode.type === 'identify') {
            setActiveAccusationNode(nextNode);
            setShowAccuseModal(true);
            setAccusationResult(null);
        } else {
            setActiveModalNode(null);
            setIsConfronting(false);
            // Ensure intermediate nodes are tracked in inventory if needed (usually just history is sufficient)
            if (intermediateIds.length > 0) {
                setInventory(prev => new Set([...prev, ...intermediateIds]));
            }
        }
    };

    const handleTerminalSubmit = (input, forceSuccess = false) => {
        // specific for terminal node
        if (!activeModalNode || activeModalNode.type !== 'terminal') return;

        const expected = activeModalNode.data.command || '';
        const isLegacyMatch = expected && input.trim() === expected.trim();

        if (forceSuccess || isLegacyMatch || input.includes('grep')) {
            addLog(`COMMAND SUCCESS: ${input}`);

            // Find next node (usually just one output)
            const nodeOptions = edges.filter(e => e.source === activeModalNode.id);

            if (nodeOptions.length > 0) {
                // Add to inventory that we beat this terminal
                // Add to inventory that we beat this terminal
                const successIds = [activeModalNode.id];
                if (activeModalNode.data.variableId) successIds.push(activeModalNode.data.variableId);
                setInventory(prev => new Set([...prev, ...successIds]));
                setNodeOutputs(prev => ({ ...prev, [activeModalNode.id]: input, [activeModalNode.data.label]: input }));

                // Award Score for Terminal Hack
                if (activeModalNode.data.score && !scoredNodes.has(activeModalNode.id)) {
                    setScore(s => s + activeModalNode.data.score);

                    // Objective Scoring
                    rewardObjectivePoints(activeModalNode, activeModalNode.data.score);

                    setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                    addLog(`HACK REWARD: +${activeModalNode.data.score} Points`);
                }

                // Close modal and move to next
                setActiveModalNode(null); // Close first
                handleOptionClick(nodeOptions[0].target);
            }
        } else {
            addLog(`COMMAND FAILED: Access Denied.`);
            // Penalty
            const penalty = activeModalNode.data.penalty || 0;
            if (penalty > 0) {
                setScore(s => Math.max(0, s - penalty));
                addLog(`HACK PROTECTION DETECTED: -${penalty} Points`);

                rewardObjectivePoints(activeModalNode, -penalty);
            }
        }
    };

    const handleAccuse = (suspect) => {
        // Logic to check if correct.
        let isCorrect = false;

        if (activeAccusationNode && activeAccusationNode.data) {
            // Updated Logic: Check against the Identify Node's 'correctCulpritName'
            const correctName = (activeAccusationNode.data.culpritName || "").toLowerCase().trim();
            const suspectName = (suspect.data.name || "").toLowerCase().trim();

            if (correctName && suspectName.includes(correctName)) {
                isCorrect = true;
            } else if (correctName === suspectName) {
                isCorrect = true;
            }
        } else {
            // Fallback Legacy Logic
            isCorrect = suspect.data.isKiller === true || suspect.data.isCulprit === true;

            // Hardcoded check for the sample case "The Digital Insider"
            if (suspect.data.name?.includes('Ken Sato') && !nodes.some(n => n.data.isKiller)) {
                isCorrect = true;
            }
        }

        if (isCorrect) {
            if (activeAccusationNode && activeAccusationNode.data.score) {
                setScore(s => s + activeAccusationNode.data.score);
                addLog(`CASE CLOSED: +${activeAccusationNode.data.score} Points`);

                rewardObjectivePoints(activeAccusationNode, activeAccusationNode.data.score);
            }
            setAccusationResult('success');
        } else {
            if (activeAccusationNode && activeAccusationNode.data.penalty) {
                const penalty = activeAccusationNode.data.penalty;
                setScore(s => Math.max(0, s - penalty));
                addLog(`WRONG ACCUSATION: -${penalty} Points`);

                rewardObjectivePoints(activeAccusationNode, -penalty);
            }
            setAccusationResult('failure');
        }
    };

    const handleQuestionSubmit = () => {
        if (!activeModalNode || activeModalNode.type !== 'question') return;

        const options = activeModalNode.data.options || [];
        const correctIds = new Set(options.filter(o => o.isCorrect).map(o => o.id));
        const selectedIds = userAnswers;

        // Check if sets are equal
        const isCorrect = correctIds.size === selectedIds.size &&
            [...correctIds].every(id => selectedIds.has(id));

        if (isCorrect) {
            addLog(`QUESTION SOLVED: ${activeModalNode.data.label}`);
            // Award points
            if (activeModalNode.data.score && !scoredNodes.has(activeModalNode.id)) {
                setScore(s => s + (activeModalNode.data.score || 0));

                // Objective Scoring (Reward)
                rewardObjectivePoints(activeModalNode, activeModalNode.data.score || 0);

                setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                addLog(`QUIZ REWARD: +${activeModalNode.data.score} Points`);
            }

            // Advance
            const nodeOptions = edges.filter(e => e.source === activeModalNode.id);
            setActiveModalNode(null);
            if (nodeOptions.length > 0) {
                handleOptionClick(nodeOptions[0].target);
            }
        } else {
            addLog(`QUESTION FAILED: Incorrect Answer.`);
            // Apply penalty if defined
            const penalty = activeModalNode.data.penalty || 0;
            if (penalty > 0) {
                setScore(s => Math.max(0, s - penalty));
                addLog(`QUIZ PENALTY: -${penalty} Points`);

                rewardObjectivePoints(activeModalNode, -penalty);
            }
            // Visual feedback could be added here
            const btn = document.getElementById('quiz-submit-btn');
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = "Incorrect - Try Again";
                btn.classList.add("bg-red-600");
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.remove("bg-red-600");
                }, 1500);
            }
        }
    };

    const getAvatarColor = (name) => {
        const colors = [
            'from-red-500 to-orange-500',
            'from-blue-500 to-cyan-500',
            'from-green-500 to-emerald-500',
            'from-purple-500 to-pink-500',
            'from-yellow-500 to-amber-500',
            'from-indigo-500 to-violet-500',
        ];
        const str = String(name || 'Unk');
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    // Finalize Game and Report
    const handleFinish = () => {
        const timeSpent = initialTime - timeLeft;
        const resultData = {
            score,
            objectiveScores: playerObjectiveScores,
            outcome: accusationResult || 'aborted',
            timeSpentSeconds: timeSpent
        };

        if (onGameEnd) {
            onGameEnd(resultData);
        } else {
            onClose();
        }
    };

    const handleCloseModal = () => {
        if (!activeModalNode) return;

        const MODAL_TYPES = ['suspect', 'evidence', 'terminal', 'message', 'media', 'notification', 'question', 'lockpick', 'decryption', 'keypad', 'identify'];
        const SKIP_TYPES = ['logic', 'setter', 'music', ...MODAL_TYPES];

        // If the modal node is the current navigational node, closing it should revert to the previous narrative
        if (activeModalNode.id === currentNodeId) {
            if (history.length > 0) {
                // Find the last node in history that is a "STABLE" narrative node (Story)
                // We skip logic nodes AND other modal nodes to find the background narrative
                const backtrack = [...history].reverse();
                const lastStoryNodeId = backtrack.find(id => {
                    const node = nodes.find(n => n.id === id);
                    return node && node.type === 'story' && node.id !== activeModalNode.id;
                });

                if (lastStoryNodeId) {
                    setCurrentNodeId(lastStoryNodeId);
                    // Clean up history to before that story node
                    const targetIndex = history.lastIndexOf(lastStoryNodeId);
                    if (targetIndex !== -1) {
                        setHistory(prev => prev.slice(0, targetIndex));
                    }
                } else {
                    // Fallback: If no story node found in history, try any non-skip node
                    const lastStableNodeId = backtrack.find(id => {
                        const node = nodes.find(n => n.id === id);
                        return node && !SKIP_TYPES.includes(node.type) && node.id !== activeModalNode.id;
                    });

                    if (lastStableNodeId) {
                        setCurrentNodeId(lastStableNodeId);
                        const targetIndex = history.lastIndexOf(lastStableNodeId);
                        setHistory(prev => prev.slice(0, targetIndex));
                    } else if (history.length > 0) {
                        // Desperation: Go back one step regardless
                        setCurrentNodeId(history[history.length - 1]);
                        setHistory(prev => prev.slice(0, -1));
                    }
                }
            } else {
                // No history! Try to find the nearest story node as a narrative home
                const storyNode = nodes.find(n => n.type === 'story');
                if (storyNode && storyNode.id !== activeModalNode.id) {
                    setCurrentNodeId(storyNode.id);
                }
            }
        }

        setActiveModalNode(null);
        setIsConfronting(false);
    };

    // Helper to get nice labels for buttons
    const getEdgeLabel = (node) => {
        if (!node) return "Continue";
        if (node.type === 'story') return node.data.label || "Start Dialogue";
        if (node.type === 'evidence') return `Analyze Evidence: ${node.data.label}`;
        if (node.type === 'terminal') return `Command Interface: ${node.data.label}`;
        if (node.type === 'message') return `Decrypted Msg: ${node.data.label}`;
        if (node.type === 'question') return `Decision: ${node.data.label}`;
        if (node.type === 'action') return node.data.label || "Execute Action";
        return `Navigate to ${node.data.label || 'Next Objective'}`;
    }



    // Render Node Content (Background / Story)
    const renderContent = () => {
        if (!currentNode) return <div className="text-zinc-500 animate-pulse">Initializing Neural Link...</div>;

        const { type, data } = currentNode;

        if (type !== 'story') {
            return (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                    <div className="animate-pulse text-zinc-500 text-sm tracking-widest uppercase font-mono">
                        secure link established // accessing subsystem...
                    </div>
                </div>
            )
        }



        // Story Node (Briefing or Narrative)
        const isBriefing = data.label.toLowerCase().includes('briefing') || history.length === 0;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                {isBriefing && (
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(239,68,68,0.3)] backdrop-blur-sm"
                        >
                            TOP SECRET // CLEARANCE LEVEL 5
                        </motion.div>
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 uppercase tracking-tighter drop-shadow-2xl"
                        >
                            {data.label}
                        </motion.h1>
                    </div>
                )}

                {!isBriefing && (
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <FileText className="w-12 h-12 text-indigo-400 animate-pulse" />
                        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 uppercase tracking-tighter drop-shadow-2xl">{data.label}</h2>
                    </div>
                )}

                <Card className="bg-zinc-900/50 border-zinc-800 p-8 backdrop-blur-md border-t-4 border-t-red-600 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:border-zinc-700 transition-colors duration-500">
                    <p className="text-zinc-200 leading-loose whitespace-pre-wrap text-lg md:text-xl font-light font-mono">
                        <TypewriterText text={data.text || data.content || ""} onComplete={() => setIsContentReady(true)} />
                    </p>
                </Card>
            </div>
        );
    };

    // Audio State
    const [isMuted, setIsMuted] = useState(false);
    const [audioSource, setAudioSource] = useState(null);
    const audioRef = useRef(null);

    // Audio Control Loop
    useEffect(() => {
        if (!audioRef.current || !audioSource) return;

        audioRef.current.src = audioSource;
        audioRef.current.loop = true;

        if (!isMuted) {
            audioRef.current.play().catch(e => console.log("Audio autoplay blocked:", e));
        }
    }, [audioSource]);

    useEffect(() => {
        if (!audioRef.current) return;
        if (isMuted) audioRef.current.pause();
        else if (audioSource) audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }, [isMuted, audioSource]);

    // Handle Music Nodes (Auto-play and Auto-advance)
    useEffect(() => {
        if (!currentNode) return;

        if (currentNode.type === 'music') {
            if (currentNode.data.url) {
                setAudioSource(currentNode.data.url);
                addLog(`AUDIO: Now playing background track.`);
            }

            // Auto advance like logic nodes
            // Find edges
            const edgesOut = options.filter(e => e.source === currentNode.id);
            if (edgesOut.length > 0) {
                setTimeout(() => handleOptionClick(edgesOut[0].target), 500);
            }
        }
    }, [currentNode, options]);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col font-sans">
            <BackgroundEffect />
            {/* Audio Player (Hidden) */}
            <audio ref={audioRef} />

            {/* Header */}
            <div className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 shrink-0 relative z-[100]">
                <div className="flex items-center gap-3">
                    <div className="bg-red-600 px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-widest animate-pulse">
                        Case Active
                    </div>
                    {/* Score Display */}
                    {/* Score Display - Prominent */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-yellow-950/20 border border-yellow-600/50 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:bg-yellow-900/20 transition-colors">
                        <div className="p-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 drop-shadow-md" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] text-yellow-600 font-black uppercase tracking-wider mb-0.5">Score</span>
                            <span className="text-2xl font-black text-yellow-400 font-mono tracking-widest drop-shadow-sm">{score}</span>
                        </div>
                    </div>
                    {/* Timer Logic */}
                    {/* Timer Logic - Always Visible & Prominent */}
                    <div className={`fixed top-2 md:top-4 left-1/2 -translate-x-1/2 px-6 py-2 md:px-8 md:py-3 rounded-xl border-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-[120] flex items-center gap-3 backdrop-blur-xl transition-all duration-300 ${timeLeft < 60 || !missionStarted ? 'bg-red-950/90 border-red-500 text-red-500' : 'bg-black/90 border-indigo-500 text-indigo-400'}`}>
                        <Clock className={`w-5 h-5 md:w-6 md:h-6 ${timeLeft < 60 ? 'animate-pulse' : ''}`} />
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                                {missionStarted ? "Time Remaining" : "Mission Timer"}
                            </span>
                            <span className="font-mono text-2xl md:text-3xl font-black tracking-widest drop-shadow-lg">
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    </div>

                </div>
                <div className="flex items-center gap-3">
                    {/* Audio Toggle */}
                    {audioSource && (
                        <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className={isMuted ? "text-red-500" : "text-green-500"}>
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </Button>
                    )}


                    {/* Evidence Board Button */}
                    {missionStarted && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowEvidenceBoard(true)}
                            className="bg-zinc-800 border border-zinc-700 text-amber-500 hover:text-amber-400"
                        >
                            <LayoutGrid className="w-4 h-4 mr-2" />
                            Crazy Wall
                        </Button>
                    )}

                    {missionStarted && (
                        <Button
                            variant="outline"
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 uppercase tracking-wider text-xs font-bold"
                            onClick={() => { setShowAccuseModal(true); setAccusationResult(null); }}
                        >
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Identify Culprit
                        </Button>
                    )}
                    <Button variant="ghost" onClick={() => {
                        if (activeModalNode) handleCloseModal();
                        else if (showEvidenceBoard) setShowEvidenceBoard(false);
                        else if (showAccuseModal) setShowAccuseModal(false);
                        else if (zoomedImage) setZoomedImage(null);
                        else onClose();
                    }}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Content Area - Scrolls vertically */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentNode?.id || 'loading'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-4xl mx-auto w-full pb-20"
                    >
                        {renderContent()}

                        {/* Begin Mission Button (Only for Briefing Node) */}
                        {currentNode && (currentNode.data.label.toLowerCase().includes('briefing') || history.length === 0) && !missionStarted ? (
                            <div className="mt-12 flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                                <Button
                                    onClick={() => setMissionStarted(true)}
                                    className="px-12 py-8 text-xl font-bold tracking-[0.2em] bg-red-600 hover:bg-red-700 text-white border-none shadow-[0_0_50px_rgba(220,38,38,0.4)] hover:shadow-[0_0_80px_rgba(220,38,38,0.6)] hover:scale-105 transition-all duration-300 uppercase"
                                >
                                    Begin Mission
                                </Button>
                            </div>
                        ) : (
                            /* Actions / Choices */
                            // Only show actions if content is ready (text finished typing)
                            // AND if it's not a Logic/Music node (which should be auto-traversing)
                            isContentReady && !['logic', 'music'].includes(currentNode.type) && (
                                <div className="mt-8 animate-in fade-in zoom-in-95 duration-500">
                                    {options.some(e => nodes.find(n => n.id === e.target)?.type === 'suspect') ? (
                                        // Grid Layout for Suspects
                                        <div className="space-y-4">
                                            {/* Only show label if NOT in the dedicated view (fallback) */}
                                            {!(missionStarted && currentNode && currentNode.data.label.toLowerCase().includes('briefing')) && (
                                                <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold tracking-wider uppercase">
                                                    <User className="w-4 h-4" />
                                                    <span>Suspect Database Matches ({options.length})</span>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {options.map((edge, i) => {
                                                    const targetNode = nodes.find(n => n.id === edge.target);
                                                    if (!targetNode || targetNode.type !== 'suspect') return null;

                                                    return (
                                                        <motion.button
                                                            key={edge.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            onClick={() => setActiveModalNode(targetNode)}
                                                            className="group text-left relative overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-0 transition-all hover:shadow-lg hover:shadow-indigo-500/10"
                                                        >
                                                            <div className={`h-24 bg-gradient-to-br ${getAvatarColor(targetNode.data.name || 'Unk')} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                                                            <div className="absolute top-4 left-4">
                                                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(targetNode.data.name || 'Unk')} flex items-center justify-center shadow-lg border-2 border-zinc-900`}>
                                                                    <span className="text-white font-bold text-lg">
                                                                        {(targetNode.data.name || '?').charAt(0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="p-4 pt-2">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate pr-2">
                                                                            {targetNode.data.name}
                                                                        </h3>
                                                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
                                                                            {targetNode.data.role}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-4 flex items-center text-xs text-zinc-600 group-hover:text-zinc-400">
                                                                    <span>Review Profile</span>
                                                                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {(() => {
                                                // Prepare combined list of interactables (Actions defined in data + Generic Edges)
                                                const actions = currentNode.data?.actions || [];
                                                const usedEdges = new Set();

                                                // 1. Explicit Actions
                                                const actionItems = actions.map(action => {
                                                    let edge = options.find(e => e.sourceHandle === action.id);

                                                    // Intelligent Fallback:
                                                    // Map to default edge if not explicitly wired.
                                                    if (!edge) {
                                                        // Broad check for "null" handle
                                                        const defaultEdge = options.find(e =>
                                                            (!e.sourceHandle || e.sourceHandle === 'null') &&
                                                            !usedEdges.has(e.id)
                                                        );

                                                        if (defaultEdge) {
                                                            edge = defaultEdge;
                                                        } else if (actions.length === 1 && options.length === 1 && !usedEdges.has(options[0].id)) {
                                                            // Desperation Fallback: 1 Action, 1 Edge -> Just Link Them
                                                            edge = options[0];
                                                        }
                                                    }

                                                    if (edge) usedEdges.add(edge.id);
                                                    return {
                                                        isAction: true,
                                                        id: action.id,
                                                        label: action.label,
                                                        variant: action.variant,
                                                        target: edge ? edge.target : null,
                                                        edgeId: edge ? edge.id : null
                                                    };
                                                });

                                                // 2. Remaining Edges (Default/Standard Exits)
                                                // STRICT MODE: If custom actions exist, hide generic buttons.
                                                const standardItems = (actions.length > 0)
                                                    ? []
                                                    : options
                                                        .filter(e => !usedEdges.has(e.id))
                                                        .map(edge => ({
                                                            isAction: false,
                                                            id: edge.id,
                                                            target: edge.target,
                                                            edgeId: edge.id
                                                        }));

                                                const allItems = [...actionItems, ...standardItems];

                                                if (allItems.length === 0) return null;

                                                return allItems.map((item, idx) => {
                                                    // Default Styles
                                                    let icon = ArrowRight;
                                                    let color = "text-indigo-400";
                                                    let bg = "bg-indigo-500/10";
                                                    let actionLabel = "PROCEED";
                                                    let title = "";

                                                    // Resolve Target Node info if it exists
                                                    let targetNode = item.target ? nodes.find(n => n.id === item.target) : null;

                                                    // Handle Music Node skipping
                                                    let displayNode = targetNode;
                                                    while (displayNode && displayNode.type === 'music') {
                                                        const outEdges = edges.filter(e => e.source === displayNode.id);
                                                        if (outEdges.length > 0) {
                                                            const next = nodes.find(n => n.id === outEdges[outEdges.length - 1].target); // simplistic next
                                                            if (next) displayNode = next;
                                                            else break;
                                                        } else break;
                                                    }

                                                    if (displayNode) {
                                                        title = displayNode.data.label || displayNode.data.name || "Continue";

                                                        // Type-based icons / colors
                                                        if (displayNode.type === 'story') {
                                                            icon = FileText;
                                                            color = "text-blue-400";
                                                            bg = "bg-blue-500/10";
                                                            actionLabel = "NARRATIVE";
                                                        } else if (displayNode.type === 'suspect') {
                                                            icon = User;
                                                            color = "text-red-400";
                                                            bg = "bg-red-500/10";
                                                            actionLabel = "INVESTIGATE";
                                                            title = displayNode.data.name || title;
                                                        } else if (displayNode.type === 'evidence') {
                                                            icon = Search;
                                                            color = "text-yellow-400";
                                                            bg = "bg-yellow-500/10";
                                                            actionLabel = "EXAMINE";
                                                        } else if (displayNode.type === 'media') {
                                                            icon = ImageIcon;
                                                            color = "text-orange-400";
                                                            bg = "bg-orange-500/10";
                                                            actionLabel = "VIEW ASSET";
                                                        } else if (displayNode.type === 'terminal') {
                                                            icon = Terminal;
                                                            color = "text-green-400";
                                                            bg = "bg-green-500/10";
                                                            actionLabel = "HACK TERMINAL";
                                                        } else if (displayNode.type === 'message') {
                                                            icon = MessageSquare;
                                                            color = "text-violet-400";
                                                            bg = "bg-violet-500/10";
                                                            actionLabel = "INCOMING";
                                                            actionLabel = "INCOMING";
                                                        } else if (displayNode.type === 'question') {
                                                            icon = HelpCircle;
                                                            color = "text-fuchsia-400";
                                                            bg = "bg-fuchsia-500/10";
                                                            actionLabel = "QUIZ";
                                                        } else if (displayNode.type === 'action') {
                                                            icon = MousePointerClick;
                                                            color = "text-indigo-400";
                                                            bg = "bg-indigo-500/10";
                                                            actionLabel = "INTERACTION";
                                                        }
                                                    }

                                                    // Override if it is an Explicit Action
                                                    if (item.isAction) {
                                                        icon = MousePointerClick;
                                                        title = item.label;
                                                        actionLabel = "";
                                                        // Base style: Dynamic scale, glass border, rich shadow
                                                        const baseShadow = "transition-all duration-300 hover:scale-[1.02] border backdrop-blur-sm shadow-lg";

                                                        switch (item.variant) {
                                                            case 'danger': // Intense Red Pulse
                                                                color = "text-white";
                                                                bg = `bg-gradient-to-r from-red-600 to-red-900 border-red-400/50 hover:border-red-400 hover:from-red-500 hover:to-red-800 hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] ${baseShadow}`;
                                                                break;
                                                            case 'primary': // Electric Blue
                                                                color = "text-white";
                                                                bg = `bg-gradient-to-r from-blue-600 to-indigo-900 border-blue-400/50 hover:border-blue-400 hover:from-blue-500 hover:to-indigo-800 hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] ${baseShadow}`;
                                                                break;
                                                            case 'success': // Cyber Green
                                                                color = "text-white";
                                                                bg = `bg-gradient-to-r from-emerald-500 to-green-900 border-emerald-400/50 hover:border-emerald-400 hover:from-emerald-400 hover:to-green-800 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] ${baseShadow}`;
                                                                break;
                                                            case 'warning': // Neon Amber
                                                                color = "text-black";
                                                                bg = `bg-gradient-to-r from-amber-400 to-orange-600 border-amber-300/50 hover:border-amber-300 hover:from-amber-300 hover:to-orange-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] ${baseShadow}`;
                                                                break;
                                                            case 'mystic': // Deep Void Purple
                                                                color = "text-white";
                                                                bg = `bg-gradient-to-r from-violet-600 to-fuchsia-900 border-violet-400/50 hover:border-violet-400 hover:from-violet-500 hover:to-fuchsia-800 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] ${baseShadow}`;
                                                                break;
                                                            case 'tech': // Holographic Cyan
                                                                color = "text-black";
                                                                bg = `bg-gradient-to-r from-cyan-400 to-blue-600 border-cyan-300/50 hover:border-cyan-300 hover:from-cyan-300 hover:to-blue-500 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] ${baseShadow}`;
                                                                break;
                                                            case 'outline': // Ghost Wireframe
                                                                color = "text-zinc-300";
                                                                bg = `bg-transparent border border-zinc-500 hover:border-white hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] ${baseShadow}`;
                                                                break;
                                                            default:
                                                                // Metallic Zinc
                                                                color = "text-zinc-100";
                                                                bg = `bg-gradient-to-r from-zinc-700 to-zinc-900 border-zinc-500/50 hover:border-zinc-400 hover:from-zinc-600 hover:to-zinc-800 hover:shadow-[0_0_20px_rgba(113,113,122,0.3)] ${baseShadow}`;
                                                                break;
                                                        }
                                                    }

                                                    // "Disabled" state look
                                                    if (!item.target) {
                                                        color = "text-zinc-600";
                                                        bg = "bg-zinc-800/50";
                                                        title = item.label || "Unconnected Path";
                                                        actionLabel = "UNAVAILABLE";
                                                    }

                                                    const Icon = icon;

                                                    return (
                                                        <motion.button
                                                            key={`${item.id}-${idx}`}
                                                            layout
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.1 }}
                                                            whileHover={item.target ? { scale: 1.02, x: 5 } : {}}
                                                            whileTap={item.target ? { scale: 0.98 } : {}}
                                                            onClick={() => item.target && handleOptionClick(item.target)}
                                                            disabled={!item.target}
                                                            className={`w-full text-center rounded-xl transition-all group relative overflow-hidden flex items-center gap-4 
                                                            ${!item.target ? 'cursor-not-allowed border border-zinc-900 opacity-60 p-4' : 'cursor-pointer'}
                                                            ${item.isAction && item.target
                                                                    ? `${bg} p-6`
                                                                    : "bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 shadow-none hover:shadow-lg hover:shadow-indigo-500/10 p-4"
                                                                }`}
                                                        >
                                                            <div className={`rounded-lg ${item.isAction ? 'bg-black/30' : bg} ${item.isAction ? 'p-2' : 'p-3'} border border-white/5 ${item.target && 'group-hover:scale-110'} transition-transform shrink-0`}>
                                                                <Icon className={`${item.isAction ? 'w-6 h-6' : 'w-5 h-5'} ${color}`} />
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
                                                                {actionLabel && (
                                                                    <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                                                                        {actionLabel}
                                                                    </div>
                                                                )}
                                                                <div className={`truncate transition-colors ${item.isAction ? `${color} drop-shadow-md text-xl font-bold uppercase tracking-[0.15em]` : 'text-zinc-200 group-hover:text-white text-lg font-bold'}`}>
                                                                    {title}
                                                                </div>
                                                            </div>

                                                            {item.target && (
                                                                <ArrowRight className={`w-5 h-5 transform group-hover:translate-x-1 transition-all shrink-0 ${item.isAction ? color : 'text-zinc-600 group-hover:text-indigo-400'}`} />
                                                            )}
                                                        </motion.button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Generic Interaction Modal (Replaces Suspect Modal) */}
            <AnimatePresence>
                {activeModalNode && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-950 border border-zinc-800 p-0 rounded-2xl max-w-2xl w-full relative overflow-hidden shadow-2xl shadow-black max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Close Button */}
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 z-[110] p-2 bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/5 hover:border-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {activeModalNode.type === 'suspect' && (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <div className="h-32 bg-gradient-to-r from-zinc-900 to-black relative shrink-0">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${getAvatarColor(activeModalNode.data.name)} opacity-20`}></div>

                                        <div className="absolute -bottom-10 left-8 flex items-end">
                                            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getAvatarColor(activeModalNode.data.name)} p-1 shadow-xl border-4 border-zinc-950`}>
                                                <div className="w-full h-full bg-black/20 rounded-xl flex items-center justify-center">
                                                    <span className="text-4xl font-bold text-white">{(activeModalNode.data.name || 'S').charAt(0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-14 px-8 pb-8 flex-1 overflow-y-auto flex flex-col">
                                        <div className="flex items-start justify-between mb-8">
                                            <div>
                                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{activeModalNode.data.name}</h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-black tracking-widest uppercase rounded border border-red-500/30">
                                                        {activeModalNode.data.role}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase rounded border border-zinc-700">
                                                        Interrogating
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex flex-col items-end gap-1">
                                                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Case Profile</div>
                                                <div className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded font-mono text-[10px] text-zinc-500">
                                                    #{activeModalNode.id.substring(0, 8).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* THE STATEMENT (DENIAL) */}
                                        <div className="relative mb-10 group">
                                            <div className="absolute -inset-2 bg-gradient-to-r from-red-500/5 to-indigo-500/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="relative bg-zinc-900/40 border-l-4 border-indigo-500 p-8 rounded-r-2xl shadow-2xl backdrop-blur-md">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                                                    <span className="text-[10px] font-black text-indigo-400/70 uppercase tracking-[0.3em]">Current Testimony</span>
                                                </div>
                                                <p className="text-xl md:text-2xl font-medium text-zinc-100 leading-relaxed italic tracking-tight">
                                                    "{activeModalNode.data.alibi || "I have nothing to say to you. I was nowhere near the scene when it happened."}"
                                                </p>
                                                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Stress Level</span>
                                                            <div className="w-32 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: "10%" }}
                                                                    animate={{ width: inventory.size > 0 ? `${Math.min(90, 10 + (inventory.size * 15))}%` : "10%" }}
                                                                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-500 animate-pulse uppercase tracking-wider">Analyzing Statement...</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-12 flex-1">
                                            {/* EVIDENCE PANEL (Primary Interaction) */}
                                            <div className="space-y-6">
                                                <div className="bg-black/60 border border-zinc-800/50 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                                        <Search className="w-24 h-24 text-white" />
                                                    </div>

                                                    {(() => {
                                                        const collectedEvidence = Array.from(inventory)
                                                            .map(id => nodes.find(n => n.id === id && n.type === 'evidence'))
                                                            .filter(Boolean);

                                                        return (
                                                            <>
                                                                <div className="flex items-center justify-between mb-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                                                            <Search className="w-4 h-4 text-amber-500" />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-sm font-black text-white uppercase tracking-wider">Confront with Evidence</h4>
                                                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Challenge the subject's statement to force a breakthrough</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                                                        <span className="text-[9px] font-black text-amber-500 uppercase">{collectedEvidence.length} Items Logged</span>
                                                                    </div>
                                                                </div>

                                                                {collectedEvidence.length > 0 ? (
                                                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                                                        {collectedEvidence.map(eNode => (
                                                                            <motion.button
                                                                                key={eNode.id}
                                                                                whileHover={{ y: -5, scale: 1.05 }}
                                                                                whileTap={{ scale: 0.95 }}
                                                                                onClick={() => {
                                                                                    const match = edges.find(e =>
                                                                                        e.source === activeModalNode.id &&
                                                                                        (e.label?.toLowerCase() === eNode.data.label?.toLowerCase() || e.data?.evidenceId === eNode.id)
                                                                                    );
                                                                                    if (match) {
                                                                                        addLog(`BREAKTHROUGH: Subject's story collapsed when confronted with ${eNode.data.label}.`);
                                                                                        setActiveModalNode(null);
                                                                                        setIsConfronting(false);
                                                                                        handleOptionClick(match.target);
                                                                                    } else {
                                                                                        addLog(`STALEMATE: ${activeModalNode.data.name} remains defiant. ${eNode.data.label} was dismissed.`);
                                                                                    }
                                                                                }}
                                                                                className="group"
                                                                            >
                                                                                <div className="aspect-square bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group-hover:border-amber-500 transition-all shadow-lg shadow-black/80 relative">
                                                                                    {eNode.data.image ? (
                                                                                        <img src={eNode.data.image} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                                            <Search className="w-6 h-6 text-zinc-800 group-hover:text-amber-500" />
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />
                                                                                    <div className="absolute inset-x-0 bottom-0 p-2 text-center pointer-events-none">
                                                                                        <div className="text-[8px] font-black text-white/50 group-hover:text-white uppercase truncate tracking-widest">{eNode.data.label}</div>
                                                                                    </div>
                                                                                </div>
                                                                            </motion.button>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-3xl bg-zinc-900/10">
                                                                        <Briefcase className="w-10 h-10 text-zinc-800 mb-4" />
                                                                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No physical evidence in possession</p>
                                                                        <p className="text-[10px] text-zinc-700 mt-1 uppercase">Acquire clues from the field to proceed</p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* DIALOGUE PANEL (Branching paths) */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                                                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                                                    </div>
                                                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Investigation Threads</h4>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {(() => {
                                                        const nodeActions = activeModalNode.data.actions || [];
                                                        const dialogueEdges = edges.filter(e => e.source === activeModalNode.id && !e.label?.startsWith('evidence:') && !e.data?.isEvidenceLink);
                                                        const handledEdgeIds = new Set();

                                                        const actionThreads = nodeActions.map(action => {
                                                            const edge = dialogueEdges.find(e => e.sourceHandle === action.id);
                                                            if (edge) handledEdgeIds.add(edge.id);
                                                            return { id: action.id, label: action.label, target: edge?.target };
                                                        }).filter(t => t.target);

                                                        const genericThreads = dialogueEdges.filter(e => !handledEdgeIds.has(e.id)).map(e => {
                                                            const targetNode = nodes.find(n => n.id === e.target);
                                                            return { id: e.id, label: e.label || getEdgeLabel(targetNode), target: e.target };
                                                        });

                                                        const allThreads = [...actionThreads, ...genericThreads];

                                                        return allThreads.map((thread) => (
                                                            <button
                                                                key={thread.id}
                                                                onClick={() => { setActiveModalNode(null); setIsConfronting(false); handleOptionClick(thread.target); }}
                                                                className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-900 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-2xl transition-all group"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all shadow-inner">
                                                                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white" />
                                                                    </div>
                                                                    <span className="text-[13px] font-bold text-zinc-400 group-hover:text-white transition-colors tracking-tight uppercase">
                                                                        {thread.label}
                                                                    </span>
                                                                </div>
                                                                <ArrowRight className="w-4 h-4 text-zinc-800 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                                            </button>
                                                        ));
                                                    })()}

                                                    {edges.filter(e => e.source === activeModalNode.id && !e.label?.startsWith('evidence:') && !e.data?.isEvidenceLink).length === 0 && (
                                                        <div className="md:col-span-2 p-10 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
                                                            <p className="text-zinc-700 font-black text-[10px] uppercase tracking-[0.3em]">No further dialogue paths identified</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeModalNode.type === 'evidence' && (
                                <div className="p-8 border-t-4 border-yellow-500 bg-zinc-900/50">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 text-yellow-500">
                                            <Search className="w-8 h-8" />
                                            <h2 className="text-2xl font-bold text-white uppercase">Evidence Logged</h2>
                                        </div>

                                    </div>

                                    <Card className="p-8 bg-black border-yellow-900/30 mb-6">
                                        {activeModalNode.data.image && (
                                            <div className="w-full mb-6 rounded-lg overflow-hidden border border-yellow-900/50 shadow-2xl relative group">
                                                <img src={activeModalNode.data.image} alt="Evidence" className="w-full h-auto object-contain max-h-[400px]" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setZoomedImage(activeModalNode.data.image)}>
                                                    <div className="flex items-center gap-2 bg-black/80 text-white px-4 py-2 rounded-full border border-white/20 backdrop-blur-md transform scale-95 group-hover:scale-100 transition-transform">
                                                        <ZoomIn className="w-5 h-5" />
                                                        <span className="text-sm font-bold uppercase tracking-wider">Investigate</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <h3 className="text-2xl font-bold text-yellow-200 mb-4">{activeModalNode.data.label}</h3>
                                        <p className="text-zinc-300 text-lg leading-relaxed">{activeModalNode.data.description}</p>
                                    </Card>

                                    <div className="flex justify-end">
                                        <Button
                                            className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
                                            onClick={() => {
                                                // Auto-advance if there is a single path out (often back to story or next clue)
                                                // Or just close
                                                const next = edges.find(e => e.source === activeModalNode.id);
                                                setActiveModalNode(null);
                                                if (next) handleOptionClick(next.target);
                                            }}
                                        >
                                            Process & Continue <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Terminal Layout */}
                            {activeModalNode.type === 'terminal' && (
                                <AdvancedTerminal
                                    node={activeModalNode}
                                    edges={edges}
                                    onComplete={(cmd) => handleTerminalSubmit(cmd, true)}
                                    onFail={() => handleCloseModal()}
                                    addLog={addLog}
                                />
                            )}

                            {/* Message Layout */}
                            {activeModalNode.type === 'message' && (
                                <div className="p-8 bg-zinc-900 border-t-4 border-violet-500">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 text-violet-400">
                                            <MessageSquare className="w-6 h-6" />
                                            <h2 className="text-xl font-bold text-white uppercase">Incoming Transmission</h2>
                                        </div>

                                    </div>

                                    <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 relative">
                                        <div className="absolute top-4 right-4 text-xs font-bold text-zinc-600 uppercase">ENCRYPTED</div>
                                        <span className="text-xs font-bold text-indigo-400 block mb-2">FROM: {activeModalNode.data.sender || 'Unknown'}</span>
                                        <p className="text-zinc-200 text-lg font-mono leading-relaxed">{activeModalNode.data.message || activeModalNode.data.content}</p>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const next = edges.find(e => e.source === activeModalNode.id);
                                                setActiveModalNode(null);
                                                if (next) handleOptionClick(next.target);
                                            }}
                                        >
                                            Close Transmission
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Media Layout */}
                            {activeModalNode.type === 'media' && (
                                <div className="p-0 bg-black flex flex-col w-full h-full min-h-0">
                                    <div className="relative p-6 border-b border-orange-500/30 flex items-start justify-between bg-zinc-900 overflow-hidden shrink-0">
                                        {/* Background Decoration */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-transparent to-transparent pointer-events-none" />

                                        <div className="relative flex items-center gap-4 z-10">
                                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                                                <ImageIcon className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                    <span className="text-[10px] font-bold tracking-[0.2em] text-orange-500 uppercase">Secure Asset</span>
                                                </div>
                                                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                                                    {activeModalNode.data.label}
                                                </h2>
                                            </div>
                                        </div>


                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center min-h-0">
                                        {activeModalNode.data.mediaType === 'video' ? (
                                            <div className="w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 shadow-2xl mb-6 shrink-0">
                                                {(activeModalNode.data.url?.includes('youtube.com') || activeModalNode.data.url?.includes('youtu.be')) ? (
                                                    <iframe
                                                        src={activeModalNode.data.url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                                                        className="w-full h-full"
                                                        allow="autoplay; encrypted-media"
                                                        allowFullScreen
                                                        title="Video Asset"
                                                    />
                                                ) : (
                                                    <video controls src={activeModalNode.data.url} className="w-full h-full" />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-full max-w-3xl mb-6 flex justify-center shrink-0">
                                                <img
                                                    src={activeModalNode.data.url}
                                                    alt="Asset"
                                                    className="max-w-full max-h-[60vh] h-auto w-auto mx-auto rounded-lg border border-zinc-800 shadow-2xl block"
                                                />
                                            </div>
                                        )}

                                        <div className="w-full max-w-3xl bg-zinc-900/80 p-6 rounded-xl border border-zinc-800 backdrop-blur-sm shrink-0">
                                            <h3 className="text-orange-200 font-bold mb-2">{activeModalNode.data.label}</h3>
                                            <p className="text-zinc-300 leading-relaxed">{activeModalNode.data.text}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end shrink-0 z-20">
                                        <Button
                                            className="bg-orange-600 hover:bg-orange-700 text-white"
                                            onClick={() => {
                                                const next = edges.find(e => e.source === activeModalNode.id);
                                                setActiveModalNode(null);
                                                if (next) handleOptionClick(next.target);
                                            }}
                                        >
                                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Notification Layout */}
                            {activeModalNode.type === 'notification' && (
                                <div className="p-8 bg-zinc-900 border-t-4 border-sky-500 h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(14,165,233,0.15)] animate-pulse">
                                        <Bell className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white mb-6 tracking-tight uppercase">{activeModalNode.data.label || 'System Notification'}</h2>
                                    <p className="text-zinc-300 text-lg leading-relaxed mb-10 max-w-lg font-medium">
                                        {activeModalNode.data.message}
                                    </p>
                                    <Button
                                        className={`w-full max-w-sm py-6 text-lg font-bold tracking-wider uppercase transition-all transform hover:scale-105 ${activeModalNode.data.buttonStyle === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' :
                                            activeModalNode.data.buttonStyle === 'primary' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20' :
                                                activeModalNode.data.buttonStyle === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20' :
                                                    activeModalNode.data.buttonStyle === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-900/20' :
                                                        'bg-white text-black hover:bg-zinc-200 shadow-white/10'
                                            } shadow-xl`}
                                        onClick={() => {
                                            const next = edges.find(e => e.source === activeModalNode.id);
                                            setActiveModalNode(null);
                                            if (next) handleOptionClick(next.target);
                                        }}
                                    >
                                        {activeModalNode.data.buttonText || "Continue"}
                                    </Button>

                                </div>
                            )}

                            {/* Question Layout */}
                            {activeModalNode.type === 'question' && (
                                <div className="p-8 bg-zinc-900 border-t-4 border-fuchsia-500 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 text-fuchsia-400">
                                            <HelpCircle className="w-8 h-8" />
                                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Challenge / Quiz</h2>
                                        </div>

                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        <p className="text-xl text-white font-medium leading-relaxed mb-8">
                                            {activeModalNode.data.question}
                                        </p>

                                        <div className="space-y-3">
                                            {(activeModalNode.data.options || []).map((opt) => {
                                                const isSelected = userAnswers.has(opt.id);
                                                return (
                                                    <div
                                                        key={opt.id}
                                                        onClick={() => {
                                                            const newSet = new Set(activeModalNode.data.selectionType === 'multi' ? userAnswers : []);
                                                            if (newSet.has(opt.id)) newSet.delete(opt.id);
                                                            else newSet.add(opt.id);
                                                            setUserAnswers(newSet);
                                                        }}
                                                        className={`p-4 rounded-lg border text-lg cursor-pointer transition-all flex items-center gap-4 ${isSelected
                                                            ? 'bg-fuchsia-500/20 border-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/10'
                                                            : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900'
                                                            }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-zinc-600'}`}>
                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                        </div>
                                                        {opt.text}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-end">
                                        <Button
                                            id="quiz-submit-btn"
                                            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-8 py-6 text-lg font-bold tracking-wider"
                                            onClick={handleQuestionSubmit}
                                            disabled={userAnswers.size === 0}
                                        >
                                            Submit Answer
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Lockpick Minigame Layout */}
                            {activeModalNode.type === 'lockpick' && (
                                <LockpickMinigame
                                    node={activeModalNode}
                                    onSuccess={() => {
                                        const next = edges.find(e => e.source === activeModalNode.id);
                                        // Set Success Variable
                                        if (activeModalNode.data.variableId) {
                                            setInventory(prev => new Set([...prev, activeModalNode.data.variableId]));
                                            setNodeOutputs(prev => ({ ...prev, [activeModalNode.data.variableId]: true }));
                                        }
                                        setActiveModalNode(null);
                                        if (next) handleOptionClick(next.target);
                                    }}
                                    onFail={() => {
                                        // Maybe damage score or just retry? For now, retry is standard.
                                        addLog("LOCKPICK FAILED: Tumblers reset.");
                                    }}
                                />
                            )}

                            {/* Keypad Minigame Layout */}
                            {activeModalNode.type === 'keypad' && (
                                <KeypadMinigame
                                    node={activeModalNode}
                                    onSuccess={() => {
                                        const next = edges.find(e => e.source === activeModalNode.id);
                                        if (activeModalNode.data.variableId) {
                                            setInventory(prev => new Set([...prev, activeModalNode.data.variableId]));
                                            setNodeOutputs(prev => ({ ...prev, [activeModalNode.data.variableId]: true }));
                                        }
                                        setActiveModalNode(null);
                                        if (next) handleOptionClick(next.target);
                                    }}
                                />
                            )}

                            {/* Decryption Minigame Layout */}
                            {activeModalNode.type === 'decryption' && (
                                <DecryptionMinigame
                                    node={activeModalNode}
                                    onSuccess={() => {
                                        const next = edges.find(e => e.source === activeModalNode.id);
                                        if (activeModalNode.data.variableId) {
                                            setInventory(prev => new Set([...prev, activeModalNode.data.variableId]));
                                            setNodeOutputs(prev => ({ ...prev, [activeModalNode.data.variableId]: true }));
                                        }
                                        setActiveModalNode(null);
                                        if (next) handleOptionClick(next.target);
                                    }}
                                />
                            )}

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Image Zoom Lightbox */}
            <AnimatePresence>
                {zoomedImage && (
                    <div
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                        onClick={() => setZoomedImage(null)}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                            className="absolute top-6 right-6 p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-full z-[210] transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="max-w-[95vw] max-h-[95vh] relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={zoomedImage}
                                alt="Zoomed Asset"
                                className="max-w-full max-h-[90vh] object-contain rounded border border-zinc-800 shadow-2xl"
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Evidence Board (Crazy Wall) */}
            < AnimatePresence >
                {showEvidenceBoard && (
                    <EvidenceBoard
                        inventory={inventory}
                        nodes={nodes}
                        history={history}
                        onClose={() => setShowEvidenceBoard(false)}
                        boardItems={boardItems}
                        setBoardItems={setBoardItems}
                        connections={boardConnections}
                        setConnections={setBoardConnections}
                        notes={boardNotes}
                        setNotes={setBoardNotes}
                        onOpenDossier={(nodeId) => {
                            const node = nodes.find(n => n.id === nodeId);
                            if (node) {
                                setActiveModalNode(node);
                                setShowEvidenceBoard(false);
                            }
                        }}
                    />
                )}
            </AnimatePresence >

            {/* Accusation Modal */}
            < AnimatePresence >
                {showAccuseModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                        >
                            <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                    <ShieldAlert className="w-8 h-8 text-red-600" />
                                    Identify The Culprit
                                </h2>
                                <Button variant="ghost" onClick={() => {
                                    if (accusationResult === 'success' || accusationResult === 'timeout') {
                                        handleFinish();
                                    } else {
                                        setShowAccuseModal(false);
                                    }
                                }}>
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8">
                                {!accusationResult && (
                                    <>
                                        <p className="text-zinc-400 text-center mb-8 max-w-lg mx-auto">
                                            Review the evidence carefully. Selecting the wrong suspect will result in immediate termination of the investigation.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {nodes.filter(n => n.type === 'suspect').map((suspect) => (
                                                <button
                                                    key={suspect.id}
                                                    onClick={() => handleAccuse(suspect)}
                                                    className="group relative flex flex-col items-center p-6 bg-zinc-900/50 border border-zinc-900 hover:border-red-500/50 rounded-xl transition-all hover:bg-zinc-900"
                                                >
                                                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(suspect.data.name)} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                        <span className="text-3xl font-bold text-white shadow-black drop-shadow-lg">{suspect.data.name.charAt(0)}</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-400 transition-colors">{suspect.data.name}</h3>
                                                    <p className="text-xs text-zinc-500 uppercase tracking-wider">{suspect.data.role}</p>
                                                    <div className="absolute inset-0 border-2 border-red-500/0 group-hover:border-red-500/20 rounded-xl transition-colors pointer-events-none"></div>
                                                </button>
                                            ))}
                                            {nodes.filter(n => n.type === 'suspect').length === 0 && (
                                                <div className="col-span-full text-center text-zinc-500 py-10">
                                                    No suspects found in database.
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {accusationResult === 'success' && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500 w-full">
                                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 border-4 border-green-500">
                                            <CheckCircle className="w-12 h-12 text-green-500" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-4">CASE CLOSED</h2>
                                        <p className="text-xl text-zinc-300 max-w-xl mb-6">
                                            Excellent work, Detective. The culprit has been identified and apprehended.
                                        </p>

                                        {/* Performance Report */}
                                        <LearningReport
                                            scores={playerObjectiveScores}
                                            objectives={gameMetadata?.learningObjectives || []}
                                        />

                                        {activeAccusationNode && activeAccusationNode.data.reasoning && (
                                            <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg max-w-xl w-full text-left mt-6">
                                                <h4 className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Case Resolution</h4>
                                                <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{activeAccusationNode.data.reasoning}</p>
                                            </div>
                                        )}
                                        <Button
                                            className="mt-8 bg-white text-black hover:bg-zinc-200"
                                            onClick={handleFinish}
                                        >
                                            Return to Headquarters
                                        </Button>
                                    </div>
                                )}

                                {accusationResult === 'failure' && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500 w-full">
                                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border-4 border-red-500">
                                            <X className="w-12 h-12 text-red-500" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-4">MISSION FAILED</h2>
                                        <p className="text-xl text-zinc-300 max-w-xl">
                                            You accused the wrong person. The real perpetrator escaped while you were distracted.
                                        </p>

                                        {/* Performance Report */}
                                        <LearningReport
                                            scores={playerObjectiveScores}
                                            objectives={gameMetadata?.learningObjectives || []}
                                        />

                                        <div className="flex gap-4 mt-8">
                                            <Button
                                                variant="outline"
                                                className="border-zinc-700 hover:bg-zinc-800"
                                                onClick={() => setAccusationResult(null)}
                                            >
                                                Review Evidence Again
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={handleFinish}
                                            >
                                                Accept Failure
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {accusationResult === 'timeout' && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500 w-full">
                                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border-4 border-red-500">
                                            <AlertTriangle className="w-12 h-12 text-red-500" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-4">TIME EXPIRED</h2>
                                        <p className="text-xl text-zinc-300 max-w-xl">
                                            The operational window has closed. The culprit has escaped jurisdiction.
                                        </p>

                                        {/* Performance Report */}
                                        <LearningReport
                                            scores={playerObjectiveScores}
                                            objectives={gameMetadata?.learningObjectives || []}
                                        />

                                        <Button
                                            className="mt-8 bg-white text-black hover:bg-zinc-200"
                                            onClick={handleFinish}
                                        >
                                            Abort Mission
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </div >
    );
};

// Learning Report Component
const LearningReport = ({ scores, objectives }) => {
    if (!objectives || objectives.length === 0) return null;

    // Aggregate scores by category
    const categoryStats = objectives.map(cat => {
        let catScore = 0;
        let interactionCount = 0;

        cat.objectives.forEach((obj, idx) => {
            const objId = `${cat.id}:${idx}`;
            if (scores[objId]) {
                catScore += scores[objId];
                interactionCount++;
            }
        });

        return { ...cat, totalScore: catScore, interactionCount };
    }).filter(c => c.interactionCount > 0 || c.totalScore !== 0);

    if (categoryStats.length === 0) return null;

    return (
        <div className="w-full max-w-2xl bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Performance Report
            </h3>

            <div className="space-y-4">
                {categoryStats.map(cat => (
                    <div key={cat.id} className="relative">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-bold text-zinc-300 uppercase">{cat.category}</span>
                            <span className={`font-mono font-bold ${cat.totalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {cat.totalScore > 0 ? '+' : ''}{cat.totalScore} PTS
                            </span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${cat.totalScore >= 0 ? 'bg-indigo-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(100, Math.abs(cat.totalScore))}%` }}
                            />
                        </div>
                        {/* Areas for Improvement / Feedback */}
                        {cat.totalScore < 0 && (
                            <p className="text-[10px] text-red-400 mt-1 italic">
                                Area for Improvement: Review {cat.category} fundamentals. High error rate detected.
                            </p>
                        )}
                        {cat.totalScore > 0 && (
                            <p className="text-[10px] text-green-500/70 mt-1 italic">
                                Strong performance in this sector.
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GamePreview;
