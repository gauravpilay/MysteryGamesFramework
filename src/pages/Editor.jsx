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
import { Logo } from '../components/ui/Logo';
import { Save, ArrowLeft, X, FileText, User, Search, GitMerge, Terminal, MessageSquare, CircleHelp, Play, Settings, Music, Image as ImageIcon, MousePointerClick, Fingerprint, Bell, HelpCircle, ChevronLeft, ChevronRight, ToggleLeft, Lock, Sun, Moon, Stethoscope } from 'lucide-react';
import { StoryNode, SuspectNode, EvidenceNode, LogicNode, TerminalNode, MessageNode, MusicNode, MediaNode, ActionNode, IdentifyNode, NotificationNode, QuestionNode, SetterNode } from '../components/nodes/CustomNodes';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import GamePreview from '../components/GamePreview';
import { AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../lib/auth';

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
        desc: "Displays a visual asset (Image or Video) to the player.",
        examples: ["CCTV Footage (YouTube)", "Crime Scene Photo", "Document Scan"]
    },
    action: {
        title: "Action Button",
        desc: "A interactive button for player choices. Use this to create branching paths or interaction points.",
        examples: ["Open Door", "Talk to Witness", "Examine Object"]
    },
    identify: {
        title: "Identify Culprit",
        desc: "The final challenge. Prompts the player to select the guilty suspect from the list. Success ends the game.",
        examples: ["Final Accusation", "Solve the Case"]
    },
    notification: {
        title: "Notification Popup",
        desc: "A modal popup to alert the player or provide simple info. Can block progress until acknowledged.",
        examples: ["Achievement Unlocked", "System Alert", "Tutorial Tip"]
    },
    question: {
        title: "Question / Quiz",
        desc: "Ask the player a question with single or multiple correct answers. Rewarding points for correct answers.",
        examples: ["Riddle", "Knowledge Check", "Code Decryption"]
    },
    setter: {
        title: "Set Variable",
        desc: "Updates a hidden variable or logic ID in the game state. Use to manually trigger flags or track progress.",
        examples: ["Unlock Door Flag", "Set Score", "Mark Chapter Complete"]
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
    { type: 'action', label: 'Action Button', icon: MousePointerClick, className: "hover:border-indigo-500/50", iconClass: "text-indigo-400" },
    { type: 'notification', label: 'Notification', icon: Bell, className: "hover:border-sky-500/50", iconClass: "text-sky-400" },
    { type: 'question', label: 'Question', icon: HelpCircle, className: "hover:border-fuchsia-500/50", iconClass: "text-fuchsia-400" },
    { type: 'setter', label: 'Set Variable', icon: ToggleLeft, className: "hover:border-cyan-500/50", iconClass: "text-cyan-400" },
    { type: 'identify', label: 'Identify Culprit', icon: Fingerprint, className: "hover:border-red-600/50", iconClass: "text-red-600" },
];

const Editor = () => {
    const { user } = useAuth();
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
    const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [caseTitle, setCaseTitle] = useState("");

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
        media: MediaNode,
        action: ActionNode,
        identify: IdentifyNode,
        notification: NotificationNode,
        question: QuestionNode,
        setter: SetterNode
    }), []);

    const [editingEdge, setEditingEdge] = useState(null); // { id: string, label: string }
    const [tempLabel, setTempLabel] = useState(""); // For input

    // Update handler
    const onNodeUpdate = useCallback((id, newData) => {
        if (isLocked) return;
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...newData, onChange: onNodeUpdate } };
            }
            return node;
        }));
    }, [setNodes, isLocked]);

    const onConnect = useCallback((params) => {
        if (isLocked) return;
        // Create edge immediately without prompt
        setEdges((eds) => addEdge({ ...params, type: 'default' }, eds));
    }, [setEdges, isLocked]);

    const onEdgeClick = useCallback((event, edge) => {
        event.stopPropagation();
        if (isLocked) return;
        setEditingEdge(edge);
        setTempLabel(edge.label || "");
    }, [isLocked]);

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

    // Generic Duplicate Handler
    const onDuplicateNode = useCallback((id) => {
        if (isLocked) return;
        setNodes((nds) => {
            const nodeToDuplicate = nds.find((n) => n.id === id);
            if (!nodeToDuplicate) return nds;

            const newNode = {
                ...nodeToDuplicate,
                id: crypto.randomUUID(),
                position: {
                    x: nodeToDuplicate.position.x + 50,
                    y: nodeToDuplicate.position.y + 50,
                },
                data: {
                    ...nodeToDuplicate.data,
                    label: `${nodeToDuplicate.data.label} (Copy)`,
                    onChange: onNodeUpdate, // Ensure handlers are attached
                    onDuplicate: onDuplicateNode,
                },
                selected: false, // Don't auto-select to avoid confusion or keep false
            };
            return [...nds.map(node => ({ ...node, selected: false })), { ...newNode, selected: true }];
        });
    }, [onNodeUpdate, setNodes, isLocked]);

    // Reattach handlers on load where they might be missing (deserialization)
    useEffect(() => {
        if (nodes.length > 0 && !nodes[0].data.onChange) {
            setNodes((nds) => nds.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    onChange: onNodeUpdate,
                    onDuplicate: onDuplicateNode
                }
            })));
        }
    }, [nodes, onNodeUpdate, onDuplicateNode, setNodes]);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        if (isLocked) return;
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
            data: {
                label: `${type} node`,
                onChange: onNodeUpdate,
                onDuplicate: onDuplicateNode
            },
        };

        setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance, onNodeUpdate, onDuplicateNode, setNodes, isLocked]);

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
                    if (data.nodes) setNodes(data.nodes);
                    if (data.edges) setEdges(data.edges);
                    if (data.meta && data.meta.timeLimit) setTimeLimit(data.meta.timeLimit);
                    if (data.isLocked !== undefined) setIsLocked(data.isLocked);
                    if (data.title) setCaseTitle(data.title);
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

    // Time Tracking Effect
    useEffect(() => {
        if (!user || isLocked) return;

        const interval = setInterval(async () => {
            try {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    totalTimeLogged: increment(1)
                });
            } catch (error) {
                console.error("Error tracking time:", error);
            }
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [user?.uid, isLocked]);

    // ... (Update handlers remain same)

    const saveProject = async () => {
        if (!db || !projectId) return;
        if (isLocked) {
            alert("Case is locked. Editing is disabled.");
            return;
        }

        // Strip functions before saving
        // Note: react-flow nodes might contain circular refs or functions in data, usually pure data is fine.
        // function to recursively clean object for Firestore
        const cleanForFirestore = (obj) => {
            if (obj === null || obj === undefined) return null;
            if (typeof obj !== 'object') return obj;

            // Handle Arrays
            if (Array.isArray(obj)) {
                // Firestore does not support arrays of arrays. Flatten or filter.
                // It also doesn't like undefined in arrays (JSON turns them to null, which is fine, but let's be safe)
                return obj.map(item => cleanForFirestore(item)).filter(i => i !== undefined);
            }

            // Handle Objects
            const newObj = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    // Skip functions/callbacks explicitly
                    if (typeof obj[key] === 'function') continue;
                    // Skip internal react flow properties if strictly needed, but usually they are fine
                    // Skip specific problematic keys logic
                    if (key === 'onChange' || key === 'onDuplicate') continue;

                    const cleaned = cleanForFirestore(obj[key]);
                    if (cleaned !== undefined) {
                        newObj[key] = cleaned;
                    }
                }
            }
            return newObj;
        };

        const cleanNodes = nodes.map(n => cleanForFirestore(n));
        const cleanEdges = edges.map(e => cleanForFirestore(e));

        try {
            const flow = { nodes: cleanNodes, edges: cleanEdges, meta: { timeLimit } };
            const docRef = doc(db, "cases", projectId);

            // Log for debugging if it fails again
            console.log("Saving payload:", flow);

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

    const validateGraph = () => {
        const errors = [];
        const warnings = [];

        // 1. Check for Orphan Nodes (No incoming edges, unless it's a specific 'Start' like Story node at times)
        // Actually, better to check for Disconnected Components, but simple check first.
        nodes.forEach(node => {
            const incoming = edges.filter(e => e.target === node.id);
            const outgoing = edges.filter(e => e.source === node.id);

            // Orphan Check
            if (incoming.length === 0 && outgoing.length === 0) {
                warnings.push(`Node '${node.data.label}' is completely disconnected.`);
            }

            // Dead End Check (No outgoing, not terminal)
            // 'identify' is usually a terminal action, so skip it. 'terminal' node might also be end.
            const terminalTypes = ['identify', 'terminal'];
            if (outgoing.length === 0 && !terminalTypes.includes(node.type)) {
                // If it's a story node at the end, it might be okay, but usually should loop back or end.
                // We'll mark as warning.
                warnings.push(`Node '${node.data.label}' is a dead end (no outgoing connections).`);
            }

            // Logic Check
            if (node.type === 'logic') {
                if (outgoing.length < 2) {
                    errors.push(`Logic Node '${node.data.label}' should have at least 2 paths (True/False).`);
                }
            }
        });

        if (nodes.length === 0) errors.push("Graph is empty.");

        // Visual Report
        const report = [...errors.map(e => `❌ ${e}`), ...warnings.map(w => `⚠️ ${w}`)].join('\n');

        if (report) {
            alert(`Graph Health Check:\n\n${report}`);
        } else {
            alert("✅ Graph looks healthy! No obvious structural issues found.");
        }
    };

    const generateBuild = async () => {
        saveProject();
        const zip = new JSZip();

        // Clean nodes data of functions
        const cleanNodes = nodes.map(n => ({ ...n, data: { ...n.data, onChange: undefined, onDuplicate: undefined } }));
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
        if (isLocked) return;
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className={`flex h-screen w-screen flex-col overflow-hidden transition-colors duration-300 relative selection:bg-indigo-500/30 font-sans ${isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>

            {/* Ambient Background - Visible mainly in Dark Mode */}
            {isDarkMode && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {/* Vibrant Background */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen saturate-150 contrast-125 transition-all duration-1000"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2529&auto=format&fit=crop')",
                        }}
                    />
                    {/* Electronic Circuits Overlay */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-color-dodge contrast-150 brightness-150 transition-opacity"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1592659762303-90081d34b277?q=80&w=2070&auto=format&fit=crop')",
                        }}
                    />
                    <div className="absolute inset-0 perspective-grid opacity-20"></div>
                </div>
            )}

            {/* Toolbar */}
            <div id="editor-toolbar" className={`h-16 border-b flex items-center justify-between px-4 z-50 backdrop-blur-md relative transition-all duration-300 shadow-sm ${isDarkMode ? 'border-white/10 bg-black/40' : 'border-zinc-200 bg-white/80'}`}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={`${isDarkMode ? 'hover:bg-white/10 text-zinc-300 hover:text-white' : ''}`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                            <GitMerge className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className={`font-bold tracking-tight leading-none ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
                                {caseTitle || "Untitled Case"}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Mission Architect</span>
                        </div>
                        {isLocked && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/50 rounded-full text-red-400 text-[10px] font-bold uppercase tracking-wider ml-4 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                <Lock className="w-3 h-3" />
                                Review Mode
                            </div>
                        )}
                    </div>
                </div>
                <div id="editor-actions" className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 p-1 rounded-lg border ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
                        <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} className="h-8 w-8">
                            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                        </Button>
                        <div className={`w-px h-4 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-300'}`}></div>
                        <Button variant="ghost" size="icon" onClick={() => setShowTutorial(true)} title="How to use" className="h-8 w-8">
                            <CircleHelp className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={validateGraph} title="Validate Graph Health" className="h-8 w-8">
                            <Stethoscope className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} title="Game Settings" disabled={isLocked} className="h-8 w-8">
                            <Settings className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`} />
                        </Button>
                    </div>

                    <Button id="save-btn" variant="secondary" size="sm" onClick={saveProject} disabled={isLocked} className="ml-2 font-medium">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => { saveProject(); setShowPreview(true); }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border-none font-bold tracking-wide"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                    </Button>

                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative z-10">
                {/* Sidebar */}
                <aside id="node-sidebar" className={`${isPaletteCollapsed ? 'w-16' : 'w-72'} border-r flex flex-col gap-4 z-20 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] backdrop-blur-xl ${isLocked ? 'opacity-80 pointer-events-none grayscale-[0.5]' : ''} ${isDarkMode ? 'border-white/10 bg-black/60' : 'border-zinc-200 bg-white/90'}`}>
                    <div className={`flex items-center ${isPaletteCollapsed ? 'justify-center p-3' : 'justify-between p-5'} border-b ${isDarkMode ? 'border-white/5' : 'border-zinc-200'}`}>
                        {!isPaletteCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Toolkit</span>
                                <span className="text-[10px] text-zinc-500 font-medium mt-0.5">Drag nodes to build</span>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 text-zinc-500 ${isDarkMode ? 'hover:text-white hover:bg-white/10' : 'hover:text-zinc-900'}`}
                            onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
                            title={isPaletteCollapsed ? "Expand Palette" : "Collapse Palette"}
                        >
                            {isPaletteCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className={`flex-1 overflow-y-auto ${isPaletteCollapsed ? 'px-2 space-y-2' : 'px-4 space-y-1.5'}`}>
                        {PALETTE_ITEMS.map((item) => (
                            <div
                                key={item.type}
                                onDragStart={(event) => onDragStart(event, item.type)}
                                draggable
                                className={`flex items-center ${isPaletteCollapsed ? 'justify-center w-10 h-10 p-0 mx-auto rounded-xl' : 'gap-3 p-3 rounded-lg'} cursor-grab transition-all active:cursor-grabbing group relative select-none
                                    ${isDarkMode
                                        ? 'bg-transparent hover:bg-white/10 text-zinc-400 hover:text-zinc-100 border border-transparent hover:border-white/10'
                                        : 'bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                                    }
                                    ${item.className}
                                `}
                                title={isPaletteCollapsed ? item.label : undefined}
                            >
                                <div className={`flex items-center justify-center rounded-md ${isPaletteCollapsed ? 'w-full h-full' : 'w-8 h-8'} ${isDarkMode ? 'bg-zinc-900 border border-white/5 group-hover:border-white/20' : 'bg-white shadow-sm border border-zinc-200'}`}>
                                    <item.icon className={`w-4 h-4 ${item.iconClass}`} />
                                </div>

                                {!isPaletteCollapsed && (
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium leading-none ${isDarkMode ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-700'}`}>{item.label}</div>
                                    </div>
                                )}

                                {!isPaletteCollapsed && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setHelpModalData(NODE_HELP[item.type]); }}
                                        className={`ml-2 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-md hover:bg-indigo-500 hover:text-white text-zinc-500`}
                                        title="Info"
                                    >
                                        <CircleHelp className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {!isPaletteCollapsed && (
                        <div className={`mt-auto p-4 border-t ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 mt-0.5">
                                    <Fingerprint className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-300">Pro Tip</p>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">
                                        Use <span className="text-indigo-400">Logic Gates</span> to create complex branching narratives based on evidence found.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Canvas */}
                <div id="editor-canvas" className="flex-1 h-full relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={isLocked ? undefined : onNodesChange}
                        onEdgesChange={isLocked ? undefined : onEdgesChange}
                        onConnect={isLocked ? undefined : onConnect}
                        onInit={setReactFlowInstance}
                        nodesDraggable={!isLocked}
                        nodesConnectable={!isLocked}
                        elementsSelectable={!isLocked}
                        nodesFocusable={!isLocked}
                        edgesFocusable={!isLocked}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onEdgeClick={onEdgeClick}
                        nodeTypes={nodeTypes}
                        deleteKeyCode={['Backspace', 'Delete']}
                        fitView
                        className={isDarkMode ? "bg-transparent" : "bg-zinc-50"}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background color={isDarkMode ? "#52525b" : "#e4e4e7"} gap={24} size={1} className="opacity-20" />
                        <Controls className={`${isDarkMode ? 'bg-black/60 border-white/10 text-zinc-400 fill-zinc-400 backdrop-blur-md rounded-lg p-1' : 'bg-white border-zinc-200 text-zinc-600 fill-zinc-600'}`} showInteractive={false} />
                        <MiniMap
                            className={`${isDarkMode ? 'bg-black/60 border-white/10 backdrop-blur-md rounded-lg overflow-hidden' : 'bg-white border-zinc-200'}`}
                            nodeColor="#6366f1"
                            maskColor={isDarkMode ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)"}
                        />
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
