import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/shared';
import { Logo } from '../components/ui/Logo';
import { Save, ArrowLeft, X, FileText, User, Search, GitMerge, Terminal, MessageSquare, Play, Settings, Music, Image as ImageIcon, MousePointerClick, Fingerprint, Bell, HelpCircle, Info, ChevronLeft, ChevronRight, ToggleLeft, Lock, Sun, Moon, Stethoscope, Unlock, Binary, Grid3x3, CheckCircle, AlertTriangle, Plus, Trash2, Target, Box, FolderOpen, Brain, Pencil, Film, Menu, Globe, ShieldAlert, Mail, LayoutGrid, Activity, Lightbulb, Volume2, VolumeX, Eye } from 'lucide-react';
import { StoryNode, SuspectNode, EvidenceNode, LogicNode, TerminalNode, MessageNode, MusicNode, MediaNode, ActionNode, IdentifyNode, NotificationNode, QuestionNode, SetterNode, LockpickNode, DecryptionNode, KeypadNode, GroupNode, InputField, InterrogationNode, ThreeDSceneNode, CutsceneNode, DeepWebOSNode, EmailNode, FactNode, CrazyWallNode } from '../components/nodes/CustomNodes';
import dagre from 'dagre';
import AICaseGeneratorModal from '../components/AICaseGeneratorModalAdvanced';
import CaseMetadataModal from '../components/CaseMetadataModal';
import { EditorContext } from '../lib/editorContext';
import LicenseConfigModal from '../components/LicenseConfigModal';
import LearningObjectivesEditor from '../components/LearningObjectivesEditor';
function FolderNode(props) {
    return <GroupNode {...props} />;
}
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import GamePreview from '../components/GamePreview';
import { AnimatePresence, motion } from 'framer-motion';
import JSZip from 'jszip';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, increment, addDoc, collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import { useConfig } from '../lib/config';
import { callAI } from '../lib/ai';
import { useLicense } from '../lib/licensing';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { jsPDF } from 'jspdf';
import StoryExportModal from '../components/StoryExportModal';

// ... (other imports)

const NODE_HELP = {
    story: {
        title: "Story Node",
        desc: "The primary narrative building block. Use this to display story text, dialogue, or descriptions to the player.",
        examples: ["Opening Scene", "Conversation with Witness", "Room Description"]
    },
    cutscene: {
        title: "Cinematic Cutscene",
        desc: "Full-screen animated cutscene with cinematic effects. Perfect for dramatic reveals, character introductions, or key story moments.",
        examples: ["Opening Credits", "Character Introduction", "Plot Twist Reveal", "Dramatic Confrontation"]
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
    interrogation: {
        title: "AI Interrogation",
        desc: "Interactive AI-powered questioning. Players can freely type questions to suspects who respond based on their persona.",
        examples: ["Interrogating the Butler", "Witness testimony verification"]
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
    email: {
        title: "Email Transmission",
        desc: "A realistic email interface for the player. Can contain sender info, subject, body, and multiple image attachments.",
        examples: ["Leaked Document", "Anonymous Tip", "Corporate Briefing"]
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
        title: "Interrogative Protocol",
        desc: "Deployment of structured inquiries to validate player intelligence. This node supports high-stakes decision points, rhythmic knowledge checks, and branched narrative outcomes based on accuracy.",
        examples: ["Cipher Verification", "Suspect Alibi Cross-Examination", "Logic Extraction Quiz"],
        details: [
            "Support for single and multi-selection modes.",
            "Dynamic point awarding and penalty systems.",
            "Custom feedback/explanations for individual answer choices.",
            "Logic ID trigger on correct submission to bridge narrative paths.",
            "Integrated hint system with progressive point costs."
        ]
    },
    setter: {
        title: "Variable Modification",
        desc: "State-level intervention. Updates persistent game variables to track mission flags, character relationships, or environmental states.",
        examples: ["Unlock High-Security Perimeter", "Initialize 'Red Protocol'", "Escalate Suspect Tension"]
    },
    lockpick: {
        title: "Lockpick Minigame",
        desc: "A reflex-based locking picking game. Player must click at the right moment to unlock pins.",
        examples: ["Locked Door", "Safe Cracking", "Briefcase Lock"]
    },
    decryption: {
        title: "Decryption Puzzle",
        desc: "A cyber-themed decoding puzzle. Player must reveal the hidden phrase within a time limit.",
        examples: ["Encrypted Server", "Scrambled Dossier", "Alien Signal"]
    },
    keypad: {
        title: "Security Keypad",
        desc: "A numeric keypad interface. Requires the player to enter a specific code found elsewhere.",
        examples: ["Vault Door", "Armory Access", "Phone Unlock"]
    },
    group: {
        title: "Sub-Graph Group",
        desc: "A container for organizing nodes. Collapse it to hide internal logic or dialogue trees.",
        examples: ["Act 1 Scene", "Side Investigation", "Complex Dialogue Tree"]
    },
    deepweb: {
        title: "Deep Web OS",
        desc: "A full-screen simulated operating system. Use this for collaborative hacking, searching for encrypted data fragments, and interacting with 'Ghost Protocol' via encrypted chat.",
        examples: ["SilkRoad 4.0 Breach", "Neural Link Investigation", "Dark Web Data Extraction"]
    },
    fact: {
        title: "Fact / Info Node",
        desc: "Explain a fact or provide information to the player. Supports rich text formatting and multiple image attachments.",
        examples: ["The Hidden Compartment", "Ancient Symbol Meaning", "Chemical Formula Discovery"]
    },
    crazywall: {
        title: "Plot Reveal — Crazy Wall",
        desc: "An interactive corkboard where players drag-and-drop suspects, their actions, and evidence tiles to reconstruct the mystery plot. Tests comprehension and links back to learning objectives.",
        examples: ["Final Revelation Board", "Mystery Unraveled", "The Last Clue"]
    }
};

const PALETTE_ITEMS = [
    { type: 'story', label: 'Story Narrative', icon: FileText, className: "hover:border-indigo-500/50", iconClass: "text-blue-400" },
    { type: 'cutscene', label: 'Cinematic Cutscene', icon: Film, className: "hover:border-purple-500/50", iconClass: "text-purple-400" },
    { type: 'suspect', label: 'Suspect', icon: User, className: "hover:border-red-500/50", iconClass: "text-red-400" },
    { type: 'evidence', label: 'Evidence Item', icon: Search, className: "hover:border-yellow-500/50", iconClass: "text-yellow-400" },
    { type: 'logic', label: 'Logic Branch', icon: GitMerge, className: "hover:border-emerald-500/50", iconClass: "text-emerald-400" },
    { type: 'terminal', label: 'Terminal Prompt', icon: Terminal, className: "hover:border-green-500/50", iconClass: "text-green-400" },
    { type: 'interrogation', label: 'AI Interrogate', icon: Brain, className: "hover:border-indigo-500/50", iconClass: "text-indigo-400" },
    { type: 'message', label: 'Message Block', icon: MessageSquare, className: "hover:border-violet-500/50", iconClass: "text-violet-400" },
    { type: 'music', label: 'Background Audio', icon: Music, className: "hover:border-pink-500/50", iconClass: "text-pink-400" },
    { type: 'email', label: 'Email Node', icon: Mail, className: "hover:border-blue-500/50", iconClass: "text-blue-400" },
    { type: 'media', label: 'Media Asset', icon: ImageIcon, className: "hover:border-orange-500/50", iconClass: "text-orange-400" },
    { type: 'action', label: 'Action Button', icon: MousePointerClick, className: "hover:border-indigo-500/50", iconClass: "text-indigo-400" },
    { type: 'notification', label: 'Notification', icon: Bell, className: "hover:border-sky-500/50", iconClass: "text-sky-400" },
    { type: 'question', label: 'Question', icon: HelpCircle, className: "hover:border-fuchsia-500/50", iconClass: "text-fuchsia-400" },
    { type: 'setter', label: 'Set Variable', icon: ToggleLeft, className: "hover:border-cyan-500/50", iconClass: "text-cyan-400" },
    { type: 'identify', label: 'Identify Culprit', icon: Fingerprint, className: "hover:border-red-600/50", iconClass: "text-red-600" },
    { type: 'lockpick', label: 'Lockpick Game', icon: Unlock, className: "hover:border-amber-500/50", iconClass: "text-amber-400" },
    { type: 'decryption', label: 'Decryption', icon: Binary, className: "hover:border-lime-500/50", iconClass: "text-lime-400" },
    { type: 'keypad', label: 'Keypad Lock', icon: Grid3x3, className: "hover:border-slate-500/50", iconClass: "text-slate-400" },
    { type: 'fact', label: 'Fact / Info', icon: Lightbulb, className: "hover:border-amber-500/50", iconClass: "text-amber-400" },
    { type: 'crazywall', label: 'Plot Reveal Wall', icon: Eye, className: "hover:border-red-500/50", iconClass: "text-red-400" },
    // { type: 'threed', label: '3D Holodeck', icon: Box, className: "hover:border-cyan-500/50", iconClass: "text-cyan-400" },
    // { type: 'deepweb', label: 'Deep Web OS', icon: Globe, className: "hover:border-emerald-500/50", iconClass: "text-emerald-400" },
];
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    // Create a fresh graph each time to avoid stale accumulated state
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        const width = node.width || (node.data?.collapsed ? 280 : 320);
        const height = node.height || (node.data?.collapsed ? 60 : 200);
        dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return {
        nodes: nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            const width = node.width || (node.data?.collapsed ? 280 : 320);
            const height = node.height || (node.data?.collapsed ? 60 : 200);

            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - width / 2,
                    y: nodeWithPosition.y - height / 2,
                }
            };
        }),
        edges
    };
};

const Editor = () => {
    const { user } = useAuth();
    const { settings } = useConfig();
    const { hasFeature, licenseData, loading: licenseLoading } = useLicense();

    const { projectId } = useParams();
    const navigate = useNavigate();
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { getIntersectingNodes } = useReactFlow();
    const [helpModalData, setHelpModalData] = useState(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [timeLimit, setTimeLimit] = useState(15); // Default 15 minutes
    const [enableTimeLimit, setEnableTimeLimit] = useState(true); // Whether to show/enforce time limit
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(window.innerWidth < 768);
    const [isSimultaneousMode, setIsSimultaneousMode] = useState(false);
    const [activeExecutingNodeId, setActiveExecutingNodeId] = useState(null);
    const [enableProgress, setEnableProgress] = useState(true); // Default to true

    const totalSteps = useMemo(() => {
        const INTERACTIVE_NODE_TYPES = [
            'story', 'cutscene', 'suspect', 'evidence', 'terminal', 'interrogation',
            'message', 'email', 'media', 'action', 'notification', 'question',
            'identify', 'lockpick', 'decryption', 'keypad', 'fact', 'crazywall',
            'threed', 'deepweb'
        ];
        return nodes.filter(n => INTERACTIVE_NODE_TYPES.includes(n.type)).length;
    }, [nodes]);

    // Sync active state to nodes for highlighting
    useEffect(() => {
        setNodes(nds => nds.map(node => ({
            ...node,
            data: {
                ...node.data,
                isExecuting: node.id === activeExecutingNodeId
            }
        })));
    }, [activeExecutingNodeId, setNodes]);

    useEffect(() => {
        if (!showPreview) {
            setActiveExecutingNodeId(null);
        }
    }, [showPreview]);

    const onGameNodeChange = useCallback((nodeId) => {
        setActiveExecutingNodeId(nodeId);
        if (nodeId && reactFlowInstance) {
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                reactFlowInstance.setCenter(node.position.x + (node.width || 300) / 2, node.position.y + (node.height || 200) / 2, {
                    zoom: 1.0,
                    duration: 500
                });
            }
        }
    }, [reactFlowInstance, nodes]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsPaletteCollapsed(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [isLocked, setIsLocked] = useState(false);

    const [isDarkMode, setIsDarkMode] = useState(true);
    const [enableThreeD, setEnableThreeD] = useState(true);
    const [enableTTS, setEnableTTS] = useState(true);
    const [caseTitle, setCaseTitle] = useState("");
    const [caseDescription, setCaseDescription] = useState("");
    const [showMetadataModal, setShowMetadataModal] = useState(false);
    const [validationReport, setValidationReport] = useState(null);
    const [learningObjectives, setLearningObjectives] = useState([]);
    const [newCategory, setNewCategory] = useState({
        name: ""
    });
    const [newObjective, setNewObjective] = useState({
        categoryId: null,
        title: "",
        detail: "",
        takeaway: ""
    });
    const [confirmDeleteCat, setConfirmDeleteCat] = useState(null); // catId or null
    const [editingBy, setEditingBy] = useState(null);
    const [showLockedModal, setShowLockedModal] = useState(false);
    const [incomingRequest, setIncomingRequest] = useState(null);
    const [requestFeedback, setRequestFeedback] = useState(null); // 'accepted' | 'declined' | null
    const [isRequesting, setIsRequesting] = useState(false);
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [showStoryFormatModal, setShowStoryFormatModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

    const [showObjectivesEditor, setShowObjectivesEditor] = useState(false);
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
        cutscene: CutsceneNode,
        suspect: SuspectNode,
        evidence: EvidenceNode,
        logic: LogicNode,
        terminal: TerminalNode,
        interrogation: InterrogationNode,
        message: MessageNode,
        music: MusicNode,
        email: EmailNode,
        media: MediaNode,
        action: ActionNode,
        identify: IdentifyNode,
        notification: NotificationNode,
        question: QuestionNode,
        setter: SetterNode,
        lockpick: LockpickNode,
        decryption: DecryptionNode,
        keypad: KeypadNode,
        group: FolderNode,
        threed: ThreeDSceneNode,
        deepweb: DeepWebOSNode,
        fact: FactNode,
        crazywall: CrazyWallNode
    }), []);

    const [editingEdge, setEditingEdge] = useState(null); // { id: string, label: string }
    const [tempLabel, setTempLabel] = useState(""); // For input
    const [tempNote, setTempNote] = useState(""); // For connection notes

    // Update handler
    const onNodeUpdate = useCallback((id, newData) => {
        if (isLocked) return;
        setNodes((nds) => {
            const updatedNodes = nds.map((node) => {
                if (node.id === id) {
                    const isClosing = newData.collapsed && !node.data.collapsed;
                    const isOpening = !newData.collapsed && node.data.collapsed;

                    let nextData = {
                        ...newData,
                        onChange: onNodeUpdate,
                        isExecuting: node.id === activeExecutingNodeId
                    };

                    if (isClosing) {
                        // Store current dimensions before collapsing
                        nextData.expandedSize = {
                            width: node.width || (node.style?.width),
                            height: node.height || (node.style?.height)
                        };
                        return {
                            ...node,
                            data: nextData,
                            style: { width: 224, height: 56 },
                            width: 224,
                            height: 56
                        };
                    } else if (isOpening) {
                        // Restore previous dimensions
                        const size = newData.expandedSize || { width: 600, height: 400 };
                        return {
                            ...node,
                            data: nextData,
                            style: { ...size },
                            width: size.width,
                            height: size.height
                        };
                    }

                    return { ...node, data: nextData };
                }
                return node;
            });

            const targetNode = updatedNodes.find(n => n.id === id);
            if (targetNode && targetNode.type === 'group') {
                return updatedNodes.map(n => {
                    if (n.parentNode === id) {
                        return { ...n, hidden: !!targetNode.data.collapsed };
                    }
                    return n;
                });
            }
            return updatedNodes;
        });
    }, [setNodes, isLocked]);

    const onConnect = useCallback((params) => {
        if (isLocked) return;
        // Create edge immediately without prompt
        setEdges((eds) => addEdge({ ...params, type: 'default' }, eds));
    }, [setEdges, isLocked]);

    const filteredNodes = useMemo(() => {
        if (!searchQuery) return [];
        const query = searchQuery.toLowerCase().trim();

        // Helper to recursively check for text in data, excluding circular/heavy references
        const searchInData = (obj, depth = 0) => {
            if (!obj || depth > 3) return false; // Prevent deep recursion

            if (typeof obj === 'string') return obj.toLowerCase().includes(query);

            if (Array.isArray(obj)) {
                return obj.some(item => searchInData(item, depth + 1));
            }

            if (typeof obj === 'object') {
                // Blacklist internal nodes/functions to avoid infinite recursion or heavy processing
                const blacklist = ['allNodes', 'onChange', 'onDuplicate', 'onUngroup', 'onShowHelp', 'style', 'position'];
                return Object.entries(obj).some(([key, val]) => {
                    if (blacklist.includes(key)) return false;
                    return searchInData(val, depth + 1);
                });
            }
            return false;
        };

        return nodes.filter(node => {
            const label = (node.data?.label || "").toLowerCase();
            const type = (node.type || "").toLowerCase();
            const id = (node.id || "").toLowerCase();

            return label.includes(query) ||
                type.includes(query) ||
                id.includes(query) ||
                searchInData(node.data);
        }).slice(0, 10);
    }, [nodes, searchQuery]);

    const navigateToNode = useCallback((node) => {
        if (!reactFlowInstance) return;

        // Calculate center precisely
        const width = node.width || 300;
        const height = node.height || 200;
        const x = node.position.x + width / 2;
        const y = node.position.y + height / 2;

        reactFlowInstance.setCenter(x, y, {
            zoom: 1.2,
            duration: 800
        });

        // Highlight the node
        setNodes((nds) => nds.map((n) => ({
            ...n,
            selected: n.id === node.id
        })));

        setSearchQuery("");
        setIsSearchOpen(false);
    }, [reactFlowInstance, setNodes]);

    const onEdgeClick = useCallback((event, edge) => {
        event.stopPropagation();
        if (isLocked) return;

        // On the first click, React Flow will select the edge via onEdgesChange.
        // On the second click, the edge will already be selected, so we open the editor.
        const currentEdge = edges.find(e => e.id === edge.id);

        if (currentEdge?.selected) {
            setEditingEdge(edge);
            setTempLabel(edge.label || "");
            setTempNote(edge.data?.note || "");
        }
    }, [isLocked, edges]);

    const saveEdgeLabel = () => {
        if (!editingEdge) return;
        setEdges((eds) => eds.map((e) => {
            if (e.id === editingEdge.id) {
                return {
                    ...e,
                    label: tempLabel === "" ? undefined : tempLabel,
                    data: { ...e.data, note: tempNote }
                };
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

    const onNodeDragStop = useCallback((_, node) => {
        if (node.type === 'group' || node.parentNode) return;

        const intersections = getIntersectingNodes(node);
        const parentGroup = intersections.find(n => n.type === 'group' && !n.data.collapsed);

        if (parentGroup) {
            setNodes((nds) => nds.map((n) => {
                if (n.id === node.id) {
                    return {
                        ...n,
                        parentNode: parentGroup.id,
                        extent: 'parent',
                        position: {
                            x: n.position.x - parentGroup.position.x,
                            y: n.position.y - parentGroup.position.y
                        }
                    };
                }
                return n;
            }));
        }
    }, [getIntersectingNodes, setNodes]);

    const onUngroup = useCallback((groupId) => {
        if (isLocked) return;
        setNodes(nds => {
            const parent = nds.find(n => n.id === groupId);
            if (!parent) return nds;

            return nds.filter(n => n.id !== groupId).map(n => {
                if (n.parentNode === groupId) {
                    return {
                        ...n,
                        parentNode: undefined,
                        extent: undefined,
                        position: {
                            x: n.position.x + parent.position.x,
                            y: n.position.y + parent.position.y
                        },
                        hidden: false
                    };
                }
                return n;
            });
        });
    }, [setNodes, isLocked]);

    const layoutNodes = useCallback((direction = 'TB') => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            direction
        );

        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);

        if (reactFlowInstance) {
            setTimeout(() => reactFlowInstance.fitView({ padding: 0.1, duration: 800 }), 100);
        }
    }, [nodes, edges, setNodes, setEdges, reactFlowInstance]);

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
                    onUngroup: onUngroup,
                },
                selected: false, // Don't auto-select to avoid confusion or keep false
            };
            return [...nds.map(node => ({ ...node, selected: false })), { ...newNode, selected: true }];
        });
    }, [onNodeUpdate, setNodes, isLocked]);

    // Guard flag: prevents loadCaseData from re-running when the user object
    // reference changes (e.g. every minute when totalTimeLogged is incremented,
    // which triggers the auth onSnapshot and creates a new user object).
    const hasLoadedData = useRef(false);
    useEffect(() => {
        // Reset the guard when the project changes so we load the new project.
        hasLoadedData.current = false;
    }, [projectId]);

    useEffect(() => {
        if (nodes.length > 0) {
            setNodes((nds) => nds.map(node => {
                // If data already matches, no need to update the reference
                if (
                    node.data.enableTTS === enableTTS &&
                    node.data.enableThreeD === enableThreeD &&
                    node.data.isExecuting === (node.id === activeExecutingNodeId) &&
                    node.data.onChange === onNodeUpdate &&
                    node.data.allNodes === nds &&
                    node.data.learningObjectives === learningObjectives
                ) {
                    return node;
                }

                return {
                    ...node,
                    data: {
                        ...node.data,
                        onChange: onNodeUpdate,
                        onDuplicate: onDuplicateNode,
                        onUngroup: onUngroup,
                        learningObjectives,
                        enableThreeD,
                        enableTTS,
                        isExecuting: node.id === activeExecutingNodeId,
                        onShowHelp: () => setHelpModalData(NODE_HELP[node.type]),
                        // Provide all canvas nodes so CrazyWallNode pickers work
                        allNodes: nds
                    }
                };
            }));
        }
    }, [nodes.length, onNodeUpdate, onDuplicateNode, onUngroup, setNodes, learningObjectives, enableThreeD, enableTTS, activeExecutingNodeId]);

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
            style: type === 'group' ? { width: 600, height: 400 } : undefined,
            data: {
                label: type === 'group' ? 'New Group' : `${type} node`,
                onChange: onNodeUpdate,
                onDuplicate: onDuplicateNode,
                onUngroup: onUngroup,
                learningObjectives
            },
        };

        if (type === 'group') {
            setNodes((nds) => [newNode, ...nds]);
        } else {
            setNodes((nds) => nds.concat(newNode));
        }
    }, [reactFlowInstance, onNodeUpdate, onDuplicateNode, setNodes, isLocked]);

    // Initial Load
    // IMPORTANT: We use `user?.uid` (not the full `user` object) in the dependency
    // array to avoid re-running this effect when the user object reference changes.
    // The user object is recreated every time the Firestore user doc changes (e.g.
    // every minute when totalTimeLogged increments), which would reload nodes from
    // Firestore and reset any unsaved node positions the user has dragged.
    // The hasLoadedData ref provides an additional guard so that if the same user
    // navigates to the same project, we don't reload and clobber unsaved changes.
    useEffect(() => {
        // Reset the guard when the project changes so we load the new project.
        hasLoadedData.current = false;
    }, [projectId]);

    useEffect(() => {
        const loadCaseData = async () => {
            if (!db || !projectId) return;
            // Wait for user to be loaded
            if (!user) return;
            // Only load once per project session to prevent Firestore user-doc
            // updates (e.g. totalTimeLogged) from re-triggering a full reload
            // that would overwrite unsaved node positions.
            if (hasLoadedData.current) return;

            // Strict Access Control: Only Admins can edit cases
            if (user.role !== 'Admin') {
                console.error("Unauthorized access to editor.");
                navigate('/');
                return;
            }

            try {
                const docRef = doc(db, "cases", projectId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.nodes) setNodes(data.nodes);
                    if (data.edges) setEdges(data.edges);
                    if (data.meta) {
                        if (data.meta.timeLimit) setTimeLimit(data.meta.timeLimit);
                        if (data.meta.enableTimeLimit !== undefined) setEnableTimeLimit(data.meta.enableTimeLimit);
                        if (data.meta.learningObjectives) setLearningObjectives(data.meta.learningObjectives);
                        if (data.meta.enableThreeD !== undefined) setEnableThreeD(data.meta.enableThreeD);
                        if (data.meta.enableTTS !== undefined) setEnableTTS(data.meta.enableTTS);
                        if (data.meta.enableProgress !== undefined) setEnableProgress(data.meta.enableProgress);
                    }
                    if (data.isLocked !== undefined) setIsLocked(data.isLocked);
                    if (data.title) setCaseTitle(data.title);
                    if (data.description) setCaseDescription(data.description);
                    // Mark as loaded so re-renders caused by user object reference
                    // changes don't trigger another load.
                    hasLoadedData.current = true;
                } else {
                    console.error("No such document!");
                }
            } catch (error) {
                console.error("Error loading case:", error);
            }
        };
        loadCaseData();
    }, [projectId, setNodes, setEdges, user?.uid, user?.role, navigate]);

    // Lock and Heartbeat Logic
    useEffect(() => {
        if (!db || !projectId || !user) return;

        const docRef = doc(db, "cases", projectId);
        let heartbeatInterval;

        const acquireLock = async () => {
            try {
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) return;

                const data = docSnap.data();
                const now = Date.now();
                const lockTimeout = 60 * 1000; // 1 minute

                if (data.editingBy && data.editingBy.uid !== user.uid) {
                    const lastActive = new Date(data.editingBy.timestamp).getTime();
                    if (now - lastActive < lockTimeout) {
                        // Already locked by someone else
                        return;
                    }
                }

                // Acquire or refresh lock
                const lockData = {
                    uid: user.uid,
                    displayName: user.displayName || "",
                    email: user.email || "",
                    timestamp: new Date().toISOString(),
                    photoURL: user.photoURL || ""
                };

                await setDoc(docRef, { editingBy: lockData }, { merge: true });

                // Start heartbeat
                heartbeatInterval = setInterval(async () => {
                    await setDoc(docRef, {
                        editingBy: {
                            ...lockData,
                            timestamp: new Date().toISOString()
                        }
                    }, { merge: true });
                }, 30000); // Every 30 seconds
            } catch (err) {
                console.error("Lock acquisition failed", err);
            }
        };

        acquireLock();

        // Monitor lock status in real-time
        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const now = Date.now();
                setEditingBy(data.editingBy);

                // Handle incoming request for Detective A (the current lock holder)
                if (data.editingBy && data.editingBy.uid === user.uid) {
                    if (data.accessRequest && data.accessRequest.status === 'pending') {
                        setIncomingRequest(data.accessRequest);
                    } else {
                        setIncomingRequest(null);
                    }
                }

                // Handle feedback for Detective B (the requester)
                if (data.accessRequest && data.accessRequest.uid === user.uid) {
                    if (data.accessRequest.status === 'accepted') {
                        setRequestFeedback('accepted');
                        // Clear request from DB after receipt
                        setDoc(docRef, { accessRequest: null }, { merge: true }).catch(() => { });
                        setTimeout(() => setRequestFeedback(null), 5000);
                    } else if (data.accessRequest.status === 'declined') {
                        setRequestFeedback('declined');
                        setIsRequesting(false);
                        // Clear request from DB after receipt
                        setTimeout(() => {
                            setDoc(docRef, { accessRequest: null }, { merge: true }).catch(() => { });
                            setRequestFeedback(null);
                        }, 5000);
                    }
                }

                // Monitor lock status in real-time
                if (data.isLocked !== undefined) setIsLocked(data.isLocked);

                if (data.editingBy && data.editingBy.uid !== user.uid) {
                    const lastActive = new Date(data.editingBy.timestamp).getTime();
                    const isStillActive = (now - lastActive < 120000);
                    setShowLockedModal(isStillActive);
                } else {
                    setShowLockedModal(false);
                }

                // Sync request status from DB
                if (!data.accessRequest) {
                    setIsRequesting(false);
                } else if (data.accessRequest.uid === user.uid && data.accessRequest.status === 'pending') {
                    setIsRequesting(true);
                }
            }
        });

        return () => {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            unsubscribe();
            // Clear lock on unmount only if it was ours
            if (user?.uid) {
                // We use a small trick: if the component is unmounting AND we were the editor, clear it.
                // However, the cleanup runs on dependency change too.
                // To be safe, we only clear if we are NOT re-running because of a project change.
                getDoc(docRef).then(s => {
                    if (s.exists() && s.data().editingBy?.uid === user.uid) {
                        setDoc(docRef, { editingBy: null }, { merge: true }).catch(() => { });
                    }
                }).catch(() => { });
            }
        };
    }, [projectId, user?.uid]);

    // Close search on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.node-search-container')) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

        // Keys that are injected at runtime by Editor and must NEVER be persisted.
        // allNodes is the main culprit — it embeds every canvas node recursively.
        const TRANSIENT_KEYS = new Set([
            'onChange', 'onDuplicate', 'onUngroup', 'onShowHelp',
            'allNodes',           // full node list injected for CrazyWallNode pickers
            'isExecuting',        // execution highlight flag
            'learningObjectives', // injected from Editor meta, already stored in meta field
            'enableTTS',          // injected from Editor meta
            'enableThreeD',       // injected from Editor meta
        ]);

        const cleanForFirestore = (obj, depth = 0) => {
            // Hard depth cap — nothing in our schema should exceed 10 levels deep
            if (depth > 10) return null;
            if (obj === null || obj === undefined) return null;
            if (typeof obj !== 'object') return obj;

            // Handle Arrays
            if (Array.isArray(obj)) {
                return obj
                    .map(item => cleanForFirestore(item, depth + 1))
                    .filter(i => i !== undefined && i !== null);
            }

            // Handle Objects
            const newObj = {};
            for (const key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                // Skip all transient runtime props
                if (TRANSIENT_KEYS.has(key)) continue;
                // Skip functions
                if (typeof obj[key] === 'function') continue;

                const cleaned = cleanForFirestore(obj[key], depth + 1);
                if (cleaned !== undefined && cleaned !== null) {
                    newObj[key] = cleaned;
                }
            }
            return newObj;
        };

        const cleanNodes = nodes.map(n => cleanForFirestore(n));
        const cleanEdges = edges.map(e => cleanForFirestore(e));

        try {
            const INTERACTIVE_NODE_TYPES = [
                'story', 'cutscene', 'suspect', 'evidence', 'terminal', 'interrogation',
                'message', 'email', 'media', 'action', 'notification', 'question',
                'identify', 'lockpick', 'decryption', 'keypad', 'fact', 'crazywall',
                'threed', 'deepweb'
            ];
            const totalSteps = nodes.filter(n => INTERACTIVE_NODE_TYPES.includes(n.type)).length;

            const flow = {
                nodes: cleanNodes,
                edges: cleanEdges,
                meta: {
                    timeLimit,
                    enableTimeLimit,
                    learningObjectives,
                    enableThreeD,
                    enableTTS,
                    enableProgress,
                    totalSteps
                }
            };

            // Pre-flight size check — Firestore document limit is ~1MB
            const payloadStr = JSON.stringify(flow);
            const payloadBytes = new TextEncoder().encode(payloadStr).length;
            console.debug(`[Save] Payload size: ${(payloadBytes / 1024).toFixed(1)} KB`);
            if (payloadBytes > 900_000) {
                console.warn(`[Save] Payload is ${(payloadBytes / 1024).toFixed(0)} KB — approaching Firestore 1 MB limit.`);
            }

            const docRef = doc(db, "cases", projectId);
            await setDoc(docRef, {
                ...flow,
                title: caseTitle,
                description: caseDescription,
                updatedAt: new Date().toISOString(),
                nodeCount: nodes.length
            }, { merge: true });

            // Visual feedback
            const btn = document.getElementById('save-btn');
            if (btn) {
                const original = btn.innerHTML;
                btn.innerText = "Saved!";
                setTimeout(() => btn.innerHTML = original, 2000);
            }
        } catch (error) {
            console.error("Error saving project:", error);
            const msg = error?.message || '';
            if (msg.includes('payload size') || msg.includes('exceeds')) {
                alert(`Save failed: project is too large for Firestore (${(new TextEncoder().encode(JSON.stringify({ nodes: cleanNodes, edges: cleanEdges })).length / 1024).toFixed(0)} KB). Try removing large image URLs from node data or splitting into smaller cases.`);
            } else {
                alert("Failed to save: " + msg);
            }
        }
    };

    const handleRequestAccess = async () => {
        if (!db || !projectId || !user) return;
        setIsRequesting(true);
        try {
            const docRef = doc(db, "cases", projectId);
            await setDoc(docRef, {
                accessRequest: {
                    uid: user.uid,
                    displayName: user.displayName || user.email,
                    email: user.email,
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                }
            }, { merge: true });
        } catch (err) {
            console.error("Failed to request access", err);
            setIsRequesting(false);
        }
    };

    const handleAcceptRequest = async () => {
        if (!db || !projectId || !incomingRequest) return;
        try {
            // 1. Save work
            await saveProject();

            // 2. Release lock and update request status
            const docRef = doc(db, "cases", projectId);
            await setDoc(docRef, {
                editingBy: null,
                accessRequest: {
                    ...incomingRequest,
                    status: 'accepted'
                }
            }, { merge: true });

            // 3. Clear local state and navigate
            setIncomingRequest(null);
            navigate('/');
        } catch (err) {
            console.error("Failed to accept request", err);
        }
    };

    const handleDeclineRequest = async () => {
        if (!db || !projectId || !incomingRequest) return;
        try {
            const docRef = doc(db, "cases", projectId);
            await setDoc(docRef, {
                accessRequest: {
                    ...incomingRequest,
                    status: 'declined'
                }
            }, { merge: true });
            setIncomingRequest(null);
        } catch (err) {
            console.error("Failed to decline request", err);
        }
    };

    const handleOverrideLock = async () => {
        if (!db || !projectId || !user) return;
        if (!window.confirm("Attacking an active lock may cause the other user to lose unsaved changes. Continue?")) return;

        try {
            const docRef = doc(db, "cases", projectId);
            const lockData = {
                uid: user.uid,
                displayName: user.displayName || user.email,
                email: user.email,
                timestamp: new Date().toISOString(),
                photoURL: user.photoURL || ""
            };
            await setDoc(docRef, {
                editingBy: lockData,
                accessRequest: null // Clear any pending requests
            }, { merge: true });
            setShowLockedModal(false);
            setRequestFeedback(null);
            setIsRequesting(false);
        } catch (err) {
            console.error("Failed to override lock", err);
        }
    };

    const validateGraph = () => {
        const errors = [];
        const warnings = [];
        const usedObjectives = new Set();

        nodes.forEach(node => {
            const incoming = edges.filter(e => e.target === node.id);
            const outgoing = edges.filter(e => e.source === node.id);

            // Orphan Check
            if (incoming.length === 0 && outgoing.length === 0) {
                warnings.push({ id: crypto.randomUUID(), type: 'warning', message: `Node '${node.data.label}' is completely disconnected.`, nodeId: node.id });
            }

            const terminalTypes = ['identify', 'terminal'];
            if (outgoing.length === 0 && !terminalTypes.includes(node.type)) {
                warnings.push({ id: crypto.randomUUID(), type: 'warning', message: `Node '${node.data.label}' is a dead end (no outgoing connections).`, nodeId: node.id });
            }

            // Logic Check
            if (node.type === 'logic') {
                if (outgoing.length < 2) {
                    errors.push({ id: crypto.randomUUID(), type: 'error', message: `Logic Node '${node.data.label}' should have at least 2 paths (True/False).`, nodeId: node.id });
                }
            }

            // Track objective usage
            if (node.data.learningObjectiveId) {
                usedObjectives.add(node.data.learningObjectiveId);
            }
            if (Array.isArray(node.data.learningObjectiveIds)) {
                node.data.learningObjectiveIds.forEach(id => usedObjectives.add(id));
            }
        });

        // Check for unused learning objectives
        learningObjectives.forEach(cat => {
            if (cat.objectives) {
                cat.objectives.forEach((obj, idx) => {
                    const objKey = `${cat.id}:${idx}`;
                    if (!usedObjectives.has(objKey)) {
                        const objTitle = typeof obj === 'string' ? obj : obj.learningObjective;
                        warnings.push({
                            id: crypto.randomUUID(),
                            type: 'warning',
                            message: `Unused Objective: '${objTitle}' (${cat.category}) is defined but not linked to any node.`,
                            nodeId: null
                        });
                    }
                });
            }
        });

        if (nodes.length === 0) errors.push({ id: crypto.randomUUID(), type: 'error', message: "Graph is empty.", nodeId: null });

        if (errors.length > 0 || warnings.length > 0) {
            setValidationReport({ errors, warnings });
        } else {
            // Show success report
            setValidationReport({ errors: [], warnings: [] });
        }
    };

    const generateBuild = async () => {
        saveProject();
        const zip = new JSZip();

        // Clean nodes data of functions
        const INTERACTIVE_NODE_TYPES = [
            'story', 'cutscene', 'suspect', 'evidence', 'terminal', 'interrogation',
            'message', 'email', 'media', 'action', 'notification', 'question',
            'identify', 'lockpick', 'decryption', 'keypad', 'fact', 'crazywall',
            'threed', 'deepweb'
        ];
        const totalSteps = nodes.filter(n => INTERACTIVE_NODE_TYPES.includes(n.type)).length;

        const gameData = {
            nodes: cleanNodes,
            edges,
            meta: {
                generatedAt: new Date(),
                timeLimit,
                enableTimeLimit,
                learningObjectives,
                enableTTS,
                enableProgress,
                totalSteps
            }
        };

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

    // ── Compute story stats for the export modal ──────────────────────────────
    const getStoryStats = () => ({
        nodeCount: nodes.length,
        edgeCount: edges.length,
        suspectCount: nodes.filter(n => n.type === 'suspect').length,
        evidenceCount: nodes.filter(n => n.type === 'evidence').length,
        questionCount: nodes.filter(n => n.type === 'question').length,
    });

    const downloadNovelStory = async (format = 'pdf', onProgress) => {
        if (!settings?.aiApiKey) {
            alert("Please set an AI API Key in settings to use this feature.");
            return;
        }

        const report = (label, pct) => onProgress?.({ label, pct });

        try {
            report('Preparing story data…', 5);
            const storyData = {
                title: caseTitle || "Untitled Mystery",
                description: caseDescription || "A thrilling detective story.",
                nodes: nodes.map(n => ({
                    id: n.id,
                    type: n.type,
                    label: n.data?.label || n.type,
                    text: n.data?.text || n.data?.description || n.data?.dialogue || n.data?.question || "",
                    score: n.data?.score || 0,
                    penalty: n.data?.penalty || 0,
                    metadata: {
                        name: n.data?.name || "",
                        role: n.data?.role || "",
                        alibi: n.data?.alibi || "",
                        description: n.data?.description || "",
                        culprit: n.data?.culpritName || "",
                        command: n.data?.command || "",
                        answer: n.data?.answer || "",
                        url: n.data?.url || "",
                        image: n.data?.image || n.data?.imageUrl || "",
                        images: n.data?.images || [],
                        mediaType: n.data?.mediaType || "",
                        blocking: n.data?.blocking || false,
                        correctAnswers: n.data?.correctAnswers || [],
                        options: n.data?.options || [],
                        hints: n.data?.hints || [],
                        helpContent: n.data?.helpContent || '',
                        variableId: n.data?.variableId || "",
                        variableValue: n.data?.variableValue || "",
                        condition: n.data?.condition || "",
                        logicIds: n.data?.logicIds || []
                    }
                })),
                edges: edges.map(e => ({
                    source: e.source,
                    target: e.target,
                    label: e.label || ""
                }))
            };

            report('Generating AI narrative overview…', 20);
            const systemPrompt = `You are an elite detective novelist. Write a concise, gripping narrative overview of this mystery case (3-5 paragraphs). 
Rules: cinematic noir/thriller tone; explain the mystery setup, main suspects, key clues, and how it builds to a climax; never mention 'nodes' or game mechanics; end with a one-sentence hook that makes someone want to play it.`;
            const userMessage = `Title: ${storyData.title}\nBackground: ${storyData.description}\n\nElements:\n${storyData.nodes.map(n => `[${n.type.toUpperCase()}] "${n.label}": ${n.text}${n.metadata.name ? ` | ${n.metadata.name} (${n.metadata.role})` : ''}`).join('\n')}\n\nFlow:\n${storyData.edges.map(e => `"${storyData.nodes.find(n => n.id === e.source)?.label || '?'}" -> "${storyData.nodes.find(n => n.id === e.target)?.label || '?'}"${e.label ? ` [${e.label}]` : ''}`).join('\n')}`;
            const story = await callAI('gemini', systemPrompt, userMessage, settings.aiApiKey);

            report('Structuring story data…', 50);
            const reviewData = buildReviewData(storyData);

            report('Building document…', 65);
            if (format === 'pdf') {
                await generateEnhancedPDF(storyData, story, reviewData, (pct) => report('Rendering pages…', 65 + Math.round(pct * 0.30)));
            } else if (format === 'docx') {
                await generateEnhancedDOCX(storyData, story, reviewData);
            }

            report('Saving file…', 98);
        } catch (error) {
            console.error("Story generation failed:", error);
            alert("Failed to generate the story document. Check your AI key and try again.");
            throw error; // re-throw so modal can reset
        }
    };

    // ── buildReviewData: BFS traversal returning structured review object ────────
    const buildReviewData = (storyData) => {
        const TYPE_EMOJI = {
            story: '📖', suspect: '🕵️', evidence: '🔍', question: '❓',
            terminal: '💻', logic: '🔀', setter: '⚙️', media: '🎬',
            message: '💬', email: '📧', fact: '💡', notification: '🔔',
            action: '🖱️', lockpick: '🔓', keypad: '🔢', decryption: '🔐',
            interrogation: '🗣️', threed: '🌐', cutscene: '🎥', deepweb: '🌑',
            identify: '⚖️', music: '🎵', crazywall: '🧩',
        };
        const emoji = (t) => TYPE_EMOJI[t] || '📌';

        const incomingSet = new Set(storyData.edges.map(e => e.target));
        let roots = storyData.nodes.filter(n => !incomingSet.has(n.id));
        if (roots.length === 0 && storyData.nodes.length > 0) {
            const outDegree = {};
            storyData.edges.forEach(e => { outDegree[e.source] = (outDegree[e.source] || 0) + 1; });
            roots = [[...storyData.nodes].sort((a, b) => (outDegree[b.id] || 0) - (outDegree[a.id] || 0))[0]];
        }

        // BFS
        const visited = new Set();
        const orderedNodes = [];
        const queue = [...roots];
        roots.forEach(r => visited.add(r.id));
        while (queue.length > 0) {
            const cur = queue.shift();
            orderedNodes.push(cur);
            storyData.edges.filter(e => e.source === cur.id).forEach(edge => {
                if (!visited.has(edge.target)) {
                    visited.add(edge.target);
                    const child = storyData.nodes.find(n => n.id === edge.target);
                    if (child) queue.push(child);
                }
            });
        }
        storyData.nodes.forEach(n => { if (!visited.has(n.id)) orderedNodes.push(n); });

        const nodeLabel = (id) => storyData.nodes.find(n => n.id === id)?.label || id;
        const deadEnds = storyData.nodes.filter(n => !storyData.edges.some(e => e.source === n.id) && n.type !== 'identify');
        const orphans = storyData.nodes.filter(n => !storyData.edges.some(e => e.source === n.id) && !storyData.edges.some(e => e.target === n.id));
        const suspects = storyData.nodes.filter(n => n.type === 'suspect');
        const evidence = storyData.nodes.filter(n => n.type === 'evidence');
        const questions = storyData.nodes.filter(n => n.type === 'question');

        const nodeTypes = {};
        storyData.nodes.forEach(n => { nodeTypes[n.type] = (nodeTypes[n.type] || 0) + 1; });

        return { orderedNodes, roots, nodeLabel, deadEnds, orphans, suspects, evidence, questions, nodeTypes, emoji };
    };

    // Helper function to generate designer-friendly canvas review (markdown – kept for reference)
    const generateDesignerReview = (storyData) => {
        const divider = '\n\n' + '─'.repeat(80) + '\n\n';

        // ── Topology: BFS from root node(s) ──────────────────────────────────────────
        // Root nodes = nodes with no incoming edges
        const incomingSet = new Set(storyData.edges.map(e => e.target));
        let roots = storyData.nodes.filter(n => !incomingSet.has(n.id));

        // Fallback: if everything has incoming edges (cycle), pick the node with most outgoing
        if (roots.length === 0 && storyData.nodes.length > 0) {
            const outDegree = {};
            storyData.edges.forEach(e => { outDegree[e.source] = (outDegree[e.source] || 0) + 1; });
            const sorted = [...storyData.nodes].sort((a, b) => (outDegree[b.id] || 0) - (outDegree[a.id] || 0));
            roots = [sorted[0]];
        }

        // BFS traversal to determine display order
        const visited = new Set();
        const orderedNodes = [];
        const queue = [...roots];
        roots.forEach(r => visited.add(r.id));

        while (queue.length > 0) {
            const current = queue.shift();
            orderedNodes.push(current);

            // Get children in edge order
            const childEdges = storyData.edges.filter(e => e.source === current.id);
            childEdges.forEach(edge => {
                if (!visited.has(edge.target)) {
                    visited.add(edge.target);
                    const childNode = storyData.nodes.find(n => n.id === edge.target);
                    if (childNode) queue.push(childNode);
                }
            });
        }

        // Append any disconnected nodes not reached via BFS
        storyData.nodes.forEach(n => {
            if (!visited.has(n.id)) orderedNodes.push(n);
        });

        // Helper: get node label by ID
        const nodeLabel = (id) => storyData.nodes.find(n => n.id === id)?.label || id;

        // ── TYPE EMOJI MAP ────────────────────────────────────────────────────────────
        const typeEmoji = {
            story: '📖', suspect: '🕵️', evidence: '🔍', question: '❓',
            terminal: '💻', logic: '🔀', setter: '⚙️', media: '🎬',
            message: '💬', email: '📧', fact: '💡', notification: '🔔',
            action: '🖱️', lockpick: '🔓', keypad: '🔢', decryption: '🔐',
            interrogation: '🗣️', threed: '🌐', cutscene: '🎥', deepweb: '🌑',
            identify: '⚖️', music: '🎵'
        };

        const emoji = (type) => typeEmoji[type] || '📌';

        // ── HEADER ────────────────────────────────────────────────────────────────────
        let review = '';
        review += '# 🕵️ DESIGNER\'S STORY REVIEW\n\n';
        review += `**Mission:** ${storyData.title}\n`;
        review += `**Description:** ${storyData.description}\n\n`;
        review += `> *This document presents your story flow in player order — from the first node players encounter to the last. Use it to spot issues, review dialogue and questions, and validate the complete player experience.*\n`;

        // ── STATS BOX ─────────────────────────────────────────────────────────────────
        review += divider;
        review += '## 📊 CANVAS AT A GLANCE\n\n';
        review += `| Metric | Value |\n|--------|-------|\n`;
        review += `| Total Nodes | ${storyData.nodes.length} |\n`;
        review += `| Total Connections | ${storyData.edges.length} |\n`;

        const nodeTypes = {};
        storyData.nodes.forEach(n => { nodeTypes[n.type] = (nodeTypes[n.type] || 0) + 1; });
        Object.entries(nodeTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
            review += `| ${emoji(type)} ${type.charAt(0).toUpperCase() + type.slice(1)} nodes | ${count} |\n`;
        });
        review += '\n';

        if (roots.length > 0) {
            review += `**🟢 Start node(s):** ${roots.map(n => `"${n.label}"`).join(', ')}\n\n`;
        }

        // Dead ends
        const deadEnds = storyData.nodes.filter(n => {
            return !storyData.edges.some(e => e.source === n.id) && n.type !== 'identify';
        });
        if (deadEnds.length > 0) {
            review += `**🔴 Terminal / End node(s):** ${deadEnds.map(n => `"${n.label}" [${n.type}]`).join(', ')}\n\n`;
        }

        // Disconnected / orphan nodes
        const orphans = storyData.nodes.filter(n =>
            !storyData.edges.some(e => e.source === n.id) &&
            !storyData.edges.some(e => e.target === n.id)
        );
        if (orphans.length > 0) {
            review += `**⚠️ Orphaned (unconnected) nodes:** ${orphans.map(n => `"${n.label}" [${n.type}]`).join(', ')}\n\n`;
        }

        // ── STORY FLOW WALKTHROUGH ────────────────────────────────────────────────────
        review += divider;
        review += '## 🎬 STORY FLOW — NODE BY NODE\n\n';
        review += '*Nodes are listed in the order a player would encounter them, starting from the root and following each connection.*\n\n';

        orderedNodes.forEach((node, index) => {
            const isStart = roots.some(r => r.id === node.id);
            const isEnd = !storyData.edges.some(e => e.source === node.id);

            review += `### ${index + 1}. ${emoji(node.type)} ${node.label}`;
            if (isStart) review += `  ← **[START]**`;
            if (isEnd && node.type !== 'identify') review += `  ← **[END]**`;
            review += `\n`;
            review += `> **Type:** \`${node.type}\`\n\n`;

            // ── Content / dialogue text ────────────────────────────────────────────
            if (node.text && node.text.trim()) {
                review += `**Content / Dialogue:**\n`;
                review += `> ${node.text.replace(/\n/g, '\n> ')}\n\n`;
            }

            // ── Type-specific sections ─────────────────────────────────────────────
            switch (node.type) {
                case 'story':
                case 'notification':
                    if (node.metadata.variableId) {
                        review += `- **Logic ID set on visit:** \`${node.metadata.variableId}\`\n`;
                    }
                    if (node.metadata.blocking) review += `- **Blocking:** Player must explicitly continue\n`;
                    break;

                case 'suspect':
                    if (node.metadata.name) review += `- **Name:** ${node.metadata.name}\n`;
                    if (node.metadata.role) review += `- **Role / Occupation:** ${node.metadata.role}\n`;
                    if (node.metadata.alibi) review += `- **Alibi:** ${node.metadata.alibi}\n`;
                    if (node.metadata.description) review += `- **Description / Backstory:** ${node.metadata.description}\n`;
                    if (node.metadata.culprit) review += `\n> CULPRIT: This suspect is the culprit (${node.metadata.culprit}).\n`;
                    // Suspect profile images
                    if (node.metadata.images && node.metadata.images.length > 0) {
                        review += `\n**Profile Image(s):**\n`;
                        node.metadata.images.forEach((imgUrl, i) => {
                            if (imgUrl) review += `![Suspect Image ${i + 1}](${imgUrl})\n`;
                        });
                    }
                    break;

                case 'evidence':
                    if (node.metadata.description) review += `- **Evidence Details:** ${node.metadata.description}\n`;
                    if (node.metadata.variableId) review += `- **Logic ID:** \`${node.metadata.variableId}\`\n`;
                    if (node.metadata.image) {
                        review += `\n**Evidence Image:**\n`;
                        review += `![Evidence](${node.metadata.image})\n`;
                    }
                    break;

                case 'question':
                    // Question text (already shown as 'Content' above)
                    if (node.metadata.helpContent) {
                        review += `\n**ℹ️ Additional Help/Context shown to player:**\n`;
                        review += `> *"${node.metadata.helpContent}"*\n\n`;
                    }
                    if (node.metadata.options && Array.isArray(node.metadata.options) && node.metadata.options.length > 0) {
                        review += `\n**Answer Choices:**\n\n`;
                        node.metadata.options.forEach((opt, optIdx) => {
                            if (!opt) return;
                            const status = opt.isCorrect ? '✅ CORRECT' : '❌ INCORRECT';
                            review += `  ${optIdx + 1}. **${opt.text || 'Untitled Option'}** — ${status}\n`;
                            if (opt.explanation && opt.explanation.trim()) {
                                review += `     > *Explanation:* ${opt.explanation.trim()}\n`;
                            }
                        });
                    }
                    if (node.metadata.hints && Array.isArray(node.metadata.hints) && node.metadata.hints.length > 0) {
                        review += `\n**Hints available to player:**\n`;
                        node.metadata.hints.forEach((hint, hi) => {
                            if (!hint) return;
                            review += `  - Hint ${hi + 1}: "${hint.text || 'Untitled'}" — costs **-${hint.penalty || 0} pts**\n`;
                        });
                    }
                    review += '\n';
                    if (node.metadata.variableId) review += `- **Logic ID:** \`${node.metadata.variableId}\`\n`;
                    break;

                case 'terminal':
                    if (node.text) review += `- **Task Description:** ${node.text}\n`;
                    if (node.metadata.command) review += `- **Required Command/Answer:** \`${node.metadata.command}\`\n`;
                    if (node.metadata.answer) review += `- **Expected Answer:** ${node.metadata.answer}\n`;
                    if (node.metadata.variableId) review += `- **Logic ID on success:** \`${node.metadata.variableId}\`\n`;
                    break;

                case 'logic':
                    if (node.metadata.condition) review += `- **Condition type:** ${node.metadata.condition}\n`;
                    if (node.metadata.logicIds && node.metadata.logicIds.length > 0) {
                        review += `- **Required Logic IDs:** ${node.metadata.logicIds.map(id => `\`${id}\``).join(', ')}\n`;
                    }
                    break;

                case 'setter':
                    if (node.metadata.variableId) review += `- **Sets variable:** \`${node.metadata.variableId}\`\n`;
                    if (node.metadata.variableValue !== undefined && node.metadata.variableValue !== '')
                        review += `- **Value:** \`${node.metadata.variableValue}\`\n`;
                    break;

                case 'email':
                    if (node.metadata.variableId) review += `- **Logic ID set on read:** \`${node.metadata.variableId}\`\n`;
                    // Email attachments (images)
                    if (node.metadata.images && node.metadata.images.length > 0) {
                        review += `\n**Email Attachments:**\n`;
                        node.metadata.images.forEach((imgUrl, i) => {
                            if (imgUrl) review += `![Attachment ${i + 1}](${imgUrl})\n`;
                        });
                    }
                    break;

                case 'media':
                    if (node.metadata.mediaType) review += `- **Media Type:** ${node.metadata.mediaType}\n`;
                    if (node.metadata.url) review += `- **URL:** ${node.metadata.url}\n`;
                    if (node.metadata.description) review += `- **Caption:** ${node.metadata.description}\n`;
                    // Embed image if it's an image type media node
                    if (node.metadata.url && (!node.metadata.mediaType || node.metadata.mediaType === 'image')) {
                        review += `\n**Media Image:**\n`;
                        review += `![Media Image](${node.metadata.url})\n`;
                    }
                    break;

                case 'lockpick':
                case 'keypad':
                case 'decryption':
                    if (node.metadata.command) review += `- **Passcode / Target:** \`${node.metadata.command}\`\n`;
                    break;

                case 'identify':
                    if (node.metadata.culprit) review += `- **Correct Culprit:** ${node.metadata.culprit}\n`;
                    break;

                case 'fact':
                    if (node.metadata.description) review += `- **Fact Details:** ${node.metadata.description}\n`;
                    if (node.metadata.variableId) review += `- **Logic ID:** \`${node.metadata.variableId}\`\n`;
                    // Fact images (array)
                    if (node.metadata.images && node.metadata.images.length > 0) {
                        review += `\n**Fact Image(s):**\n`;
                        node.metadata.images.forEach((imgUrl, i) => {
                            if (imgUrl) review += `![Fact Image ${i + 1}](${imgUrl})\n`;
                        });
                    }
                    break;
            }

            // ── Scoring / Penalty ──────────────────────────────────────────────────
            const rawNode = nodes.find(n => n.id === node.id);
            if (rawNode) {
                if (rawNode.data?.score) review += `\n- **Score reward:** +${rawNode.data.score} pts\n`;
                if (rawNode.data?.penalty) review += `- **Penalty:** -${rawNode.data.penalty} pts\n`;
            }

            // ── Connections ────────────────────────────────────────────────────────
            const outgoing = storyData.edges.filter(e => e.source === node.id);
            const incoming = storyData.edges.filter(e => e.target === node.id);

            review += '\n';

            if (incoming.length > 0) {
                review += `**↑ Reached from:** ${incoming.map(e => {
                    const lbl = nodeLabel(e.source);
                    return e.label ? `"${lbl}" _(${e.label})_` : `"${lbl}"`;
                }).join(' · ')}\n`;
            }

            if (outgoing.length > 0) {
                if (outgoing.length === 1) {
                    review += `**↓ Leads to:** "${nodeLabel(outgoing[0].target)}"${outgoing[0].label ? ` _(${outgoing[0].label})_` : ''}\n`;
                } else {
                    review += `**↓ Branches to:**\n`;
                    outgoing.forEach(e => {
                        review += `  → "${nodeLabel(e.target)}"${e.label ? ` _(${e.label})_` : ''}\n`;
                    });
                }
            } else {
                review += `**↓ End of path** _(no further connections)_\n`;
            }

            review += '\n' + '─'.repeat(60) + '\n\n';
        });

        // ── CHARACTER PROFILES ────────────────────────────────────────────────────────
        const suspects = storyData.nodes.filter(n => n.type === 'suspect');
        if (suspects.length > 0) {
            review += divider;
            review += '## 👥 CHARACTER PROFILES\n\n';
            suspects.forEach((suspect, index) => {
                review += `### ${index + 1}. ${suspect.metadata.name || suspect.label}\n\n`;
                if (suspect.metadata.role) review += `**Role:** ${suspect.metadata.role}\n`;
                if (suspect.metadata.alibi) review += `**Alibi:** ${suspect.metadata.alibi}\n`;
                if (suspect.metadata.description) review += `**Background:** ${suspect.metadata.description}\n`;
                if (suspect.text) review += `**Profile Text:** ${suspect.text}\n`;
                if (suspect.metadata.culprit) review += `\n> ⚠️ **CULPRIT** — designated answer: \`${suspect.metadata.culprit}\`\n`;
                review += '\n';
            });
        }

        // -- EVIDENCE TRACKER --
        const evidence = storyData.nodes.filter(n => n.type === 'evidence');
        if (evidence.length > 0) {
            review += divider;
            review += '## EVIDENCE TRACKER\n\n';
            evidence.forEach((item, index) => {
                review += `### ${index + 1}. ${item.label}\n\n`;
                if (item.metadata.variableId) review += `- **Logic ID:** \`${item.metadata.variableId}\`\n`;
                if (item.metadata.description) review += `- **Description:** ${item.metadata.description}\n`;
                if (item.text) review += `- **Details:** ${item.text}\n`;
                if (item.metadata.image) {
                    review += `\n**Evidence Image:**\n`;
                    review += `![Evidence](${item.metadata.image})\n`;
                }
                review += '\n';
            });
        }

        // ── QUESTION BANK ─────────────────────────────────────────────────────────────
        const questions = storyData.nodes.filter(n => n.type === 'question');
        if (questions.length > 0) {
            review += divider;
            review += '## QUESTION BANK\n\n';
            review += '*Full answer key for every question — for designer review only.*\n\n';
            questions.forEach((qNode, qi) => {
                review += `### Q${qi + 1}. ${qNode.label}\n\n`;
                review += `**Question:** ${qNode.text || '(no question text set)'}\n\n`;

                if (qNode.metadata.helpContent) {
                    review += `**Additional Help shown to player:**\n`;
                    review += `> ${qNode.metadata.helpContent}\n\n`;
                }

                if (qNode.metadata.options && qNode.metadata.options.length > 0) {
                    review += `**Answer Choices:**\n\n`;
                    qNode.metadata.options.forEach((opt, oi) => {
                        if (!opt) return;
                        const status = opt.isCorrect ? '[CORRECT]' : '[INCORRECT]';
                        review += `  ${oi + 1}. ${status} ${opt.text || '—'}\n`;
                        if (opt.explanation && opt.explanation.trim()) {
                            review += `     Explanation: ${opt.explanation.trim()}\n`;
                        }
                        review += '\n';
                    });
                }

                if (qNode.metadata.hints && qNode.metadata.hints.length > 0) {
                    review += `**Hints:**\n`;
                    qNode.metadata.hints.forEach((hint, hi) => {
                        if (!hint) return;
                        review += `  - Hint ${hi + 1}: "${hint.text || '—'}" (Penalty: -${hint.penalty || 0} pts)\n`;
                    });
                    review += '\n';
                }

                review += '---\n\n';
            });
        }

        // ── FLOW HEALTH CHECK ─────────────────────────────────────────────────────────
        review += divider;
        review += '## 💡 FLOW HEALTH CHECK\n\n';
        let healthOk = true;

        if (orphans.length > 0) {
            healthOk = false;
            review += `**⚠️ Orphaned nodes (no connections at all):**\n`;
            orphans.forEach(n => review += `  - "${n.label}" [${n.type}]\n`);
            review += '\n';
        }

        if (deadEnds.length > 0) {
            review += `**ℹ️ End nodes (intentional dead-ends / finales):**\n`;
            deadEnds.forEach(n => review += `  - "${n.label}" [${n.type}]\n`);
            review += '\n';
        }

        const hasIdentify = storyData.nodes.some(n => n.type === 'identify');
        if (!hasIdentify) {
            healthOk = false;
            review += '**⚠️ No "Identify Culprit" node found.** Consider adding one to give the mystery a clear finale.\n\n';
        }

        if (suspects.length === 0) {
            review += '**💭 Suggestion:** Add suspect nodes to create characters for the mystery.\n\n';
        }

        if (evidence.length === 0) {
            review += '**💭 Suggestion:** Add evidence nodes to give players clues to find.\n\n';
        }

        if (healthOk && orphans.length === 0) {
            review += '**✅ Story flow looks healthy** — all nodes are connected and reachable.\n\n';
        }

        review += divider;
        review += '\n*End of Designer\'s Story Review*\n';
        review += `*Generated: ${new Date().toLocaleString()}*\n`;

        return review;
    };




    // Helper to clean text from problematic characters for PDF
    const cleanTextForPDF = (text) => {
        if (!text) return '';
        return text
            // Remove all emoji / symbol Unicode blocks
            .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')   // Emoji & supplemental symbols
            .replace(/[\u{2600}-\u{27BF}]/gu, '')      // Misc symbols, dingbats, arrows
            .replace(/[\u{2B00}-\u{2BFF}]/gu, '')      // Misc symbols and arrows
            .replace(/[\u{FE00}-\u{FEFF}]/gu, '')      // Variation selectors / BOM
            // Replace smart / curly arrows used in the review
            .replace(/[↑↓←→⇒⇐]/g, (c) => ({ '↑': '^', '↓': 'v', '←': '<-', '→': '->', '⇒': '=>', '⇐': '<=' }[c] || c))
            // Replace Unicode box/dash characters
            .replace(/[─━─—–]/g, '-')
            // Remove any remaining non-printable / non-ASCII control chars except newline
            .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
            .trim();
    };

    // Fetch a remote image and return a base64 data-URL for jsPDF addImage
    const fetchImageAsBase64 = async (url) => {
        if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
        try {
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) return null;
            const blob = await response.blob();
            return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    };

    // ─── generateEnhancedPDF ──────────────────────────────────────────────────────

    const generateEnhancedPDF = async (storyData, story, reviewData, onProgress) => {
        const { orderedNodes, roots, nodeLabel, deadEnds, orphans, suspects, evidence, questions, nodeTypes, emoji } = reviewData;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PW = doc.internal.pageSize.getWidth();   // 210mm
        const PH = doc.internal.pageSize.getHeight();  // 297mm
        const M = 20;           // left/right margin
        const FOOTER_H = 18;    // reserved at bottom for footer
        const SAFE_BOTTOM = PH - FOOTER_H;
        const CW = PW - 2 * M; // usable content width
        let y = M;
        let pageNum = 1;
        // ── Pre-fetch all node images (suspects, evidence, questions) ──────────────
        onProgress?.(0);
        const nodeImages = {}; // nodeId -> base64 data URL
        const imageNodes = storyData.nodes.filter(n =>
            ['suspect', 'evidence', 'question'].includes(n.type) &&
            (n.metadata.image || (n.metadata.images && n.metadata.images[0]))
        );
        for (let i = 0; i < imageNodes.length; i++) {
            const n = imageNodes[i];
            const url = n.metadata.image || n.metadata.images?.[0];
            const b64 = await fetchImageAsBase64(url).catch(() => null);
            if (b64) nodeImages[n.id] = b64;
            onProgress?.((i + 1) / Math.max(imageNodes.length, 1) * 0.3);
        }

        const LINE_H = 6;       // standard line height (mm)

        const COLORS = {
            indigo: [79, 70, 229], violet: [124, 58, 237], amber: [217, 119, 6],
            slate: [51, 65, 85], white: [255, 255, 255], light: [248, 250, 252],
            muted: [100, 116, 139], body: [30, 41, 59], border: [203, 213, 225],
            green: [22, 163, 74], red: [220, 38, 38], blue: [37, 99, 235],
            pink: [219, 39, 119], yellow: [202, 138, 4], orange: [234, 88, 12],
            teal: [13, 148, 136],
        };

        const TYPE_COLOR = {
            story: COLORS.indigo, suspect: COLORS.pink, evidence: COLORS.amber,
            question: COLORS.violet, terminal: COLORS.teal, logic: COLORS.green,
            setter: COLORS.blue, media: COLORS.orange, message: COLORS.blue,
            email: COLORS.blue, fact: COLORS.yellow, notification: COLORS.slate,
            identify: COLORS.red, cutscene: COLORS.violet, interrogation: COLORS.pink,
            deepweb: COLORS.slate, lockpick: COLORS.teal, keypad: COLORS.teal,
            decryption: COLORS.teal,
        };
        const typeColor = (t) => TYPE_COLOR[t] || COLORS.indigo;

        const clean = (txt) => {
            if (!txt) return '';
            return txt
                // Remove all emoji / symbol Unicode blocks
                .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
                .replace(/[\u{2600}-\u{27BF}]/gu, '')
                .replace(/[\u{2B00}-\u{2BFF}]/gu, '')
                // Replace smart / curly arrows
                .replace(/[↑↓←→⇒⇐]/g, (c) => ({ '↑': '^', '↓': 'v', '←': '<-', '→': '->', '⇒': '=>', '⇐': '<=' }[c] || c))
                // Basic ASCII cleaning
                .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
                .replace(/[─━—–]/g, '-')
                .trim();
        };

        const newPage = () => {
            // Draw footer on current page before turning
            doc.setFontSize(7); doc.setTextColor(...COLORS.muted); doc.setFont('helvetica', 'normal');
            doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.2);
            doc.line(M, SAFE_BOTTOM + 2, PW - M, SAFE_BOTTOM + 2);
            const titleClean = clean(storyData.title).substring(0, 50);
            doc.text(titleClean + ' — Story Review', M, SAFE_BOTTOM + 8);
            doc.text(`Page ${pageNum}`, PW - M, SAFE_BOTTOM + 8, { align: 'right' });
            doc.addPage();
            pageNum++;
            y = M;
        };

        // Returns true and turns page if remaining space < needed mm
        const checkY = (needed = 12) => {
            if (y + needed > SAFE_BOTTOM) { newPage(); return true; }
            return false;
        };

        // Gap helper — adds vertical space, turning page if needed
        const gap = (mm = 3) => { y += mm; checkY(0); };

        // ── helpers ──────────────────────────────────────────────────────────────
        const sectionBanner = (title, color = COLORS.indigo) => {
            checkY(16);
            doc.setFillColor(...color);
            doc.roundedRect(M, y, CW, 13, 2, 2, 'F');
            doc.setFontSize(11); doc.setTextColor(...COLORS.white); doc.setFont('helvetica', 'bold');
            doc.text(clean(title), M + 5, y + 9);
            y += 18;
        };

        const subHeading = (title, color = COLORS.indigo) => {
            checkY(12);
            doc.setFontSize(10); doc.setTextColor(...color); doc.setFont('helvetica', 'bold');
            doc.text(clean(title), M, y + 5);
            y += 7;
            doc.setDrawColor(...color); doc.setLineWidth(0.4);
            doc.line(M, y, M + doc.getTextWidth(clean(title)), y);
            y += 4;
        };

        const bodyText = (text, indent = 0, color = COLORS.body, size = 9.5) => {
            if (!text || !text.toString().trim()) return;
            doc.setFontSize(size); doc.setTextColor(...color); doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(clean(text.toString()), CW - indent);
            lines.forEach(l => {
                checkY(LINE_H + 1);
                doc.text(l, M + indent, y);
                y += LINE_H;
            });
            y += 2; // paragraph gap
        };

        const labelValue = (label, value, indent = 0) => {
            if (!value || !value.toString().trim()) return;
            checkY(LINE_H + 1);
            doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.slate);
            const lw = doc.getTextWidth(label + ': ');
            doc.text(label + ': ', M + indent, y);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.body);
            const maxW = CW - indent - lw;
            const valLines = doc.splitTextToSize(clean(value.toString()), maxW);
            // First line on same row as label
            doc.text(valLines[0], M + indent + lw, y);
            y += LINE_H;
            // Subsequent lines indented under the value
            for (let i = 1; i < valLines.length; i++) {
                checkY(LINE_H + 1);
                doc.text(valLines[i], M + indent + lw, y);
                y += LINE_H;
            }
        };

        const bullet = (text, indent = 4, color = COLORS.body) => {
            if (!text) return;
            checkY(LINE_H + 1);
            doc.setFontSize(9); doc.setTextColor(...color); doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(clean(text), CW - indent - 6);
            // Draw bullet on the first line only
            doc.text('\u2022', M + indent, y);
            lines.forEach((l, i) => {
                checkY(LINE_H + 1);
                doc.text(l, M + indent + 5, y);
                y += LINE_H;
            });
        };

        const divLine = (color = COLORS.border) => {
            checkY(6);
            doc.setDrawColor(...color); doc.setLineWidth(0.2);
            doc.line(M, y, PW - M, y);
            y += 6;
        };

        const pill = (text, color, x, py) => {
            const t = clean(text); if (!t) return 0;
            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
            const tw = doc.getTextWidth(t);
            const pw2 = tw + 6;
            doc.setFillColor(color[0], color[1], color[2]);
            doc.setDrawColor(...color); doc.setLineWidth(0.3);
            doc.roundedRect(x, py - 4.5, pw2, 6, 1.5, 1.5, 'F');
            doc.setTextColor(...COLORS.white); doc.text(t, x + 3, py);
            return pw2 + 3;
        };

        // ─────────────────────────────────────────────────────────────────────────
        // PAGE 1 — COVER
        // ─────────────────────────────────────────────────────────────────────────
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, PW, PH, 'F');
        // gradient strip top
        doc.setFillColor(...COLORS.indigo); doc.rect(0, 0, PW, 2, 'F');
        // gradient strip amber accent
        doc.setFillColor(...COLORS.amber); doc.rect(0, 2, PW * 0.4, 2, 'F');
        doc.setFillColor(124, 58, 237); doc.rect(PW * 0.4, 2, PW * 0.6, 2, 'F');

        // Label
        doc.setFontSize(9); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal');
        doc.text('MYSTERY GAMES FRAMEWORK', PW / 2, 30, { align: 'center' });
        doc.text('STORY DESIGN REVIEW DOCUMENT', PW / 2, 37, { align: 'center' });

        // Decorative ring
        doc.setDrawColor(...COLORS.indigo); doc.setLineWidth(0.5);
        doc.circle(PW / 2, PH / 2 - 30, 45, 'S');
        doc.setDrawColor(217, 119, 6, 0.3); doc.setLineWidth(0.3);
        doc.circle(PW / 2, PH / 2 - 30, 50, 'S');

        // Title
        doc.setFontSize(26); doc.setTextColor(248, 250, 252); doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(storyData.title, CW - 20);
        let ty = PH / 2 - 10;
        titleLines.forEach(l => { doc.text(l, PW / 2, ty, { align: 'center' }); ty += 13; });

        // Subtitle
        doc.setFontSize(11); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'italic');
        doc.text('A Mystery Game Story', PW / 2, ty + 5, { align: 'center' });

        // Description
        if (storyData.description) {
            doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal');
            const dl = doc.splitTextToSize(storyData.description, CW - 30);
            let dy = ty + 16;
            dl.forEach(l => { doc.text(l, PW / 2, dy, { align: 'center' }); dy += 5; });
        }

        // Stats strip
        const statsY = PH - 55;
        doc.setFillColor(30, 41, 59); doc.setDrawColor(51, 65, 85);
        doc.setLineWidth(0.3); doc.roundedRect(M, statsY, CW, 28, 3, 3, 'FD');
        const statItems = [
            { label: 'Nodes', value: storyData.nodes.length },
            { label: 'Connections', value: storyData.edges.length },
            { label: 'Suspects', value: suspects.length },
            { label: 'Evidence', value: evidence.length },
            { label: 'Questions', value: questions.length },
        ];
        const sw = CW / statItems.length;
        statItems.forEach((s, i) => {
            const sx = M + i * sw + sw / 2;
            doc.setFontSize(16); doc.setTextColor(...COLORS.amber); doc.setFont('helvetica', 'bold');
            doc.text(s.value.toString(), sx, statsY + 13, { align: 'center' });
            doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal');
            doc.text(s.label.toUpperCase(), sx, statsY + 21, { align: 'center' });
        });

        // Footer
        doc.setFontSize(7); doc.setTextColor(71, 85, 105);
        doc.text(`Generated ${new Date().toLocaleDateString()} by Mystery Games Framework`, PW / 2, PH - 10, { align: 'center' });

        // ─────────────────────────────────────────────────────────────────────────
        // PAGE 2 — TABLE OF CONTENTS
        // ─────────────────────────────────────────────────────────────────────────
        newPage();
        // reset background for content pages
        doc.setFillColor(...COLORS.white);

        sectionBanner('TABLE OF CONTENTS', COLORS.slate);
        y += 3;

        const tocItems = [
            { n: '1', title: 'Narrative Overview', sub: 'AI-generated story summary' },
            { n: '2', title: 'Story Flow — Node by Node', sub: `${orderedNodes.length} steps in player order` },
            { n: '3', title: 'Character Dossiers', sub: `${suspects.length} suspect profiles` },
            { n: '4', title: 'Evidence Tracker', sub: `${evidence.length} evidence items` },
            { n: '5', title: 'Question Bank & Answer Key', sub: `${questions.length} questions with answers` },
            { n: '6', title: 'Summary Statistics', sub: 'Final node count & breakdown' },
        ];

        tocItems.forEach(item => {
            checkY(18);
            // Row background
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.2);
            doc.roundedRect(M, y, CW, 14, 2, 2, 'FD');
            // Number
            doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.indigo);
            doc.text(item.n + '.', M + 4, y + 9);
            // Title
            doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.body);
            doc.text(clean(item.title), M + 13, y + 9);
            // Subtitle (right-aligned only)
            doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.muted); doc.setFontSize(8);
            const subW = doc.getTextWidth(clean(item.sub));
            doc.text(clean(item.sub), PW - M - subW - 3, y + 9);
            y += 17; // row height + gap
        });

        y += 4;
        // Node type breakdown
        subHeading('Canvas Overview', COLORS.slate);
        const ntEntries = Object.entries(nodeTypes).sort((a, b) => b[1] - a[1]);
        let px = M; let py2 = y + 1;
        ntEntries.forEach(([type, count]) => {
            const lbl = `${type} (${count})`;
            const w = pill(lbl, typeColor(type), px, py2);
            if (w) px += w;
            if (px > PW - M - 30) { px = M; py2 += 10; y += 10; }
        });
        y = py2 + 10;

        if (roots.length > 0) {
            labelValue('Story starts at', roots.map(r => r.label).join(', '));
        }
        if (deadEnds.length > 0) {
            labelValue('Story ends at', deadEnds.map(n => n.label).join(', '));
        }
        if (orphans.length > 0) {
            checkY(8);
            doc.setFillColor(254, 243, 199); doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.5);
            doc.roundedRect(M, y, CW, 9, 2, 2, 'FD');
            doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(146, 64, 14);
            doc.text('WARNING: ' + orphans.length + ' orphaned nodes found — ' + orphans.map(n => n.label).join(', '), M + 3, y + 6);
            y += 14;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // PAGE — SECTION 1: AI NARRATIVE OVERVIEW
        // ─────────────────────────────────────────────────────────────────────────
        newPage();
        sectionBanner('1. NARRATIVE OVERVIEW', COLORS.indigo);

        doc.setFontSize(8.5); doc.setTextColor(...COLORS.muted); doc.setFont('helvetica', 'italic');
        doc.text('AI-generated summary of the story — for creative context and review purposes.', M, y); y += 8;

        const storyParas = story.split(/\n\n+/);
        storyParas.forEach(para => {
            if (!para.trim()) return;
            checkY(10);
            // drop any markdown markers
            const cleanPara = para.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').trim();
            bodyText(cleanPara, 0, COLORS.body, 10);
            y += 2;
        });

        // ─────────────────────────────────────────────────────────────────────────
        // PAGE — SECTION 2: STORY FLOW NODE BY NODE
        // ─────────────────────────────────────────────────────────────────────────
        newPage();
        sectionBanner('2. STORY FLOW — NODE BY NODE', COLORS.violet);

        doc.setFontSize(8.5); doc.setTextColor(...COLORS.muted); doc.setFont('helvetica', 'italic');
        doc.text('Nodes are listed in the exact order a player encounters them, from start to finish.', M, y); y += 9;

        orderedNodes.forEach((node, index) => {
            const isStart = roots.some(r => r.id === node.id);
            const isEnd = !storyData.edges.some(e => e.source === node.id);
            const nc = typeColor(node.type);

            // Always start a node card with at least 50mm free — avoids partial cards
            checkY(50);

            // ── Node header bar ─────────────────────────────────────────────
            const CARD_BAR_H = 10;
            doc.setFillColor(...nc);
            doc.roundedRect(M, y, CW, CARD_BAR_H, 2, 2, 'F');

            // Step number badge
            doc.setFillColor(255, 255, 255);
            doc.circle(M + 7, y + CARD_BAR_H / 2, 4, 'F');
            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...nc);
            doc.text((index + 1).toString(), M + 7, y + CARD_BAR_H / 2 + 2.5, { align: 'center' });

            // Node title
            doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.white);
            doc.text(clean(node.label), M + 17, y + CARD_BAR_H / 2 + 3.5);

            // START / END badges
            let bx = PW - M - 3;
            if (isEnd) {
                doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
                const ew = doc.getTextWidth('END') + 5;
                bx -= ew;
                doc.setFillColor(220, 38, 38); doc.roundedRect(bx, y + 2, ew, 6, 1, 1, 'F');
                doc.setTextColor(255, 255, 255); doc.text('END', bx + 2.5, y + 6.5);
                bx -= 3;
            }
            if (isStart) {
                doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
                const sw3 = doc.getTextWidth('START') + 5;
                bx -= sw3;
                doc.setFillColor(34, 197, 94); doc.roundedRect(bx, y + 2, sw3, 6, 1, 1, 'F');
                doc.setTextColor(255, 255, 255); doc.text('START', bx + 2.5, y + 6.5);
            }

            y += CARD_BAR_H + 3;

            // Type label
            checkY(LINE_H + 1);
            doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.muted);
            doc.text('Type: ' + node.type.toUpperCase(), M + 2, y);
            y += LINE_H + 1;

            // ── Node Image (if any) ──────────────────────────────────────────
            const imgB64 = nodeImages[node.id];
            if (imgB64) {
                const imgW = (node.type === 'suspect') ? 30 : 50; // suspects get smaller portraits
                const imgH = (node.type === 'suspect') ? 30 : 35;
                checkY(imgH + 10);
                try {
                    doc.addImage(imgB64, 'JPEG', M + 2, y, imgW, imgH);
                    doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.2);
                    doc.rect(M + 2, y, imgW, imgH);
                    y += imgH + 5;
                } catch { /* skip bad image */ }
            }

            // ── Content / dialogue ──────────────────────────────────────────
            if (node.text && node.text.trim()) {
                checkY(LINE_H + 2);
                doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.slate);
                doc.text('Content:', M + 2, y);
                y += LINE_H;

                doc.setFontSize(9); doc.setFont('helvetica', 'normal');
                const quoteTxt = doc.splitTextToSize(clean(node.text), CW - 14);
                const qh = quoteTxt.length * LINE_H + 4;
                checkY(qh + 4);
                // Left accent bar
                doc.setFillColor(...nc);
                doc.rect(M + 2, y - 2, 2, qh, 'F');
                // Text lines
                doc.setTextColor(...COLORS.body);
                quoteTxt.forEach(l => {
                    checkY(LINE_H + 1);
                    doc.text(l, M + 8, y);
                    y += LINE_H;
                });
                y += 3; // gap after blockquote
            }

            // ── Type-specific extras ────────────────────────────────────────
            switch (node.type) {
                case 'suspect':
                    if (node.metadata.name) labelValue('Name', node.metadata.name, 2);
                    if (node.metadata.role) labelValue('Role', node.metadata.role, 2);
                    if (node.metadata.alibi) labelValue('Alibi', node.metadata.alibi, 2);
                    if (node.metadata.culprit) {
                        checkY(12);
                        doc.setFillColor(254, 226, 226); doc.setDrawColor(220, 38, 38); doc.setLineWidth(0.5);
                        doc.roundedRect(M + 2, y, CW - 4, 9, 1, 1, 'FD');
                        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(153, 27, 27);
                        doc.text('CULPRIT: ' + clean(node.metadata.culprit), M + 6, y + 6);
                        y += 13;
                    }
                    break;
                case 'evidence':
                    if (node.metadata.description) labelValue('Details', node.metadata.description, 2);
                    if (node.metadata.variableId) labelValue('Logic ID', node.metadata.variableId, 2);
                    break;
                case 'question':
                    if (node.metadata.options && node.metadata.options.length > 0) {
                        checkY(LINE_H * 2);
                        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.slate);
                        doc.text('Answer Choices:', M + 2, y);
                        y += LINE_H + 2;
                        node.metadata.options.forEach((opt, oi) => {
                            if (!opt) return;
                            const correct = opt.isCorrect;
                            const optColor = correct ? COLORS.green : [100, 116, 139];
                            // Use safe wrapping width and standard characters
                            const prefix = correct ? '[CORRECT] ' : '[ ] ';
                            const optTxt = doc.splitTextToSize(`${prefix}${oi + 1}. ${clean(opt.text || '')}`, CW - 24);
                            const oh = optTxt.length * LINE_H + 5;
                            checkY(oh + 3);
                            // Background box
                            doc.setFillColor(correct ? 220 : 248, correct ? 252 : 250, correct ? 231 : 252);
                            doc.setDrawColor(...optColor); doc.setLineWidth(0.3);
                            doc.roundedRect(M + 4, y, CW - 8, oh, 1, 1, 'FD');
                            doc.setFontSize(8.5); doc.setFont('helvetica', correct ? 'bold' : 'normal');
                            doc.setTextColor(...optColor);
                            optTxt.forEach((l, li) => {
                                doc.text(l, M + 8, y + (li + 1) * LINE_H - 1);
                            });
                            y += oh + 3;
                        });
                    }
                    if (node.metadata.hints && node.metadata.hints.length > 0) {
                        checkY(LINE_H * 2);
                        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.slate);
                        doc.text('Hints:', M + 2, y);
                        y += LINE_H + 1;
                        node.metadata.hints.forEach((h, hi) => {
                            if (h && h.text) bullet(`Hint ${hi + 1}: "${clean(h.text)}" — penalty: -${h.penalty || 0} pts`, 6, COLORS.muted);
                        });
                    }
                    break;
                case 'terminal':
                    if (node.metadata.command) labelValue('Required Command', node.metadata.command, 2);
                    if (node.metadata.answer) labelValue('Expected Answer', node.metadata.answer, 2);
                    break;
                case 'logic':
                    if (node.metadata.condition) labelValue('Condition', node.metadata.condition, 2);
                    if (node.metadata.logicIds && node.metadata.logicIds.length > 0)
                        labelValue('Required IDs', node.metadata.logicIds.join(', '), 2);
                    break;
                case 'setter':
                    if (node.metadata.variableId) labelValue('Sets Flag', node.metadata.variableId, 2);
                    if (node.metadata.variableValue !== undefined && node.metadata.variableValue !== '')
                        labelValue('Value', String(node.metadata.variableValue), 2);
                    break;
                case 'media':
                    if (node.metadata.mediaType) labelValue('Media Type', node.metadata.mediaType, 2);
                    if (node.metadata.url) labelValue('URL', node.metadata.url, 2);
                    break;
                case 'lockpick': case 'keypad': case 'decryption':
                    if (node.metadata.command) labelValue('Passcode / Target', node.metadata.command, 2);
                    break;
                case 'identify':
                    if (node.metadata.culprit) labelValue('Correct Culprit', node.metadata.culprit, 2);
                    break;
            }

            // Score / penalty
            if (node.score) bullet(`Score reward: +${node.score} pts`, 2, COLORS.green);
            if (node.penalty) bullet(`Penalty: -${node.penalty} pts`, 2, COLORS.red);

            gap(2);

            // ── Edge connections ────────────────────────────────────────────
            const incoming = storyData.edges.filter(e => e.target === node.id);
            const outgoing = storyData.edges.filter(e => e.source === node.id);

            if (incoming.length > 0) {
                checkY(LINE_H + 1);
                doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.muted);
                const inTxt = doc.splitTextToSize('From: ' + incoming.map(e => nodeLabel(e.source)).join('  \u00b7  '), CW - 4);
                inTxt.forEach(l => { checkY(LINE_H + 1); doc.text(l, M + 2, y); y += LINE_H; });
            }

            if (outgoing.length === 0) {
                checkY(LINE_H + 1);
                doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.red);
                doc.text('(End of path — no further connections)', M + 2, y);
                y += LINE_H;
            } else if (outgoing.length === 1) {
                checkY(LINE_H + 1);
                doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.muted);
                const lbl = outgoing[0].label ? ` [${outgoing[0].label}]` : '';
                const leadTxt = doc.splitTextToSize('Leads to: ' + nodeLabel(outgoing[0].target) + lbl, CW - 4);
                leadTxt.forEach(l => { checkY(LINE_H + 1); doc.text(l, M + 2, y); y += LINE_H; });
            } else {
                checkY(LINE_H + 1);
                doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.slate);
                doc.text('Branches to:', M + 2, y);
                y += LINE_H;
                outgoing.forEach(e => {
                    const lbl = e.label ? ` [${e.label}]` : '';
                    bullet('-> ' + nodeLabel(e.target) + lbl, 6, COLORS.slate);
                });
            }

            gap(2);
            divLine();
        });


        // ─────────────────────────────────────────────────────────────────────────
        // PAGE — SECTION 3: CHARACTER DOSSIERS
        // ─────────────────────────────────────────────────────────────────────────
        if (suspects.length > 0) {
            newPage();
            sectionBanner('3. CHARACTER DOSSIERS', COLORS.pink);
            suspects.forEach((s, i) => {
                const imgB64 = nodeImages[s.id];
                const IMG_W = 32;
                const IMG_H = 32;
                const hasPic = !!imgB64;
                checkY(25 + (hasPic ? IMG_H : 0));

                // ── Card header bar ──────────────────────────────────────────
                const cardColor = s.metadata.culprit ? [254, 226, 226] : [248, 250, 252];
                doc.setFillColor(...cardColor);
                doc.setDrawColor(...(s.metadata.culprit ? COLORS.red : COLORS.border));
                doc.setLineWidth(s.metadata.culprit ? 0.8 : 0.3);
                doc.roundedRect(M, y, CW, 7, 2, 2, 'FD');
                doc.setFontSize(10); doc.setFont('helvetica', 'bold');
                doc.setTextColor(...(s.metadata.culprit ? COLORS.red : COLORS.pink));
                doc.text(`${i + 1}. ${clean(s.metadata.name || s.label)}`, M + 4, y + 5.5);
                if (s.metadata.culprit) {
                    doc.setFontSize(7); doc.setTextColor(...COLORS.red);
                    doc.text('[ CULPRIT ]', PW - M - 22, y + 5.5);
                }
                y += 10;

                // ── Portrait ABOVE text ──────────────────────────────────────
                if (hasPic) {
                    try {
                        doc.addImage(imgB64, 'JPEG', M + 2, y, IMG_W, IMG_H);
                        doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.3);
                        doc.rect(M + 2, y, IMG_W, IMG_H);
                        y += IMG_H + 5;
                    } catch { /* skip */ }
                }

                // Now for the text fields — always below the image
                if (s.metadata.role) labelValue('Role', s.metadata.role, 2);
                if (s.metadata.alibi) labelValue('Alibi', s.metadata.alibi, 2);
                if (s.metadata.description) labelValue('Background', s.metadata.description, 2);
                if (s.text) labelValue('Profile Note', s.text, 2);

                y += 4;
                divLine();
            });
        }

        // ─────────────────────────────────────────────────────────────────────────
        // PAGE — SECTION 4: EVIDENCE TRACKER
        // ─────────────────────────────────────────────────────────────────────────
        if (evidence.length > 0) {
            newPage();
            sectionBanner('4. EVIDENCE TRACKER', COLORS.amber);
            evidence.forEach((item, i) => {
                const imgB64 = nodeImages[item.id];
                const hasPic = !!imgB64;
                const IMG_W = 45;
                const IMG_H = 36;
                checkY(20 + (hasPic ? IMG_H : 0));

                // ── item header bar ──────────────────────────────────────────
                doc.setFillColor(255, 251, 235); doc.setDrawColor(...COLORS.amber); doc.setLineWidth(0.3);
                doc.roundedRect(M, y, CW, 7, 2, 2, 'FD');
                doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.amber);
                doc.text(`${i + 1}. ${clean(item.label)}`, M + 4, y + 5.5);
                y += 10;

                // ── Photo ABOVE text ─────────────────────────────────────────
                if (hasPic) {
                    try {
                        doc.addImage(imgB64, 'JPEG', M + 2, y, IMG_W, IMG_H);
                        doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.3);
                        doc.rect(M + 2, y, IMG_W, IMG_H);
                        y += IMG_H + 5;
                    } catch { /* skip */ }
                }

                if (item.metadata.variableId) labelValue('Logic ID', item.metadata.variableId, 2);
                if (item.metadata.description) labelValue('Description', item.metadata.description, 2);
                if (item.text) labelValue('Details', item.text, 2);

                y += 3;
                divLine();
            });
        }

        // ─────────────────────────────────────────────────────────────────────────
        // PAGE — SECTION 5: QUESTION BANK & ANSWER KEY
        // ─────────────────────────────────────────────────────────────────────────
        if (questions.length > 0) {
            newPage();
            sectionBanner('5. QUESTION BANK & ANSWER KEY', COLORS.violet);
            doc.setFontSize(8.5); doc.setTextColor(...COLORS.muted); doc.setFont('helvetica', 'italic');
            doc.text('Full answer key for every question — for designer review only.', M, y); y += 9;

            questions.forEach((q, qi) => {
                const imgB64 = nodeImages[q.id];
                const hasPic = !!imgB64;
                const IMG_W = CW; // full width image
                const IMG_H = 36; // question image height mm
                checkY(hasPic ? IMG_H + 30 : 22);

                // ── Question header bar ──────────────────────────────────────
                doc.setFillColor(245, 243, 255); doc.setDrawColor(...COLORS.violet); doc.setLineWidth(0.3);
                doc.roundedRect(M, y, CW, 7, 2, 2, 'FD');
                doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.violet);
                doc.text(`Q${qi + 1}. ${clean(q.label)}`, M + 4, y + 5.5);
                y += 10;

                // ── Question image ABOVE text — full width ───────────────────
                if (hasPic) {
                    try {
                        doc.addImage(imgB64, 'JPEG', M, y, IMG_W, IMG_H);
                        doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.3);
                        doc.rect(M, y, IMG_W, IMG_H);
                    } catch { /* skip */ }
                    // Move y BELOW the image before any text
                    y += IMG_H + 4;
                }

                // ── Question text fields (ALWAYS below image if present) ─────
                if (q.text) {
                    checkY(LINE_H + 2);
                    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.slate);
                    doc.text('Question:', M + 2, y);
                    y += LINE_H;
                    bodyText(q.text, 4, COLORS.body, 9);
                }
                if (q.metadata.helpContent) {
                    checkY(LINE_H + 1);
                    doc.setFontSize(8.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...COLORS.muted);
                    const hintLines = doc.splitTextToSize('Hint to player: ' + clean(q.metadata.helpContent), CW - 8);
                    hintLines.forEach(l => { checkY(LINE_H); doc.text(l, M + 4, y); y += LINE_H; });
                }
                if (q.metadata.options && q.metadata.options.length > 0) {
                    checkY(LINE_H * 2);
                    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.slate);
                    doc.text('Answers:', M + 2, y);
                    y += LINE_H;
                    y += 10;
                    q.metadata.options.forEach((opt, oi) => {
                        if (!opt) return;
                        const correct = opt.isCorrect;
                        const col = correct ? COLORS.green : [100, 116, 139];
                        const prefix = correct ? '[CORRECT] ' : '[ ] ';
                        const optTxt = doc.splitTextToSize(`${prefix}${oi + 1}. ${clean(opt.text || '')}`, CW - 24);
                        const boxH = optTxt.length * LINE_H + 4;
                        checkY(boxH + 2);
                        doc.setFillColor(correct ? 220 : 248, correct ? 252 : 250, correct ? 231 : 252);
                        doc.setDrawColor(...col); doc.setLineWidth(0.3);
                        doc.roundedRect(M + 4, y - 1, CW - 8, boxH, 1, 1, 'FD');
                        doc.setFontSize(8.5); doc.setFont('helvetica', correct ? 'bold' : 'normal');
                        doc.setTextColor(...col);
                        optTxt.forEach((l, li) => {
                            doc.text(l, M + 8, y + (li + 1) * LINE_H - 1);
                        });
                        y += boxH + 3;
                        if (opt.explanation && opt.explanation.trim()) {
                            const el = doc.splitTextToSize('Explanation: ' + clean(opt.explanation), CW - 14);
                            el.forEach(l => { checkY(LINE_H); doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...COLORS.muted); doc.text(l, M + 10, y); y += LINE_H; });
                        }
                    });
                }
                y += 4;
                divLine();
            });
        }

        // Final Summary
        newPage();
        sectionBanner('6. SUMMARY STATISTICS', COLORS.teal);
        y += 5;

        Object.entries(nodeTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
            labelValue(`${type.charAt(0).toUpperCase() + type.slice(1)}`, `${count} node${count !== 1 ? 's' : ''}`);
        });

        // Final footer on last page
        doc.setFontSize(7); doc.setTextColor(...COLORS.muted); doc.setFont('helvetica', 'normal');
        doc.text(`${storyData.title} — Story Review`, M, PH - 8);
        doc.text(`Page ${pageNum}`, PW - M, PH - 8, { align: 'right' });

        try {
            doc.save(`${storyData.title.replace(/\s+/g, '_')}_Story_Review.pdf`);
        } catch (e) {
            console.error('PDF save error:', e);
            alert('Could not save PDF. Please try Word format instead.');
        }
    };

    // ─── generateEnhancedDOCX ──────────────────────────────────────────────────
    const generateEnhancedDOCX = async (storyData, story, reviewData) => {
        const { orderedNodes, roots, nodeLabel, deadEnds, orphans, suspects, evidence, questions, nodeTypes, emoji } = reviewData;
        const children = [];

        const mkPara = (opts) => new Paragraph(opts);
        const mkRun = (opts) => new TextRun(opts);

        const dividerPara = () => mkPara({
            text: '',
            border: { bottom: { color: 'C7D2FE', space: 1, style: 'single', size: 8 } },
            spacing: { before: 80, after: 100 },
        });

        const taggedPara = (text, bgHex, textHex = 'FFFFFF', heading = HeadingLevel.HEADING_2) => mkPara({
            children: [mkRun({ text, bold: true, color: textHex, size: 22 })],
            heading,
            shading: { fill: bgHex, color: textHex },
            spacing: { before: 300, after: 120 },
        });

        const infoRow = (label, value) => {
            if (!value || !value.toString().trim()) return null;
            return mkPara({
                children: [
                    mkRun({ text: label + ': ', bold: true, color: '334155', size: 20 }),
                    mkRun({ text: value.toString(), color: '1E293B', size: 20 }),
                ],
                spacing: { after: 80 },
            });
        };

        // ── COVER / TITLE PAGE ────────────────────────────────────────────────────
        children.push(
            mkPara({ text: '', spacing: { before: 800 } }),
            mkPara({
                children: [mkRun({ text: storyData.title, bold: true, color: '4F46E5', size: 52 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 200 },
            }),
            mkPara({
                children: [mkRun({ text: 'A Mystery Game — Story Design Review', italics: true, color: '64748B', size: 26 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 150 },
            }),
        );

        if (storyData.description) {
            children.push(mkPara({
                children: [mkRun({ text: storyData.description, color: '475569', size: 22 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }));
        }

        children.push(
            dividerPara(),
            mkPara({
                children: [
                    mkRun({ text: `Nodes: ${storyData.nodes.length}  •  `, bold: true, color: '7C3AED', size: 22 }),
                    mkRun({ text: `Suspects: ${suspects.length}  •  `, bold: true, color: 'DB2777', size: 22 }),
                    mkRun({ text: `Evidence: ${evidence.length}  •  `, bold: true, color: 'D97706', size: 22 }),
                    mkRun({ text: `Questions: ${questions.length}`, bold: true, color: '7C3AED', size: 22 }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 150 },
            }),
            mkPara({
                children: [mkRun({ text: `Generated: ${new Date().toLocaleDateString()} — Mystery Games Framework`, italics: true, color: '94A3B8', size: 18 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
            dividerPara(),
        );

        // ── SECTION 1: NARRATIVE OVERVIEW ─────────────────────────────────────────
        children.push(
            mkPara({ text: '', pageBreakBefore: true }),
            taggedPara('1. NARRATIVE OVERVIEW', '4F46E5'),
            mkPara({
                children: [mkRun({ text: 'AI-generated story summary for creative review.', italics: true, color: '94A3B8', size: 18 })],
                spacing: { after: 120 },
            }),
        );
        story.split(/\n\n+/).forEach(para => {
            if (!para.trim()) return;
            children.push(mkPara({
                children: [mkRun({ text: para.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').trim(), size: 22, color: '1E293B' })],
                spacing: { after: 160 },
            }));
        });

        // ── SECTION 2: STORY FLOW NODE BY NODE ───────────────────────────────────
        children.push(
            mkPara({ text: '', pageBreakBefore: true }),
            taggedPara('2. STORY FLOW — NODE BY NODE', '7C3AED'),
            mkPara({
                children: [mkRun({ text: 'Nodes listed in the exact order a player encounters them, from start to finish.', italics: true, color: '94A3B8', size: 18 })],
                spacing: { after: 160 },
            }),
        );

        orderedNodes.forEach((node, index) => {
            const isStart = roots.some(r => r.id === node.id);
            const isEnd = !storyData.edges.some(e => e.source === node.id);

            const TYPE_HEX = {
                story: '4F46E5', suspect: 'DB2777', evidence: 'D97706', question: '7C3AED',
                terminal: '0D9488', logic: '16A34A', setter: '2563EB', media: 'EA580C',
                identify: 'DC2626', cutscene: '7C3AED', interrogation: 'DB2777',
            };
            const hx = TYPE_HEX[node.type] || '334155';

            const badges = [];
            if (isStart) badges.push(mkRun({ text: '  [START]', bold: true, color: '16A34A', size: 18 }));
            if (isEnd) badges.push(mkRun({ text: '  [END]', bold: true, color: 'DC2626', size: 18 }));

            children.push(mkPara({
                children: [
                    mkRun({ text: `${index + 1}. ${node.label}`, bold: true, color: hx, size: 24 }),
                    mkRun({ text: `  (${node.type})`, color: '94A3B8', size: 18 }),
                    ...badges,
                ],
                shading: { fill: 'F8FAFC' },
                border: { left: { color: hx, style: 'single', size: 12, space: 8 } },
                spacing: { before: 160, after: 60 },
                indent: { left: 0 },
            }));

            if (node.text && node.text.trim()) {
                children.push(mkPara({
                    children: [
                        mkRun({ text: 'Content: ', bold: true, color: '334155', size: 20 }),
                        mkRun({ text: node.text.trim(), color: '1E293B', size: 20, italics: true }),
                    ],
                    indent: { left: 360 },
                    spacing: { after: 80 },
                }));
            }

            // Type-specific
            const addInfo = (label, val) => {
                if (!val) return;
                const p = infoRow(label, val);
                if (p) { p.indent = { left: 360 }; children.push(p); }
            };

            switch (node.type) {
                case 'suspect':
                    addInfo('Name', node.metadata.name);
                    addInfo('Role', node.metadata.role);
                    addInfo('Alibi', node.metadata.alibi);
                    if (node.metadata.culprit) {
                        children.push(mkPara({
                            children: [mkRun({ text: 'CULPRIT: ' + node.metadata.culprit, bold: true, color: '991B1B', size: 20 })],
                            shading: { fill: 'FEE2E2' },
                            indent: { left: 360 },
                            spacing: { after: 80 },
                        }));
                    }
                    break;
                case 'evidence':
                    addInfo('Logic ID', node.metadata.variableId);
                    addInfo('Details', node.metadata.description);
                    break;
                case 'question':
                    if (node.metadata.options && node.metadata.options.length > 0) {
                        children.push(mkPara({ children: [mkRun({ text: 'Answer Choices:', bold: true, color: '334155', size: 20 })], indent: { left: 360 }, spacing: { after: 40 } }));
                        node.metadata.options.forEach((opt, oi) => {
                            if (!opt) return;
                            const correct = opt.isCorrect;
                            children.push(mkPara({
                                children: [mkRun({ text: `${correct ? '✓' : '✗'} ${oi + 1}. ${opt.text || ''}`, bold: correct, color: correct ? '16A34A' : '94A3B8', size: 20 })],
                                shading: { fill: correct ? 'DCFCE7' : 'F8FAFC' },
                                indent: { left: 720 },
                                spacing: { after: 40 },
                            }));
                            if (opt.explanation && opt.explanation.trim()) {
                                children.push(mkPara({
                                    children: [mkRun({ text: 'Explanation: ' + opt.explanation.trim(), italics: true, color: '64748B', size: 18 })],
                                    indent: { left: 1080 },
                                    spacing: { after: 40 },
                                }));
                            }
                        });
                    }
                    if (node.metadata.hints && node.metadata.hints.length > 0) {
                        node.metadata.hints.forEach((h, hi) => {
                            if (h) children.push(mkPara({
                                children: [mkRun({ text: `Hint ${hi + 1}: "${h.text}" — penalty: -${h.penalty || 0} pts`, color: '64748B', size: 18, italics: true })],
                                indent: { left: 720 },
                                spacing: { after: 40 },
                            }));
                        });
                    }
                    break;
                case 'terminal':
                    addInfo('Required Command', node.metadata.command);
                    addInfo('Expected Answer', node.metadata.answer);
                    break;
                case 'logic':
                    addInfo('Condition', node.metadata.condition);
                    addInfo('Required IDs', node.metadata.logicIds?.join(', '));
                    break;
                case 'setter':
                    addInfo('Sets Flag', node.metadata.variableId);
                    addInfo('Value', node.metadata.variableValue?.toString());
                    break;
                case 'identify':
                    addInfo('Correct Culprit', node.metadata.culprit);
                    break;
            }

            // Connections
            const outgoing = storyData.edges.filter(e => e.source === node.id);
            const incoming = storyData.edges.filter(e => e.target === node.id);
            if (incoming.length > 0) {
                children.push(mkPara({
                    children: [mkRun({ text: 'From: ' + incoming.map(e => nodeLabel(e.source)).join(' · '), color: '94A3B8', size: 18 })],
                    indent: { left: 360 }, spacing: { after: 40 },
                }));
            }
            if (outgoing.length === 0) {
                children.push(mkPara({ children: [mkRun({ text: '(End of path — no further connections)', bold: true, color: 'DC2626', size: 18 })], indent: { left: 360 }, spacing: { after: 80 } }));
            } else if (outgoing.length === 1) {
                children.push(mkPara({ children: [mkRun({ text: 'Leads to: ' + nodeLabel(outgoing[0].target) + (outgoing[0].label ? ` [${outgoing[0].label}]` : ''), color: '475569', size: 18 })], indent: { left: 360 }, spacing: { after: 80 } }));
            } else {
                children.push(mkPara({ children: [mkRun({ text: 'Branches to:', bold: true, color: '475569', size: 18 })], indent: { left: 360 }, spacing: { after: 40 } }));
                outgoing.forEach(e => {
                    children.push(mkPara({ children: [mkRun({ text: '→ ' + nodeLabel(e.target) + (e.label ? ` [${e.label}]` : ''), color: '475569', size: 18 })], indent: { left: 720 }, spacing: { after: 40 } }));
                });
            }
            children.push(dividerPara());
        });

        // ── SECTION 3: CHARACTER DOSSIERS ─────────────────────────────────────────
        if (suspects.length > 0) {
            children.push(
                mkPara({ text: '', pageBreakBefore: true }),
                taggedPara('3. CHARACTER DOSSIERS', 'DB2777'),
            );
            suspects.forEach((s, i) => {
                const isCulprit = !!s.metadata.culprit;
                children.push(mkPara({
                    children: [
                        mkRun({ text: `${i + 1}. ${s.metadata.name || s.label}`, bold: true, color: isCulprit ? 'DC2626' : 'DB2777', size: 24 }),
                        ...(isCulprit ? [mkRun({ text: '  ← CULPRIT', bold: true, color: 'DC2626', size: 18 })] : []),
                    ],
                    shading: { fill: isCulprit ? 'FEE2E2' : 'FDF2F8' },
                    spacing: { before: 160, after: 80 },
                }));
                const addS = (l, v) => { if (v) { const p = infoRow(l, v); if (p) children.push(p); } };
                addS('Role', s.metadata.role);
                addS('Alibi', s.metadata.alibi);
                addS('Background', s.metadata.description);
                addS('Profile Note', s.text);
                children.push(dividerPara());
            });
        }

        // ── SECTION 4: EVIDENCE TRACKER ───────────────────────────────────────────
        if (evidence.length > 0) {
            children.push(
                mkPara({ text: '', pageBreakBefore: true }),
                taggedPara('4. EVIDENCE TRACKER', 'D97706'),
            );
            evidence.forEach((item, i) => {
                children.push(mkPara({
                    children: [mkRun({ text: `${i + 1}. ${item.label}`, bold: true, color: 'D97706', size: 22 })],
                    shading: { fill: 'FFFBEB' },
                    spacing: { before: 120, after: 60 },
                }));
                const addE = (l, v) => { if (v) { const p = infoRow(l, v); if (p) children.push(p); } };
                addE('Logic ID', item.metadata.variableId);
                addE('Description', item.metadata.description);
                addE('Details', item.text);
                children.push(dividerPara());
            });
        }

        // ── SECTION 5: QUESTION BANK ──────────────────────────────────────────────
        if (questions.length > 0) {
            children.push(
                mkPara({ text: '', pageBreakBefore: true }),
                taggedPara('5. QUESTION BANK & ANSWER KEY', '7C3AED'),
                mkPara({ children: [mkRun({ text: 'Full answer key for every question — for designer review only.', italics: true, color: '94A3B8', size: 18 })], spacing: { after: 120 } }),
            );
            questions.forEach((q, qi) => {
                children.push(mkPara({
                    children: [mkRun({ text: `Q${qi + 1}. ${q.label}`, bold: true, color: '7C3AED', size: 22 })],
                    shading: { fill: 'F5F3FF' },
                    spacing: { before: 120, after: 60 },
                }));
                if (q.text) {
                    children.push(mkPara({ children: [mkRun({ text: 'Question: ', bold: true, color: '334155', size: 20 }), mkRun({ text: q.text, color: '1E293B', size: 20 })], spacing: { after: 80 } }));
                }
                if (q.metadata.helpContent) {
                    children.push(mkPara({ children: [mkRun({ text: 'Hint to player: ' + q.metadata.helpContent, italics: true, color: '64748B', size: 18 })], spacing: { after: 80 } }));
                }
                if (q.metadata.options && q.metadata.options.length > 0) {
                    q.metadata.options.forEach((opt, oi) => {
                        if (!opt) return;
                        const correct = opt.isCorrect;
                        children.push(mkPara({
                            children: [mkRun({ text: `${correct ? '✓' : '✗'} ${oi + 1}. ${opt.text || ''}`, bold: correct, color: correct ? '16A34A' : '94A3B8', size: 20 })],
                            shading: { fill: correct ? 'DCFCE7' : 'F8FAFC' },
                            indent: { left: 360 },
                            spacing: { after: 40 },
                        }));
                        if (opt.explanation && opt.explanation.trim()) {
                            children.push(mkPara({ children: [mkRun({ text: 'Explanation: ' + opt.explanation.trim(), italics: true, color: '64748B', size: 18 })], indent: { left: 720 }, spacing: { after: 40 } }));
                        }
                    });
                }
                children.push(dividerPara());
            });
        }

        // ── SECTION 6: HEALTH CHECK ───────────────────────────────────────────────
        children.push(
            mkPara({ text: '', pageBreakBefore: true }),
            taggedPara('6. STORY HEALTH CHECK', '0D9488'),
        );

        const hasIdentify = storyData.nodes.some(n => n.type === 'identify');

        if (orphans.length > 0) {
            children.push(mkPara({ children: [mkRun({ text: 'WARNING: Orphaned nodes (no connections): ' + orphans.map(n => n.label).join(', '), bold: true, color: '92400E', size: 20 })], shading: { fill: 'FEF3C7' }, spacing: { after: 100 } }));
        }
        if (!hasIdentify) {
            children.push(mkPara({ children: [mkRun({ text: 'WARNING: No "Identify Culprit" node found. Add one to give the mystery a definite resolution.', bold: true, color: '92400E', size: 20 })], shading: { fill: 'FEF3C7' }, spacing: { after: 100 } }));
        }
        if (suspects.length === 0) {
            children.push(mkPara({ children: [mkRun({ text: 'SUGGESTION: Add suspect nodes to create characters for the mystery.', color: '1E40AF', size: 20 })], shading: { fill: 'DBEAFE' }, spacing: { after: 100 } }));
        }
        if (evidence.length === 0) {
            children.push(mkPara({ children: [mkRun({ text: 'SUGGESTION: Add evidence nodes to give players clues to discover.', color: '1E40AF', size: 20 })], shading: { fill: 'DBEAFE' }, spacing: { after: 100 } }));
        }
        if (orphans.length === 0 && hasIdentify && suspects.length > 0 && evidence.length > 0) {
            children.push(mkPara({ children: [mkRun({ text: 'All clear — story flow looks healthy! All nodes are connected and reachable.', bold: true, color: '166534', size: 20 })], shading: { fill: 'DCFCE7' }, spacing: { after: 100 } }));
        }

        children.push(
            dividerPara(),
            mkPara({ children: [mkRun({ text: 'Node Type Breakdown:', bold: true, color: '334155', size: 20 })], spacing: { before: 160, after: 80 } }),
            ...Object.entries(nodeTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) =>
                mkPara({ children: [mkRun({ text: `${emoji(type)} ${type}: ${count} node${count !== 1 ? 's' : ''}`, color: '475569', size: 20 })], bullet: { level: 0 }, spacing: { after: 40 } })
            ),
        );

        const docx = new DocxDocument({
            sections: [{ properties: {}, children }],
            styles: {
                default: {
                    document: { run: { font: 'Calibri', size: 20, color: '1E293B' } },
                },
            },
        });

        const blob = await Packer.toBlob(docx);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${storyData.title.replace(/\s+/g, '_')}_Story_Review.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };



    const onDragStart = (event, nodeType) => {
        if (isLocked) return;
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const addCategory = () => {
        if (!newCategory.name.trim()) return;
        setLearningObjectives([...learningObjectives, {
            id: crypto.randomUUID(),
            category: newCategory.name.trim(),
            objectives: []
        }]);
        setNewCategory({ name: "" });
    };

    const addObjective = (catId) => {
        if (!newObjective.title.trim()) return;
        setLearningObjectives(learningObjectives.map(cat => {
            if (cat.id === catId) {
                return {
                    ...cat,
                    objectives: [...cat.objectives, {
                        id: crypto.randomUUID(),
                        learningObjective: newObjective.title.trim(),
                        objective: newObjective.detail.trim(),
                        keyTakeaway: newObjective.takeaway.trim()
                    }]
                };
            }
            return cat;
        }));
        setNewObjective({ categoryId: null, title: "", detail: "", takeaway: "" });
    };

    const deleteObjective = (catId, index) => {
        setLearningObjectives(learningObjectives.map(cat => {
            if (cat.id === catId) {
                const newObjs = [...cat.objectives];
                newObjs.splice(index, 1);
                return { ...cat, objectives: newObjs };
            }
            return cat;
        }));
    };

    const deleteCategory = (catId) => {
        setConfirmDeleteCat(catId);
    };

    const confirmDeleteCategory = () => {
        if (!confirmDeleteCat) return;
        setLearningObjectives(learningObjectives.filter(cat => cat.id !== confirmDeleteCat));
        setConfirmDeleteCat(null);
    };

    const handleSaveMetadata = ({ title, description }) => {
        setCaseTitle(title);
        setCaseDescription(description);
        // Auto-save after updating metadata
        setTimeout(() => saveProject(), 100);
    };


    const handlePreviewGameEnd = async (resultData) => {
        if (user && user.email) {
            const newResult = {
                ...resultData,
                userId: user.email,
                userDisplayName: user.displayName || user.email.split('@')[0],
                caseId: projectId || 'preview-session',
                caseTitle: (caseTitle || 'Untitled Case') + ' (Preview)',
                playedAt: new Date().toISOString(),
                isPreview: true
            };
            try {
                if (db) await addDoc(collection(db, "game_results"), newResult);
            } catch (e) {
                console.error("Preview save failed", e);
                // Local Fallback
                const existing = JSON.parse(localStorage.getItem('mystery_game_results') || '[]');
                localStorage.setItem('mystery_game_results', JSON.stringify([newResult, ...existing]));
            }
        }
        setShowPreview(false);
    };

    const groupSelectedNodes = useCallback(() => {
        if (isLocked) return;
        const selectedNodes = nodes.filter(n => n.selected && n.type !== 'group');
        if (selectedNodes.length === 0) return;

        const minX = Math.min(...selectedNodes.map(n => n.position.x));
        const minY = Math.min(...selectedNodes.map(n => n.position.y));
        const maxX = Math.max(...selectedNodes.map(n => n.position.x + (n.width || 300)));
        const maxY = Math.max(...selectedNodes.map(n => n.position.y + (n.height || 200)));

        const groupId = crypto.randomUUID();
        const width = (maxX - minX) + 80;
        const height = (maxY - minY) + 100;
        const groupNode = {
            id: groupId,
            type: 'group',
            position: { x: minX - 40, y: minY - 60 },
            style: { width, height },
            width,
            height,
            data: {
                label: 'New Group',
                collapsed: false,
                onChange: onNodeUpdate,
                onUngroup: onUngroup
            }
        };

        setNodes(nds => [
            groupNode,
            ...nds.map(n => n.selected ? {
                ...n,
                parentNode: groupId,
                extent: 'parent',
                position: { x: n.position.x - (minX - 40), y: n.position.y - (minY - 60) },
                selected: false
            } : n)
        ]);
    }, [nodes, setNodes, onNodeUpdate, isLocked]);

    if (licenseLoading) {
        return (
            <div className={`fixed inset-0 flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!licenseData || licenseData._expired) {
        const isExpired = licenseData?._expired;
        const expiredAt = licenseData?._expiredAt;

        return (
            <div className={`fixed inset-0 flex flex-col items-center justify-center transition-colors duration-300 font-sans ${isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                    <div className="absolute inset-0 perspective-grid"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-md w-full p-12 text-center space-y-8 bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-[40px] shadow-2xl">
                    <div className="flex justify-center">
                        <div className="p-5 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 shadow-inner">
                            <ShieldAlert className="w-12 h-12 text-indigo-400" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
                            {isExpired ? 'License Expired' : 'Access Restricted'}
                        </h1>
                        <p className="text-zinc-500 text-sm leading-relaxed font-medium">
                            {isExpired ? (
                                <AnimatePresence>
                                    Your Mystery Games Framework license expired on{' '}
                                    <span className="text-amber-400 font-bold">
                                        {new Date(expiredAt).toLocaleString()}
                                    </span>
                                    . Please reactivate to access the mission architect.
                                </AnimatePresence>
                            ) : (
                                'Your Mystery Framework v2.0 license is currently inactive or has expired. Please activate your framework to access the mission architect.'
                            )}
                        </p>
                    </div>
                    <div className="pt-4 space-y-4">
                        <Button
                            onClick={() => setIsLicenseModalOpen(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-14 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                        >
                            Activate Framework
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/')}
                            className="w-full text-zinc-500 hover:text-white font-bold"
                        >
                            Return to Command Center
                        </Button>
                    </div>
                </div>
                <LicenseConfigModal
                    isOpen={isLicenseModalOpen}
                    onClose={() => setIsLicenseModalOpen(false)}
                />
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 flex h-[100dvh] w-screen flex-col overflow-hidden transition-colors duration-300 selection:bg-indigo-500/30 font-sans ${isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>

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
            <header
                id="editor-toolbar"
                className={`h-16 border-b flex items-center justify-between px-4 z-50 backdrop-blur-md relative transition-all duration-300 shadow-sm shrink-0 whitespace-nowrap
                    ${isDarkMode ? 'border-white/10 bg-zinc-900/80' : 'border-zinc-200 bg-white/95'}
                `}
            >
                <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={`px-2 md:px-3 ${isDarkMode ? 'hover:bg-white/10 text-zinc-300 hover:text-white' : ''}`}>
                        <ArrowLeft className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Back</span>
                    </Button>
                    <button
                        onClick={() => !isLocked && setShowMetadataModal(true)}
                        disabled={isLocked}
                        className={`flex items-center gap-2 group min-w-0 ${!isLocked ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'} transition-opacity`}
                        title={isLocked ? "Case is locked" : "Click to edit case title and description"}
                    >
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                            <GitMerge className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="flex flex-col min-w-0 text-left">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold tracking-tight leading-none truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'} ${!isLocked ? 'group-hover:text-indigo-400' : ''} transition-colors text-xs md:text-sm`}>
                                    {caseTitle || "Untitled Case"}
                                </span>
                                {!isLocked && (
                                    <Pencil className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
                                )}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 truncate">Mission Architect</span>
                                <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter opacity-70"> / {settings.appVersion || 'v1.0.0'}</span>
                            </div>
                        </div>
                    </button>
                    {isLocked && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/50 rounded-full text-red-400 text-[8px] md:text-[10px] font-bold uppercase tracking-wider md:ml-4 flex-shrink-0">
                            <Lock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            <span className="hidden xs:inline">Review Mode</span>
                        </div>
                    )}
                </div>
                <div id="editor-actions" className="flex items-center gap-1 md:gap-3">
                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        {/* Node Search Mechanism */}
                        <div className="relative md:mr-4 min-w-[240px] node-search-container">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${isDarkMode ? 'bg-black/60 border-white/10 focus-within:border-indigo-500/50 shadow-inner' : 'bg-zinc-100 border-zinc-200 focus-within:border-indigo-500'}`}>
                                <Search className="w-4 h-4 text-zinc-500" />
                                <input
                                    placeholder="Jump..."
                                    className={`bg-transparent border-none outline-none text-xs w-full ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setIsSearchOpen(true);
                                    }}
                                    onFocus={() => setIsSearchOpen(true)}
                                    onBlur={() => {
                                        // Delay closing to allow onClick on the results list
                                        setTimeout(() => setIsSearchOpen(false), 200);
                                    }}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-white/10 rounded-full">
                                        <X className="w-3 h-3 text-zinc-500" />
                                    </button>
                                )}
                            </div>

                            <AnimatePresence>
                                {isSearchOpen && searchQuery && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className={`absolute top-full right-0 mt-2 w-72 rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden backdrop-blur-xl ${isDarkMode ? 'bg-zinc-950/90 border-white/10' : 'bg-white border-zinc-200'}`}
                                    >
                                        <div className="max-h-80 overflow-y-auto scrollbar-hide">
                                            {filteredNodes.length > 0 ? (
                                                filteredNodes.map(node => (
                                                    <button
                                                        key={node.id}
                                                        onClick={() => navigateToNode(node)}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${isDarkMode ? 'hover:bg-indigo-500/10 border-b border-white/5 last:border-none' : 'hover:bg-indigo-50 border-b border-zinc-100 last:border-none'}`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-900 border border-white/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                            <Target className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={`text-[11px] font-black uppercase tracking-tight truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                                                {node.data?.label || 'Untitled Node'}
                                                            </span>
                                                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{node.type}</span>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-8 text-center">
                                                    <div className="inline-flex p-3 rounded-full bg-zinc-900 mb-3">
                                                        <Search className="w-5 h-5 text-zinc-700" />
                                                    </div>
                                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">No matching nodes</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className={`flex items-center gap-1 p-1 rounded-lg border ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
                            <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} className="h-8 w-8">
                                {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                            </Button>
                            <div className="w-px h-4 bg-white/10"></div>
                            <Button variant="ghost" size="icon" onClick={() => setShowTutorial(true)} title="How to use" className="h-8 w-8">
                                <Info className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={validateGraph} title="Validate Graph Health" className="h-8 w-8">
                                <Stethoscope className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => layoutNodes('TB')} title="NICE ARRANGE: Auto-organize canvas" className="h-8 w-8">
                                <LayoutGrid className={`w-4 h-4 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSimultaneousMode(!isSimultaneousMode)}
                                title={isSimultaneousMode ? "Disable Simultaneous View" : "Enable Simultaneous View: Side-by-side Game & Canvas"}
                                className={`h-8 w-8 ${isSimultaneousMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : ''}`}
                            >
                                <Activity className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEnableTTS(!enableTTS)}
                                title={enableTTS ? "Disable Case-Level TTS" : "Enable Case-Level TTS"}
                                className={`h-8 w-8 ${!enableTTS ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-emerald-400'}`}
                            >
                                {enableTTS ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            </Button>
                            {hasFeature('enable_ai_build_feature') && (
                                <div className="flex items-center">
                                    <div className="w-px h-4 bg-white/10"></div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAIGenerator(true)}
                                        title="AI Auto-Generate Case"
                                        disabled={isLocked}
                                        className={`h-8 px-3 gap-2 border border-dashed ${isDarkMode ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10' : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'}`}
                                    >
                                        <Brain className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">AI Build</span>
                                    </Button>
                                </div>
                            )}
                            <div className="w-px h-4 bg-white/10"></div>
                            <Button
                                id="download-story-btn"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowStoryFormatModal(true)}
                                title="Download Full Story as Novel"
                                disabled={isLocked}
                                className={`h-8 px-3 gap-2 ${isDarkMode ? 'text-amber-400 hover:bg-amber-500/10' : 'text-amber-600 hover:bg-amber-50'}`}
                            >
                                <FileText className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Download Story</span>
                            </Button>
                            <div className="w-px h-4 bg-white/10"></div>
                            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} title="Game Settings" disabled={isLocked} className="h-8 w-8">
                                <Settings className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowObjectivesEditor(true)}
                                title="Edit Learning Objectives"
                                disabled={isLocked}
                                className={`h-8 px-3 gap-2 border ${learningObjectives.length > 0 ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'border-transparent text-zinc-400 hover:bg-white/5'}`}
                            >
                                <Target className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden xl:inline">Objectives {learningObjectives.length > 0 ? `(${learningObjectives.reduce((s, c) => s + c.objectives.length, 0)})` : ''}</span>
                            </Button>
                        </div>

                        <Button id="save-btn" variant="secondary" size="sm" onClick={saveProject} disabled={isLocked} className="font-medium h-9">
                            <Save className="w-4 h-4 mr-2" />
                            <span>Save</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => { saveProject(); setShowPreview(true); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border-none font-bold tracking-wide h-9"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            <span>Preview</span>
                        </Button>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="lg:hidden flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => { saveProject(); setShowPreview(true); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)] border-none font-bold h-9 px-3"
                        >
                            <Play className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`h-9 w-9 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    <AnimatePresence mode="wait">
                        {isMobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                className={`absolute top-full right-4 left-4 mt-2 p-4 rounded-3xl border shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-[100] backdrop-blur-xl ${isDarkMode ? 'bg-zinc-900/98 border-white/10' : 'bg-white/98 border-zinc-200'}`}
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="ghost"
                                        className={`justify-start gap-3 h-12 rounded-2xl ${isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}
                                        onClick={() => { setIsDarkMode(!isDarkMode); setIsMobileMenuOpen(false); }}
                                    >
                                        {isDarkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                                        <span className="text-[10px] font-black uppercase tracking-wider">Appearance</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className={`justify-start gap-3 h-12 rounded-2xl ${isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}
                                        onClick={() => { saveProject(); setIsMobileMenuOpen(false); }}
                                        disabled={isLocked}
                                    >
                                        <Save className="w-5 h-5 text-emerald-400" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Save Case</span>
                                    </Button>
                                    {hasFeature('enable_ai_build_feature') && (
                                        <Button
                                            variant="ghost"
                                            className={`justify-start gap-3 h-12 rounded-2xl ${isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}
                                            onClick={() => { setShowAIGenerator(true); setIsMobileMenuOpen(false); }}
                                            disabled={isLocked}
                                        >
                                            <Brain className="w-5 h-5 text-indigo-400" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">AI Build</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        className={`justify-start gap-3 h-12 rounded-2xl ${isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}
                                        onClick={() => { setShowStoryFormatModal(true); setIsMobileMenuOpen(false); }}
                                        disabled={isLocked}
                                    >
                                        <FileText className="w-5 h-5 text-amber-500" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Download Story</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className={`justify-start gap-3 h-12 rounded-2xl ${isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}
                                        onClick={() => { validateGraph(); setIsMobileMenuOpen(false); }}
                                    >
                                        <Stethoscope className="w-5 h-5 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Validate</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className={`justify-start gap-3 h-12 rounded-2xl ${isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}
                                        onClick={() => { setShowSettings(true); setIsMobileMenuOpen(false); }}
                                        disabled={isLocked}
                                    >
                                        <Settings className="w-5 h-5 text-zinc-400" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Settings</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className={`justify-start gap-3 h-12 rounded-2xl ${isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}
                                        onClick={() => { setShowTutorial(true); setIsMobileMenuOpen(false); }}
                                    >
                                        <HelpCircle className="w-5 h-5 text-indigo-500" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Tutorial</span>
                                    </Button>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border ${isDarkMode ? 'bg-black/60 border-white/10 shadow-inner' : 'bg-zinc-100 border-zinc-200'}`}>
                                        <Search className="w-4 h-4 text-zinc-500" />
                                        <input
                                            placeholder="Search nodes..."
                                            className={`bg-transparent border-none outline-none text-xs w-full ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setIsSearchOpen(true);
                                            }}
                                            onFocus={() => setIsSearchOpen(true)}
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {isSearchOpen && searchQuery && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden mt-2 max-h-48 overflow-y-auto custom-scrollbar"
                                            >
                                                {filteredNodes.map(node => (
                                                    <button
                                                        key={node.id}
                                                        onClick={() => { navigateToNode(node); setIsMobileMenuOpen(false); }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 rounded-xl transition-all`}
                                                    >
                                                        <Target className="w-4 h-4 text-indigo-400" />
                                                        <span className="text-xs font-bold text-zinc-300 truncate">{node.data?.label || 'Untitled Node'}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </header>

            <div className={`flex flex-1 overflow-hidden relative z-10 transition-all duration-500 ${isMobileMenuOpen ? 'blur-md pointer-events-none brightness-[0.4] scale-[0.98]' : ''}`}>
                {/* Sidebar */}
                <aside id="node-sidebar" className={`${isPaletteCollapsed ? 'w-16' : 'w-72'} border-r flex flex-col gap-4 z-20 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] backdrop-blur-xl ${isLocked ? 'opacity-80 pointer-events-none grayscale-[0.5]' : ''} ${isDarkMode ? 'border-white/10 bg-black/60' : 'border-zinc-200 bg-white/90'} absolute md:relative h-full`}>
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
                        {PALETTE_ITEMS.filter(item => item.type !== 'threed' || enableThreeD).map((item) => (
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
                                        className={`ml-2 transition-all p-1.5 rounded-md hover:bg-indigo-500 hover:text-white ${item.type === 'question' ? 'opacity-100 bg-indigo-500/10 text-indigo-400' : 'opacity-0 group-hover:opacity-100 text-zinc-500'}`}
                                        title={`${item.label} Info`}
                                    >
                                        <Info className="w-3.5 h-3.5" />
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

                {/* Main View Area */}
                <div className="flex-1 flex flex-row overflow-hidden relative">
                    {/* Canvas Container */}
                    <EditorContext.Provider value={{ learningObjectives, projectId }}>
                        <div id="editor-canvas" className={`h-full relative transition-all duration-500 shrink-0 min-w-0 ${isSimultaneousMode && showPreview ? 'w-1/2 border-r border-white/10' : 'flex-1'}`} ref={reactFlowWrapper}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={isLocked ? undefined : onNodesChange}
                                onEdgesChange={isLocked ? undefined : onEdgesChange}
                                onConnect={isLocked ? undefined : onConnect}
                                onInit={setReactFlowInstance}
                                nodesDraggable={!isLocked}
                                nodeTypes={nodeTypes}
                                fitView
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onNodeDragStop={onNodeDragStop}
                                onEdgeClick={onEdgeClick}
                                deleteKeyCode={isLocked ? null : 'Backspace'}
                                selectionKeyCode={isLocked ? null : 'Shift'}
                                multiSelectionKeyCode={isLocked ? null : 'Meta'}
                                minZoom={0.1}
                                maxZoom={4}
                                snapToGrid
                                snapGrid={[20, 20]}
                            >
                                <Background color={isDarkMode ? "#333" : "#ccc"} gap={20} />
                                <Controls className={`${isDarkMode ? 'fill-white stroke-white !bg-zinc-900 !border-white/10' : ''}`} />
                                <MiniMap
                                    nodeStrokeColor={(n) => {
                                        if (n.type === 'story') return '#4f46e5';
                                        if (n.type === 'suspect') return '#ef4444';
                                        if (n.type === 'evidence') return '#eab308';
                                        if (n.type === 'logic') return '#10b981';
                                        return '#333';
                                    }}
                                    nodeColor={(n) => {
                                        if (n.id === activeExecutingNodeId) return '#10b981';
                                        return isDarkMode ? '#111' : '#fff';
                                    }}
                                    className={`!rounded-xl border shadow-2xl !bg-black/50 backdrop-blur-md ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}
                                />
                            </ReactFlow>

                            {/* Simultaneous Highlight Legend */}
                            {isSimultaneousMode && showPreview && (
                                <div className="absolute top-4 left-4 z-[100] px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-md flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Simultaneous Mode Active</span>
                                </div>
                            )}
                        </div>

                        {/* Right Pane: Concurrent Game UI */}
                        <AnimatePresence>
                            {isSimultaneousMode && showPreview && (
                                <motion.div
                                    initial={{ x: '100%', opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: '100%', opacity: 0 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="w-1/2 h-full bg-black relative z-20 border-l border-white/5 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] shrink-0 overflow-hidden"
                                >
                                    <GamePreview
                                        nodes={nodes}
                                        edges={edges}
                                        onClose={() => setShowPreview(false)}
                                        gameMetadata={{ timeLimit, enableTimeLimit, learningObjectives, enableTTS, enableProgress, totalSteps }}
                                        onGameEnd={handlePreviewGameEnd}
                                        onNodeChange={onGameNodeChange}
                                        isSimultaneous={true}
                                    />

                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="absolute top-4 right-4 z-[101] p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md border border-white/5"
                                        title="Close Preview"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </EditorContext.Provider>
                </div>
                {/* end Main View Area */}

                <AICaseGeneratorModal
                    isOpen={showAIGenerator}
                    onClose={() => setShowAIGenerator(false)}
                    projectId={projectId}
                    onGenerate={(newNodes, newEdges, meta) => {
                        const preparedNodes = newNodes.map(node => ({
                            ...node,
                            data: {
                                ...node.data,
                                onChange: onNodeUpdate,
                                onDuplicate: onDuplicateNode,
                                onUngroup: onUngroup,
                                learningObjectives,
                                enableThreeD
                            }
                        }));
                        setNodes(preparedNodes);
                        setEdges(newEdges);

                        // Update metadata if provided by AI
                        if (meta) {
                            if (meta.caseTitle) setCaseTitle(meta.caseTitle);
                            if (meta.caseDescription) setCaseDescription(meta.caseDescription);
                        }

                        // Force fit view after generation
                        setTimeout(() => {
                            if (reactFlowInstance) reactFlowInstance.fitView({ duration: 800 });
                        }, 100);
                    }}
                />

                <CaseMetadataModal
                    isOpen={showMetadataModal}
                    onClose={() => setShowMetadataModal(false)}
                    initialTitle={caseTitle}
                    initialDescription={caseDescription}
                    onSave={handleSaveMetadata}
                />

                <AnimatePresence>
                    {showTutorial && (
                        <TutorialOverlay steps={tutorialSteps} onClose={() => setShowTutorial(false)} />
                    )}
                    {showPreview && !isSimultaneousMode && (
                        <GamePreview nodes={nodes} edges={edges} onClose={() => setShowPreview(false)} gameMetadata={{ timeLimit, enableTimeLimit, learningObjectives, enableTTS, enableProgress, totalSteps }} onGameEnd={handlePreviewGameEnd} onNodeChange={onGameNodeChange} />
                    )}

                    {/* Learning Objectives Editor */}
                    {showObjectivesEditor && (
                        <LearningObjectivesEditor
                            isOpen={showObjectivesEditor}
                            objectives={learningObjectives}
                            onSave={(updated) => {
                                setLearningObjectives(updated);
                                setShowObjectivesEditor(false);
                            }}
                            onClose={() => setShowObjectivesEditor(false)}
                        />
                    )}
                    {/* Settings Modal */}
                    {showSettings && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-zinc-950 border border-zinc-800 p-4 md:p-8 rounded-2xl md:rounded-3xl max-w-2xl w-full shadow-2xl max-h-[95vh] overflow-y-auto relative custom-scrollbar">
                                {/* Close Button */}
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all z-20"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* High-Visibility Header */}
                                <div className="mb-6 md:mb-10 flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-2 md:gap-3">
                                            <Settings className="w-6 h-6 md:w-8 md:h-8 text-indigo-500" />
                                            Session Architect
                                        </h2>
                                        <p className="text-zinc-500 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] pl-1">Configuration & Neural Parameters</p>
                                    </div>
                                </div>
                                <div className="space-y-10">
                                    {/* CORE PARAMETERS SECTION */}
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] whitespace-nowrap px-4">Core Parameters</span>
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
                                        </div>

                                        <div className="p-4 md:p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-white uppercase tracking-tight">Mission Duration</p>
                                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Time limit to solve the case</p>
                                            </div>
                                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                <button
                                                    onClick={() => setEnableTimeLimit(!enableTimeLimit)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${enableTimeLimit ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{enableTimeLimit ? 'Enabled' : 'Disabled'}</span>
                                                </button>
                                                <div className={`flex items-center gap-3 transition-all ${enableTimeLimit ? 'opacity-100 scale-100' : 'opacity-30 scale-95 pointer-events-none'}`}>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="120"
                                                        disabled={!enableTimeLimit}
                                                        value={timeLimit}
                                                        onChange={(e) => setTimeLimit(parseInt(e.target.value) || 15)}
                                                        className="bg-black border border-zinc-700 rounded-xl px-4 py-2 md:py-3 text-white w-20 md:w-24 text-center text-lg md:text-xl font-black focus:border-indigo-500 outline-none transition-all"
                                                    />
                                                    <span className="text-zinc-500 text-[10px] font-black uppercase">Minutes</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 md:p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-white uppercase tracking-tight">Progress Tracking</p>
                                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Show a progress bar or percentage to the player</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => setEnableProgress(!enableProgress)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${enableProgress ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{enableProgress ? 'Enabled' : 'Disabled'}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 md:p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-white uppercase tracking-tight">Audio Narration (TTS)</p>
                                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Enable or disable voice for this entire case</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => setEnableTTS(!enableTTS)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${enableTTS ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}
                                                >
                                                    {enableTTS ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{enableTTS ? 'Enabled' : 'Disabled'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </section>

                                    {/* ANALYTICAL FRAMEWORK SECTION */}
                                    <section className="space-y-6 border-t border-zinc-800 pt-10">
                                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Analytical Framework (Learning Objectives)</h3>
                                        <button
                                            onClick={() => { setShowSettings(false); setShowObjectivesEditor(true); }}
                                            className="w-full flex items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/15 border-2 border-indigo-500/30 hover:border-indigo-500/50 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                    <Target className="w-6 h-6 text-indigo-400" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-black text-white text-base uppercase tracking-tight">Learning Objectives Editor</p>
                                                    <p className="text-[10px] text-indigo-300/70 font-bold uppercase tracking-widest mt-0.5">
                                                        {learningObjectives.length} {learningObjectives.length === 1 ? 'Category' : 'Categories'} · {learningObjectives.reduce((s, c) => s + c.objectives.length, 0)} Objectives
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </section>
                                </div>
                                <div className="mt-8 flex justify-end gap-2">
                                    <Button onClick={() => setShowSettings(false)}>
                                        Save & Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                    }

                    {/* Edge Editor Modal */}
                    {
                        editingEdge && (
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
                                            <span className="text-zinc-500 text-[10px] mt-1 block">Visible action label shown on the core game flow.</span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Internal Note (Suspect Wall)</label>
                                            <textarea
                                                placeholder="Describe the connection... (e.g. 'Both worked at the bank during the heist')"
                                                value={tempNote}
                                                onChange={(e) => setTempNote(e.target.value)}
                                                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500 text-xs resize-none"
                                                rows={3}
                                            />
                                            <span className="text-zinc-500 text-[10px] mt-1 block">This note appears on the Suspect Wall when both suspects are revealed.</span>
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
                        )
                    }
                    {
                        helpModalData && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={() => setHelpModalData(null)}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-2xl w-full shadow-[0_0_50px_rgba(99,102,241,0.2)] relative overflow-hidden flex flex-col max-h-[90vh]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Decorative background elements */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px]"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 blur-[60px]"></div>

                                    <button onClick={() => setHelpModalData(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-all hover:rotate-90 z-20">
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-center gap-4 mb-6 shrink-0">
                                        <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30">
                                            <Info className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                                                {helpModalData.title}
                                            </h2>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Helpl</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                                        <p className="text-zinc-400 leading-relaxed mb-8 text-base font-medium italic border-l-2 border-indigo-500/30 pl-4">
                                            "{helpModalData.desc}"
                                        </p>

                                        {helpModalData.details && (
                                            <div className="space-y-3 mb-8">
                                                {helpModalData.details.map((detail, i) => (
                                                    <div key={i} className="flex items-start gap-3 text-sm text-zinc-300 font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] mt-1.5 shrink-0"></div>
                                                        <span className="leading-tight">{detail}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
                                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Tactical Examples</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {helpModalData.examples.map((ex, i) => (
                                                    <div key={i} className="px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-xs text-zinc-400 font-mono flex items-center gap-3 group hover:border-indigo-500/50 transition-all">
                                                        <span className="text-indigo-600 font-bold">0{i + 1}</span>
                                                        {ex}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setHelpModalData(null)}
                                        className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                                    >
                                        ACKNOWLEDGE
                                    </button>
                                </motion.div>
                            </div>
                        )
                    }
                </AnimatePresence>

                {/* Validation Report Modal */}
                <AnimatePresence>
                    {validationReport && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setValidationReport(null)}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl relative overflow-hidden"
                            >
                                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                                    <div className="flex items-center gap-3">
                                        <Stethoscope className="w-5 h-5 text-emerald-500" />
                                        <h2 className="text-lg font-bold text-white">Graph Health Report</h2>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setValidationReport(null)}>
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {validationReport.errors.length === 0 && validationReport.warnings.length === 0 && (
                                        <div className="text-center py-12 text-zinc-500">
                                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500 opacity-50" />
                                            <p>No issues found.</p>
                                        </div>
                                    )}

                                    {validationReport.errors.length > 0 && (
                                        <div>
                                            <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" /> Errors ({validationReport.errors.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {validationReport.errors.map(err => (
                                                    <div
                                                        key={err.id}
                                                        onClick={() => {
                                                            if (err.nodeId && reactFlowInstance) {
                                                                const node = nodes.find(n => n.id === err.nodeId);
                                                                if (node) {
                                                                    reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 800 });
                                                                    setValidationReport(null);
                                                                }
                                                            }
                                                        }}
                                                        className="bg-red-950/20 border border-red-900/30 p-3 rounded-lg flex items-start justify-between cursor-pointer hover:bg-red-950/40 transition-colors group"
                                                    >
                                                        <span className="text-red-200 text-sm">{err.message}</span>
                                                        {err.nodeId && <Search className="w-4 h-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {validationReport.warnings.length > 0 && (
                                        <div>
                                            <h3 className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" /> Warnings ({validationReport.warnings.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {validationReport.warnings.map(warn => (
                                                    <div
                                                        key={warn.id}
                                                        onClick={() => {
                                                            if (warn.nodeId && reactFlowInstance) {
                                                                const node = nodes.find(n => n.id === warn.nodeId);
                                                                if (node) {
                                                                    reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 800 });
                                                                    setValidationReport(null);
                                                                }
                                                            }
                                                        }}
                                                        className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-lg flex items-start justify-between cursor-pointer hover:bg-amber-950/40 transition-colors group"
                                                    >
                                                        <span className="text-amber-200 text-sm">{warn.message}</span>
                                                        {warn.nodeId && <Search className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                    {/* Delete Category Confirmation Modal */}
                    {
                        confirmDeleteCat && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl max-w-sm w-full shadow-2xl space-y-6"
                                >
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                                            <AlertTriangle className="w-8 h-8 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Destructive Action</h3>
                                            <p className="text-zinc-500 text-sm mt-2">
                                                Are you sure you want to delete <span className="text-zinc-200 font-bold">{learningObjectives.find(c => c.id === confirmDeleteCat)?.category}</span> and all its associated objectives?
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="ghost"
                                            className="flex-1 border border-zinc-800 hover:bg-zinc-900"
                                            onClick={() => setConfirmDeleteCat(null)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-900/20"
                                            onClick={confirmDeleteCategory}
                                        >
                                            Delete All
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )
                    }
                    {/* Case Locked Modal */}
                    {
                        showLockedModal && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-zinc-950 border border-indigo-500/30 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(79,70,229,0.2)] text-center relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
                                            <div className="relative w-20 h-20 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center">
                                                <Lock className="w-10 h-10 text-indigo-400" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-full border-4 border-zinc-950 flex items-center justify-center">
                                                <AlertTriangle className="w-4 h-4 text-black" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-black text-white tracking-tight">Case is Occupied</h2>
                                            <p className="text-zinc-400 text-sm leading-relaxed">
                                                <span className="text-indigo-400 font-bold">{editingBy?.displayName || 'Another detective'}</span> is currently working on this case file. To prevent data corruption, simultaneous editing is prohibited.
                                            </p>
                                        </div>

                                        <div className="w-full h-px bg-zinc-800"></div>

                                        <div className="flex flex-col gap-3 w-full">
                                            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20 uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                Live Status: Currently Editing
                                            </div>

                                            <div className="flex flex-col gap-2 w-full mt-2">
                                                {requestFeedback === 'declined' ? (
                                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold animate-shake">
                                                        Access Request Declined
                                                    </div>
                                                ) : requestFeedback === 'accepted' ? (
                                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold">
                                                        Access Granted! Releasing Lock...
                                                    </div>
                                                ) : isRequesting ? (
                                                    <div className="flex items-center justify-center gap-3 w-full h-12 bg-white/5 rounded-xl border border-white/10 text-zinc-400 text-sm font-bold animate-pulse">
                                                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                        Waiting for Response...
                                                    </div>
                                                ) : (
                                                    <AnimatePresence>
                                                        <Button
                                                            onClick={handleOverrideLock}
                                                            variant="destructive"
                                                            className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-200 border-red-500/30 font-bold h-12 rounded-xl"
                                                        >
                                                            Override (Force Access)
                                                        </Button>
                                                        <Button
                                                            onClick={handleRequestAccess}
                                                            variant="primary"
                                                            className="w-full font-bold h-12 rounded-xl"
                                                        >
                                                            Request Access
                                                        </Button>
                                                    </AnimatePresence>
                                                )}
                                            </div>

                                            <Button
                                                onClick={() => navigate('/')}
                                                variant="ghost"
                                                className="w-full text-zinc-500 hover:text-white hover:bg-white/5 font-medium h-10 rounded-xl"
                                            >
                                                Return to Dashboard
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )
                    }
                    {/* Incoming Access Request Modal */}
                    {
                        incomingRequest && (
                            <div className="fixed inset-0 z-[300] flex items-end justify-center p-6 md:items-center pointer-events-none">
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    className="bg-zinc-950 border border-indigo-500/50 p-6 rounded-2xl max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] pointer-events-auto"
                                >
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                            <User className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-tight">Access Requested</h3>
                                            <p className="text-zinc-400 text-xs leading-relaxed mt-1">
                                                <span className="text-indigo-400 font-bold">{incomingRequest.displayName}</span> is requesting permission to edit this case file.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleDeclineRequest}
                                            variant="ghost"
                                            className="flex-1 text-zinc-500 hover:text-white hover:bg-white/5 font-bold rounded-xl"
                                        >
                                            Decline
                                        </Button>
                                        <Button
                                            onClick={handleAcceptRequest}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                                        >
                                            Accept & Release
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )
                    }
                </AnimatePresence>


                {/* Story Export Modal */}
                <StoryExportModal
                    isOpen={showStoryFormatModal}
                    onClose={() => setShowStoryFormatModal(false)}
                    onExport={(format, onProgress) => downloadNovelStory(format, onProgress)}
                    isDarkMode={isDarkMode}
                    storyStats={getStoryStats()}
                />
                <LicenseConfigModal
                    isOpen={isLicenseModalOpen}
                    onClose={() => setIsLicenseModalOpen(false)}
                />
            </div>
        </div>
    );
};

const EditorPage = () => (
    <ErrorBoundary>
        <ReactFlowProvider>
            <Editor />
        </ReactFlowProvider>
    </ErrorBoundary>
);

export default EditorPage;