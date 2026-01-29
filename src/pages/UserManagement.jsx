import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteField, deleteDoc, setDoc } from "firebase/firestore";
import { Button, Card } from "../components/ui/shared";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../components/ui/table";
import { Shield, ShieldAlert, User, ArrowLeft, MoreHorizontal, Check, X, FolderLock, Lock, Trash2, UserX, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UserManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Case Management State
    const [cases, setCases] = useState([]);
    const [managingUser, setManagingUser] = useState(null);
    const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
    const [tempAssignedIds, setTempAssignedIds] = useState([]);
    const [isCustomAccess, setIsCustomAccess] = useState(false);

    // Only allow access if current user is Admin
    // Note: In a real app, you'd also enforce this with Firestore Rules.
    useEffect(() => {
        if (user && user.role !== 'Admin') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!db) {
                // Mock data if no DB
                setUsers([
                    { id: '1', email: 'admin@agency.com', role: 'Admin', displayName: 'Chief Admin' },
                    { id: '2', email: 'detective@agency.com', role: 'User', displayName: 'Detective Doe' },
                    { id: '3', email: 'rookie@agency.com', role: 'User', displayName: 'Rookie Ray' }
                ]);
                setLoading(false);
                return;
            }

            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const userList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(userList);
            } catch (err) {
                console.error("Error fetching users:", err);
                if (err.code === 'permission-denied') {
                    setError("Access Denied: Check Firestore Security Rules. Loading demo data...");
                } else {
                    setError(`Error: ${err.message}. Loading demo data...`);
                }
                // Fallback to mock data on error so UI is usable
                setUsers([
                    { id: '1', email: 'admin@agency.com', role: 'Admin', displayName: 'Chief Admin (Demo)' },
                    { id: '2', email: 'detective@agency.com', role: 'User', displayName: 'Detective Doe (Demo)' },
                    { id: '3', email: 'rookie@agency.com', role: 'User', displayName: 'Rookie Ray (Demo)' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'Admin') {
            fetchUsers();
        }
    }, [user]);

    // Fetch Cases for the Access Manager
    useEffect(() => {
        const fetchCases = async () => {
            if (!db) {
                // Mock Cases
                setCases([
                    { id: 'c1', title: 'Operation Blackout' },
                    { id: 'c2', title: 'The Vanishing Diamond' }
                ]);
                return;
            }
            try {
                const querySnapshot = await getDocs(collection(db, "cases"));
                setCases(querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })));
            } catch (err) {
                console.error("Error fetching cases:", err);
            }
        };

        if (user?.role === 'Admin') fetchCases();
    }, [user]);

    const handleManageAccess = (targetUser) => {
        setManagingUser(targetUser);
        if (targetUser.assignedCaseIds) {
            setIsCustomAccess(true);
            setTempAssignedIds(targetUser.assignedCaseIds);
        } else {
            setIsCustomAccess(false);
            // Pre-select all just for visual transition if they switch to restricted
            setTempAssignedIds(cases.map(c => c.id));
        }
    };

    const handleSaveAccess = async () => {
        if (!managingUser) return;

        const userId = managingUser.id;

        // Optimistic UI update
        const updatedUser = {
            ...managingUser,
            assignedCaseIds: isCustomAccess ? tempAssignedIds : undefined
        };
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        setManagingUser(null);

        if (!db) return; // Mock mode logic ends here

        try {
            const userRef = doc(db, "users", userId);
            if (!isCustomAccess) {
                await updateDoc(userRef, { assignedCaseIds: deleteField() });
            } else {
                await updateDoc(userRef, { assignedCaseIds: tempAssignedIds });
            }
        } catch (err) {
            console.error("Error updating access:", err);
            setError("Failed to save access settings.");
            // Revert on error would go here
        }
    };

    const toggleCaseAssignment = (caseId) => {
        setTempAssignedIds(prev => {
            if (prev.includes(caseId)) {
                return prev.filter(id => id !== caseId);
            } else {
                return [...prev, caseId];
            }
        });
    };

    const handleRoleChange = async (userId, newRole) => {
        if (!db) {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            return;
        }

        try {
            const userRef = doc(db, "users", userId);
            await setDoc(userRef, { role: newRole }, { merge: true });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error("Error updating role:", err);
            setError("Failed to update user role. Check permissions.");
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const newStatus = (currentStatus === 'deactivated' || currentStatus === 'Deactivated') ? 'active' : 'deactivated';

        if (!db) {
            setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
            return;
        }

        try {
            const userRef = doc(db, "users", userId);
            // Using setDoc with merge: true is safer than updateDoc it ensure the doc exists
            await setDoc(userRef, { status: newStatus }, { merge: true });

            setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));

            // If we deactivated someone, show a brief success indicator
            console.log(`User ${userId} status updated to ${newStatus}`);
        } catch (err) {
            console.error("Error toggling status:", err);
            setError(`Failed to update user status: ${err.message}`);
        }
    };

    const handleRemoveUser = (targetUser) => {
        setConfirmDeleteUser(targetUser);
    };

    const executeRemoveUser = async () => {
        if (!confirmDeleteUser) return;
        const userId = confirmDeleteUser.id;

        if (!db) {
            setUsers(users.filter(u => u.id !== userId));
            setConfirmDeleteUser(null);
            return;
        }

        try {
            await deleteDoc(doc(db, "users", userId));
            setUsers(users.filter(u => u.id !== userId));
            setConfirmDeleteUser(null);
        } catch (err) {
            console.error("Error removing user:", err);
            setError("Failed to remove user record.");
            setConfirmDeleteUser(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading personnel records...</div>;

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
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
                <div className="absolute inset-0 perspective-grid opacity-20"></div>
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                        <h1 className="text-xl font-bold tracking-tight">Admin Console</h1>
                    </div>
                </div>
                <div className="text-sm text-zinc-500 font-mono">
                    ACCESS LEVEL: TOP SECRET
                </div>
            </header>

            <main className="pt-24 px-6 max-w-6xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">User Management</h2>
                    <p className="text-zinc-400">Manage personnel access levels and permissions.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2">
                        <X className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
                    <Table>
                        <TableHeader className="bg-black/40 border-b border-white/5">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-zinc-400 font-bold uppercase text-xs tracking-wider py-4 pl-6">Personnel Email</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-xs tracking-wider py-4">Clearance</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-xs tracking-wider py-4">Status</TableHead>
                                <TableHead className="text-right text-zinc-400 font-bold uppercase text-xs tracking-wider py-4">Access Control</TableHead>
                                <TableHead className="text-right text-zinc-400 font-bold uppercase text-xs tracking-wider py-4 pr-6">Management</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="text-zinc-300 font-mono text-sm py-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-500">
                                                {u.email.charAt(0).toUpperCase()}
                                            </div>
                                            {u.email}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm ${u.role === 'Admin'
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                            }`}>
                                            {u.role === 'Admin' ? <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> : <User className="w-3.5 h-3.5 mr-1.5" />}
                                            {u.role || 'User'}
                                        </span>
                                    </TableCell>

                                    <TableCell className="py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm ${(u.status === 'deactivated' || u.status === 'Deactivated')
                                            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                                            }`}>
                                            {(u.status === 'deactivated' || u.status === 'Deactivated') ? <UserX className="w-3.5 h-3.5 mr-1.5" /> : <UserCheck className="w-3.5 h-3.5 mr-1.5" />}
                                            {(u.status === 'deactivated' || u.status === 'Deactivated') ? 'Deactivated' : 'Active'}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-right w-[160px] py-4">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all font-medium text-xs uppercase tracking-wide border border-transparent hover:border-indigo-500/30"
                                            onClick={() => handleManageAccess(u)}
                                            title="Manage Case Access"
                                        >
                                            <FolderLock className="w-4 h-4 mr-2" />
                                            Case Files
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right w-[240px] py-4 pr-6">
                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {u.role !== 'Admin' ? (
                                                <Button
                                                    size="sm"
                                                    className="bg-red-500/10 hover:bg-red-500/40 text-red-400 border border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
                                                    onClick={() => handleRoleChange(u.id, 'Admin')}
                                                >
                                                    Promote
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-zinc-800 hover:bg-zinc-800 text-zinc-400"
                                                    onClick={() => handleRoleChange(u.id, 'User')}
                                                    disabled={u.id === user.uid}
                                                >
                                                    Demote
                                                </Button>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className={`h-8 w-8 p-0 ${(u.status === 'deactivated' || u.status === 'Deactivated') ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-400 hover:bg-amber-500/10'}`}
                                                onClick={() => handleToggleStatus(u.id, u.status)}
                                                disabled={u.id === user.uid || u.id === user.id}
                                                title={(u.status === 'deactivated' || u.status === 'Deactivated') ? "Activate User" : "Deactivate User"}
                                            >
                                                {(u.status === 'deactivated' || u.status === 'Deactivated') ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleRemoveUser(u)}
                                                disabled={u.id === user.uid || u.id === user.id}
                                                title="Remove User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </main>

            {/* Access Management Modal */}
            {managingUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Manage Case Access</h3>
                                <Button variant="ghost" size="icon" onClick={() => setManagingUser(null)} className="h-8 w-8">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-sm text-zinc-500 mt-1">
                                Configure visible cases for <span className="text-zinc-300 font-mono">{managingUser.email}</span>
                            </p>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 mb-6">
                                <div className="flex items-center gap-2">
                                    {isCustomAccess ? (
                                        <Lock className="w-4 h-4 text-amber-500" />
                                    ) : (
                                        <Shield className="w-4 h-4 text-green-500" />
                                    )}
                                    <span className="text-sm font-medium">
                                        {isCustomAccess ? "Restricted Access" : "All Cases (Default)"}
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setIsCustomAccess(!isCustomAccess)}
                                >
                                    {isCustomAccess ? "Reset to All" : "Customize"}
                                </Button>
                            </div>

                            {isCustomAccess && (
                                <div className="space-y-2">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-3">Select Visible Cases</p>
                                    {cases.length === 0 ? (
                                        <div className="text-center py-4 text-zinc-500 text-sm">No cases available.</div>
                                    ) : (
                                        cases.map(c => (
                                            <div
                                                key={c.id}
                                                className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${tempAssignedIds.includes(c.id)
                                                    ? 'bg-indigo-500/10 border-indigo-500/50'
                                                    : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                                                    }`}
                                                onClick={() => toggleCaseAssignment(c.id)}
                                            >
                                                <span className="text-sm font-medium text-zinc-300 truncate pr-4">{c.title || 'Untitled Case'}</span>
                                                {tempAssignedIds.includes(c.id) && (
                                                    <Check className="w-4 h-4 text-indigo-400" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {!isCustomAccess && (
                                <div className="text-center py-8 text-zinc-500 text-sm">
                                    <p>This user has access to all current and future cases.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setManagingUser(null)}>Cancel</Button>
                            <Button onClick={handleSaveAccess}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteUser && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-zinc-950 border border-red-500/30 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.1)] overflow-hidden">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Purge Personnel Record?</h3>
                            <p className="text-zinc-400 text-sm mb-6">
                                You are about to permanently delete <span className="text-red-400 font-mono font-bold">{confirmDeleteUser.email}</span>. This action is irreversible and will revoke all access immediately.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                    onClick={executeRemoveUser}
                                >
                                    CONFIRM PURGE
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-zinc-500 hover:text-white"
                                    onClick={() => setConfirmDeleteUser(null)}
                                >
                                    Abort Operation
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default UserManagement;
