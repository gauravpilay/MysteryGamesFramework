import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { Button, Card } from "../components/ui/shared";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../components/ui/table";
import { Shield, ShieldAlert, User, ArrowLeft, MoreHorizontal, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UserManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    const handleRoleChange = async (userId, newRole) => {
        if (!db) {
            // Mock update
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            return;
        }

        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { role: newRole });
            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error("Error updating role:", err);
            setError("Failed to update user role.");
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading personnel records...</div>;

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30">
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

                <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                            <TableRow>
                                <TableHead className="text-zinc-400">Email</TableHead>
                                <TableHead className="text-zinc-400">Current Role</TableHead>
                                <TableHead className="text-right text-zinc-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40">
                                    <TableCell className="text-zinc-400 font-mono text-sm">
                                        {u.email}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${u.role === 'Admin'
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                            }`}>
                                            {u.role === 'Admin' ? <ShieldAlert className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                                            {u.role || 'User'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {u.role !== 'Admin' ? (
                                                <Button
                                                    size="sm"
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/50"
                                                    onClick={() => handleRoleChange(u.id, 'Admin')}
                                                >
                                                    Promote to Admin
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                                    onClick={() => handleRoleChange(u.id, 'User')}
                                                    disabled={u.id === user.uid} // Prevent self, demotion logic if needed
                                                >
                                                    Demote to User
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </main>
        </div>
    );
};

export default UserManagement;
