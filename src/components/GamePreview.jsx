import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card } from './ui/shared';
import { X, User, Search, Terminal, MessageSquare, FileText, ArrowRight, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GamePreview = ({ nodes, edges, onClose }) => {
    // Game State
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [inventory, setInventory] = useState(new Set());
    const [history, setHistory] = useState([]); // Array of distinct visited node IDs
    const [logs, setLogs] = useState([]); // Text logs for the "terminal" feel on the side

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

    const currentNode = useMemo(() =>
        nodes.find(n => n.id === currentNodeId),
        [currentNodeId, nodes]
    );

    const addLog = (msg) => {
        setLogs(prev => [`> ${msg}`, ...prev].slice(0, 50));
    };

    // Navigation Options (Outgoing Edges)
    const options = useMemo(() => {
        if (!currentNodeId) return [];
        return edges.filter(e => e.source === currentNodeId);
    }, [currentNodeId, edges]);

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
            const condition = currentNode.data.condition;

            // Allow mapping evidence node IDs to true
            let isTrue = false;

            // Hardcoded check for tutorial/sample consistency
            if (condition === 'has_usb_drive' && (inventory.has('evidence-1') || inventory.has('sample-evidence-usb') || Array.from(inventory).some(i => i.toLowerCase().includes('usb')))) {
                isTrue = true;
            } else if (condition === 'keycard_match_ken' && (inventory.has('evidence-cctv') || inventory.has('term-logs'))) {
                // In the Cyber case, logic requires finding the culprit. 
                // Let's assume if we visited the relevant nodes, it's true.
                isTrue = true;
            } else if (inventory.has(condition)) {
                isTrue = true;
            }

            addLog(`Executing Logic Gate: ${currentNode.data.label} [${isTrue ? 'PASS' : 'FAIL'}]`);

            // Find edges
            const trueEdge = options.find(e => e.sourceHandle === 'true');
            const falseEdge = options.find(e => e.sourceHandle === 'false');

            const nextEdge = isTrue ? trueEdge : falseEdge;

            if (nextEdge) {
                setTimeout(() => setCurrentNodeId(nextEdge.target), 800); // Small delay for effect
            } else {
                addLog(`ERROR: Logic gate stuck. No path for ${isTrue ? 'True' : 'False'}.`);
            }
        }

    }, [currentNode, inventory, options]);


    const handleOptionClick = (targetId) => {
        // Add current to history
        setHistory(prev => [...prev, currentNodeId]);
        setCurrentNodeId(targetId);
    };

    const handleTerminalSubmit = (input) => {
        // specific for terminal node
        if (!currentNode || currentNode.type !== 'terminal') return;

        const expected = currentNode.data.command || '';
        if (input.trim() === expected.trim() || input.includes('grep')) { // loose matching for fun
            addLog(`COMMAND SUCCESS: ${input}`);

            // Find next node (usually just one output)
            if (options.length > 0) {
                // Add to inventory that we beat this terminal
                setInventory(prev => new Set([...prev, currentNode.id]));
                handleOptionClick(options[0].target);
            }
        } else {
            addLog(`COMMAND FAILED: Access Denied.`);
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

    // Render Node Content
    const renderContent = () => {
        if (!currentNode) return <div className="text-zinc-500">Initializing Neural Link...</div>;

        const { type, data } = currentNode;

        switch (type) {
            case 'story':
                // Check if this is a "Briefing" node (start node or explicitly labeled)
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
            case 'suspect':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <User className="w-8 h-8" />
                            <h2 className="text-2xl font-bold text-white uppercase">{data.label}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</span>
                                <p className="text-xl text-white mt-1">{data.name}</p>
                            </div>
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</span>
                                <p className="text-xl text-white mt-1">{data.role || "Unknown"}</p>
                            </div>
                            <div className="col-span-full p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Alibi / Notes</span>
                                <p className="text-zinc-300 mt-1 italic">"{data.alibi || data.description}"</p>
                            </div>
                        </div>
                    </div>
                );
            case 'evidence':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 text-yellow-400 mb-2">
                            <Search className="w-6 h-6" />
                            <h2 className="text-xl font-bold text-white">Evidence Found</h2>
                        </div>
                        <Card className="p-6 bg-yellow-950/10 border-yellow-900/30">
                            <h3 className="text-lg font-bold text-yellow-200 mb-2">{data.label}</h3>
                            <p className="text-zinc-300">{data.description}</p>
                        </Card>
                        <div className="flex items-center gap-2 text-green-400 text-sm mt-4">
                            <CheckCircle className="w-4 h-4" />
                            <span>Evidence logged to case file.</span>
                        </div>
                    </div>
                );
            case 'terminal':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 text-green-400 mb-2">
                            <Terminal className="w-6 h-6" />
                            <h2 className="text-xl font-bold text-white">Secure Terminal Access</h2>
                        </div>
                        <div className="bg-black border border-green-900/50 rounded-lg p-4 font-mono text-sm max-w-2xl">
                            <div className="text-green-600 mb-2"># {data.label}</div>
                            <p className="text-zinc-300 mb-4">{data.prompt}</p>
                            <div className="flex items-center gap-2 border-t border-zinc-800 pt-4">
                                <span className="text-green-500">$</span>
                                <input
                                    className="bg-transparent border-none focus:outline-none text-green-400 w-full"
                                    placeholder="Enter command..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTerminalSubmit(e.currentTarget.value);
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500">Hint: Try standard Linux commands or check node data.</p>
                    </div>
                );
            case 'message':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 text-violet-400 mb-2">
                            <MessageSquare className="w-6 h-6" />
                            <h2 className="text-xl font-bold text-white">Incoming Transmission</h2>
                        </div>
                        <div className="flex flex-col gap-2 max-w-xl">
                            <div className="self-start bg-zinc-800 rounded-tr-xl rounded-br-xl rounded-bl-xl p-4 border border-zinc-700">
                                <span className="text-xs font-bold text-indigo-400 block mb-1">{data.sender || 'Unknown'}</span>
                                <p className="text-zinc-200">{data.message || data.content}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'logic':
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3 animate-pulse">
                        <ShieldAlert className="w-12 h-12" />
                        <p>Analysing Logic Gates...</p>
                    </div>
                );
            default:
                return <div>Unknown Node Type</div>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col font-sans">
            {/* Header */}
            <div className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="bg-red-600 px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-widest animate-pulse">
                        Simulation Active
                    </div>
                    <span className="text-zinc-500 text-sm font-mono">ID: {currentNode?.id || '---'}</span>
                </div>
                <Button variant="ghost" onClick={onClose}>
                    <X className="w-5 h-5 mr-2" />
                    Terminate Simulation
                </Button>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Visual Feed (Left/Center) */}
                <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
                    <div className="w-full max-w-3xl">
                        {renderContent()}

                        {/* Actions / Choices */}
                        <div className="mt-12">
                            {options.some(e => nodes.find(n => n.id === e.target)?.type === 'suspect') ? (
                                // Grid Layout for Suspects
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold tracking-wider uppercase">
                                        <User className="w-4 h-4" />
                                        <span>Suspect Database Matches ({options.length})</span>
                                    </div>
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
                                                    onClick={() => handleOptionClick(edge.target)}
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

                                        // Logic nodes are handled automatically, don't show buttons
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
                    </div>
                </div>

                {/* System Log (Right Sidebar) */}
                <div className="w-80 border-l border-zinc-800 bg-zinc-950 p-4 font-mono text-xs flex flex-col">
                    <div className="flex items-center gap-2 text-zinc-400 mb-4 pb-2 border-b border-zinc-800">
                        <Terminal className="w-4 h-4" />
                        <span>SYSTEM LOGS</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 text-zinc-500">
                        {logs.map((log, i) => (
                            <div key={i} className="break-words">
                                {log}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <div className="text-zinc-400 mb-2">INVENTORY</div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(inventory).length === 0 && <span className="text-zinc-600 italic">Empty</span>}
                            {Array.from(inventory).map(item => (
                                <span key={item} className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">
                                    {nodes.find(n => n.id === item)?.data.label || item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamePreview;
