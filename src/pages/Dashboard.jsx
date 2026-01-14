import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query } from 'firebase/firestore';
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
    const isAdmin = user?.role === 'Admin';

    // Load projects from Firestore
    useEffect(() => {
        if (!db) return;

        const q = query(collection(db, "cases"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedCases = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProjects(loadedCases);
        });

        return () => unsubscribe();
    }, []);

    const createProject = async () => {
        if (!isAdmin) return;

        try {
            const newCaseData = {
                title: newProjectName || 'Untitled Mystery',
                description: newProjectDesc || 'A thrilling case awaiting design.',
                updatedAt: new Date().toISOString(),
                nodeCount: 0,
                status: "draft",
                createdBy: user.email,
                nodes: [],
                edges: []
            };

            await addDoc(collection(db, "cases"), newCaseData);

            setShowNewModal(false);
            setNewProjectName('');
            setNewProjectDesc('');
        } catch (error) {
            console.error("Error creating case:", error);
            alert("Failed to create case. Check console.");
        }
    };

    const generateSampleCase = async (e) => {
        if (e) e.preventDefault();
        console.log("generateSampleCase: Clicked");

        if (!isAdmin) {
            console.log("generateSampleCase: Not admin");
            return;
        }

        // Skipping confirmation to avoid browser blocking issues
        console.log("generateSampleCase: Auto-confirming seed...");

        console.log("generateSampleCase: Attempting to create doc...");
        try {
            // Sample Data Construction (nodes array definition)
            const nodes = [
                {
                    id: 'node-briefing',
                    type: 'story',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'Mission Briefing',
                        content: "URGENT // PRIORITY ALPHA\nLocation: City Power Authority (CPA) HQ\nTime: 08:00 Hours\n\nCommand, we have a catastrophic failure of the city's power grid. Preliminary forensics indicate a sophisticated ransomware strain known as 'DarkPulse'. \n\nThe entry point was internal. Valid credentials were used to bypass the air-gapped protection at 03:22 AM. \n\nWe have detained 5 key personnel who were in the building. You have 30 minutes to identify the insider threat before the backup generators fail and the city descends into chaos.\n\nGood luck, Detective."
                    }
                },
                {
                    id: 'node-hub',
                    type: 'story',
                    position: { x: 400, y: 200 },
                    data: {
                        label: 'Investigation Hub',
                        content: "You are in the main lobby. The 5 suspects are being held in separate holding rooms. The server room is locked down. \n\nReview your leads and interrogate the suspects. Remember, every minute counts."
                    }
                },
                // Suspects
                {
                    id: 'suspect-viktor',
                    type: 'suspect',
                    position: { x: 0, y: 400 },
                    data: {
                        name: 'Viktor Novikov',
                        role: 'SysAdmin',
                        alibi: 'Claims he was sleeping in the server room break area.',
                        description: 'Senior System Administrator. Brilliant but disgruntled. Has been denied a raise three times this year.'
                    }
                },
                {
                    id: 'suspect-sarah',
                    type: 'suspect',
                    position: { x: 200, y: 400 },
                    data: {
                        name: 'Sarah Jenkins',
                        role: 'Lead Developer',
                        alibi: 'Working late on the new UI update.',
                        description: 'Lead Developer for the grid control software. Known for erratic security practices. Often shares passwords.'
                    }
                },
                {
                    id: 'suspect-marcus',
                    type: 'suspect',
                    position: { x: 400, y: 400 },
                    data: {
                        name: 'Marcus Chen',
                        role: 'Network Engineer',
                        alibi: 'In the gym downstairs.',
                        description: 'Network Engineer. Former "Grey Hat" hacker with a record. Hired for his expertise in penetration testing.',
                        isKiller: false
                    }
                },
                {
                    id: 'suspect-elena',
                    type: 'suspect',
                    position: { x: 600, y: 400 },
                    data: {
                        name: 'Elena Petrov',
                        role: 'External Consultant',
                        alibi: 'On a call with overseas clients in the conference room.',
                        description: 'Cybersecurity Consultant. Very professional, highly paid. Rumored to have debts.'
                    }
                },
                {
                    id: 'suspect-halloway',
                    type: 'suspect',
                    position: { x: 800, y: 400 },
                    data: {
                        name: 'Dir. Halloway',
                        role: 'Director of Ops',
                        alibi: 'In his office reviewing quarterly reports.',
                        description: 'Director of Operations. The boss. Under immense pressure due to budget cuts. Living beyond his means.',
                        isKiller: true // The Culprit
                    }
                },
                // Evidence
                {
                    id: 'ev-logs',
                    type: 'evidence',
                    position: { x: 100, y: 600 },
                    data: {
                        label: 'Server Access Logs',
                        description: 'Log file showing a login event at 03:22 AM. User: "ADMIN". Terminal ID: DIR-OFFICE-01.'
                    }
                },
                {
                    id: 'ev-email',
                    type: 'evidence',
                    position: { x: 300, y: 600 },
                    data: {
                        label: 'Phishing Email',
                        description: 'Printout of an email found on Sarah\'s desk. "URGENT: Password Reset Required". The link points to a known malware domain.'
                    }
                },
                {
                    id: 'ev-financials',
                    type: 'evidence',
                    position: { x: 800, y: 700 },
                    data: {
                        label: 'Offshore Accounts',
                        description: 'Encrypted ledger decoded from Halloway\'s private terminal. Shows massive crypto deposits matching the ransomware demand amount.'
                    }
                },
                // Terminal
                {
                    id: 'term-office',
                    type: 'terminal',
                    position: { x: 800, y: 550 },
                    data: {
                        label: 'Director\'s Terminal',
                        prompt: 'Enter override code to access secure files:',
                        command: 'override_auth_alpha'
                    }
                },
                // Logic
                {
                    id: 'logic-check-logs',
                    type: 'logic',
                    position: { x: 600, y: 550 },
                    data: {
                        label: 'Has Logs?',
                        condition: 'ev-logs'
                    }
                }
            ];

            const edges = [
                // Flow to Hub
                { id: 'e1', source: 'node-briefing', target: 'node-hub' },
                { id: 'e2', source: 'node-hub', target: 'suspect-viktor', label: 'Interrogate Viktor' },
                { id: 'e3', source: 'node-hub', target: 'suspect-sarah', label: 'Interrogate Sarah' },
                { id: 'e4', source: 'node-hub', target: 'suspect-marcus', label: 'Interrogate Marcus' },
                { id: 'e5', source: 'node-hub', target: 'suspect-elena', label: 'Interrogate Elena' },
                { id: 'e6', source: 'node-hub', target: 'suspect-halloway', label: 'Interrogate Halloway' },

                // Interactions
                // Viktor -> Logs (He points out the anomaly)
                { id: 'e-vik-logs', source: 'suspect-viktor', target: 'ev-logs', label: 'Ask about the breach time' },
                { id: 'e-logs-back', source: 'ev-logs', target: 'node-hub', label: 'Return to Hub' },

                // Sarah -> Email (She admits mistake)
                { id: 'e-sarah-email', source: 'suspect-sarah', target: 'ev-email', label: 'Ask about recent emails' },
                { id: 'e-email-back', source: 'ev-email', target: 'node-hub', label: 'Return to Hub' },

                // Marcus -> Halloway Hint (He tracked the traffic)
                { id: 'e-marcus-term', source: 'suspect-marcus', target: 'node-hub', label: 'Verify Alibi' }, // Dead end for him but helpful info in text

                // Elena -> Needs Logs to talk
                { id: 'e-elena-logic', source: 'suspect-elena', target: 'logic-check-logs', label: 'Ask about Admin Access' },
                // Logic -> True -> Points to Halloway
                { id: 'e-logic-true', source: 'logic-check-logs', target: 'node-hub', label: 'True', sourceHandle: 'true' },
                { id: 'e-logic-false', source: 'logic-check-logs', target: 'node-hub', label: 'False', sourceHandle: 'false' },

                // Halloway -> Terminal (Need to hack his computer)
                { id: 'e-halloway-term', source: 'suspect-halloway', target: 'term-office', label: 'Inspect Office Computer' },
                // Terminal -> Financials
                { id: 'e-term-fin', source: 'term-office', target: 'ev-financials', label: 'Access Secure Folder' },
                { id: 'e-fin-back', source: 'ev-financials', target: 'node-hub', label: 'Return to Hub' },
            ];

            const sampleCase = {
                title: 'Operation Blackout',
                description: 'Cyber Security Threat: The city grid has been hijacked. Find the insider who installed the DarkPulse ransomware.',
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.email,
                nodeCount: nodes.length,
                nodes: nodes,
                edges: edges,
                meta: {
                    timeLimit: 30
                }
            };

            await addDoc(collection(db, "cases"), sampleCase);
            alert("Success! 'Operation Blackout' has been created.");
        } catch (error) {
            console.error("Seeding failed detailed:", error);
            alert(`Failed to seed case. Error: ${error.message}`);
        }
    };

    const initiateDelete = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId || !isAdmin) return;

        try {
            await deleteDoc(doc(db, "cases", deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting case:", error);
            alert("Failed to delete case.");
        }
    };

    const togglePublish = async (e, project) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAdmin) return;

        const newStatus = project.status === 'published' ? 'draft' : 'published';
        try {
            await updateDoc(doc(db, "cases", project.id), {
                status: newStatus
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const openProject = (id) => {
        if (isAdmin) {
            navigate(`/editor/${id}`);
        } else {
            navigate(`/play/${id}`);
        }
    };

    // Filter projects for view
    const visibleProjects = projects.filter(p => isAdmin || p.status === 'published');

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
                            <span className="text-xs font-medium text-zinc-300">
                                {user?.displayName || "Detective"}
                                {isAdmin && <span className="ml-2 text-indigo-400 font-bold">(Admin)</span>}
                            </span>
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
                        {isAdmin && (
                            <>
                                <Button variant="secondary" onClick={generateSampleCase} type="button">
                                    <Rocket className="w-4 h-4 mr-2" />
                                    Seed Sample
                                </Button>
                                <Button onClick={() => setShowNewModal(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Case
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {visibleProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                                onClick={() => openProject(project.id)}
                                className="group relative cursor-pointer"
                            >
                                <Card className={`h-full p-5 hover:border-indigo-500/50 transition-colors bg-gradient-to-tr from-zinc-900 via-zinc-900 to-zinc-900/50 hover:to-indigo-900/10 ${project.status === 'draft' ? 'border-dashed border-zinc-700 opacity-80' : ''}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-2 rounded-md ${project.status === 'published' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-400'} transition-colors`}>
                                            <FolderOpen className="w-5 h-5" />
                                        </div>
                                        {isAdmin && (
                                            <div className="flex items-center gap-1 relative z-20">
                                                <button
                                                    className={`px-2 py-1 text-xs font-bold rounded uppercase tracking-wider ${project.status === 'published' ? 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                                                    onClick={(e) => togglePublish(e, project)}
                                                    title={project.status === 'published' ? 'Unpublish' : 'Publish to Users'}
                                                >
                                                    {project.status === 'published' ? 'Live' : 'Draft'}
                                                </button>
                                                <button
                                                    className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-red-400"
                                                    onClick={(e) => initiateDelete(e, project.id)}
                                                    title="Delete Project"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                                        {project.title}
                                    </h3>
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
                    {visibleProjects.length === 0 && (
                        <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                                <Plus className="w-6 h-6 text-zinc-600" />
                            </div>
                            <h3 className="text-zinc-400 font-medium">No active cases</h3>
                            <p className="text-zinc-600 text-sm mt-1 max-w-sm mx-auto">
                                {isAdmin ? "Start by creating a new mystery." : "No published cases available yet."}
                            </p>
                            {isAdmin && <Button variant="outline" className="mt-6" onClick={() => setShowNewModal(true)}>Create Case</Button>}
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
