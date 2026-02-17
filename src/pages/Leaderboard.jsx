import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import {
    Trophy,
    Medal,
    Target,
    Clock,
    Search,
    ChevronRight,
    ArrowLeft,
    Shield,
    Zap,
    Star,
    LayoutGrid,
    List,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/shared';

const Leaderboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);
    const [users, setUsers] = useState([]);
    const [cases, setCases] = useState([]);
    const [activeTab, setActiveTab] = useState('global'); // 'global' or 'mission'
    const [selectedCaseId, setSelectedCaseId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch All data
                const [resultsSnap, usersSnap, casesSnap] = await Promise.all([
                    getDocs(collection(db, "game_results")),
                    getDocs(collection(db, "users")),
                    getDocs(query(collection(db, "cases"), where("status", "==", "published")))
                ]);

                const resultsData = resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const casesData = casesSnap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(c => {
                        const title = c.title?.trim().toLowerCase();
                        return title && !title.startsWith('untitled');
                    });

                setResults(resultsData);
                setUsers(usersData);
                setCases(casesData);
            } catch (err) {
                console.error("Failed to fetch leaderboard data:", err);
                setMockData();
            } finally {
                setLoading(false);
            }
        };

        const setMockData = () => {
            const mockUsers = [
                { id: '1', displayName: 'Ghost Protocol', email: 'ghost@agency.com', photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
                { id: '2', displayName: 'Cipher King', email: 'cipher@agency.com', photoURL: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
                { id: '3', displayName: 'Shadow Weaver', email: 'shadow@agency.com', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
                { id: '4', displayName: 'Neon Blade', email: 'neon@agency.com', photoURL: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop' },
                { id: '5', displayName: 'Data Phantom', email: 'data@agency.com' }
            ];
            const mockCases = [
                { id: 'c1', title: 'The Digital Insider' },
                { id: 'c2', title: 'Midnight Heist' }
            ];
            const mockResults = [
                { userId: 'ghost@agency.com', score: 4500, timeSpentSeconds: 320, outcome: 'success', caseId: 'c1', caseTitle: 'The Digital Insider', playedAt: new Date().toISOString() },
                { userId: 'cipher@agency.com', score: 4200, timeSpentSeconds: 410, outcome: 'success', caseId: 'c1', caseTitle: 'The Digital Insider', playedAt: new Date().toISOString() },
                { userId: 'shadow@agency.com', score: 3800, timeSpentSeconds: 290, outcome: 'success', caseId: 'c1', caseTitle: 'The Digital Insider', playedAt: new Date().toISOString() },
                { userId: 'neon@agency.com', score: 3100, timeSpentSeconds: 500, outcome: 'success', caseId: 'c2', caseTitle: 'Midnight Heist', playedAt: new Date().toISOString() },
                { userId: 'ghost@agency.com', score: 2900, timeSpentSeconds: 150, outcome: 'success', caseId: 'c2', caseTitle: 'Midnight Heist', playedAt: new Date().toISOString() }
            ];
            setUsers(mockUsers);
            setCases(mockCases);
            setResults(mockResults);
        };

        if (db) {
            fetchData();
        } else {
            setMockData();
            setLoading(false);
        }
    }, []);

    // Aggregation Logic
    const getLeaderboardData = () => {
        let filteredResults = [...results];

        if (selectedCaseId !== 'all') {
            filteredResults = filteredResults.filter(r => r.caseId === selectedCaseId);
        }

        if (activeTab === 'global') {
            // Group by User
            const userStats = {};
            filteredResults.forEach(res => {
                if (!userStats[res.userId]) {
                    const userObj = users.find(u => u.email === res.userId || u.id === res.userId);
                    userStats[res.userId] = {
                        userId: res.userId,
                        displayName: res.userDisplayName || userObj?.displayName || res.userId.split('@')[0],
                        totalScore: 0,
                        missionsCompleted: 0,
                        totalTime: 0,
                        bestScore: 0,
                        photoURL: userObj?.photoURL
                    };
                }
                userStats[res.userId].totalScore += (res.score || 0);
                userStats[res.userId].missionsCompleted += 1;
                userStats[res.userId].totalTime += (res.timeSpentSeconds || 0);
                if ((res.score || 0) > userStats[res.userId].bestScore) {
                    userStats[res.userId].bestScore = res.score;
                }
            });

            return Object.values(userStats)
                .sort((a, b) => b.totalScore - a.totalScore)
                .filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
        } else {
            // Individual Game Results (Hall of Fame)
            return filteredResults
                .sort((a, b) => b.score - a.score)
                .map(res => {
                    const userObj = users.find(u => u.email === res.userId || u.id === res.userId);
                    return {
                        ...res,
                        displayName: res.userDisplayName || userObj?.displayName || res.userId.split('@')[0],
                        photoURL: userObj?.photoURL
                    };
                })
                .filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.caseTitle?.toLowerCase().includes(searchQuery.toLowerCase()));
        }
    };

    const leaderboard = getLeaderboardData();

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_70%)]"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-zinc-800 rounded-full transition-colors group"
                        >
                            <ArrowLeft className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tighter">Agency Leaderboard</h1>
                                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Global Personnel Rankings</p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                        <button
                            onClick={() => setActiveTab('global')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'global' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Global Rankings
                        </button>
                        <button
                            onClick={() => setActiveTab('mission')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'mission' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Hall of Fame
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Agents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all w-48 md:w-64"
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 relative z-10">
                {/* Top 3 Podium (Global only) */}
                {activeTab === 'global' && leaderboard.length >= 3 && !searchQuery && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-end pt-10">
                        {/* 2nd Place */}
                        <PodiumCard
                            agent={leaderboard[1]}
                            rank={2}
                            delay={0.2}
                            color="from-zinc-400 to-zinc-600 shadow-zinc-500/10"
                            icon={<Medal className="w-8 h-8 text-zinc-400" />}
                        />
                        {/* 1st Place */}
                        <PodiumCard
                            agent={leaderboard[0]}
                            rank={1}
                            delay={0.1}
                            featured={true}
                            color="from-yellow-400 to-amber-600 shadow-yellow-500/20"
                            icon={<Trophy className="w-12 h-12 text-yellow-400" />}
                        />
                        {/* 3rd Place */}
                        <PodiumCard
                            agent={leaderboard[2]}
                            rank={3}
                            delay={0.3}
                            color="from-orange-400 to-red-600 shadow-orange-500/10"
                            icon={<Medal className="w-8 h-8 text-orange-400" />}
                        />
                    </div>
                )}

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        <div className="flex items-center gap-2 text-zinc-500 shrink-0">
                            <Filter className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Filter by Mission</span>
                        </div>
                        <select
                            value={selectedCaseId}
                            onChange={(e) => setSelectedCaseId(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors cursor-pointer min-w-[200px]"
                        >
                            <option value="all">All Operations</option>
                            {cases.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-6 text-zinc-400 text-xs font-mono">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span>{leaderboard.length} Agents Logged</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span>Updated Real-time</span>
                        </div>
                    </div>
                </div>

                {/* Main Leaderboard Table */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl blur-2xl opacity-50"></div>
                    <div className="relative bg-zinc-950/80 border border-zinc-800/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                                <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em]">Synchronizing Registry...</p>
                            </div>
                        ) : leaderboard.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-zinc-800 bg-zinc-900/30">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Rank</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Agent Details</th>
                                            {activeTab === 'mission' && (
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Operation</th>
                                            )}
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                                {activeTab === 'global' ? 'Total Pts' : 'Score'}
                                            </th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                                {activeTab === 'global' ? 'Missions' : 'Outcome'}
                                            </th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        <AnimatePresence mode="popLayout">
                                            {leaderboard.map((item, index) => (
                                                <motion.tr
                                                    key={item.id || item.userId}
                                                    layout
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`group hover:bg-white/[0.02] transition-colors ${item.userId === user?.email ? 'bg-purple-900/10' : ''}`}
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-lg font-black font-mono transition-colors ${index < 3 ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                                                                {(index + 1).toString().padStart(2, '0')}
                                                            </span>
                                                            {index < 3 && (
                                                                <div className={`p-1 rounded bg-gradient-to-br ${index === 0 ? 'from-yellow-400 to-amber-600' : index === 1 ? 'from-zinc-400 to-zinc-600' : 'from-orange-400 to-red-600'} opacity-50`}>
                                                                    <Star className="w-3 h-3 text-white fill-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                                                                    {item.photoURL ? (
                                                                        <img src={item.photoURL} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                                                                            {item.displayName?.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {item.userId === user?.email && (
                                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full shadow-lg" title="You"></div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                                                                    {item.displayName}
                                                                </div>
                                                                <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">
                                                                    {item.userId}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {activeTab === 'mission' && (
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <div className="text-sm font-medium text-zinc-300 line-clamp-1">{item.caseTitle}</div>
                                                                <div className="text-[10px] text-zinc-500 font-mono">
                                                                    {new Date(item.playedAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                                <Zap className="w-4 h-4 text-purple-400" />
                                                            </div>
                                                            <span className="text-lg font-black text-white lining-nums">
                                                                {(activeTab === 'global' ? item.totalScore : item.score)?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {activeTab === 'global' ? (
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <div className="text-xs font-bold text-zinc-300">{item.missionsCompleted} Missions</div>
                                                                    <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">Tactical Deployment</div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${item.outcome === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                                {item.outcome === 'success' ? 'Success' : 'Failed'}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center gap-2 text-zinc-300 font-mono text-sm font-bold">
                                                                <Clock className="w-3.5 h-3.5 text-zinc-600" />
                                                                {formatTime(activeTab === 'global' ? item.totalTime : item.timeSpentSeconds)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-32 flex flex-col items-center justify-center gap-6 opacity-40 grayscale">
                                <Shield className="w-20 h-20 text-zinc-600" />
                                <div className="text-center">
                                    <h3 className="text-xl font-bold uppercase tracking-widest">No Intelligence Data</h3>
                                    <p className="text-sm font-mono mt-2">No agents matching these parameters have been logged.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const PodiumCard = ({ agent, rank, delay, featured = false, color, icon }) => {
    if (!agent) return <div className="hidden md:block"></div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.8, ease: "easeOut" }}
            className={`relative group ${featured ? 'order-2 z-20' : rank === 2 ? 'order-1' : 'order-3'}`}
        >
            {/* Background Glow */}
            <div className={`absolute -inset-4 bg-gradient-to-t ${color} rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity`}></div>

            <div className={`relative flex flex-col items-center pt-12 pb-8 px-6 rounded-3xl border ${featured ? 'bg-zinc-900/80 border-purple-500/30 ring-1 ring-purple-500/20 shadow-2xl' : 'bg-zinc-950/60 border-zinc-800'} backdrop-blur-xl group-hover:border-zinc-700 transition-all duration-500`}>

                {/* Avatar with Ring */}
                <div className="relative mb-6">
                    <div className={`absolute -inset-1.5 bg-gradient-to-br ${color} rounded-full blur-sm opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                    <div className="relative w-24 h-24 rounded-full border-4 border-zinc-950 overflow-hidden bg-zinc-800 shadow-2xl">
                        {agent.photoURL ? (
                            <img src={agent.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-black flex items-center justify-center text-4xl font-black text-white">
                                {agent.displayName?.charAt(0)}
                            </div>
                        )}
                    </div>
                    {/* Rank Badge */}
                    <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black shadow-lg border-2 border-zinc-950`}>
                        {rank}
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h3 className={`text-xl font-black uppercase tracking-tight group-hover:text-purple-400 transition-colors ${featured ? 'text-white' : 'text-zinc-300'}`}>
                        {agent.displayName}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 line-clamp-1">{agent.userId}</p>
                </div>

                {/* Main Stat */}
                <div className="w-full space-y-4 mb-4">
                    <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800/50">
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Cumulative Score</div>
                        <div className="text-3xl font-black text-white lining-nums flex items-center justify-center gap-2">
                            <Zap className="w-5 h-5 text-purple-400" />
                            {agent.totalScore.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Sub Stats */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="text-center bg-black/20 rounded-xl py-3 border border-zinc-800/20">
                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Missions</div>
                        <div className="text-lg font-black text-zinc-300">{agent.missionsCompleted}</div>
                    </div>
                    <div className="text-center bg-black/20 rounded-xl py-3 border border-zinc-800/20">
                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Efficiency</div>
                        <div className="text-sm font-black text-zinc-300 mt-1">
                            {Math.round((agent.totalScore / (agent.totalTime || 1)) * 10) / 10} <span className="text-[10px]">P/s</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    {icon}
                </div>
            </div>
        </motion.div>
    );
};

export default Leaderboard;
