import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Button, Card, Input, cn } from "../components/ui/shared";
import {
    BarChart,
    MessageSquare,
    Star,
    Download,
    ArrowLeft,
    Filter,
    Calendar,
    ChevronRight,
    ChevronDown,
    Search,
    ThumbsUp,
    AlertTriangle,
    Target,
    Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const FeedbackReports = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [selectedCaseId, setSelectedCaseId] = useState("");
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    // Only allow access if user is Admin
    useEffect(() => {
        if (user && user.role !== 'Admin') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchCases = async () => {
            if (!db) {
                setCases([{ id: "demo-1", title: "The Digital Heist" }]);
                setLoading(false);
                return;
            }
            try {
                const querySnapshot = await getDocs(collection(db, "cases"));
                const casesList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title || "Untitled Mission",
                        hasTitle: !!data.title,
                        createdAt: data.createdAt || data.updatedAt || null
                    };
                }).filter(c => c.hasTitle && !c.title.trim().toLowerCase().startsWith('untitled')) // Only show missions that have a proper title and are not untitled
                    .sort((a, b) => a.title.localeCompare(b.title));

                setCases(casesList);
                if (casesList.length > 0) {
                    setSelectedCaseId(casesList[0].id);
                }
            } catch (err) {
                console.error("Error fetching cases:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCases();
    }, []);

    // Handle clicking outside the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCases = cases.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const fetchFeedback = async () => {
            if (!selectedCaseId) return;
            setLoading(true);

            if (!db) {
                // Generate demo feedback
                const demoFeedback = [
                    { rating: 5, difficulty: 'Challenging', engagement: 'Immersive', comments: 'Amazing game!', userDisplayName: 'Detective Alice', timestamp: new Date().toISOString() },
                    { rating: 4, difficulty: 'Balanced', engagement: 'Immersive', comments: 'Really liked the twist.', userDisplayName: 'Rookie Bob', timestamp: new Date().toISOString() },
                    { rating: 3, difficulty: 'Too Easy', engagement: 'Good', comments: 'A bit fast.', userDisplayName: 'Agent Smith', timestamp: new Date().toISOString() }
                ];
                setFeedbackList(demoFeedback);
                calculateStats(demoFeedback);
                setLoading(false);
                return;
            }

            try {
                const q = query(
                    collection(db, "game_feedback"),
                    where("caseId", "==", selectedCaseId),
                    orderBy("timestamp", "desc")
                );
                const querySnapshot = await getDocs(q);
                const feedbacks = querySnapshot.docs.map(doc => doc.data());
                setFeedbackList(feedbacks);
                calculateStats(feedbacks);
            } catch (err) {
                console.error("Error fetching feedback:", err);
                // Try without orderBy if index doesn't exist yet
                try {
                    const q2 = query(
                        collection(db, "game_feedback"),
                        where("caseId", "==", selectedCaseId)
                    );
                    const querySnapshot2 = await getDocs(q2);
                    const feedbacks2 = querySnapshot2.docs.map(doc => doc.data())
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    setFeedbackList(feedbacks2);
                    calculateStats(feedbacks2);
                } catch (err2) {
                    console.error("Fallback fetch failed:", err2);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, [selectedCaseId]);

    const calculateStats = (feedbacks) => {
        if (feedbacks.length === 0) {
            setStats(null);
            return;
        }

        const totalRating = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
        const avgRating = totalRating / feedbacks.length;

        const difficultyCounts = feedbacks.reduce((acc, f) => {
            acc[f.difficulty] = (acc[f.difficulty] || 0) + 1;
            return acc;
        }, {});

        const engagementCounts = feedbacks.reduce((acc, f) => {
            acc[f.engagement] = (acc[f.engagement] || 0) + 1;
            return acc;
        }, {});

        setStats({
            avgRating,
            count: feedbacks.length,
            difficultyCounts,
            engagementCounts
        });
    };

    const exportPDF = () => {
        const selectedCase = cases.find(c => c.id === selectedCaseId);
        const doc = new jsPDF();

        // Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("INTELLIGENCE REPORT: MISSION FEEDBACK", 14, 20);
        doc.setFontSize(12);
        doc.text(`Mission: ${selectedCase?.title || "Unknown"}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

        // Stats Box
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(14, 50, 180, 40, 3, 3, 'FD');

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Executive Summary", 20, 60);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Total Field Reports: ${stats?.count || 0}`, 20, 70);
        doc.text(`Average Rating: ${stats?.avgRating?.toFixed(1) || 0} / 5.0 Stars`, 20, 80);

        // Feedback Table
        autoTable(doc, {
            startY: 100,
            head: [['Personnel', 'Rating', 'Difficulty', 'Engagement', 'Comments']],
            body: feedbackList.map(f => [
                f.userDisplayName || 'Anonymous',
                f.rating + ' Stars',
                f.difficulty || 'N/A',
                f.engagement || 'N/A',
                f.comments || '-'
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`Mission_Feedback_${selectedCase?.title.replace(/\s+/g, '_')}.pdf`);
    };

    const selectedCase = cases.find(c => c.id === selectedCaseId);

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-600/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/admin/users')} className="hover:bg-zinc-900">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Admin Console
                    </Button>
                    <div className="h-6 w-px bg-zinc-800 hidden md:block" />
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-indigo-500" />
                        <h1 className="text-xl font-bold tracking-tight">Mission Feedback Reports</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Searchable Mission Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm font-medium hover:border-zinc-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64 text-left"
                        >
                            <span className="truncate">{selectedCase?.title || "Select Mission"}</span>
                            <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[60] backdrop-blur-xl"
                                >
                                    <div className="p-3 border-b border-zinc-800">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search missions..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                                        {filteredCases.length > 0 ? (
                                            filteredCases.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        setSelectedCaseId(c.id);
                                                        setIsDropdownOpen(false);
                                                        setSearchQuery("");
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                                                        selectedCaseId === c.id
                                                            ? "bg-indigo-600/20 text-indigo-400 font-bold"
                                                            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                                    )}
                                                >
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="truncate">{c.title}</span>
                                                        {!c.hasTitle && c.createdAt && (
                                                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                                                AUTO-GENERATED: {new Date(c.createdAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {selectedCaseId === c.id && <Check className="w-4 h-4 shrink-0" />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-zinc-600 text-sm">
                                                No missions found
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Button
                        disabled={!stats}
                        onClick={exportPDF}
                        className="bg-zinc-100 text-black hover:bg-white font-bold"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Intelligence
                    </Button>
                </div>
            </header>

            <main className="pt-24 px-6 pb-12 max-w-7xl mx-auto relative z-10">
                {!selectedCaseId ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                        <Search className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a mission to view feedback reports.</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p className="text-zinc-500 font-mono tracking-widest animate-pulse">DECRYPTING REPORTS...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                label="Average Rating"
                                value={`${stats?.avgRating?.toFixed(1) || 0} Stars`}
                                icon={<Star className="text-amber-400" />}
                                subtext={`${stats?.count || 0} Responses`}
                                color="amber"
                            />
                            <StatCard
                                label="Highest Sentiment"
                                value={stats ? Object.entries(stats.engagementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A' : 'N/A'}
                                icon={<ThumbsUp className="text-emerald-400" />}
                                subtext="Engagement Primary"
                                color="emerald"
                            />
                            <StatCard
                                label="Difficulty Mode"
                                value={stats ? Object.entries(stats.difficultyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A' : 'N/A'}
                                icon={<Target className="text-indigo-400" />}
                                subtext="Most Reported Level"
                                color="indigo"
                            />
                            <StatCard
                                label="Report Status"
                                value={stats?.count > 0 ? "Analyzed" : "No Data"}
                                icon={<Calendar className="text-fuchsia-400" />}
                                subtext={`As of ${new Date().toLocaleDateString()}`}
                                color="fuchsia"
                            />
                        </div>

                        {/* Distribution Charts (Custom CSS Implementation) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="p-8 bg-zinc-900/40 border-zinc-800">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-indigo-500" />
                                    Difficulty Distribution
                                </h3>
                                <div className="space-y-6">
                                    {['Too Easy', 'Balanced', 'Challenging', 'Extreme'].map(label => {
                                        const count = stats?.difficultyCounts[label] || 0;
                                        const percentage = stats ? (count / stats.count) * 100 : 0;
                                        return (
                                            <div key={label} className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-400">{label}</span>
                                                    <span className="font-mono text-indigo-400 font-bold">{count}</span>
                                                </div>
                                                <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 1, ease: "circOut" }}
                                                        className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            <Card className="p-8 bg-zinc-900/40 border-zinc-800">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-fuchsia-500" />
                                    Narrative Engagement
                                </h3>
                                <div className="space-y-6">
                                    {['Immersive', 'Good', 'Average', 'Poor'].map(label => {
                                        const count = stats?.engagementCounts[label] || 0;
                                        const percentage = stats ? (count / stats.count) * 100 : 0;
                                        return (
                                            <div key={label} className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-400">{label}</span>
                                                    <span className="font-mono text-fuchsia-400 font-bold">{count}</span>
                                                </div>
                                                <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 1, ease: "circOut" }}
                                                        className="h-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 shadow-[0_0_10px_rgba(192,38,211,0.5)]"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>

                        {/* Detailed Comments */}
                        <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden">
                            <div className="p-6 border-b border-zinc-800 bg-black/20">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-zinc-400" />
                                    Personnel Observations
                                </h3>
                            </div>
                            <div className="divide-y divide-zinc-800">
                                {feedbackList.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500 italic">No field reports archived for this mission.</div>
                                ) : (
                                    feedbackList.map((f, i) => (
                                        <div key={i} className="p-6 hover:bg-white/5 transition-colors group">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 uppercase">
                                                        {(f.userDisplayName || 'Agent').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-zinc-200">{f.userDisplayName || 'Anonymous Agent'}</h4>
                                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                                                            {new Date(f.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <Star
                                                            key={idx}
                                                            className={`w-3.5 h-3.5 ${idx < f.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-800'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mb-3">
                                                {f.difficulty && (
                                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wider">
                                                        {f.difficulty}
                                                    </span>
                                                )}
                                                {f.engagement && (
                                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 font-bold uppercase tracking-wider">
                                                        {f.engagement}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-zinc-400 text-sm leading-relaxed italic border-l-2 border-zinc-800 pl-4 py-1">
                                                "{f.comments || 'No specific observations provided.'}"
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

const StatCard = ({ label, value, icon, subtext, color }) => {
    const colorMap = {
        amber: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40",
        emerald: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40",
        indigo: "border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40",
        fuchsia: "border-fuchsia-500/20 bg-fuchsia-500/5 hover:border-fuchsia-500/40"
    };

    return (
        <Card className={`p-6 border ${colorMap[color]} transition-all duration-500 group overflow-hidden relative`}>
            {/* Animated Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>
            </div>
            <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</span>
                <h3 className="text-2xl font-black text-white tracking-tighter">{value}</h3>
                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">{subtext}</p>
            </div>
        </Card>
    );
};

const Heart = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

export default FeedbackReports;
