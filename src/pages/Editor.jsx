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
import { Save, ArrowLeft, Download, FileText, User, Search, GitMerge, Terminal, MessageSquare } from 'lucide-react';
import { StoryNode, SuspectNode, EvidenceNode, LogicNode, TerminalNode, MessageNode } from '../components/nodes/CustomNodes';
import JSZip from 'jszip';

const Editor = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    const nodeTypes = useMemo(() => ({
        story: StoryNode,
        suspect: SuspectNode,
        evidence: EvidenceNode,
        logic: LogicNode,
        terminal: TerminalNode,
        message: MessageNode
    }), []);

    // Initial Load
    useEffect(() => {
        const savedData = localStorage.getItem(`project_data_${projectId}`);
        if (savedData) {
            const flow = JSON.parse(savedData);
            if (flow.nodes) setNodes(flow.nodes);
            if (flow.edges) setEdges(flow.edges);
        }
    }, [projectId, setNodes, setEdges]);

    // Update handler
    const onNodeUpdate = useCallback((id, newData) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...newData, onChange: onNodeUpdate } };
            }
            return node;
        }));
    }, [setNodes]);

    // Reattach handlers on load where they might be missing (deserialization)
    useEffect(() => {
        if (nodes.length > 0 && !nodes[0].data.onChange) {
            setNodes((nds) => nds.map(node => ({
                ...node,
                data: { ...node.data, onChange: onNodeUpdate }
            })));
        }
    }, [nodes, onNodeUpdate, setNodes]);


    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

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

    const saveProject = () => {
        // We strip functions before saving is automatic in JSON.stringify but good to be aware
        const flow = { nodes, edges };
        localStorage.setItem(`project_data_${projectId}`, JSON.stringify(flow));

        const projects = JSON.parse(localStorage.getItem('mystery_projects') || '[]');
        const updated = projects.map(p => p.id === projectId ? { ...p, updatedAt: new Date().toISOString(), nodeCount: nodes.length } : p);
        localStorage.setItem('mystery_projects', JSON.stringify(updated));

        // Visual feedback
        const btn = document.getElementById('save-btn');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerText = "Saved!";
            setTimeout(() => btn.innerHTML = original, 2000);
        }
    };

    const generateBuild = async () => {
        saveProject();
        const zip = new JSZip();

        // Clean nodes data of functions
        const cleanNodes = nodes.map(n => ({ ...n, data: { ...n.data, onChange: undefined } }));
        const gameData = { nodes: cleanNodes, edges, meta: { generatedAt: new Date() } };

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
            <div className="h-16 border-b border-zinc-800 bg-black/80 flex items-center justify-between px-4 z-10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <span className="font-bold text-zinc-400">Mission Architect</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button id="save-btn" variant="secondary" size="sm" onClick={saveProject}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                    </Button>
                    <Button variant="primary" size="sm" onClick={generateBuild}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate Build
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-4 z-10">
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
                            <span className="text-sm font-medium">Chat Message</span>
                        </div>
                    </div>

                    <div className="mt-auto p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                        <p className="text-[10px] text-zinc-500">
                            Drag nodes to canvas. Connect handles to create flow logic. Save frequently.
                        </p>
                    </div>
                </aside>

                {/* Canvas */}
                <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
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
        </div>
    );
};

export default () => (
    <ReactFlowProvider>
        <Editor />
    </ReactFlowProvider>
);
