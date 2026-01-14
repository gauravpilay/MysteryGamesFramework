import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Button, Card, Input, Label } from '../components/ui/shared';
import { Plus, FolderOpen, LogOut, Search, Trash2, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ... (imports remain the same)

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [showNewModal, setShowNewModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null); // State for delete confirmation
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

    // Load projects from local storage
    useEffect(() => {
        // Load existing projects
        const saved = localStorage.getItem('mystery_projects');
        let currentProjects = saved ? JSON.parse(saved) : [];
        let modified = false;

        // 1. Tutorial Project Check
        const tutorialId = 'tutorial-sample-story-v1';
        const isTutorialDismissed = localStorage.getItem('tutorial_dismissed') === 'true';

        if (!isTutorialDismissed && !currentProjects.some(p => p.id === tutorialId)) {
            const tutorialProject = {
                id: tutorialId,
                title: 'Tutorial: The Missing Architect',
                description: 'A guided sample story demonstrating how to structure a mystery game.',
                updatedAt: new Date().toISOString(),
                nodeCount: 7
            };

            const tutorialData = {
                nodes: [
                    {
                        id: 'start-node',
                        type: 'story',
                        position: { x: 100, y: 100 },
                        data: {
                            label: 'The Beginning',
                            text: 'Welcome to the Mystery Architect! This is a "Story Node". It sets the scene. \n\n"You arrive at the scene of the crime. The office is silent..."'
                        }
                    },
                    {
                        id: 'suspect-1',
                        type: 'suspect',
                        position: { x: 500, y: 100 },
                        data: {
                            label: 'Suspect: The Intern',
                            name: 'Alex "The Coder" Mercer',
                            role: 'Junior Dev',
                            alibi: 'Nervous, typing furiously.',
                            isKiller: false
                        }
                    },
                    {
                        id: 'evidence-1',
                        type: 'evidence',
                        position: { x: 500, y: 300 },
                        data: {
                            label: 'Found USB Drive',
                            description: 'A black encrypted USB drive found under the desk.'
                        }
                    },
                    {
                        id: 'logic-1',
                        type: 'logic',
                        position: { x: 900, y: 200 },
                        data: {
                            label: 'Has Evidence?',
                            condition: 'has_usb_drive'
                        }
                    },
                    {
                        id: 'msg-1',
                        type: 'message',
                        position: { x: 100, y: 400 },
                        data: {
                            label: 'Incoming Text',
                            sender: 'Unknown',
                            message: 'Stop looking for the architect. - Watcher'
                        }
                    }
                ],
                edges: [
                    { id: 'e1-2', source: 'start-node', target: 'suspect-1' },
                    { id: 'e1-3', source: 'start-node', target: 'evidence-1' },
                    { id: 'e2-4', source: 'suspect-1', target: 'logic-1' }
                ]
            };

            currentProjects.unshift(tutorialProject);
            localStorage.setItem(`project_data_${tutorialId}`, JSON.stringify(tutorialData));
            modified = true;
        }

        // 2. Cyber Attack Sample Check
        const cyberId = 'sample-cyber-attack-v2';
        const isCyberDismissed = localStorage.getItem('sample_cyber_dismissed') === 'true';

        if (!isCyberDismissed && !currentProjects.some(p => p.id === cyberId)) {
            const cyberProject = {
                id: cyberId,
                title: 'Case: The Digital Insider',
                description: 'CRITICAL: DarkCipher Ransomware attack on Global FinTech. Identify the insider threat immediately.',
                updatedAt: new Date().toISOString(),
                nodeCount: 16
            };

            const cyberData = {
                nodes: [
                    {
                        id: 'cyber-start',
                        type: 'story',
                        position: { x: 0, y: 0 },
                        data: {
                            label: 'Briefing: 0800 HRS',
                            text: 'ALERT: Global FinTech Bank systems are locked by DarkCipher ransomware. \n\nForensics indicates the payload was deployed internally. We have 5 suspects who had access during the 0200-0400 maintenance window. \n\nFind the culprit. Time is running out.'
                        }
                    },
                    {
                        id: 'suspect-sarah',
                        type: 'suspect',
                        position: { x: -400, y: 250 },
                        data: {
                            label: 'Suspect: Sarah',
                            name: 'Sarah "The Vet" Jenkins',
                            role: 'Senior SysAdmin',
                            alibi: 'Claimed to be patching Server Block B. Logs confirm her login at 02:15.',
                        }
                    },
                    {
                        id: 'suspect-mike',
                        type: 'suspect',
                        position: { x: -200, y: 250 },
                        data: {
                            label: 'Suspect: Mike',
                            name: 'Mike "Script" Ross',
                            role: 'IT Intern',
                            alibi: 'Left office at 18:00. Badge swipe shows re-entry at 08:00. Known to browse hacker forums.',
                        }
                    },
                    {
                        id: 'suspect-elena',
                        type: 'suspect',
                        position: { x: 0, y: 250 },
                        data: {
                            label: 'Suspect: Elena',
                            name: 'Elena "Ghost" Petrova',
                            role: 'Lead Developer',
                            alibi: 'Working remote from Warsaw. VPN logs show constant activity on the repo.',
                        }
                    },
                    {
                        id: 'suspect-ken',
                        type: 'suspect',
                        position: { x: 200, y: 250 },
                        data: {
                            label: 'Suspect: Ken',
                            name: 'Ken Sato',
                            role: 'External Consultant',
                            alibi: 'On-site for migration. Had unsupervised access to the server room.',
                        }
                    },
                    {
                        id: 'suspect-david',
                        type: 'suspect',
                        position: { x: 400, y: 250 },
                        data: {
                            label: 'Suspect: David',
                            name: 'David Sterling',
                            role: 'CTO',
                            alibi: 'In frantic meetings. Pressured team to bypass security protocols for speed.',
                        }
                    },
                    {
                        id: 'term-logs',
                        type: 'terminal',
                        position: { x: -300, y: 500 },
                        data: {
                            label: 'Server Auth Logs',
                            prompt: 'Check the authentication logs for unusual activity around 03:00.',
                            command: 'grep "03:" /var/log/auth.log'
                        }
                    },
                    {
                        id: 'evidence-cctv',
                        type: 'evidence',
                        position: { x: 0, y: 500 },
                        data: {
                            label: 'CCTV Footage',
                            description: 'Blurry footage from 03:14 AM shows a figure in a hoodie entering the secure zone using a keycard.'
                        }
                    },
                    {
                        id: 'msg-tip',
                        type: 'message',
                        position: { x: 300, y: 500 },
                        data: {
                            label: 'Anonymous Tip',
                            sender: 'Unknown',
                            message: 'Check the consultant\'s trash. He thought he was clever.'
                        }
                    },
                    {
                        id: 'logic-keycard',
                        type: 'logic',
                        position: { x: 0, y: 700 },
                        data: {
                            label: 'Analyze Keycard',
                            condition: 'keycard_match_ken'
                        }
                    },
                    {
                        id: 'evidence-trash',
                        type: 'evidence',
                        position: { x: 300, y: 700 },
                        data: {
                            label: 'Burned Note',
                            description: 'Recovered note: "Payload active. Payment to wallet 3Xy... - K.S."'
                        }
                    },
                    {
                        id: 'story-climax',
                        type: 'story',
                        position: { x: 0, y: 900 },
                        data: {
                            label: 'The Confrontation',
                            text: 'You have gathered the evidence. All signs point to one person. It is time to make the arrest.'
                        }
                    }
                ],
                edges: [
                    { id: 'e-start-sarah', source: 'cyber-start', target: 'suspect-sarah' },
                    { id: 'e-start-mike', source: 'cyber-start', target: 'suspect-mike' },
                    { id: 'e-start-elena', source: 'cyber-start', target: 'suspect-elena' },
                    { id: 'e-start-ken', source: 'cyber-start', target: 'suspect-ken' },
                    { id: 'e-start-david', source: 'cyber-start', target: 'suspect-david' },

                    // New: Suspects leading to clues
                    { id: 'e-sarah-logs', source: 'suspect-sarah', target: 'term-logs' },
                    { id: 'e-mike-cctv', source: 'suspect-mike', target: 'evidence-cctv' },
                    { id: 'e-elena-tip', source: 'suspect-elena', target: 'msg-tip' },
                    { id: 'e-david-logs', source: 'suspect-david', target: 'term-logs' },
                    { id: 'e-ken-trash', source: 'suspect-ken', target: 'evidence-trash' },

                    // Clue Interconnections
                    { id: 'e-tip-trash', source: 'msg-tip', target: 'evidence-trash' },
                    { id: 'e-cctv-logic', source: 'evidence-cctv', target: 'logic-keycard' },
                    { id: 'e-logic-climax', source: 'logic-keycard', target: 'story-climax' }
                ]
            };

            currentProjects.unshift(cyberProject);
            localStorage.setItem(`project_data_${cyberId}`, JSON.stringify(cyberData));
            modified = true;
        }

        if (modified) {
            setProjects([...currentProjects]); // Create new reference
            localStorage.setItem('mystery_projects', JSON.stringify(currentProjects));
        } else {
            setProjects(currentProjects);
        }
    }, []);

    const createProject = () => {
        const newProject = {
            id: crypto.randomUUID(),
            title: newProjectName || 'Untitled Mystery',
            description: newProjectDesc || 'A thrilling case awaiting design.',
            updatedAt: new Date().toISOString(),
            nodeCount: 0
        };
        const updated = [newProject, ...projects];
        setProjects(updated);
        localStorage.setItem('mystery_projects', JSON.stringify(updated));
        setShowNewModal(false);
        setNewProjectName('');
        setNewProjectDesc('');
        // Initialize empty graph for this project
        localStorage.setItem(`project_data_${newProject.id}`, JSON.stringify({ nodes: [], edges: [] }));
    };

    const initiateDelete = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (!deleteId) return;

        // Prevent deletion of the Cyber Attack sample case
        // If deleting tutorial, mark it as dismissed
        if (deleteId === 'tutorial-sample-story-v1') {
            localStorage.setItem('tutorial_dismissed', 'true');
        }

        setProjects(prev => {
            const updated = prev.filter(p => p.id !== deleteId);
            localStorage.setItem('mystery_projects', JSON.stringify(updated));
            return updated;
        });
        localStorage.removeItem(`project_data_${deleteId}`);
        setDeleteId(null);
    };

    const openProject = (id) => {
        navigate(`/editor/${id}`);
    };

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <FolderOpen className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Mystery Architect</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                            {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 rounded-full bg-indigo-500"></div>}
                            <span className="text-xs font-medium text-zinc-300">{user?.displayName || "Detective"}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">Case Files</h1>
                        <p className="text-zinc-500 text-sm mt-1">Manage your active investigations</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input type="text" placeholder="Search cases..." className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 text-zinc-300 placeholder:text-zinc-600" />
                        </div>
                        <Button onClick={() => setShowNewModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Case
                        </Button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {projects.map((project) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                                onClick={() => openProject(project.id)}
                                className="group relative cursor-pointer"
                            >
                                <Card className="h-full p-5 hover:border-indigo-500/50 transition-colors bg-gradient-to-tr from-zinc-900 via-zinc-900 to-zinc-900/50 hover:to-indigo-900/10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2 rounded-md bg-zinc-800 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                            <FolderOpen className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400" />
                                        </div>
                                        <div className="dropdown relative">
                                            <button
                                                className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-white relative z-20"
                                                onClick={(e) => initiateDelete(e, project.id)}
                                                title="Delete Project"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">{project.title}</h3>
                                    <p className="text-sm text-zinc-500 mt-2 line-clamp-2 h-10">{project.description}</p>

                                    <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
                                        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                        <div className="flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                                            <Rocket className="w-3 h-3" />
                                            <span>Launch Architect</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty State */}
                    {projects.length === 0 && (
                        <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                                <Plus className="w-6 h-6 text-zinc-600" />
                            </div>
                            <h3 className="text-zinc-400 font-medium">No active cases</h3>
                            <p className="text-zinc-600 text-sm mt-1 max-w-sm mx-auto">Start by creating a new mystery to investigate.</p>
                            <Button variant="outline" className="mt-6" onClick={() => setShowNewModal(true)}>Create Case</Button>
                        </div>
                    )}
                </div>
            </main>

            {/* New Project Modal */}
            {showNewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-white mb-1">Initialize New Case</h2>
                            <p className="text-xs text-zinc-500 mb-6">Define the parameters for your investigation.</p>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label>Case Title</Label>
                                    <Input
                                        placeholder="e.g. The Corporate Espionage"
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Briefing / Description</Label>
                                    <textarea
                                        className="flex w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[80px]"
                                        placeholder="A short summary of the narrative..."
                                        value={newProjectDesc}
                                        onChange={e => setNewProjectDesc(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-8">
                                <Button variant="ghost" onClick={() => setShowNewModal(false)}>Cancel</Button>
                                <Button onClick={createProject} disabled={!newProjectName.trim()}>Initialize</Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4 mx-auto">
                                    <Trash2 className="w-6 h-6 text-red-500" />
                                </div>
                                <h2 className="text-lg font-bold text-white text-center mb-1">Delete Case File?</h2>
                                <p className="text-zinc-500 text-center text-sm mb-6">
                                    Are you sure you want to permanently delete this investigation? This action cannot be undone.
                                </p>

                                <div className="flex items-center justify-center gap-3">
                                    <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
                                    <Button variant="destructive" onClick={confirmDelete}>Delete Forever</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
