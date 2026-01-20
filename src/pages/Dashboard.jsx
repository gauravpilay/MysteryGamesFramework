import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { Button, Card, Input, Label } from '../components/ui/shared';
import { Logo } from '../components/ui/Logo';
import { Plus, FolderOpen, LogOut, Search, Trash2, Rocket, Copy, Users, BookOpen, Lock, Unlock, Activity, FileText, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ... (imports remain the same)

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null); // State for delete confirmation
    const [duplicateId, setDuplicateId] = useState(null); // State for duplicate confirmation
    const [duplicateName, setDuplicateName] = useState('');
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
            // Sample Data Construction (nodes array definition)
            const nodes = [
                {
                    id: 'node-briefing',
                    type: 'story',
                    position: { x: 400, y: 0 },
                    data: {
                        label: 'Mission Briefing',
                        content: "URGENT // PRIORITY ALPHA\nLocation: City Power Authority (CPA) HQ\nTime: 08:00 Hours\n\nCommand, we have a catastrophic failure of the city's power grid. Preliminary forensics indicate a sophisticated ransomware strain known as 'DarkPulse'. \n\nThe entry point was internal. Valid credentials were used to bypass the air-gapped protection at 03:22 AM. \n\nWe have detained 5 key personnel who were in the building. You have 30 minutes to identify the insider threat before the backup generators fail and the city descends into chaos.\n\nGood luck, Detective."
                    }
                },
                {
                    id: 'node-hub',
                    type: 'story',
                    position: { x: 400, y: 300 },
                    data: {
                        label: 'Investigation Hub',
                        content: "You are in the main lobby. The 5 suspects are being held in separate holding rooms. The server room is locked down. \n\nReview your leads and interrogate the suspects. Remember, every minute counts."
                    }
                },
                // Suspects - Row 1
                {
                    id: 'suspect-viktor',
                    type: 'suspect',
                    position: { x: -100, y: 600 },
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
                    position: { x: 150, y: 600 },
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
                    position: { x: 400, y: 600 },
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
                    position: { x: 650, y: 600 },
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
                    position: { x: 900, y: 600 },
                    data: {
                        name: 'Dir. Halloway',
                        role: 'Director of Ops',
                        alibi: 'In his office reviewing quarterly reports.',
                        description: 'Director of Operations. The boss. Under immense pressure due to budget cuts. Living beyond his means.',
                        isKiller: true // The Culprit
                    }
                },
                // Evidence - Row 2
                {
                    id: 'ev-logs',
                    type: 'evidence',
                    position: { x: -100, y: 900 },
                    data: {
                        label: 'Server Access Logs',
                        description: 'Log file showing a login event at 03:22 AM. User: "ADMIN". Terminal ID: DIR-OFFICE-01.'
                    }
                },
                {
                    id: 'ev-email',
                    type: 'evidence',
                    position: { x: 150, y: 900 },
                    data: {
                        label: 'Phishing Email',
                        description: 'Printout of an email found on Sarah\'s desk. "URGENT: Password Reset Required". The link points to a known malware domain.'
                    }
                },
                // Terminal Chain
                {
                    id: 'term-office',
                    type: 'terminal',
                    position: { x: 900, y: 900 },
                    data: {
                        label: 'Director\'s Terminal',
                        prompt: 'Enter override code to access secure files:',
                        command: 'override_auth_alpha'
                    }
                },
                {
                    id: 'ev-financials',
                    type: 'evidence',
                    position: { x: 900, y: 1200 },
                    data: {
                        label: 'Offshore Accounts',
                        description: 'Encrypted ledger decoded from Halloway\'s private terminal. Shows massive crypto deposits matching the ransomware demand amount.'
                    }
                },
                // Logic
                {
                    id: 'logic-check-logs',
                    type: 'logic',
                    position: { x: 400, y: 900 },
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

    const initiateDuplicate = (e, project) => {
        e.preventDefault();
        e.stopPropagation();
        setDuplicateId(project.id);
        setDuplicateName(`Copy of ${project.title}`);
    };

    const confirmDuplicate = async () => {
        if (!duplicateId || !isAdmin) return;

        try {
            const originalProject = projects.find(p => p.id === duplicateId);
            if (!originalProject) return;

            const newCaseData = {
                ...originalProject,
                title: duplicateName,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft',
            };

            // Remove id if it exists in the object, as addDoc creates a new one
            delete newCaseData.id;

            await addDoc(collection(db, "cases"), newCaseData);
            setDuplicateId(null);
            setDuplicateName('');
        } catch (error) {
            console.error("Error duplicating case:", error);
            alert("Failed to duplicate case.");
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

    const toggleLock = async (e, project) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAdmin) return;

        const newLockStatus = !project.isLocked;
        try {
            await updateDoc(doc(db, "cases", project.id), {
                isLocked: newLockStatus
            });
        } catch (error) {
            console.error("Error updating lock status:", error);
        }
    };

    const openProject = (id) => {
        if (isAdmin) {
            navigate(`/editor/${id}`);
        } else {
            navigate(`/play/${id}`);
        }
    };

    // Filter projects based on user assignment and search query
    const accessibleProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (isAdmin) return true; // Admins always see everything
        if (!user?.assignedCaseIds) return true; // Default is access to all
        return user.assignedCaseIds.includes(p.id);
    });

    const publishedProjects = accessibleProjects.filter(p => p.status === 'published');
    const draftProjects = accessibleProjects.filter(p => p.status !== 'published');

    const ProjectCard = ({ project }) => (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => openProject(project.id)}
            className="group relative cursor-pointer"
        >
            <Card className={`h-full p-6 transition-all duration-500 transform rounded-xl min-h-[220px] flex flex-col border glass-card group-hover:-translate-y-2 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.2)] ${project.status === 'published' ? 'border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-zinc-800 shadow-none'}`}>
                <div className="flex items-start justify-between mb-5">
                    <div className={`p-3 rounded-lg ${project.status === 'published' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'} transition-colors relative`}>
                        <FolderOpen className="w-6 h-6" />
                        {project.isLocked && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border border-black" title="Locked">
                                <Lock className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-2 relative z-20">
                            <button
                                className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider transition-colors ${project.status === 'published' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-amber-500 text-black shadow-lg hover:bg-amber-400'}`}
                                onClick={(e) => togglePublish(e, project)}
                                title={project.status === 'published' ? 'Unpublish' : 'Publish to Users'}
                            >
                                {project.status === 'published' ? 'Live' : 'Draft'}
                            </button>
                            <button
                                className={`p-1.5 rounded-md hover:bg-zinc-800 transition-colors ${project.isLocked ? 'text-red-400' : 'text-zinc-500 hover:text-indigo-400'}`}
                                onClick={(e) => toggleLock(e, project)}
                                title={project.isLocked ? "Unlock Case" : "Lock Case"}
                            >
                                {project.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button
                                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-indigo-400 transition-colors"
                                onClick={(e) => initiateDuplicate(e, project)}
                                title="Duplicate Project"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                            <button
                                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                                onClick={(e) => initiateDelete(e, project.id)}
                                title="Delete Project"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500 group-hover:from-white group-hover:to-zinc-300 transition-all truncate mb-3 tracking-tight">
                    {project.title}
                </h3>

                <p className="text-sm text-zinc-400 leading-relaxed mb-auto line-clamp-3">
                    {project.description}
                </p>

                <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between text-xs font-medium text-zinc-500">
                    <span className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-600">Updated</span>
                        {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <Rocket className="w-3.5 h-3.5" />
                        <span className="uppercase tracking-wider text-[10px] font-bold">Open Case</span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30 relative overflow-x-hidden">
            {/* Background Image & Grid */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Vibrant Background */}
                <div
                    className="absolute right-0 top-0 bottom-0 w-3/4 bg-cover bg-center opacity-40 mix-blend-screen saturate-150 contrast-125 transition-all duration-1000"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2529&auto=format&fit=crop')",
                        maskImage: "linear-gradient(to left, black 10%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to left, black 10%, transparent 100%)"
                    }}
                />

                {/* Electronic Circuits Overlay */}
                <div
                    className="absolute right-0 top-0 bottom-0 w-3/4 bg-cover bg-center opacity-20 mix-blend-color-dodge contrast-150 brightness-150"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1592659762303-90081d34b277?q=80&w=2070&auto=format&fit=crop')",
                        maskImage: "linear-gradient(to left, black 10%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to left, black 10%, transparent 100%)"
                    }}
                />
                {/* Animated Grid Overlay */}
                <div className="absolute inset-0 perspective-grid opacity-20"></div>

                {/* Ambient Glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center">
                            <Logo className="w-9 h-9 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
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
            <main className="container mx-auto px-6 py-10 space-y-12 relative z-10">
                {/* Hero Section */}
                <div className="relative">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-white">
                            Welcome Back, Detective
                        </span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl">
                        Your expertise is required. Review your active case files or initiate a new investigation below. The city is counting on you.
                    </p>
                </div>

                {/* Action Controls & Search Toolbar */}
                <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between gap-6 shadow-xl">
                    <h2 className="text-base font-bold text-zinc-400 uppercase tracking-widest hidden md:block pl-2">
                        Control Center
                    </h2>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search case files..."
                                className="pl-12 pr-6 py-3 bg-black/50 border border-zinc-700 rounded-xl text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-80 transition-all shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {isAdmin && (
                            <>
                                <div className="h-8 w-px bg-zinc-700 mx-2"></div> {/* Vertical Divider */}
                                <Button variant="secondary" onClick={() => navigate('/admin/users')} className="h-11 px-5 text-base">
                                    <Users className="w-5 h-5 mr-2 text-indigo-400" />
                                    Users
                                </Button>
                                <Button variant="secondary" onClick={() => window.open('/USER_MANUAL.pdf', '_blank')} className="h-11 px-5 text-base">
                                    <BookOpen className="w-5 h-5 mr-2 text-indigo-400" />
                                    Manual
                                </Button>
                                <Button onClick={() => setShowNewModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border-none h-11 px-6 text-base font-bold tracking-wide">
                                    <Plus className="w-5 h-5 mr-2" />
                                    New Case
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Separator Line */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                {/* Stats Row */}
                {/* Stats Row - Vibrant & Prominent */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Active Cases - Blue Reactor */}
                    <div className="relative group overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-black/60 p-6 flex items-center gap-6 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity className="w-24 h-24 text-indigo-500" />
                        </div>
                        <div className="p-4 rounded-xl bg-indigo-500/20 text-indigo-400 shadow-inner ring-1 ring-white/10">
                            <Activity className="w-8 h-8" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-1">Active Cases</p>
                            <p className="text-4xl font-extrabold text-white drop-shadow-md">{publishedProjects.length}</p>
                        </div>
                    </div>

                    {/* Draft Files - Amber Data */}
                    <div className="relative group overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/40 to-black/60 p-6 flex items-center gap-6 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileText className="w-24 h-24 text-amber-500" />
                        </div>
                        <div className="p-4 rounded-xl bg-amber-500/20 text-amber-400 shadow-inner ring-1 ring-white/10">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-amber-300 text-sm font-bold uppercase tracking-widest mb-1">Draft Files</p>
                            <p className="text-4xl font-extrabold text-white drop-shadow-md">{draftProjects.length}</p>
                        </div>
                    </div>

                    {/* Total Time - Emerald Timer */}
                    <div className="relative group overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 to-black/60 p-6 flex items-center gap-6 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="w-24 h-24 text-emerald-500" />
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-400 shadow-inner ring-1 ring-white/10">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-emerald-300 text-sm font-bold uppercase tracking-widest mb-1">Total Time</p>
                            <p className="text-4xl font-extrabold text-white drop-shadow-md">
                                {user?.totalTimeLogged ? `${Math.floor(user.totalTimeLogged / 60)}h ${user.totalTimeLogged % 60}m` : '0h 0m'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Separator */}


                {/* Case Directory Header */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    <h2 className="text-xl font-bold text-white tracking-wide">Case Directory</h2>
                </div>

                {/* Published Section */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {publishedProjects.map(p => <ProjectCard key={p.id} project={p} />)}
                        </AnimatePresence>
                        {publishedProjects.length === 0 && (
                            <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
                                <p className="text-zinc-500 text-sm">No live cases currently available.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Drafts Section (Admin Only) */}
                {isAdmin && draftProjects.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-6 border-t border-zinc-800/50 pt-8 mt-12">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <h2 className="text-lg font-bold text-zinc-400 tracking-wide uppercase text-sm">Draft Case Files</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <AnimatePresence>
                                {draftProjects.map(p => <ProjectCard key={p.id} project={p} />)}
                            </AnimatePresence>
                            {draftProjects.length === 0 && (
                                <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
                                    <p className="text-zinc-500 text-sm">No drafts in progress. Start a new case.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}
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

            {/* Duplicate Confirmation Modal */}
            <AnimatePresence>
                {duplicateId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 mb-4 mx-auto">
                                    <Copy className="w-6 h-6 text-indigo-500" />
                                </div>
                                <h2 className="text-lg font-bold text-white text-center mb-1">Duplicate Case File</h2>
                                <p className="text-zinc-500 text-center text-sm mb-6">
                                    Create a copy of this investigation.
                                </p>

                                <div className="space-y-4 mb-6">
                                    <div className="space-y-1">
                                        <Label>New Case Title</Label>
                                        <Input
                                            placeholder="Name of the copy"
                                            value={duplicateName}
                                            onChange={e => setDuplicateName(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-3">
                                    <Button variant="ghost" onClick={() => setDuplicateId(null)}>Cancel</Button>
                                    <Button onClick={confirmDuplicate} disabled={!duplicateName.trim()}>Duplicate Case</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
