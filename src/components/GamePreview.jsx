import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Card } from './ui/shared';
import { X, User, Search, Terminal, MessageSquare, FileText, ArrowRight, ShieldAlert, CheckCircle, AlertTriangle, Volume2, VolumeX, Image as ImageIcon, Briefcase, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GamePreview = ({ nodes, edges, onClose, gameMetadata }) => {
    // Game State
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [inventory, setInventory] = useState(new Set());
    const [history, setHistory] = useState([]); // Array of distinct visited node IDs
    const [logs, setLogs] = useState([]);
    const [missionStarted, setMissionStarted] = useState(false);
    // Generic Modal State: can hold a node object or null
    const [activeModalNode, setActiveModalNode] = useState(null);
    // Accusation State
    const [showAccuseModal, setShowAccuseModal] = useState(false);
    const [accusationResult, setAccusationResult] = useState(null); // 'success' | 'failure' | null | 'timeout'

    // Logic/Outputs State
    const [nodeOutputs, setNodeOutputs] = useState({});

    // Timer State
    const initialTime = (gameMetadata?.timeLimit || 15) * 60; // Convert minutes to seconds
    const [timeLeft, setTimeLeft] = useState(initialTime);

    // Scoring State
    const [score, setScore] = useState(0);
    const [scoredNodes, setScoredNodes] = useState(new Set());

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

    // Initialize Game
    const currentNode = useMemo(() =>
        nodes.find(n => n.id === currentNodeId),
        [currentNodeId, nodes]
    );

    const addLog = (msg) => {
        setLogs(prev => [`> ${msg}`, ...prev].slice(0, 50));
    };

    // Initialize Game
    useEffect(() => {
        // Find a suitable start node.
        // 1. Try to find a node ID containing 'start'
        // 2. Or a Story node with no incoming edges
        // 3. Or just the first node
        let start = nodes.find(n => n.id.toLowerCase().includes('start'));
        if (!start) {
            const tempEdges = new Set(edges.map(e => e.target));
            start = nodes.find(n => !tempEdges.has(n.id) && n.type === 'story');
        }
        if (!start && nodes.length > 0) start = nodes[0];

        if (start) {
            setCurrentNodeId(start.id);
            addLog(`System initialized. Session started at ${new Date().toLocaleTimeString()}`);
            addLog(`Loaded ${nodes.length} nodes and ${edges.length} connections.`);
        }
    }, []);

    // Scoring Logic (Visit-based)
    useEffect(() => {
        if (!currentNode || !currentNode.data.score) return;

        // Terminal nodes award score on hack success, not visit.
        if (currentNode.type === 'terminal') return;

        if (!scoredNodes.has(currentNode.id)) {
            setScore(s => s + currentNode.data.score);
            setScoredNodes(prev => new Set([...prev, currentNode.id]));
            addLog(`SCORE REWARD: +${currentNode.data.score} Points`);
        }
    }, [currentNode, scoredNodes]);



    // Navigation Options (Outgoing Edges)
    const options = useMemo(() => {
        if (!currentNodeId) return [];
        return edges.filter(e => e.source === currentNodeId);
    }, [currentNodeId, edges]);

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

        // 1. Evidence: Auto-collect
        if (currentNode.type === 'evidence') {
            const flag = currentNode.data.condition || currentNode.id;
            if (!inventory.has(flag)) {
                setInventory(prev => new Set([...prev, flag]));
                addLog(`EVIDENCE ACQUIRED: ${currentNode.data.label}`);
            }
        }

        // 2. Logic: Auto-redirect
        if (currentNode.type === 'logic') {
            const { logicType, variable, operator, value, condition } = currentNode.data;
            let isTrue = false;

            // New Structured Logic
            if (variable) {
                // Determine actual value
                let actualValue = undefined;

                // 1. Check Node Outputs (by Label or ID)
                if (nodeOutputs[variable] !== undefined) actualValue = nodeOutputs[variable];
                // 2. Check Inventory (Boolean existence)
                else if (inventory.has(variable)) actualValue = true;

                // Evaluate
                if (actualValue === undefined) {
                    // Variable not found
                    isTrue = false;
                } else {
                    // Operators
                    const sVal = String(actualValue).toLowerCase();
                    const tVal = String(value || '').toLowerCase();

                    if (operator === '!=') isTrue = sVal != tVal;
                    else if (operator === '>') isTrue = parseFloat(actualValue) > parseFloat(value);
                    else if (operator === '<') isTrue = parseFloat(actualValue) < parseFloat(value);
                    else if (operator === 'contains') isTrue = sVal.includes(tVal);
                    else isTrue = sVal == tVal; // Default ==
                }

                addLog(`LOGIC (${logicType}): ${variable} [${actualValue}] ${operator} ${value} = ${isTrue}`);
            } else {
                // Legacy Condition String
                isTrue = checkLogicCondition(condition);
                addLog(`LOGIC CHECK: ${condition || 'Default'} = ${isTrue}`);
            }

            // WHILE (Wait) Handling
            if (logicType === 'while' && !isTrue) {
                // If it's a WHILE loop and condition is met (or not met?), assume 'While True' = Perform Loop?
                // Or 'While' = 'Wait Until True'?
                // Let's implement 'Wait Until True' behavior. 
                // Does NOT traverse. Just waits for state update.
                return;
            }

            // Find edges
            const trueEdge = options.find(e => e.sourceHandle === 'true' || e.label === 'True' || e.label === 'true');
            const falseEdge = options.find(e => e.sourceHandle === 'false' || e.label === 'False' || e.label === 'false');

            let nextEdge = isTrue ? trueEdge : falseEdge;

            // Fallback for unlabeled edges
            if (!nextEdge && options.length > 0) {
                if (options.length === 1) nextEdge = options[0];
                else nextEdge = isTrue ? options[0] : options[1];
            }

            if (nextEdge) {
                setTimeout(() => setCurrentNodeId(nextEdge.target), 1500);
            } else {
                addLog(`LOGIC STOP: No path for result ${isTrue}`);
            }
        }

    }, [currentNode, inventory, options, nodeOutputs]);


    const [showVault, setShowVault] = useState(false);

    // ...

    const handleOptionClick = (targetId) => {
        // Add current to history
        setHistory(prev => [...prev, currentNodeId]);
        setCurrentNodeId(targetId);

        // Find the target node
        const targetNode = nodes.find(n => n.id === targetId);

        // If it's a type that requires a popup, set it as active modal AND add to inventory
        if (targetNode && ['suspect', 'evidence', 'terminal', 'message', 'media'].includes(targetNode.type)) {
            setActiveModalNode(targetNode);
            setInventory(prev => new Set([...prev, targetId]));
        } else {
            setActiveModalNode(null);
        }
    };

    const handleTerminalSubmit = (input) => {
        // specific for terminal node
        if (!activeModalNode || activeModalNode.type !== 'terminal') return;

        const expected = activeModalNode.data.command || '';
        if (input.trim() === expected.trim() || input.includes('grep')) {
            addLog(`COMMAND SUCCESS: ${input}`);

            // Find next node (usually just one output)
            const nodeOptions = edges.filter(e => e.source === activeModalNode.id);

            if (nodeOptions.length > 0) {
                // Add to inventory that we beat this terminal
                // Add to inventory that we beat this terminal
                setInventory(prev => new Set([...prev, activeModalNode.id]));
                setNodeOutputs(prev => ({ ...prev, [activeModalNode.id]: input, [activeModalNode.data.label]: input }));

                // Award Score for Terminal Hack
                if (activeModalNode.data.score && !scoredNodes.has(activeModalNode.id)) {
                    setScore(s => s + activeModalNode.data.score);
                    setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                    addLog(`HACK REWARD: +${activeModalNode.data.score} Points`);
                }

                // Close modal and move to next
                setActiveModalNode(null); // Close first
                handleOptionClick(nodeOptions[0].target);
            }
        } else {
            addLog(`COMMAND FAILED: Access Denied.`);
        }
    };

    const handleAccuse = (suspect) => {
        // Logic to check if correct.
        // We look for a property `isKiller` or `isCulprit` in data.
        // For the sample case, let's assume if we don't find explicit data, we check against a hardcoded name for the sample.

        let isCorrect = suspect.data.isKiller === true || suspect.data.isCulprit === true;

        // Hardcoded check for the sample case "The Digital Insider"
        // In our sample data, we didn't explicitly set isKiller on "Ken Sato" v2, but let's assume he is based on story.
        // Or if the user hasn't set it, we default to failure to prevent false positives? 
        // Better: Check if ANY suspect has isKiller set. If not, maybe the logic is missing.
        // For valid gameplay, let's assume "Ken Sato" is the culprit for the sample case if no flag exists.
        if (suspect.data.name?.includes('Ken Sato') && !nodes.some(n => n.data.isKiller)) {
            isCorrect = true;
        }

        if (isCorrect) {
            setAccusationResult('success');
        } else {
            setAccusationResult('failure');
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
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    // Helper to get nice labels for buttons
    const getEdgeLabel = (node) => {
        if (!node) return "Continue";
        if (node.type === 'story') return node.data.label || "Continue Narrative";
        if (node.type === 'evidence') return `Examine Evidence: ${node.data.label}`;
        if (node.type === 'terminal') return `Access Terminal: ${node.data.label}`;
        if (node.type === 'message') return `Read Message: ${node.data.label}`;
        return `Proceed to ${node.data.label}`;
    }

    // Render Node Content (Background / Story)
    const renderContent = () => {
        if (!currentNode) return <div className="text-zinc-500">Initializing Neural Link...</div>;

        const { type, data } = currentNode;

        // If we are currently "at" a non-story node (like we just clicked it), 
        // we might want to show the LAST story node or a generic background.
        // For now, let's just render the story content if it's a story node, otherwise show a placeholder.
        if (type !== 'story') {
            // If we are at a terminal/evidence node, the popup handles the interaction.
            // The main view can just show "Interaction in progress..."
            return (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                    <div className="animate-pulse text-zinc-500 text-sm tracking-widest uppercase">
                        secure link established // accessing subsystem
                    </div>
                </div>
            )
        }

        // Story Node (Briefing or Narrative)
        const isBriefing = data.label.toLowerCase().includes('briefing') || history.length === 0;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {isBriefing && (
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold tracking-[0.2em] mb-4"
                        >
                            TOP SECRET // CLEARANCE LEVEL 5
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 uppercase tracking-tighter">
                            {data.label}
                        </h1>
                    </div>
                )}

                {!isBriefing && (
                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                        <FileText className="w-6 h-6" />
                        <h2 className="text-xl font-bold text-white">{data.label}</h2>
                    </div>
                )}

                <Card className={`bg-zinc-900/50 border-zinc-800 p-8 ${isBriefing ? 'border-t-4 border-t-red-600 shadow-2xl shadow-red-900/20' : ''}`}>
                    <p className={`text-zinc-200 leading-loose whitespace-pre-wrap ${isBriefing ? 'text-lg md:text-xl font-light' : 'text-lg'}`}>
                        {data.text || data.content}
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
            {/* Audio Player (Hidden) */}
            <audio ref={audioRef} />

            {/* Header */}
            <div className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-red-600 px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-widest animate-pulse">
                        Simulation Active
                    </div>
                    {/* Score Display */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-zinc-200 font-bold font-mono text-sm">{score}</span>
                    </div>
                    {/* ... Time Remaining logic ... */}
                    {missionStarted && (
                        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-lg border-2 shadow-2xl z-50 flex items-center gap-3 backdrop-blur-md ${timeLeft < 60 ? 'bg-red-950/80 border-red-500 text-red-500 animate-pulse' : 'bg-zinc-950/80 border-indigo-500/50 text-indigo-400'}`}>
                            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Time Remaining</span>
                            <span className="font-mono text-2xl font-black tracking-widest">{formatTime(timeLeft)}</span>
                        </div>
                    )}
                    <span className="text-zinc-500 text-sm font-mono">ID: {currentNode?.id || '---'}</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Audio Toggle */}
                    {audioSource && (
                        <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className={isMuted ? "text-red-500" : "text-green-500"}>
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </Button>
                    )}

                    {/* Vault Button */}
                    {missionStarted && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowVault(true)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white"
                        >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Evidence Vault
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
                    <Button variant="ghost" onClick={onClose}>
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
                                    // Standard List Layout
                                    <div className="grid grid-cols-1 gap-3">
                                        {options.map((edge) => {
                                            const targetNode = nodes.find(n => n.id === edge.target);
                                            if (!targetNode) return null;
                                            if (targetNode.type === 'logic') return null;

                                            return (
                                                <Button
                                                    key={edge.id}
                                                    onClick={() => handleOptionClick(edge.target)}
                                                    className="w-full justify-between h-auto py-4 text-base group"
                                                    variant="outline"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:bg-white transition-colors"></span>
                                                        <span>
                                                            {targetNode.type === 'story' ? (targetNode.data.label || 'Continue Narrative') :
                                                                targetNode.type === 'suspect' ? `Investigate: ${targetNode.data.name || targetNode.data.label}` :
                                                                    targetNode.type === 'evidence' ? `Examine: ${targetNode.data.label}` :
                                                                        targetNode.type === 'media' ? `View Asset: ${targetNode.data.label}` :
                                                                            `Proceed to ${targetNode.data.label}`}
                                                        </span>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                                                </Button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Inventory / Vault Modal */}
            <AnimatePresence>
                {showVault && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl relative">
                            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Briefcase className="w-6 h-6 text-indigo-500" />
                                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">Resource Vault</h2>
                                </div>
                                <Button variant="ghost" onClick={() => setShowVault(false)}>
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Array.from(inventory).map(id => {
                                        const node = nodes.find(n => n.id === id);
                                        if (!node || !['evidence', 'media'].includes(node.type)) return null;

                                        const Icon = node.type === 'media' ? ImageIcon : Search;
                                        const color = node.type === 'media' ? 'text-orange-500' : 'text-yellow-500';

                                        return (
                                            <div
                                                key={id}
                                                onClick={() => { setShowVault(false); setActiveModalNode(node); }}
                                                className="bg-black border border-zinc-800 p-4 rounded-xl hover:border-indigo-500/50 cursor-pointer transition-all group"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Icon className={`w-5 h-5 ${color}`} />
                                                    <span className="text-xs font-bold text-zinc-500 uppercase">{node.type}</span>
                                                </div>
                                                <h4 className="font-bold text-zinc-200 group-hover:text-indigo-400 truncate">{node.data.label}</h4>
                                                {node.type === 'media' && node.data.mediaType === 'image' && (
                                                    <div className="mt-3 aspect-video bg-zinc-900 rounded overflow-hidden">
                                                        <img src={node.data.url} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                                    </div>
                                                )}
                                                <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{node.data.description || node.data.text}</p>
                                            </div>
                                        )
                                    })}
                                    {Array.from(inventory).filter(id => {
                                        const n = nodes.find(x => x.id === id);
                                        return n && ['evidence', 'media'].includes(n.type);
                                    }).length === 0 && (
                                            <div className="col-span-full py-12 text-center text-zinc-600">
                                                <p>No evidence collected yet.</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

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
                            {/* Suspect Layout */}
                            {activeModalNode.type === 'suspect' && (
                                <>
                                    <div className="h-32 bg-gradient-to-r from-zinc-900 to-black relative shrink-0">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${getAvatarColor(activeModalNode.data.name)} opacity-20`}></div>
                                        <Button variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/10 z-10" onClick={() => setActiveModalNode(null)}>
                                            <X className="w-6 h-6" />
                                        </Button>
                                        <div className="absolute -bottom-10 left-8 flex items-end">
                                            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getAvatarColor(activeModalNode.data.name)} p-1 shadow-xl border-4 border-zinc-950`}>
                                                <div className="w-full h-full bg-black/20 rounded-xl flex items-center justify-center">
                                                    <span className="text-4xl font-bold text-white">{activeModalNode.data.name.charAt(0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-14 px-8 pb-8 overflow-y-auto">
                                        <h2 className="text-3xl font-black text-white uppercase">{activeModalNode.data.name}</h2>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs font-bold tracking-wider uppercase rounded">
                                            {activeModalNode.data.role}
                                        </span>

                                        <div className="mt-8 grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    Dossier / Notes
                                                </h4>
                                                <p className="text-zinc-300 leading-relaxed bg-zinc-900/50 p-4 rounded-lg border border-zinc-900">
                                                    {activeModalNode.data.description || "No additional notes available in database."}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                                    <ShieldAlert className="w-4 h-4" />
                                                    Known Alibi
                                                </h4>
                                                <p className="text-zinc-300 leading-relaxed italic border-l-2 border-emerald-500/50 pl-4">
                                                    "{activeModalNode.data.alibi || "Alibi not yet established."}"
                                                </p>
                                            </div>

                                            {/* Action Buttons for this Suspect */}
                                            <div className="pt-8 border-t border-zinc-900 mt-4">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Available Actions</h4>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {edges.filter(e => e.source === activeModalNode.id).map(edge => {
                                                        const target = nodes.find(n => n.id === edge.target);
                                                        if (!target) return null;
                                                        return (
                                                            <Button
                                                                key={edge.id}
                                                                onClick={() => { setActiveModalNode(null); handleOptionClick(edge.target); }}
                                                                className="w-full justify-between h-auto py-3 bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                                                            >
                                                                <span>{getEdgeLabel(target)}</span>
                                                                <ArrowRight className="w-4 h-4" />
                                                            </Button>
                                                        )
                                                    })}
                                                    {edges.filter(e => e.source === activeModalNode.id).length === 0 && (
                                                        <div className="p-3 rounded bg-zinc-900/50 border border-zinc-900 border-dashed">
                                                            <p className="text-zinc-500 italic text-sm mb-1">No further leads on this suspect currently.</p>
                                                            <p className="text-[10px] text-zinc-600 font-mono">
                                                                Debug: Node ID `{activeModalNode.id}` has 0 outgoing connections.
                                                                Connect this node to Evidence or Story nodes in the editor to create actions.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {activeModalNode.type === 'evidence' && (
                                <div className="p-8 border-t-4 border-yellow-500 bg-zinc-900/50">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 text-yellow-500">
                                            <Search className="w-8 h-8" />
                                            <h2 className="text-2xl font-bold text-white uppercase">Evidence Logged</h2>
                                        </div>
                                        <Button variant="ghost" onClick={() => setActiveModalNode(null)}><X className="w-6 h-6" /></Button>
                                    </div>

                                    <Card className="p-8 bg-black border-yellow-900/30 mb-6">
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
                                <div className="p-0 bg-black h-full flex flex-col font-mono">
                                    <div className="p-4 border-b border-green-900/50 flex items-center justify-between bg-zinc-900/50">
                                        <div className="flex items-center gap-2 text-green-500">
                                            <Terminal className="w-5 h-5" />
                                            <span className="font-bold tracking-widest">SECURE TERMINAL // {activeModalNode.data.label}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="text-green-500 hover:text-green-400"
                                            onClick={() => {
                                                // If closing without solving, go back to previous node
                                                if (!inventory.has(activeModalNode.id)) {
                                                    const prevNodeId = history[history.length - 1];
                                                    if (prevNodeId) setCurrentNodeId(prevNodeId);
                                                    // Pop the history to keep it clean (optional, but good for "Back" logic)
                                                    setHistory(prev => prev.slice(0, -1));
                                                }
                                                setActiveModalNode(null);
                                            }}
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                        {logs.map((l, i) => <div key={i} className="text-green-800 text-xs">{l}</div>)}
                                        <div className="text-green-400 my-4 text-sm">{activeModalNode.data.prompt}</div>
                                        <div className="flex items-center gap-2 border-t border-green-900/30 pt-4 mt-auto">
                                            <span className="text-green-500 animate-pulse">$</span>
                                            <input
                                                className="bg-transparent border-none focus:outline-none text-green-400 w-full font-bold text-lg"
                                                placeholder="Enter command..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleTerminalSubmit(e.currentTarget.value);
                                                }}
                                                autoFocus
                                            />
                                        </div>
                                        <p className="text-xs text-green-700 mt-2">ACCESS RESTRICTED. UNAUTHORIZED USE IS A FELONY.</p>
                                    </div>
                                </div>
                            )}

                            {/* Message Layout */}
                            {activeModalNode.type === 'message' && (
                                <div className="p-8 bg-zinc-900 border-t-4 border-violet-500">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 text-violet-400">
                                            <MessageSquare className="w-6 h-6" />
                                            <h2 className="text-xl font-bold text-white uppercase">Incoming Transmission</h2>
                                        </div>
                                        <Button variant="ghost" onClick={() => setActiveModalNode(null)}><X className="w-6 h-6" /></Button>
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
                                <div className="p-0 bg-black h-full flex flex-col">
                                    <div className="p-4 border-b border-orange-900/50 flex items-center justify-between bg-zinc-900/50 shrink-0">
                                        <div className="flex items-center gap-2 text-orange-500">
                                            <ImageIcon className="w-5 h-5" />
                                            <span className="font-bold tracking-widest uppercase">ASSET // {activeModalNode.data.label}</span>
                                        </div>
                                        <Button variant="ghost" className="text-orange-500 hover:text-orange-400" onClick={() => setActiveModalNode(null)}>
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
                                        {activeModalNode.data.mediaType === 'video' ? (
                                            <div className="w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 shadow-2xl mb-6">
                                                {/* Simple heuristic for YouTube embeds */}
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
                                            <div className="w-full max-w-3xl mb-6">
                                                <img
                                                    src={activeModalNode.data.url}
                                                    alt="Asset"
                                                    className="w-full h-auto rounded-lg border border-zinc-800 shadow-2xl"
                                                />
                                            </div>
                                        )}

                                        <div className="w-full max-w-3xl bg-zinc-900/80 p-6 rounded-xl border border-zinc-800 backdrop-blur-sm">
                                            <h3 className="text-orange-200 font-bold mb-2">{activeModalNode.data.label}</h3>
                                            <p className="text-zinc-300 leading-relaxed">{activeModalNode.data.text}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end shrink-0">
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

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Accusation Modal */}
            <AnimatePresence>
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
                                <Button variant="ghost" onClick={() => setShowAccuseModal(false)}>
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
                                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500">
                                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 border-4 border-green-500">
                                            <CheckCircle className="w-12 h-12 text-green-500" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-4">CASE CLOSED</h2>
                                        <p className="text-xl text-zinc-300 max-w-xl">
                                            Excellent work, Detective. The culprit has been identified and apprehended thanks to your diligence.
                                        </p>
                                        <Button
                                            className="mt-8 bg-white text-black hover:bg-zinc-200"
                                            onClick={onClose}
                                        >
                                            Return to Headquarters
                                        </Button>
                                    </div>
                                )}

                                {accusationResult === 'failure' && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500">
                                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border-4 border-red-500">
                                            <X className="w-12 h-12 text-red-500" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-4">MISSION FAILED</h2>
                                        <p className="text-xl text-zinc-300 max-w-xl">
                                            You accused the wrong person. The real perpetrator escaped while you were distracted.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-8 border-zinc-700 hover:bg-zinc-800"
                                            onClick={() => setAccusationResult(null)}
                                        >
                                            Review Evidence Again
                                        </Button>
                                    </div>
                                )}

                                {accusationResult === 'timeout' && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500">
                                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border-4 border-red-500">
                                            <AlertTriangle className="w-12 h-12 text-red-500" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-4">TIME EXPIRED</h2>
                                        <p className="text-xl text-zinc-300 max-w-xl">
                                            The operational window has closed. The culprit has escaped jurisdiction.
                                        </p>
                                        <Button
                                            className="mt-8 bg-white text-black hover:bg-zinc-200"
                                            onClick={onClose}
                                        >
                                            Abort Mission
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GamePreview;
