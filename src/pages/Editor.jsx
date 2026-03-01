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
        const query = searchQuery.toLowerCase();

        // Helper to recursively check for text in data
        const searchInData = (obj) => {
            if (!obj) return false;
            if (typeof obj === 'string') return obj.toLowerCase().includes(query);
            if (Array.isArray(obj)) return obj.some(item => searchInData(item));
            if (typeof obj === 'object') {
                return Object.values(obj).some(val => searchInData(val));
            }
            return false;
        };

        return nodes.filter(node => {
            const label = node.data?.label?.toLowerCase() || "";
            const type = node.type?.toLowerCase() || "";
            return label.includes(query) ||
                type.includes(query) ||
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
        }
    }, [isLocked, edges]);

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
            const flow = { nodes: cleanNodes, edges: cleanEdges, meta: { timeLimit, enableTimeLimit, learningObjectives, enableThreeD, enableTTS } };

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
        const cleanNodes = nodes.map(n => ({ ...n, data: { ...n.data, onChange: undefined, onDuplicate: undefined } }));
        const gameData = { nodes: cleanNodes, edges, meta: { generatedAt: new Date(), timeLimit, enableTimeLimit, learningObjectives, enableTTS } };

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

    const downloadNovelStory = async (format = 'markdown') => {
        // Close the modal immediately to prevent multiple clicks
        setShowStoryFormatModal(false);

        if (!settings?.aiApiKey) {
            alert("Please set an AI API Key in settings to use this feature.");
            return;
        }

        const btn = document.getElementById('download-story-btn');
        const originalContent = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<span class="flex items-center gap-2 animate-pulse"><div class="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>Writing Novel...</span>';
            btn.disabled = true;
        }

        try {
            const storyData = {
                title: caseTitle || "Untitled Mystery",
                description: caseDescription || "A thrilling detective story.",
                nodes: nodes.map(n => ({
                    id: n.id,
                    type: n.type,
                    label: n.data?.label || n.type,
                    text: n.data?.text || n.data?.description || n.data?.dialogue || n.data?.question || "",
                    metadata: {
                        name: n.data?.name || "",
                        role: n.data?.role || "",
                        alibi: n.data?.alibi || "",
                        description: n.data?.description || "",
                        culprit: n.data?.culpritName || "",
                        command: n.data?.command || "",
                        answer: n.data?.answer || "",
                        url: n.data?.url || "",
                        // Single image (evidence, question)
                        image: n.data?.image || "",
                        // Array of images (suspect, email, fact, media with gallery)
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

            const systemPrompt = `You are an elite detective novelist and case architect. Your goal is to provide a concise and compelling plot summary of a mystery game based on its node-based structure.

SUMMARY GUIDELINES:
1. CONCISE PLOT: Write a few paragraphs (a summary) that set the context, plot, and mystery. Do not write a full novel.
2. FLOW & TRANSITIONS: Explain how the story starts, the key suspects introduced, the major clues found, and how it leads to the final confrontation.
3. ATMOSPHERE: Maintain a "noir" or "cyber" aesthetic in your summary.
4. NO EXPOSITION ON MECHANICS: Do not mention "nodes" or "game mechanics". Write it as a story pitch or high-level narrative overview.

IMPORTANT: Focus on the Narrative Summary and the Plot Logic.`;

            const userMessage = `Title: ${storyData.title}
Background: ${storyData.description}

Narrative Blocks:
${storyData.nodes.map(n => `[Node: ${n.label} (${n.type})]
Content: ${n.text}
${n.metadata.name ? `Character: ${n.metadata.name}, Role: ${n.metadata.role}, Alibi: ${n.metadata.alibi}` : ''}
${n.metadata.description ? `Detail: ${n.metadata.description}` : ''}
`).join('\n')}

Connections:
${storyData.edges.map(e => `From "${storyData.nodes.find(n => n.id === e.source)?.label || 'Unknown'}" to "${storyData.nodes.find(n => n.id === e.target)?.label || 'Unknown'}" ${e.label ? `via "${e.label}"` : ''}`).join('\n')}

Please provide a concise plot summary and narrative overview based on these elements.`;

            const story = await callAI('gemini', systemPrompt, userMessage, settings.aiApiKey);

            // Generate Designer's Canvas Review Section
            const designerReview = generateDesignerReview(storyData);

            // Combine the novel and designer review
            const fullDocument = `${story}\n\n${designerReview}`;

            if (format === 'markdown') {
                const blob = new Blob([fullDocument], { type: 'text/markdown' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${storyData.title.replace(/\s+/g, '_')}_Mystery_Novel.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else if (format === 'pdf') {
                await generateEnhancedPDF(storyData, story, designerReview);
            } else if (format === 'google-docs') {
                await generateEnhancedDOCX(storyData, story, designerReview);
            }

        } catch (error) {
            console.error("Story generation failed:", error);
            alert("Failed to write the story. Check your AI key and try again.");
        } finally {
            if (btn) {
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        }
    };

    // Helper function to generate designer-friendly canvas review
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

    // Helper to fetch and convert image URL to Base64 for PDF/DOCX
    const fetchImageAsBase64 = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                resolve({ dataURL, width: img.width, height: img.height });
            };
            img.onerror = (err) => reject(err);
            img.src = url;
        });
    };

    // Enhanced PDF Generator with beautiful formatting
    const generateEnhancedPDF = async (storyData, story, designerReview) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;
        let yPos = margin;

        // Helper function to check if we need a new page
        const checkPageBreak = (requiredSpace = 10) => {
            if (yPos + required > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
                return true;
            }
            return false;
        };

        // Advanced text renderer that handles inline markdown formatting
        const renderFormattedText = (text, fontSize, baseColor = [0, 0, 0], indent = 0) => {
            doc.setFontSize(fontSize);

            // Parse the text for markdown formatting
            const segments = [];
            let currentPos = 0;

            // Regular expressions for markdown patterns
            const boldPattern = /\*\*(.+?)\*\*/g;
            const italicPattern = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;

            // First, find all bold segments
            let boldMatches = [];
            let match;
            while ((match = boldPattern.exec(text)) !== null) {
                boldMatches.push({ start: match.index, end: match.index + match[0].length, text: match[1], type: 'bold' });
            }

            // Then find italic segments (that aren't part of bold)
            let italicMatches = [];
            const tempText = text.replace(/\*\*(.+?)\*\*/g, (m) => '█'.repeat(m.length)); // Mask bold sections
            const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
            while ((match = italicRegex.exec(tempText)) !== null) {
                italicMatches.push({ start: match.index, end: match.index + match[0].length, text: text.substring(match.index + 1, match.index + match[0].length - 1), type: 'italic' });
            }

            // Combine and sort all matches
            const allMatches = [...boldMatches, ...italicMatches].sort((a, b) => a.start - b.start);

            // Build segments
            let lastEnd = 0;
            allMatches.forEach(match => {
                // Add normal text before this match
                if (match.start > lastEnd) {
                    segments.push({ text: text.substring(lastEnd, match.start), bold: false, italic: false });
                }
                // Add formatted text
                segments.push({ text: match.text, bold: match.type === 'bold', italic: match.type === 'italic' });
                lastEnd = match.end;
            });

            // Add remaining normal text
            if (lastEnd < text.length) {
                segments.push({ text: text.substring(lastEnd), bold: false, italic: false });
            }

            // If no formatting found, just add the whole text
            if (segments.length === 0) {
                segments.push({ text: text, bold: false, italic: false });
            }

            // Now render the segments
            let currentX = margin + indent;
            const maxWidth = contentWidth - indent;
            let currentLine = [];
            let currentLineWidth = 0;

            segments.forEach((segment, segIndex) => {
                const words = segment.text.split(' ');

                words.forEach((word, wordIndex) => {
                    if (word > 0 || seg > 0) {
                        word = ' ' + word;
                    }

                    doc.setFont('helvetica', segment.bold ? 'bold' : (segment.italic ? 'italic' : 'normal'));
                    const wordWidth = doc.getTextWidth(word);

                    if (currentLineWidth + word > maxWidth && currentLine.length > 0) {
                        // Render current line
                        renderLine(currentLine, currentX, yPos, baseColor);
                        yPos += fontSize * 0.5;
                        checkPageBreak();
                        currentLine = [];
                        currentLineWidth = 0;
                        currentX = margin + indent;
                        word = word.trim(); // Remove leading space for new line
                    }

                    currentLine.push({ text: word, bold: segment.bold, italic: segment.italic, width: doc.getTextWidth(word) });
                    currentLineWidth += doc.getTextWidth(word);
                });
            });

            // Render remaining line
            if (currentLine.length > 0) {
                renderLine(currentLine, currentX, yPos, baseColor);
                yPos += fontSize * 0.5;
            }

            yPos += 3;
        };

        // Helper to render a line with mixed formatting
        const renderLine = (segments, startX, y, color) => {
            let x = startX;
            doc.setTextColor(...color);

            segments.forEach(seg => {
                doc.setFont('helvetica', seg.bold ? 'bold' : (seg.italic ? 'italic' : 'normal'));
                doc.text(seg.text, x, y);
                x += seg.width;
            });
        };

        // Simple text helper for backward compatibility
        const addText = (text, fontSize, color = [0, 0, 0], isBold = false, indent = 0) => {
            if (isBold) {
                text = text.replace(/^\*\*/, '').replace(/\*\*$/, ''); // Remove ** if present
            }
            renderFormattedText(text, fontSize, color, indent);
        };

        // Cover Page
        doc.setFillColor(30, 30, 50);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Title
        doc.setFontSize(32);
        doc.setTextColor(255, 215, 0);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(storyData.title, contentWidth - 40);
        let titleY = pageHeight / 3;
        titleLines.forEach(line => {
            const textWidth = doc.getTextWidth(line);
            doc.text(line, (pageWidth - textWidth) / 2, titleY);
            titleY += 12;
        });

        // Subtitle
        doc.setFontSize(14);
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'italic');
        doc.text('A Mystery Game Story', pageWidth / 2, titleY + 10, { align: 'center' });

        // Description
        if (storyData.description) {
            doc.setFontSize(11);
            doc.setTextColor(180, 180, 180);
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(storyData.description, contentWidth - 60);
            let descY = titleY + 30;
            descLines.forEach(line => {
                doc.text(line, pageWidth / 2, descY, { align: 'center' });
                descY += 6;
            });
        }

        // Footer on cover
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated by Mystery Games Framework', pageWidth / 2, pageHeight - 20, { align: 'center' });
        doc.text(new Date().toLocaleDateString(), pageWidth / 2, pageHeight - 15, { align: 'center' });

        // Start content on new page
        doc.addPage();
        yPos = margin;

        // Parse and render the story
        const storyLines = story.split('\n');

        doc.setFontSize(18);
        doc.setTextColor(79, 70, 229);
        doc.setFont('helvetica', 'bold');
        doc.text('THE STORY', margin, yPos);
        yPos += 12;

        // Add a separator line
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        storyLines.forEach(line => {
            if (!line.trim()) {
                yPos += 4;
                return;
            }
            addText(line, 11, [40, 40, 40], false, 0);
        });

        // Designer Review Section
        doc.addPage();
        yPos = margin;

        const reviewLines = designerReview.split('\n');
        let currentSection = 'default';

        for (const line of reviewLines) {
            const trimmed = line.trim();

            if (!trimmed) {
                yPos += 3;
                continue;
            }

            // Main heading (# DESIGNER'S CANVAS REVIEW)
            if (trimmed.startsWith('# ')) {
                checkPageBreak(20);
                const text = cleanTextForPDF(trimmed.substring(2));
                doc.setFillColor(79, 70, 229);
                doc.rect(margin - 5, yPos - 5, contentWidth + 10, 18, 'F');
                doc.setFontSize(20);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text(text, margin, yPos + 8);
                yPos += 25;
                continue;
            }

            // Section headings (## )
            if (trimmed.startsWith('## ')) {
                checkPageBreak(15);
                yPos += 5;
                const rawText = trimmed.substring(3);
                const text = cleanTextForPDF(rawText);

                // Color code different sections based on original text with emojis
                let bgColor = [79, 70, 229];
                if (rawText.includes('CANVAS AT A GLANCE') || rawText.includes('STORY STRUCTURE')) { bgColor = [59, 130, 246]; currentSection = 'overview'; }
                else if (rawText.includes('STORY FLOW')) { bgColor = [139, 92, 246]; currentSection = 'flow'; }
                else if (rawText.includes('CHARACTER')) { bgColor = [236, 72, 153]; currentSection = 'characters'; }
                else if (rawText.includes('EVIDENCE TRACKER')) { bgColor = [234, 179, 8]; currentSection = 'evidence'; }
                else if (rawText.includes('QUESTION BANK')) { bgColor = [168, 85, 247]; currentSection = 'questions'; }
                else if (rawText.includes('LOGIC')) { bgColor = [34, 197, 94]; currentSection = 'logic'; }
                else if (rawText.includes('INTERACTIVE')) { bgColor = [249, 115, 22]; currentSection = 'interactive'; }
                else if (rawText.includes('FLOW HEALTH') || rawText.includes('RECOMMENDATIONS')) { bgColor = [16, 185, 129]; currentSection = 'recommendations'; }

                doc.setFillColor(...bgColor);
                doc.rect(margin - 3, yPos - 3, contentWidth + 6, 12, 'F');
                doc.setFontSize(14);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text(text, margin, yPos + 5);
                yPos += 18;
                continue;
            }

            // Subsection headings (### )
            if (trimmed.startsWith('### ')) {
                checkPageBreak(12);
                const text = cleanTextForPDF(trimmed.substring(4));
                doc.setFontSize(12);
                doc.setTextColor(79, 70, 229);
                doc.setFont('helvetica', 'bold');
                doc.text(text, margin, yPos);
                yPos += 10;
                continue;
            }

            // Bold text (**text**) - now handled by renderFormattedText
            // Remove this check as it's redundant with the new parser
            // if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            //     const text = trimmed.substring(2, trimmed.length - 2);
            //     addText(text, 10, [60, 60, 60], true, 0);
            //     return;
            // }

            // Blockquote lines (> ...)
            if (trimmed.startsWith('> ') || trimmed.startsWith('>*')) {
                checkPageBreak(8);
                const text = cleanTextForPDF(trimmed.replace(/^>\s?/, ''));
                doc.setFontSize(10);
                doc.setDrawColor(180, 180, 180);
                doc.setLineWidth(1.5);
                doc.line(margin + 2, yPos - 3, margin + 2, yPos + 4);
                doc.setTextColor(100, 100, 100);
                doc.setFont('helvetica', 'italic');
                const bqLines = doc.splitTextToSize(text, contentWidth - 15);
                bqLines.forEach(l => {
                    doc.text(l, margin + 8, yPos);
                    yPos += 5;
                    checkPageBreak();
                });
                yPos += 2;
                continue;
            }

            // Markdown table rows (| col | col |)
            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                // Skip separator rows (|---|---|
                if (/^[\|\- :]+$/.test(trimmed)) { continue; }
                checkPageBreak(7);
                const cols = trimmed.split('|').map(c => cleanTextForPDF(c.trim())).filter(c => c.length > 0);
                if (cols.length > 0) {
                    const colWidth = contentWidth / cols.length;
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(60, 60, 60);
                    cols.forEach((col, ci) => {
                        const cellText = doc.splitTextToSize(col, colWidth - 4);
                        doc.text(cellText, margin + ci * colWidth + 2, yPos);
                    });
                    yPos += 7;
                    doc.setDrawColor(220, 220, 220);
                    doc.setLineWidth(0.1);
                    doc.line(margin, yPos - 1, pageWidth - margin, yPos - 1);
                }
                continue;
            }

            // Warning/Alert boxes (WARNING: or contains warning-like prefix after cleaning)
            if (trimmed.includes('\u26A0') || trimmed.match(/\*\*⚠/)) {
                checkPageBreak(15);
                doc.setFillColor(254, 243, 199);
                doc.setDrawColor(251, 191, 36);
                doc.setLineWidth(1);

                // Clean text and add label
                const cleanText = cleanTextForPDF(trimmed).replace(/\*\*/g, '');
                const labeledText = 'WARNING: ' + cleanText;

                doc.setFontSize(10);
                const lines = doc.splitTextToSize(labeledText, contentWidth - 6);
                const boxHeight = lines.length * 5 + 4;

                doc.rect(margin, yPos - 2, contentWidth, boxHeight, 'FD');

                const savedYPos = yPos;
                yPos += 2;
                lines.forEach(l => { doc.setFont('helvetica', 'normal'); doc.setTextColor(146, 64, 14); doc.text(l, margin + 3, yPos); yPos += 5; });
                yPos = savedYPos + boxHeight + 3;
                continue;
            }

            // Suggestion boxes (SUGGESTION keyword)
            if (trimmed.match(/Suggestion/i) && trimmed.includes('**')) {
                checkPageBreak(15);
                doc.setFillColor(219, 234, 254);
                doc.setDrawColor(59, 130, 246);
                doc.setLineWidth(1);

                const cleanText = cleanTextForPDF(trimmed).replace(/\*\*/g, '');
                const labeledText = 'SUGGESTION: ' + cleanText;

                doc.setFontSize(10);
                const lines = doc.splitTextToSize(labeledText, contentWidth - 6);
                const boxHeight = lines.length * 5 + 4;

                doc.rect(margin, yPos - 2, contentWidth, boxHeight, 'FD');

                const savedYPos = yPos;
                yPos += 2;
                lines.forEach(l => { doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 64, 175); doc.text(l, margin + 3, yPos); yPos += 5; });
                yPos = savedYPos + boxHeight + 3;
                continue;
            }

            // List items (  - or  → or  ← or numbered N.)
            if (trimmed.startsWith('- ') || trimmed.startsWith('->') || trimmed.startsWith('<-') ||
                trimmed.startsWith('v ') || trimmed.startsWith('^ ') || /^\d+\.\s/.test(trimmed)) {
                let bullet = '-';
                let text = trimmed;

                if (trimmed.startsWith('- ')) {
                    bullet = '\u2022'; // bullet
                    text = trimmed.substring(2);
                } else if (trimmed.startsWith('->')) {
                    bullet = '->';
                    text = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('<-')) {
                    bullet = '<-';
                    text = trimmed.substring(2).trim();
                } else if (/^\d+\.\s/.test(trimmed)) {
                    const m = trimmed.match(/^(\d+\.\s)/);
                    bullet = m[1].trim();
                    text = trimmed.substring(m[1].length);
                }

                const cleanItem = cleanTextForPDF(text).replace(/\*\*/g, '');
                checkPageBreak();

                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                doc.setFont('helvetica', 'bold');
                doc.text(bullet, margin + 5, yPos);

                doc.setFont('helvetica', 'normal');
                const itemLines = doc.splitTextToSize(cleanItem, contentWidth - 16);
                itemLines.forEach((il, idx) => {
                    if (idx > 0) checkPageBreak();
                    doc.setTextColor(80, 80, 80);
                    doc.text(il, margin + 14, yPos);
                    yPos += 5;
                });
                yPos += 1;
                continue;
            }

            // Image lines — any ![alt](url) pattern
            if (trimmed.startsWith('![') && trimmed.includes('](')) {
                const urlMatch = trimmed.match(/\(([^)]+)\)/);
                if (urlMatch && urlMatch[1]) {
                    const url = urlMatch[1].trim();
                    // Only try to embed if it looks like an image URL
                    const looksLikeImage = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url) ||
                        url.startsWith('data:image') ||
                        url.includes('firebasestorage') ||
                        url.includes('googleapis.com') ||
                        url.includes('storage.googleapis');

                    if (looksLikeImage) {
                        try {
                            checkPageBreak(80);
                            const imgData = await fetchImageAsBase64(url);

                            // Use up to 80% of the content width, preserve aspect ratio
                            const maxW = contentWidth * 0.85;
                            const ratio = imgData.width / Math.max(imgData.height, 1);
                            const displayWidth = Math.min(maxW, imgData.width > 0 ? maxW : 100);
                            const displayHeight = Math.min(displayWidth / ratio, 160); // cap height at 160pt
                            const finalWidth = displayHeight * ratio; // recalculate width if height was capped

                            // Centre the image
                            const xOffset = (contentWidth - finalWidth) / 2;

                            // Light border around image
                            doc.setDrawColor(200, 200, 200);
                            doc.setLineWidth(0.3);
                            doc.rect(margin + xOffset - 1, yPos - 1, finalWidth + 2, displayHeight + 2);
                            doc.addImage(imgData.dataURL, 'JPEG', margin + xOffset, yPos, finalWidth, displayHeight);

                            yPos += displayHeight + 8;
                            checkPageBreak();
                        } catch (err) {
                            console.warn('PDF: image failed to load:', url, err);
                            doc.setFontSize(8);
                            doc.setTextColor(150, 100, 0);
                            const shortUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
                            doc.text(`[Image: ${shortUrl}]`, margin + 5, yPos);
                            yPos += 8;
                        }
                    } else {
                        // Non-image URL — just print as text
                        const altText = (trimmed.match(/!\[([^\]]*)]/) || [])[1] || 'Image';
                        doc.setFontSize(9);
                        doc.setTextColor(80, 80, 200);
                        doc.setFont('helvetica', 'italic');
                        const shortUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
                        doc.text(`${altText}: ${shortUrl}`, margin + 5, yPos);
                        yPos += 7;
                    }
                    continue;
                }
            }

            // Divider lines (=== or --- or ─── )
            if (trimmed.startsWith('===') || trimmed.startsWith('---') || trimmed.startsWith('\u2500\u2500\u2500')) {
                checkPageBreak(5);
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(trimmed.startsWith('===') ? 0.5 : 0.2);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 6;
                continue;
            }

            // Italic text (*text*)
            if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
                const cleanItalic = cleanTextForPDF(trimmed.replace(/^\*|\*$/g, ''));
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(120, 120, 120);
                const italicLines = doc.splitTextToSize(cleanItalic, contentWidth);
                italicLines.forEach(l => { doc.text(l, margin, yPos); yPos += 5; checkPageBreak(); });
                continue;
            }

            // Regular paragraph — always clean before rendering
            const cleanPara = cleanTextForPDF(trimmed).replace(/\*\*/g, '');
            if (cleanPara) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
                const paraLines = doc.splitTextToSize(cleanPara, contentWidth);
                paraLines.forEach(l => { checkPageBreak(); doc.text(l, margin, yPos); yPos += 5.5; });
                yPos += 1;
            }
        }

        // Save the PDF
        try {
            doc.save(`${storyData.title.replace(/\s+/g, '_')}_Mystery_Novel.pdf`);
        } catch (saveErr) {
            console.error("PDF Save error:", saveErr);
            alert("Could not save PDF. Try Markdown format instead.");
        }
    };

    // Enhanced DOCX Generator with beautiful formatting
    const generateEnhancedDOCX = async (storyData, story, designerReview) => {
        const children = [];

        // Title Page
        children.push(
            new Paragraph({
                text: storyData.title,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
                text: 'A Mystery Game Story',
                alignment: AlignmentType.CENTER,
                italics: true,
                spacing: { after: 100 },
            })
        );

        if (storyData.description) {
            children.push(
                new Paragraph({
                    text: storyData.description,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                })
            );
        }

        children.push(
            new Paragraph({
                text: `Generated: ${new Date().toLocaleDateString()}`,
                alignment: AlignmentType.CENTER,
                italics: true,
                spacing: { after: 400 },
            })
        );

        // Story Section
        children.push(
            new Paragraph({
                text: 'THE STORY',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        );

        // Add story paragraphs
        story.split('\n\n').forEach(para => {
            if (para.trim()) {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: para.trim(), size: 24 })],
                        spacing: { after: 200 },
                    })
                );
            }
        });

        // Designer Review Section
        const reviewLines = designerReview.split('\n');

        for (const line of reviewLines) {
            const trimmed = line.trim();

            if (!trimmed) continue;

            // Main heading
            if (trimmed.startsWith('# ')) {
                children.push(
                    new Paragraph({
                        text: trimmed.substring(2),
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 },
                        shading: { fill: '4F46E5', color: 'FFFFFF' },
                    })
                );
                continue;
            }

            // Section headings
            if (trimmed.startsWith('## ')) {
                children.push(
                    new Paragraph({
                        text: trimmed.substring(3),
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 300, after: 150 },
                    })
                );
                continue;
            }

            // Subsection headings
            if (trimmed.startsWith('### ')) {
                children.push(
                    new Paragraph({
                        text: trimmed.substring(4),
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 },
                    })
                );
                continue;
            }

            // Bold text
            if (trimmed.startsWith('**') && trimmed.includes(':**')) {
                const parts = trimmed.split(':**');
                const label = parts[0].substring(2);
                const value = parts[1]?.trim() || '';
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: label + ': ', bold: true }),
                            new TextRun({ text: value }),
                        ],
                        spacing: { after: 100 },
                    })
                );
                continue;
            }

            // List items
            if (trimmed.startsWith('- ') || trimmed.startsWith('→') || trimmed.startsWith('←')) {
                const text = trimmed.startsWith('-') ? trimmed.substring(2) : trimmed.substring(1).trim();
                children.push(
                    new Paragraph({
                        text: text,
                        bullet: { level: 0 },
                        spacing: { after: 50 },
                    })
                );
                continue;
            }

            // Evidence Images detector
            if (trimmed.includes('![Evidence](')) {
                const urlMatch = trimmed.match(/\((.*?)\)/);
                if (urlMatch && urlMatch[1]) {
                    try {
                        const imgData = await fetchImageAsBase64(urlMatch[1]);

                        // Convert DataURL to Uint8Array manually (more robust than fetch in some contexts)
                        const base64Data = imgData.dataURL.split(',')[1];
                        const binaryString = window.atob(base64Data);
                        const len = binaryString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }

                        children.push(
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: bytes.buffer,
                                        transformation: {
                                            width: 400,
                                            height: 400 * (imgData.height / imgData.width),
                                        },
                                    }),
                                ],
                                spacing: { before: 200, after: 200 },
                                alignment: AlignmentType.CENTER
                            })
                        );
                    } catch (e) {
                        console.error("DOCX Image fail:", e);
                    }
                }
                continue;
            }

            // Warnings/Suggestions
            if (trimmed.includes('⚠️') || trimmed.includes('💭')) {
                const color = trimmed.includes('⚠️') ? '92400E' : '1E40AF';
                const fill = trimmed.includes('⚠️') ? 'FEF3C7' : 'DBEAFE';
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: trimmed, bold: true, color: color })],
                        spacing: { after: 150 },
                        shading: { fill: fill },
                    })
                );
                continue;
            }

            // Dividers
            if (trimmed.startsWith('===') || trimmed.startsWith('---')) {
                children.push(
                    new Paragraph({
                        text: '',
                        border: { bottom: { color: 'CCCCCC', space: 1, style: 'single', size: 6 } },
                        spacing: { before: 100, after: 100 },
                    })
                );
                continue;
            }

            // Italic text
            if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: trimmed.substring(1, trimmed.length - 1), italics: true, color: '666666' })],
                        spacing: { after: 100 },
                    })
                );
                continue;
            }

            // Regular paragraph
            children.push(
                new Paragraph({
                    text: trimmed,
                    spacing: { after: 100 },
                })
            );
        }

        const doc = new DocxDocument({
            sections: [{
                properties: {},
                children: children,
            }],
        });

        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${storyData.title.replace(/\s+/g, '_')}_Mystery_Novel.docx`;
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
                            <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 truncate">Mission Architect</span>
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
                    <EditorContext.Provider value={{ learningObjectives }}>
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
                                        gameMetadata={{ timeLimit, enableTimeLimit, learningObjectives, enableTTS }}
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
                        <GamePreview nodes={nodes} edges={edges} onClose={() => setShowPreview(false)} gameMetadata={{ timeLimit, enableTimeLimit, learningObjectives, enableTTS }} onGameEnd={handlePreviewGameEnd} onNodeChange={onGameNodeChange} />
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
                                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">Analytical Framework (Learning Objectives)</h3>

                                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 md:p-5 mb-8">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1 space-y-1.5">
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">New Category Title</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Cyber Security Fundamentals"
                                                        value={newCategory.name}
                                                        onChange={(e) => setNewCategory({ name: e.target.value })}
                                                        onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                                        className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button size="sm" onClick={addCategory} disabled={!newCategory.name.trim()} className="w-full md:w-auto h-10 px-6 font-bold shadow-lg shadow-indigo-600/20">
                                                        <Plus className="w-4 h-4 mr-2" /> Add Category
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {learningObjectives.map((cat) => (
                                                <div key={cat.id} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                                                    <div className="flex items-center justify-between mb-4 border-b border-zinc-800/50 pb-3">
                                                        <span className="font-extrabold text-indigo-400 text-lg uppercase tracking-tight">{cat.category}</span>
                                                        <button onClick={() => deleteCategory(cat.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-2 bg-black/40 rounded-lg border border-transparent hover:border-red-900/30" title="Delete Category">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3 mb-6">
                                                        {cat.objectives.length === 0 && (
                                                            <div className="text-xs text-zinc-600 italic px-2">No specific learning objectives added yet.</div>
                                                        )}
                                                        {cat.objectives.map((obj, idx) => (
                                                            <div key={idx} className="bg-black/40 border border-zinc-800/50 rounded-xl p-4 group relative">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex-1 space-y-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                                            <span className="font-bold text-sm text-zinc-200">{typeof obj === 'string' ? obj : obj.learningObjective}</span>
                                                                        </div>
                                                                        {typeof obj !== 'string' && (
                                                                            <div className="pl-3 space-y-1.5">
                                                                                {obj.objective && <p className="text-[11px] text-zinc-400 leading-relaxed italic border-l border-zinc-800 pl-3">{obj.objective}</p>}
                                                                                {obj.keyTakeaway && (
                                                                                    <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/5 w-fit px-2 py-0.5 rounded border border-emerald-500/10">
                                                                                        <CheckCircle className="w-3 h-3" /> {obj.keyTakeaway}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <button onClick={() => deleteObjective(cat.id, idx)} className="text-zinc-600 hover:text-red-400 transition-all p-2 bg-black/80 rounded-lg border border-zinc-800 hover:border-red-900/30">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1 mb-1">Add New Objective</p>
                                                        <div className="space-y-3">
                                                            <InputField
                                                                placeholder="Learning Objective (e.g. Identify Phishing emails)"
                                                                value={newObjective.categoryId === cat.id ? newObjective.title : ""}
                                                                onChange={(e) => setNewObjective({ ...newObjective, categoryId: cat.id, title: e.target.value })}
                                                                className="!bg-black !border-zinc-800 focus:!border-indigo-500"
                                                            />
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <InputField
                                                                    placeholder="Detail / Description"
                                                                    value={newObjective.categoryId === cat.id ? newObjective.detail : ""}
                                                                    onChange={(e) => setNewObjective({ ...newObjective, categoryId: cat.id, detail: e.target.value })}
                                                                    className="!bg-black !border-zinc-800 focus:!border-indigo-500"
                                                                />
                                                                <InputField
                                                                    placeholder="Key Takeaway"
                                                                    value={newObjective.categoryId === cat.id ? newObjective.takeaway : ""}
                                                                    onChange={(e) => setNewObjective({ ...newObjective, categoryId: cat.id, takeaway: e.target.value })}
                                                                    className="!bg-black !border-zinc-800 focus:!border-indigo-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => addObjective(cat.id)}
                                                                disabled={newObjective.categoryId !== cat.id || !newObjective.title.trim()}
                                                                className="h-9 px-4 text-xs"
                                                            >
                                                                <Plus className="w-3.5 h-3.5 mr-2" /> Save Objective
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
                        )
                    }
                    {
                        helpModalData && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={() => setHelpModalData(null)}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-lg w-full shadow-[0_0_50px_rgba(99,102,241,0.2)] relative overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Decorative background elements */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px]"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 blur-[60px]"></div>

                                    <button onClick={() => setHelpModalData(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-all hover:rotate-90">
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30">
                                            <Info className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                                                {helpModalData.title}
                                            </h2>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Intelligence Protocol</p>
                                        </div>
                                    </div>

                                    <p className="text-zinc-400 leading-relaxed mb-8 text-sm font-medium italic">
                                        "{helpModalData.desc}"
                                    </p>

                                    {helpModalData.details && (
                                        <div className="space-y-3 mb-8">
                                            {helpModalData.details.map((detail, i) => (
                                                <div key={i} className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                                                    {detail}
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

                {/* Story Format Selection Modal */}
                <AnimatePresence>
                    {showStoryFormatModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                onClick={() => setShowStoryFormatModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className={`relative w-full max-w-md rounded-3xl border shadow-[0_20px_80px_rgba(0,0,0,0.5)] overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'}`}
                            >
                                {/* Header */}
                                <div className={`p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                                                <FileText className={`w-6 h-6 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                                            </div>
                                            <div>
                                                <h3 className={`text-lg font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                                    Download Story
                                                </h3>
                                                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                                                    Choose your preferred format
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowStoryFormatModal(false)}
                                            className="h-8 w-8"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Format Options */}
                                <div className="p-6 space-y-3">
                                    <button
                                        onClick={() => downloadNovelStory('markdown')}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left group ${isDarkMode
                                            ? 'bg-white/5 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5'
                                            : 'bg-zinc-50 border-zinc-200 hover:border-amber-500 hover:bg-amber-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
                                                <FileText className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`text-sm font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                                    Markdown (.md)
                                                </div>
                                                <div className="text-xs text-zinc-500 font-medium mt-0.5">
                                                    Plain text with formatting
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => downloadNovelStory('pdf')}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left group ${isDarkMode
                                            ? 'bg-white/5 border-white/10 hover:border-red-500/50 hover:bg-red-500/5'
                                            : 'bg-zinc-50 border-zinc-200 hover:border-red-500 hover:bg-red-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
                                                <FileText className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`text-sm font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                                    PDF Document
                                                </div>
                                                <div className="text-xs text-zinc-500 font-medium mt-0.5">
                                                    Universal document format
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => downloadNovelStory('google-docs')}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left group ${isDarkMode
                                            ? 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5'
                                            : 'bg-zinc-50 border-zinc-200 hover:border-blue-500 hover:bg-blue-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
                                                <FileText className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`text-sm font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                                    Google Docs (.docx)
                                                </div>
                                                <div className="text-xs text-zinc-500 font-medium mt-0.5">
                                                    Editable Word document
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                        </div>
                                    </button>
                                </div>

                                {/* Footer */}
                                <div className={`p-4 border-t ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <p className="text-xs text-zinc-500 text-center font-medium">
                                        AI will generate a seamless novel from your canvas
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
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