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
import { Save, ArrowLeft, Download, FileText, User, Search, GitMerge, Terminal, MessageSquare, CircleHelp, Play, Settings } from 'lucide-react';
import { StoryNode, SuspectNode, EvidenceNode, LogicNode, TerminalNode, MessageNode } from '../components/nodes/CustomNodes';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import GamePreview from '../components/GamePreview';
import { AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// ... (other imports)

const Editor = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [timeLimit, setTimeLimit] = useState(15); // Default 15 minutes

    // ... (tutorialSteps and nodeTypes remain same)

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
                    <Button variant="primary" size="sm" onClick={generateBuild}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate Build
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside id="node-sidebar" className="w-64 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-4 z-10">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Node Palette</div>

                    <div className="space-y-3">
                        <div onDragStart={(event) => onDragStart(event, 'story')} draggable className="flex items-center gap-3 p-3 rounded bg-zinc-900 border border-zinc-800 cursor-grab hover:border-indigo-500/50 hover:bg-zinc-800 transition-all active:cursor-grabbing">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium">Story Narrative</span>
                        </div>
                        <div onDragStart={(event) => onDragStart(event, 'suspect')} draggable className="flex items-center gap-3 p-3 rounded bg-zinc-900 border border-zinc-800 cursor-grab hover:border-red-500/50 hover:bg-zinc-800 transition-all active:cursor-grabbing">
                            <User className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium">Suspect Unknown</span>
                        </div>
                        <div onDragStart={(event) => onDragStart(event, 'evidence')} draggable className="flex items-center gap-3 p-3 rounded bg-zinc-900 border border-zinc-800 cursor-grab hover:border-yellow-500/50 hover:bg-zinc-800 transition-all active:cursor-grabbing">
                            <Search className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium">Evidence Item</span>
                        </div>
                        <div onDragStart={(event) => onDragStart(event, 'logic')} draggable className="flex items-center gap-3 p-3 rounded bg-zinc-900 border border-zinc-800 cursor-grab hover:border-emerald-500/50 hover:bg-zinc-800 transition-all active:cursor-grabbing">
                            <GitMerge className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium">Logic Branch</span>
                        </div>
                        <div onDragStart={(event) => onDragStart(event, 'terminal')} draggable className="flex items-center gap-3 p-3 rounded bg-zinc-900 border border-zinc-800 cursor-grab hover:border-green-500/50 hover:bg-zinc-800 transition-all active:cursor-grabbing">
                            <Terminal className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-medium">Terminal Prompt</span>
                        </div>
                        <div onDragStart={(event) => onDragStart(event, 'message')} draggable className="flex items-center gap-3 p-3 rounded bg-zinc-900 border border-zinc-800 cursor-grab hover:border-violet-500/50 hover:bg-zinc-800 transition-all active:cursor-grabbing">
                            <MessageSquare className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-medium">Message Block</span>
                        </div>
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
