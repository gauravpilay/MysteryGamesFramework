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
                            <Button onClick={() => setShowNewModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Case
                            </Button>
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
