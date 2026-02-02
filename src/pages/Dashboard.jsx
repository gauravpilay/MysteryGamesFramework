import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, deleteDoc, updateDoc, setDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button, Card, Input, Label } from '../components/ui/shared';
import { Logo } from '../components/ui/Logo';
import { Plus, FolderOpen, LogOut, Search, Trash2, Rocket, Copy, Users, BookOpen, Lock, Unlock, Activity, FileText, CheckCircle, Clock, TrendingUp, Pencil, Fingerprint, Trophy, AlertTriangle, Package, Image as ImageIcon, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressReportModal from '../components/ProgressReportModal';
import AdminProgressModal from '../components/AdminProgressModal';
import SystemSettingsModal from '../components/SystemSettingsModal';
// import MarketplaceModal from '../components/marketplace/MarketplaceModal';
import { Settings } from 'lucide-react';
import { useConfig } from '../lib/config';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { settings } = useConfig();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showAdminProgressModal, setShowAdminProgressModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    // const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [duplicateId, setDuplicateId] = useState(null);
    const [duplicateName, setDuplicateName] = useState('');
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [lockedProject, setLockedProject] = useState(null);
    const [isRequesting, setIsRequesting] = useState(false);
    const [requestFeedback, setRequestFeedback] = useState(null); // 'accepted' | 'declined' | null
    const [incomingRequest, setIncomingRequest] = useState(null); // { project, request }
    const [imageUploadProject, setImageUploadProject] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const isAdmin = user?.role === 'Admin';

    // Fetch Projects
    useEffect(() => {
        if (!db) {
            // Mock data if no DB
            setProjects([
                { id: 'sample-1', title: 'The Vanishing Protocol', description: 'A high-stakes cyber mystery.', status: 'published', thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', updatedAt: new Date().toISOString() },
                { id: 'sample-2', title: 'Midnight Heist', description: 'Who stole the diamond?', status: 'draft', thumbnail: 'https://images.unsplash.com/photo-1478720568477-152d9b164e63', updatedAt: new Date().toISOString() }
            ]);
            return;
        }

        const q = query(collection(db, "cases"), orderBy("updatedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(docs);
        }, (error) => {
            console.error("Error fetching cases:", error);
        });

        return () => unsubscribe();
    }, [user]);

    // Derived State
    const accessibleProjects = projects.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const publishedProjects = accessibleProjects.filter(p => p.status === 'published');
    const draftProjects = accessibleProjects.filter(p => p.status !== 'published');

    // Handlers
    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;

        const newCase = {
            title: newProjectName,
            description: newProjectDesc,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
            author: user?.email || 'Unknown',
            nodes: [],
            edges: []
        };

        if (db) {
            try {
                const docRef = await addDoc(collection(db, "cases"), newCase);
                navigate(`/editor/${docRef.id}`);
            } catch (e) {
                console.error("Error creating case:", e);
            }
        } else {
            alert("Database not connected. Cannot create.");
        }
        setShowNewModal(false);
    };

    const handleDeleteProject = async () => {
        if (!deleteId || !db) return;
        try {
            await deleteDoc(doc(db, "cases", deleteId));
            setDeleteId(null);
        } catch (e) {
            console.error("Error deleting:", e);
        }
    };

    const handleDuplicateProject = async () => {
        if (!duplicateId || !duplicateName || !db) return;
        const original = projects.find(p => p.id === duplicateId);
        if (!original) return;

        const newCase = {
            ...original,
            title: duplicateName,
            status: 'draft',
            updatedAt: new Date().toISOString()
        };
        delete newCase.id; // Ensure ID is not passed to addDoc to generate a new one

        try {
            await addDoc(collection(db, "cases"), newCase);
            setDuplicateId(null);
            setDuplicateName('');
        } catch (e) {
            console.error("Error duplicating:", e);
        }
    };

    const handleToggleStatus = async (project) => {
        if (!db) return;

        // Check for active lock
        if (project.editingBy && project.editingBy.uid !== user?.uid) {
            const now = Date.now();
            const lastActive = new Date(project.editingBy.timestamp).getTime();
            if (now - lastActive < 60000) { // 1 minute timeout
                setLockedProject(project);
                return;
            }
        }

        const newStatus = project.status === 'published' ? 'draft' : 'published';
        try {
            await setDoc(doc(db, "cases", project.id), { status: newStatus }, { merge: true });
        } catch (e) {
            console.error("Status update failed:", e);
        }
    };

    const handleEditProject = (project) => {
        if (project.editingBy && project.editingBy.uid !== user?.uid) {
            const now = Date.now();
            const lastActive = new Date(project.editingBy.timestamp).getTime();
            if (now - lastActive < 60000) { // 1 minute timeout
                setLockedProject(project);
                return;
            }
        }
        navigate(`/editor/${project.id}`);
    };

    const handleRequestAccess = async () => {
        if (!db || !lockedProject || !user) return;
        setIsRequesting(true);
        try {
            const docRef = doc(db, "cases", lockedProject.id);
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

    const handleAcceptRequest = async (project, request) => {
        if (!db || !project || !request) return;
        try {
            const docRef = doc(db, "cases", project.id);
            await setDoc(docRef, {
                editingBy: null,
                accessRequest: {
                    ...request,
                    status: 'accepted'
                }
            }, { merge: true });
            setIncomingRequest(null);
        } catch (err) {
            console.error("Failed to accept request", err);
        }
    };

    const handleDeclineRequest = async (project, request) => {
        if (!db || !project || !request) return;
        try {
            const docRef = doc(db, "cases", project.id);
            await setDoc(docRef, {
                accessRequest: {
                    ...request,
                    status: 'declined'
                }
            }, { merge: true });
            setIncomingRequest(null);
        } catch (err) {
            console.error("Failed to decline request", err);
        }
    };

    const handleImageUpload = async (projectId, file) => {
        if (!file || !storage || !db) return;

        setUploadingImage(true);
        try {
            // Create a reference to the storage location
            const storageRef = ref(storage, `case-images/${projectId}/${file.name}`);

            // Upload the file
            await uploadBytes(storageRef, file);

            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);

            // Update the Firestore document
            await setDoc(doc(db, "cases", projectId), {
                thumbnail: downloadURL,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            setImageUploadProject(null);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploadingImage(false);
        }
    };

    // Monitor access request feedback and incoming requests
    useEffect(() => {
        if (!user || !projects.length) return;

        // 1. Handle outgoing request feedback (we are the requester)
        if (lockedProject) {
            const currentProject = projects.find(p => p.id === lockedProject.id);
            if (currentProject) {
                if (currentProject.accessRequest && currentProject.accessRequest.uid === user.uid) {
                    if (currentProject.accessRequest.status === 'accepted') {
                        setRequestFeedback('accepted');
                        setDoc(doc(db, "cases", currentProject.id), { accessRequest: null }, { merge: true }).catch(() => { });
                        setTimeout(() => {
                            setRequestFeedback(null);
                            setLockedProject(null);
                            navigate(`/editor/${currentProject.id}`);
                        }, 2000);
                    } else if (currentProject.accessRequest.status === 'declined') {
                        setRequestFeedback('declined');
                        setIsRequesting(false);
                        setTimeout(() => {
                            setDoc(doc(db, "cases", currentProject.id), { accessRequest: null }, { merge: true }).catch(() => { });
                            setRequestFeedback(null);
                        }, 5000);
                    }
                } else if (!currentProject.accessRequest && isRequesting) {
                    setIsRequesting(false);
                }
            }
        }

        // 2. Handle incoming requests (we are the lock holder)
        const projectWithRequest = projects.find(p =>
            p.editingBy?.uid === user.uid &&
            p.accessRequest?.status === 'pending'
        );

        if (projectWithRequest) {
            setIncomingRequest({ project: projectWithRequest, request: projectWithRequest.accessRequest });
        } else {
            setIncomingRequest(null);
        }
    }, [projects, lockedProject, user, isRequesting, navigate]);

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30 relative overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute right-0 top-0 bottom-0 w-3/4 bg-cover bg-center opacity-40 mix-blend-screen saturate-150 contrast-125 transition-all duration-1000"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2529&auto=format&fit=crop')",
                        maskImage: "linear-gradient(to left, black 10%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to left, black 10%, transparent 100%)"
                    }}
                />
                <div
                    className="absolute right-0 top-0 bottom-0 w-3/4 bg-cover bg-center opacity-20 mix-blend-color-dodge contrast-150 brightness-150"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1592659762303-90081d34b277?q=80&w=2070&auto=format&fit=crop')",
                        maskImage: "linear-gradient(to left, black 10%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to left, black 10%, transparent 100%)"
                    }}
                />
                <div className="absolute inset-0 perspective-grid opacity-20"></div>
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
                        <span className="font-bold text-lg tracking-tight">{settings.systemName || 'Mystery Architect'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            className="text-zinc-400 hover:text-white flex items-center gap-2"
                            onClick={() => setShowProgressModal(true)}
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span className="hidden md:inline">My Progress</span>
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-zinc-400 hover:text-white flex items-center gap-2"
                            onClick={() => navigate('/leaderboard')}
                        >
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="hidden md:inline">Leaderboard</span>
                        </Button>
                        {/* Marketplace feature temporarily hidden */}
                        {/* <Button
                            variant="ghost"
                            className="text-zinc-400 hover:text-white flex items-center gap-2"
                            onClick={() => setShowMarketplaceModal(true)}
                        >
                            <Package className="w-4 h-4 text-indigo-400" />
                            <span className="hidden md:inline">Marketplace</span>
                        </Button> */}
                        {isAdmin && (
                            <>
                                <Button
                                    variant="ghost"
                                    className="text-zinc-400 hover:text-white flex items-center gap-2"
                                    onClick={() => setShowAdminProgressModal(true)}
                                >
                                    <Users className="w-4 h-4 text-purple-400" />
                                    <span className="hidden md:inline">Users Progress</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-zinc-400 hover:text-white flex items-center gap-2"
                                    onClick={() => setShowSettingsModal(true)}
                                >
                                    <Settings className="w-4 h-4 text-indigo-400" />
                                    <span className="hidden md:inline">Settings</span>
                                </Button>
                            </>
                        )}
                        <div className="h-4 w-px bg-zinc-700"></div>
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

            <main className="container mx-auto px-6 py-10 space-y-12 relative z-10">
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

                {/* Command Center Console */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-zinc-900/60 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                        {/* Top Bar Decoration */}
                        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50"></div>

                        <div className="p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6 w-full lg:w-auto">
                                <div className="hidden sm:flex flex-col">
                                    <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Command Console</h2>
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        SYSTEM READY
                                    </div>
                                </div>

                                <div className="h-10 w-px bg-zinc-800 hidden sm:block"></div>

                                <div className="relative flex-1 lg:w-80 group/search">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/search:text-indigo-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Filter Intelligence Files..."
                                        className="w-full pl-11 pr-4 py-2.5 bg-black/40 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                                {isAdmin && (
                                    <>
                                        <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                                            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')} className="h-9 px-4 text-xs font-bold hover:bg-white/5">
                                                <Users className="w-3.5 h-3.5 mr-2 text-indigo-400" /> Personnel
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => window.open('/USER_MANUAL.pdf', '_blank')} className="h-9 px-4 text-xs font-bold hover:bg-white/5">
                                                <BookOpen className="w-3.5 h-3.5 mr-2 text-indigo-400" /> Manual
                                            </Button>
                                        </div>
                                        <div className="h-6 w-px bg-zinc-800 mx-1 hidden lg:block"></div>
                                        <Button
                                            onClick={() => setShowNewModal(true)}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 border-none h-10 px-6 text-sm font-bold tracking-wide shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Open New Case
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                {/* Published Cases */}
                <div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        Available Missions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {publishedProjects.length > 0 ? publishedProjects.map(project => (
                            <CaseCard
                                key={project.id}
                                project={project}
                                isAdmin={isAdmin}
                                onPlay={() => navigate(`/play/${project.id}`)}
                                onEdit={() => handleEditProject(project)}
                                onDelete={() => setDeleteId(project.id)}
                                onDuplicate={() => { setDuplicateId(project.id); setDuplicateName(`${project.title} (Copy)`); }}
                                onToggleStatus={() => handleToggleStatus(project)}
                                onUploadImage={() => setImageUploadProject(project)}
                            />
                        )) : (
                            <p className="col-span-full text-zinc-500 italic">No active missions available.</p>
                        )}
                    </div>
                </div>

                {/* Draft Cases (Admin) */}
                {isAdmin && (
                    <div className='pt-8'>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-zinc-500" />
                            Draft Files
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {draftProjects.length > 0 ? draftProjects.map(project => (
                                <CaseCard
                                    key={project.id}
                                    project={project}
                                    isAdmin={isAdmin}
                                    onPlay={() => navigate(`/play/${project.id}`)}
                                    onEdit={() => handleEditProject(project)}
                                    onDelete={() => setDeleteId(project.id)}
                                    onDuplicate={() => { setDuplicateId(project.id); setDuplicateName(`${project.title} (Copy)`); }}
                                    onToggleStatus={() => handleToggleStatus(project)}
                                    onUploadImage={() => setImageUploadProject(project)}
                                />
                            )) : (
                                <p className="col-span-full text-zinc-500 italic">No drafts in progress.</p>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            <AnimatePresence>
                {showNewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-4 text-white">Initialize New Case By</h2>
                            <div className="space-y-4">
                                <div>
                                    <Label>Case Codename</Label>
                                    <Input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g. Operation Blackout" className="mt-1" />
                                </div>
                                <div>
                                    <Label>Briefing Notes</Label>
                                    <Input value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Brief description..." className="mt-1" />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button variant="ghost" onClick={() => setShowNewModal(false)}>Cancel</Button>
                                    <Button onClick={handleCreateProject} disabled={!newProjectName}>Create File</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-sm bg-zinc-900 border border-red-900/50 rounded-xl p-6 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-2 text-white flex items-center gap-2">
                                <Trash2 className="text-red-500" /> Confirm Deletion
                            </h2>
                            <p className="text-zinc-400 mb-6">Are you sure you want to permanently delete this case file? This action cannot be undone.</p>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteProject}>Delete Forever</Button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {duplicateId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-4 text-white">Duplicate Case File</h2>
                            <div className="space-y-4">
                                <div>
                                    <Label>New Case Name</Label>
                                    <Input value={duplicateName} onChange={e => setDuplicateName(e.target.value)} className="mt-1" />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button variant="ghost" onClick={() => setDuplicateId(null)}>Cancel</Button>
                                    <Button onClick={handleDuplicateProject}>Duplicate</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {lockedProject && (() => {
                    const currentProject = projects.find(p => p.id === lockedProject.id) || lockedProject;
                    if (!currentProject.editingBy) return null;

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-zinc-950 border border-indigo-500/30 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(79,70,229,0.2)] text-center relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
                                        {currentProject.editingBy.photoURL ? (
                                            <img
                                                src={currentProject.editingBy.photoURL}
                                                alt={currentProject.editingBy.displayName}
                                                className="relative w-24 h-24 rounded-2xl border-2 border-indigo-500/50 object-cover shadow-2xl"
                                            />
                                        ) : (
                                            <div className="relative w-24 h-24 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center">
                                                <Users className="w-10 h-10 text-indigo-400" />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-full border-4 border-zinc-950 flex items-center justify-center shadow-lg">
                                            <Lock className="w-4 h-4 text-black" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Personnel on Site</span>
                                            <h2 className="text-3xl font-black text-white tracking-tighter">
                                                {(() => {
                                                    const name = currentProject.editingBy.displayName || "";
                                                    const emailPart = currentProject.editingBy.email?.split('@')[0] || "";
                                                    // If displayName is generic or missing, use email
                                                    const bestName = (name && name !== 'Detective') ? name : (emailPart || 'Detective');
                                                    return bestName.split(' ')[0];
                                                })()}
                                            </h2>
                                        </div>
                                        <p className="text-zinc-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                                            Detective <span className="text-zinc-200 font-bold">{currentProject.editingBy.displayName || currentProject.editingBy.email?.split('@')[0] || 'another agent'}</span> is currently re-writing this case history. To prevent parallel dimensions (and data loss), please wait for their departure.
                                        </p>
                                    </div>

                                    <div className="w-full h-px bg-zinc-800/50"></div>

                                    <div className="flex flex-col gap-3 w-full">
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/5 py-2.5 rounded-xl border border-emerald-500/10 uppercase tracking-widest">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Transmission Active
                                        </div>

                                        <div className="flex flex-col gap-2 w-full mt-2">
                                            {requestFeedback === 'declined' ? (
                                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">
                                                    Access Request Declined
                                                </div>
                                            ) : requestFeedback === 'accepted' ? (
                                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold">
                                                    Access Granted! Redirecting...
                                                </div>
                                            ) : isRequesting ? (
                                                <div className="flex items-center justify-center gap-3 w-full h-12 bg-white/5 rounded-xl border border-white/10 text-zinc-400 text-sm font-bold animate-pulse">
                                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                    Waiting for Response...
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={handleRequestAccess}
                                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-xl transition-all active:scale-95 shadow-xl"
                                                >
                                                    Request Access
                                                </Button>
                                            )}
                                        </div>

                                        <Button
                                            onClick={() => { setLockedProject(null); setIsRequesting(false); }}
                                            variant="ghost"
                                            className="w-full text-zinc-500 hover:text-white hover:bg-white/5 font-medium h-10 rounded-xl"
                                        >
                                            Understood, Detective
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}

                {showProgressModal && (
                    <ProgressReportModal onClose={() => setShowProgressModal(false)} />
                )}

                {showAdminProgressModal && isAdmin && (
                    <AdminProgressModal onClose={() => setShowAdminProgressModal(false)} />
                )}

                {showSettingsModal && isAdmin && (
                    <SystemSettingsModal onClose={() => setShowSettingsModal(false)} />
                )}

                {/* Marketplace modal temporarily hidden */}
                {/* {showMarketplaceModal && (
                    <MarketplaceModal
                        isOpen={showMarketplaceModal}
                        onClose={() => setShowMarketplaceModal(false)}
                        currentUser={user}
                    />
                )} */}

                {/* Incoming Access Request Modal */}
                {incomingRequest && (
                    <div className="fixed inset-0 z-[300] flex items-end justify-center p-6 md:items-center pointer-events-none">
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-zinc-950 border border-indigo-500/50 p-6 rounded-2xl max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] pointer-events-auto"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                    <Users className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">Access Requested</h3>
                                    <p className="text-zinc-400 text-xs leading-relaxed mt-1">
                                        <span className="text-indigo-400 font-bold">{incomingRequest.request.displayName}</span> is requesting permission to edit <span className="text-white font-bold">{incomingRequest.project.title}</span>.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleDeclineRequest(incomingRequest.project, incomingRequest.request)}
                                    variant="ghost"
                                    className="flex-1 text-zinc-500 hover:text-white hover:bg-white/5 font-bold rounded-xl"
                                >
                                    Decline
                                </Button>
                                <Button
                                    onClick={() => handleAcceptRequest(incomingRequest.project, incomingRequest.request)}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                                >
                                    Accept & Release
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Image Upload Modal */}
                {imageUploadProject && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-indigo-400" />
                                Upload Case Image
                            </h2>
                            <p className="text-sm text-zinc-400 mb-4">
                                Upload a custom image for <span className="text-white font-bold">{imageUploadProject.title}</span>
                            </p>
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="case-image-upload"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleImageUpload(imageUploadProject.id, file);
                                            }
                                        }}
                                        disabled={uploadingImage}
                                    />
                                    <label
                                        htmlFor="case-image-upload"
                                        className="flex flex-col items-center justify-center cursor-pointer"
                                    >
                                        <Upload className="w-12 h-12 text-zinc-500 mb-3" />
                                        <span className="text-sm font-bold text-white mb-1">
                                            {uploadingImage ? 'Uploading...' : 'Click to upload'}
                                        </span>
                                        <span className="text-xs text-zinc-500">
                                            PNG, JPG, GIF up to 10MB
                                        </span>
                                    </label>
                                </div>
                                {imageUploadProject.thumbnail && (
                                    <div className="relative">
                                        <p className="text-xs text-zinc-500 mb-2">Current Image:</p>
                                        <img
                                            src={imageUploadProject.thumbnail}
                                            alt="Current thumbnail"
                                            className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                                        />
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setImageUploadProject(null)}
                                        disabled={uploadingImage}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CaseCard = ({ project, isAdmin, onPlay, onEdit, onDelete, onDuplicate, onToggleStatus, onUploadImage }) => {
    // Deterministic gradient based on project ID
    const getGradient = (id) => {
        const variants = [
            "from-indigo-900 via-purple-900 to-black",
            "from-emerald-900 via-teal-900 to-black",
            "from-amber-900 via-orange-900 to-black",
            "from-rose-900 via-pink-900 to-black",
            "from-cyan-900 via-blue-900 to-black"
        ];
        // Simple hash to pick a stable variant
        const idx = (id || "default").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % variants.length;
        return variants[idx];
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.15)] flex flex-col"
        >
            <div className={`h-56 bg-zinc-800 relative overflow-hidden`}>
                {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getGradient(project.id)} relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                        <span className="text-6xl font-black text-white/10 tracking-tighter select-none scale-150 transform group-hover:scale-125 transition-transform duration-700">
                            {project.title.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                    </div>
                )}

                {project.editingBy && (Date.now() - new Date(project.editingBy.timestamp).getTime() < 60000) && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 bg-indigo-500/20 backdrop-blur-md rounded-lg border border-indigo-500/30 shadow-lg animate-in fade-in slide-in-from-left-2 duration-500">
                        <div className="relative">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <div className="absolute inset-0 bg-emerald-500/50 rounded-full animate-ping"></div>
                        </div>
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                            In Use: {(project.editingBy.displayName && project.editingBy.displayName !== 'Detective') ? project.editingBy.displayName.split(' ')[0] : (project.editingBy.email?.split('@')[0] || 'Active')}
                        </span>
                    </div>
                )}

                {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-2 items-center">
                        <button
                            onClick={(e) => { e.stopPropagation(); onUploadImage(); }}
                            className="p-1.5 rounded-lg backdrop-blur-md border shadow-sm bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-indigo-400 transition-all group/upload"
                            title="Upload Case Image"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded backdrop-blur-md border shadow-sm ${project.status === 'published' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-black/40 border-zinc-700 text-zinc-400'}`}>
                            {project.status === 'published' ? 'Live' : 'Draft'}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); onToggleStatus(); }} className={`p-1.5 rounded-lg backdrop-blur-md border shadow-sm ${project.status === 'published' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30' : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'} transition-all`} title={project.status === 'published' ? "Case is Locked (Live). Click to Unlock." : "Case is Unlocked (Draft). Click to Lock."}>
                            {project.status === 'published' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">{project.title}</h3>
                <p className="text-sm text-zinc-300 leading-relaxed line-clamp-4 mb-4 flex-1">{project.description || "No briefing available."}</p>

                {/* Status Bar */}
                <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4 border-t border-zinc-800 pt-3">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    {project.status === 'published' && (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                            <Activity className="w-3.5 h-3.5" />
                            <span>Active Mission</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-auto">
                    <Button onClick={onPlay} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-900/20">
                        <Rocket className="w-4 h-4 mr-2" /> Play
                    </Button>
                    {isAdmin && (
                        <>
                            <div className="relative group/tooltip">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={onEdit}
                                    disabled={project.status === 'published'}
                                    className={project.status === 'published' ? "opacity-50 cursor-not-allowed bg-zinc-900/50" : "hover:text-indigo-400"}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                {project.status === 'published' && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300 rounded shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        Case is Live. <span className="text-indigo-400 font-bold">Unlock</span> above to edit.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900"></div>
                                    </div>
                                )}
                            </div>
                            <Button variant="secondary" size="icon" onClick={onDuplicate} title="Duplicate">
                                <Copy className="w-4 h-4" />
                            </Button>
                            <div className="relative group/tooltip">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onDelete}
                                    disabled={project.status === 'published'}
                                    className={project.status === 'published' ? "opacity-30 cursor-not-allowed" : "text-zinc-500 hover:text-red-400 hover:bg-red-950/30"}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                {project.status === 'published' && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300 rounded shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        Case is Live. <span className="text-indigo-400 font-bold">Unlock</span> above to delete.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900"></div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
