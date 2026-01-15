import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/shared';
import { Save, ArrowLeft, X, FileText, User, Search, GitMerge, Terminal, MessageSquare, CircleHelp, Play, Settings, Music, Image as ImageIcon } from 'lucide-react';
import { StoryNode, SuspectNode, EvidenceNode, LogicNode, TerminalNode, MessageNode, MusicNode, MediaNode } from '../components/nodes/CustomNodes';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import GamePreview from '../components/GamePreview';
import { AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// ... (other imports)

const NODE_HELP = {
    story: {
        title: "Story Node",
        desc: "The primary narrative building block. Use this to display story text, dialogue, or descriptions to the player.",
        examples: ["Opening Scene", "Conversation with Witness", "Room Description"]
    },
    suspect: {
        title: "Suspect Profile",
        desc: "Represents a character in the mystery. Players can click them to view their dossier, alibi, and actions.",
        examples: ["Col. Mustard", "The suspicious butler"]
    },
    evidence: {
        title: "Evidence Item",
        desc: "A collectible item. Evidence is added to the player's inventory and can be used to satisfy logic conditions.",
        examples: ["Bloody Knife", "Encrypted USB Drive", "Crumpled Note"]
    },
    logic: {
        title: "Logic Gate",
        desc: "Controls the flow of the game based on conditions. Use 'If' to branch and 'While' to wait for events.",
        examples: ["Check if key is found", "Wait for terminal hack", "Branch based on suspect accusation"]
    },
    terminal: {
        title: "Terminal Challenge",
        desc: "A hacking interface where the player must type a specific command or answer to proceed.",
        examples: ["Password Lock", "Database Query", "Override Sequence"]
    },
    message: {
        title: "Incoming Transmission",
        desc: "Simulates an incoming message or email. Useful for providing hints or urgent updates.",
        examples: ["Anonymous Tip", "HQ Briefing", "Threatening Text"]
    },
    music: {
        title: "Background Audio",
        desc: "Sets the mood. The specified audio track will loop when this node is active.",
        examples: ["Suspense Theme", "Action Music", "Silence"]
    },
    media: {
        title: "Media Asset",
        desc: "Displays a visual asset (Image or Video) to the player.",
        examples: ["CCTV Footage (YouTube)", "Crime Scene Photo", "Document Scan"]
    }
};

const PALETTE_ITEMS = [
    { type: 'story', label: 'Story Narrative', icon: FileText, className: "hover:border-indigo-500/50", iconClass: "text-blue-400" },
    { type: 'suspect', label: 'Suspect', icon: User, className: "hover:border-red-500/50", iconClass: "text-red-400" },
    { type: 'evidence', label: 'Evidence Item', icon: Search, className: "hover:border-yellow-500/50", iconClass: "text-yellow-400" },
    { type: 'logic', label: 'Logic Branch', icon: GitMerge, className: "hover:border-emerald-500/50", iconClass: "text-emerald-400" },
    { type: 'terminal', label: 'Terminal Prompt', icon: Terminal, className: "hover:border-green-500/50", iconClass: "text-green-400" },
    { type: 'message', label: 'Message Block', icon: MessageSquare, className: "hover:border-violet-500/50", iconClass: "text-violet-400" },
    { type: 'music', label: 'Background Audio', icon: Music, className: "hover:border-pink-500/50", iconClass: "text-pink-400" },
    { type: 'media', label: 'Media Asset', icon: ImageIcon, className: "hover:border-orange-500/50", iconClass: "text-orange-400" },
];

const Editor = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [helpModalData, setHelpModalData] = useState(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [timeLimit, setTimeLimit] = useState(15); // Default 15 minutes

    const tutorialSteps = [
        {
            title: "Welcome to the Editor",
            description: "This is where you craft your mystery. Let's take a quick tour of the features.",
            targetId: null
        },
        {
            title: "The Toolbar",
            description: "Here you can navigate back to the dashboard, manage your case file, and access help.",
            targetId: "editor-toolbar"
        },
        {
            title: "Node Palette",
            description: "These are your building blocks. Drag and drop Story, Suspect, Evidence, or Logic nodes onto the canvas to construct your narrative.",
            targetId: "node-sidebar"
        },
        {
            title: "The Canvas",
            description: "This is your workspace. Drag nodes here and connect them to create the flow of the story.",
            targetId: "editor-canvas"
        },
        {
            title: "Actions",
            description: "Save your progress often. When you're ready, click 'Generate Build' to export a playable HTML game.",
            targetId: "editor-actions"
        }
    ];

    const nodeTypes = useMemo(() => ({
        story: StoryNode,
        suspect: SuspectNode,
        evidence: EvidenceNode,
        logic: LogicNode,
        terminal: TerminalNode,
        message: MessageNode,
        music: MusicNode,
        media: MediaNode
    }), []);

    const [editingEdge, setEditingEdge] = useState(null); // { id: string, label: string }
    const [tempLabel, setTempLabel] = useState(""); // For input

    // Update handler
    const onNodeUpdate = useCallback((id, newData) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...newData, onChange: onNodeUpdate } };
            }
            return node;
        }));
    }, [setNodes]);

    const onConnect = useCallback((params) => {
        // Create edge immediately without prompt
        setEdges((eds) => addEdge({ ...params, type: 'default' }, eds));
    }, [setEdges]);

    const onEdgeClick = useCallback((event, edge) => {
        event.stopPropagation();
        setEditingEdge(edge);
        setTempLabel(edge.label || "");
    }, []);

    const saveEdgeLabel = () => {
        if (!editingEdge) return;
        setEdges((eds) => eds.map((e) => {
            if (e.id === editingEdge.id) {
                return { ...e, label: tempLabel === "" ? undefined : tempLabel };
            }
            return e;
        }));
        setEditingEdge(null);
    };

    const deleteEdge = () => {
        if (!editingEdge) return;
        setEdges((eds) => eds.filter(e => e.id !== editingEdge.id));
        setEditingEdge(null);
    };

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // Reattach handlers on load where they might be missing (deserialization)
    useEffect(() => {
        if (nodes.length > 0 && !nodes[0].data.onChange) {
            setNodes((nds) => nds.map(node => ({
                ...node,
                data: { ...node.data, onChange: onNodeUpdate }
            })));
        }
    }, [nodes, onNodeUpdate, setNodes]);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        if (typeof type === 'undefined' || !type) return;

        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const newNode = {
            id: crypto.randomUUID(),
            type,
            position,
            data: { label: `${type} node`, onChange: onNodeUpdate },
        };

        setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance, onNodeUpdate, setNodes]);

    // Initial Load
    useEffect(() => {
        const loadCaseData = async () => {
            if (!db || !projectId) return;
            try {
                const docRef = doc(db, "cases", projectId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.nodes) setNodes(data.nodes);
                    if (data.edges) setEdges(data.edges);
                    if (data.meta && data.meta.timeLimit) setTimeLimit(data.meta.timeLimit);
                } else {
                    console.error("No such document!");
                    // potentially navigate back or show error
                }
            } catch (error) {
                console.error("Error loading case:", error);
            }
        };
        loadCaseData();
    }, [projectId, setNodes, setEdges]);

    // ... (Update handlers remain same)

    const saveProject = async () => {
        if (!db || !projectId) return;

        // Strip functions before saving
        // Note: react-flow nodes might contain circular refs or functions in data, usually pure data is fine.
        // The editor uses 'onChange' callback in data, we must NOT save that to Firestore as it breaks JSON/serialization
        const cleanNodes = nodes.map(n => {
            const { onChange, ...restData } = n.data;
            return { ...n, data: restData };
        });

        try {
            const flow = { nodes: cleanNodes, edges, meta: { timeLimit } };
            const docRef = doc(db, "cases", projectId);

            await updateDoc(docRef, {
                ...flow,
                updatedAt: new Date().toISOString(),
                nodeCount: nodes.length
            });

            // Visual feedback
            const btn = document.getElementById('save-btn');
            if (btn) {
                const original = btn.innerHTML;
                btn.innerText = "Saved!";
                setTimeout(() => btn.innerHTML = original, 2000);
            }
        } catch (error) {
            console.error("Error saving project:", error);
            alert("Failed to save.");
        }
    };

    const generateBuild = async () => {
        saveProject();
        const zip = new JSZip();

        // Clean nodes data of functions
        const cleanNodes = nodes.map(n => ({ ...n, data: { ...n.data, onChange: undefined } }));
        const gameData = { nodes: cleanNodes, edges, meta: { generatedAt: new Date(), timeLimit } };

        const folder = zip.folder("mystery-game-build");
        folder.file("game-data.json", JSON.stringify(gameData, null, 2));

        // Minimal template
        const templateHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mystery Game Build</title>
    <style>
        body { background: #09090b; color: #fff; font-family: sans-serif; padding: 40px; }
        .card { background: #18181b; padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #27272a; }
        h1 { color: #818cf8; }
        code { color: #a5b4fc; }
    </style>
</head>
<body>
    <h1>Mystery Game Production Build</h1>
    <p>This is a generated export. In a full implementation, this would be the React Player.</p>
    <div class="card">
        <h3>Game Data Loaded</h3>
        <pre id="output">Loading...</pre>
    </div>
    <script>
        fetch('./game-data.json')
            .then(res => res.json())
            .then(data => {
                document.getElementById('output').innerText = JSON.stringify(data, null, 2);
            });
    </script>
</body>
</html>`;

        folder.file("index.html", templateHtml);

        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mystery-game-export-${projectId}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="flex h-screen w-screen flex-col bg-black text-white overflow-hidden">
            {/* Toolbar */}
            <div id="editor-toolbar" className="h-16 border-b border-zinc-800 bg-black/80 flex items-center justify-between px-4 z-10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <span className="font-bold text-zinc-400">Mission Architect</span>
                </div>
                <div id="editor-actions" className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowTutorial(true)} title="How to use">
                        <CircleHelp className="w-5 h-5 text-indigo-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} title="Game Settings">
                        <Settings className="w-5 h-5 text-zinc-400" />
                    </Button>
                    <Button id="save-btn" variant="secondary" size="sm" onClick={saveProject}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { saveProject(); setShowPreview(true); }}>
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                    </Button>

                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside id="node-sidebar" className="w-64 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-4 z-10">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Node Palette</div>

                    <div className="space-y-3">
                        {PALETTE_ITEMS.map((item) => (
                            <div
                                key={item.type}
                                onDragStart={(event) => onDragStart(event, item.type)}
                                draggable
                                className={`flex items-center gap-3 p-3 rounded bg-zinc-900 border border-zinc-800 cursor-grab hover:bg-zinc-800 transition-all active:cursor-grabbing group relative ${item.className}`}
                            >
                                <item.icon className={`w-4 h-4 ${item.iconClass}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setHelpModalData(NODE_HELP[item.type]); }}
                                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white"
                                    title="View Documentation"
                                >
                                    <CircleHelp className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                        <p className="text-[10px] text-zinc-500">
                            Drag nodes to canvas. Connect handles to create flow logic. Save frequently.
                        </p>
                    </div>
                </aside>

                {/* Canvas */}
                <div id="editor-canvas" className="flex-1 h-full relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onEdgeClick={onEdgeClick}
                        nodeTypes={nodeTypes}
                        deleteKeyCode={['Backspace', 'Delete']}
                        fitView
                        className="bg-zinc-950"
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background color="#27272a" gap={20} size={1} />
                        <Controls className="bg-zinc-900 border border-zinc-800 text-zinc-400 fill-zinc-400" />
                        <MiniMap className="bg-zinc-900 border border-zinc-800" nodeColor="#6366f1" maskColor="rgba(0, 0, 0, 0.7)" />
                    </ReactFlow>
                </div>
            </div>
            <AnimatePresence>
                {showTutorial && (
                    <TutorialOverlay steps={tutorialSteps} onClose={() => setShowTutorial(false)} />
                )}
                {showPreview && (
                    <GamePreview nodes={nodes} edges={edges} onClose={() => setShowPreview(false)} gameMetadata={{ timeLimit }} />
                )}
                {/* Settings Modal */}
                {showSettings && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl max-w-md w-full shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Settings className="w-6 h-6 text-indigo-500" />
                                Game Configuration
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Time Limit (Minutes)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            min="1"
                                            max="120"
                                            value={timeLimit}
                                            onChange={(e) => setTimeLimit(parseInt(e.target.value) || 15)}
                                            className="bg-black border border-zinc-700 rounded px-3 py-2 text-white w-24 text-center text-lg font-bold focus:border-indigo-500 outline-none"
                                        />
                                        <span className="text-zinc-400 text-sm">Minutes to solve the case.</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-2">
                                <Button onClick={() => setShowSettings(false)}>
                                    Save & Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edge Editor Modal */}
                {editingEdge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl max-w-sm w-full shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <GitMerge className="w-6 h-6 text-indigo-500" />
                                Edit Connection
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Action Label</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Interrogate, Unlock"
                                        value={tempLabel}
                                        onChange={(e) => setTempLabel(e.target.value)}
                                        className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"
                                        autoFocus
                                    />
                                    <span className="text-zinc-500 text-xs mt-1 block">Text shown on the line connecting nodes.</span>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-between">
                                <Button variant="destructive" onClick={deleteEdge}>
                                    Delete Link
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => setEditingEdge(null)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={saveEdgeLabel}>
                                        Save Label
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {helpModalData && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setHelpModalData(null)}>
                        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setHelpModalData(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <CircleHelp className="w-6 h-6 text-indigo-500" />
                                {helpModalData.title}
                            </h2>
                            <p className="text-zinc-300 leading-relaxed mb-6"> {helpModalData.desc} </p>
                            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Example Usage</h3>
                                <ul className="space-y-2">
                                    {helpModalData.examples.map((ex, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                                            <span className="text-indigo-500 mt-1">•</span>
                                            {ex}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

import ErrorBoundary from '../components/ErrorBoundary';

export default () => (
    <ErrorBoundary>
        <ReactFlowProvider>
            <Editor />
        </ReactFlowProvider>
    </ErrorBoundary>
);
