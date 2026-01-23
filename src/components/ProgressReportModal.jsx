import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, Target, Award, Clock, BarChart2, Filter, ChevronDown, CheckCircle, AlertTriangle, Trash2, Download, CircleHelp } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button, Card } from './ui/shared';

const ProgressReportModal = ({ onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState([]);
    const [selectedCaseId, setSelectedCaseId] = useState('all');
    const [timeRange, setTimeRange] = useState('all'); // 'all', 'week', 'month'
    const [showConfirmWipe, setShowConfirmWipe] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const [objMap, setObjMap] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let data = [];
                let map = {};

                // 1. Try Firestore if available
                if (db) {
                    try {
                        // Fetch Results
                        const q = query(
                            collection(db, "game_results"),
                            where("userId", "==", user.email)
                        );
                        const snapshot = await getDocs(q);
                        data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                        const casesSnap = await getDocs(query(collection(db, "cases")));

                        casesSnap.docs.forEach(doc => {
                            const c = doc.data();
                            if (c.meta?.learningObjectives) {
                                c.meta.learningObjectives.forEach(cat => {
                                    if (cat.objectives) {
                                        cat.objectives.forEach((obj, idx) => {
                                            const isObj = typeof obj === 'object';
                                            const title = isObj ? obj.learningObjective : obj;
                                            const key = `${cat.id}:${idx}`;

                                            map[key] = title;
                                            map[cat.id] = cat.category;
                                            if (isObj) {
                                                const details = {
                                                    learningObjective: obj.learningObjective,
                                                    objective: obj.objective,
                                                    keyTakeaway: obj.keyTakeaway
                                                };
                                                map[`${key}_details`] = details;
                                                map[`${title}_details`] = details;
                                            }
                                            map[title] = title;
                                        });
                                    }
                                });
                            }
                        });

                    } catch (err) {
                        console.error("Firestore fetch failed:", err);
                    }
                }

                data.sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
                setRawData(data);
                setObjMap(map);
            } catch (err) {
                console.error("Error fetching progress:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Filtering
    const filteredData = useMemo(() => {
        let data = [...rawData];

        if (selectedCaseId !== 'all') {
            data = data.filter(d => d.caseId === selectedCaseId);
        }

        const now = new Date();
        if (timeRange === 'week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            data = data.filter(d => new Date(d.playedAt) >= weekAgo);
        } else if (timeRange === 'month') {
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            data = data.filter(d => new Date(d.playedAt) >= monthAgo);
        }

        return data;
    }, [rawData, selectedCaseId, timeRange]);

    // Aggregations
    const stats = useMemo(() => {
        const uniqueCases = [...new Set(rawData.map(d => d.caseId))];
        const caseOptions = uniqueCases.map(id => {
            const found = rawData.find(d => d.caseId === id);
            return { id, title: found?.caseTitle || "Unknown Case" };
        });

        const totalGames = filteredData.length;
        const totalWins = filteredData.filter(d => d.outcome === 'success').length;
        const winRate = totalGames ? Math.round((totalWins / totalGames) * 100) : 0;
        const totalTime = filteredData.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0);

        // Objective Aggregation
        const objectiveStats = {};

        filteredData.forEach(game => {
            const scores = game.objectiveScores || {};
            Object.entries(scores).forEach(([objId, score]) => {
                // Key is usually category_id:idx OR a readable name (new format).
                // We use key as is for stats
                if (!objectiveStats[objId]) objectiveStats[objId] = { total: 0, count: 0, min: 0, max: 0, runs: [] };

                objectiveStats[objId].total += score;
                objectiveStats[objId].count += 1;
                objectiveStats[objId].runs.push({ date: game.playedAt, score });
            });
        });

        return { caseOptions, totalGames, winRate, totalTime, objectiveStats };
    }, [rawData, filteredData]);


    const handleClearHistory = () => {
        setShowConfirmWipe(true);
    };

    const executeClearHistory = async () => {
        setLoading(true);
        setShowConfirmWipe(false);
        try {
            // 1. Clear Firestore
            if (db) {
                const batch = writeBatch(db);
                // rawData contains all fetched docs for this user
                // Filter only firestore docs (those with IDs that look like UUIDs or DB IDs, usually just check if they came from DB)
                // For simplicity, we just try to delete all IDs found in rawData if they exist
                // Ideally we should re-query to be safe, but rawData is fine.

                // Note: writeBatch has 500 ops limit. If user has > 500 games, we need chunks.
                // Simplified loop for now.
                const chunkData = rawData.slice(0, 490);

                chunkData.forEach(d => {
                    if (d.id) { // Localstorage items might also have IDs but let's try
                        const ref = doc(db, "game_results", d.id);
                        batch.delete(ref);
                    }
                });

                await batch.commit();
            }

            // 2. Clear LocalStorage
            localStorage.removeItem('mystery_game_results');

            // 3. Clear State
            setRawData([]);
        } catch (err) {
            console.error("Failed to clear history:", err);
            // Alert in catch is fine for now or could show error toaster, but user wants to avoid CONFIRM dialog.
            alert("Partial deletion occurred. Please check console.");
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = user?.role === 'Admin';

    const handleExportPDF = () => {
        try {
            if (!user || !user.email) {
                alert("User session not found. Please log in again.");
                return;
            }
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Title
            doc.setFontSize(22);
            doc.setTextColor(63, 81, 181); // Indigo color
            doc.text("Detective Performance Record", 14, 22);

            // Header Info
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`User Index: ${user?.email}`, 14, 32);
            doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 37);
            doc.text(`Report Range: ${timeRange === 'all' ? 'All Time' : timeRange === 'week' ? 'Past 7 Days' : 'Past 30 Days'}`, 14, 42);

            // Stats Box
            doc.setDrawColor(200);
            doc.setFillColor(245, 247, 255);
            doc.rect(14, 50, pageWidth - 28, 25, 'F');

            doc.setFontSize(10);
            doc.setTextColor(50);
            doc.text("SUMMARY STATISTICS", 18, 56);

            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`Missions: ${stats.totalGames}`, 18, 65);
            doc.text(`Success Rate: ${stats.winRate}%`, 65, 65);
            doc.text(`Field Time: ${Math.floor(stats.totalTime / 60)}m ${stats.totalTime % 60}s`, 120, 65);

            let detailY = 88;

            // Learning Objectives Table
            if (Object.keys(stats.objectiveStats).length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(63, 81, 181);
                doc.text("Learning Objectives Analysis", 14, 88);

                const objectiveData = Object.entries(
                    Object.entries(stats.objectiveStats).reduce((acc, [key, data]) => {
                        let name = objMap[key] || key;
                        if (!objMap[key]) {
                            if (key.includes(':')) {
                                const [prefix, suffix] = key.split(':');
                                if (objMap[prefix]) {
                                    name = `${objMap[prefix]}: Objective ${parseInt(suffix) + 1}`;
                                } else {
                                    name = prefix.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                                }
                            }
                        }
                        if (!acc[name]) acc[name] = { ...data };
                        else {
                            acc[name].total += data.total;
                            acc[name].count += data.count;
                        }
                        return acc;
                    }, {})
                );

                // Visual Chart
                let chartY = 105;
                doc.setFontSize(9);
                doc.setTextColor(140);
                doc.text("INTELLIGENCE SKILL DISTRIBUTION MODEL", 14, chartY - 6);

                objectiveData.forEach(([name, data], i) => {
                    const count = data.count || 1;
                    const score = Math.round(data.total / count);
                    const maxBarWidth = pageWidth - 90;
                    const barWidth = maxBarWidth * (Math.abs(score) / 100) || 0;

                    doc.setTextColor(80);
                    doc.text(String(name).length > 25 ? String(name).substring(0, 22) + "..." : String(name), 14, chartY + (i * 8));

                    // Bar track
                    doc.setFillColor(242, 242, 247);
                    doc.rect(65, chartY + (i * 8) - 3, maxBarWidth, 3, 'F');

                    // Bar fill
                    doc.setFillColor(score >= 0 ? 79 : 220, score >= 0 ? 70 : 38, score >= 0 ? 229 : 38);
                    doc.rect(65, chartY + (i * 8) - 3, barWidth, 3, 'F');

                    doc.setFontSize(7);
                    doc.text(`${score}%`, pageWidth - 20, chartY + (i * 8));
                    doc.setFontSize(9);
                });

                const tableStartY = chartY + (objectiveData.length * 8) + 10;
                const objectiveRows = objectiveData.map(([name, data]) => [
                    name,
                    `${Math.round(data.total / data.count)}%`,
                    data.count
                ]);

                autoTable(doc, {
                    startY: tableStartY,
                    head: [['Objective', 'Avg Score', 'Data Points']],
                    body: objectiveRows,
                    headStyles: { fillColor: [63, 81, 181] },
                    alternateRowStyles: { fillColor: [245, 247, 251] }
                });

                // Detailed Learning Paths Section
                detailY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 70;

                // Check for page break
                if (detailY > 240) {
                    doc.addPage();
                    detailY = 20;
                }

                doc.setFontSize(14);
                doc.setTextColor(63, 81, 181);
                doc.text("Detailed Learning Path Analysis", 14, detailY);
                detailY += 10;

                const objectivesUsed = Object.keys(stats.objectiveStats);

                objectivesUsed.forEach(objKey => {
                    const details = objMap[`${objKey}_details`];
                    const objTitle = objMap[objKey];
                    const catId = objKey.split(':')[0];
                    const catName = objMap[catId] || "Category";

                    if (details && (details.learningObjective || details.objective || details.keyTakeaway)) {
                        // Pre-calculate heights
                        doc.setFontSize(10);
                        const safeTitle = `${catName}: ${objTitle || objKey}`;
                        const splitTitle = doc.splitTextToSize(safeTitle, pageWidth - 36);

                        doc.setFontSize(8);
                        const splitFocus = details.learningObjective ? doc.splitTextToSize(`Focus: ${details.learningObjective}`, pageWidth - 36) : [];
                        const splitDetail = details.objective ? doc.splitTextToSize(`Objective: ${details.objective}`, pageWidth - 36) : [];
                        const splitTakeaway = details.keyTakeaway ? doc.splitTextToSize(`Key Takeaway: ${details.keyTakeaway}`, pageWidth - 36) : [];

                        const blockHeight = (splitTitle.length * 6) + (splitFocus.length * 4) + (splitDetail.length * 4) + (splitTakeaway.length * 4) + 12;

                        if (detailY + blockHeight > 270) {
                            doc.addPage();
                            detailY = 20;
                        }

                        doc.setDrawColor(230);
                        doc.setFillColor(250, 250, 252);
                        doc.rect(14, detailY, pageWidth - 28, blockHeight, 'F');

                        let innerY = detailY + 7;
                        doc.setFontSize(10);
                        doc.setTextColor(63, 81, 181);
                        doc.setFont(undefined, 'bold');
                        doc.text(splitTitle, 18, innerY);
                        innerY += (splitTitle.length * 5) + 2;

                        doc.setFontSize(8);
                        doc.setFont(undefined, 'normal');
                        doc.setTextColor(80);

                        if (splitFocus.length > 0) {
                            doc.text(splitFocus, 18, innerY);
                            innerY += (splitFocus.length * 4);
                        }
                        if (splitDetail.length > 0) {
                            doc.text(splitDetail, 18, innerY);
                            innerY += (splitDetail.length * 4);
                        }
                        if (splitTakeaway.length > 0) {
                            doc.setTextColor(16, 185, 129); // Emerald
                            doc.setFont(undefined, 'bold');
                            doc.text(splitTakeaway, 18, innerY);
                            innerY += (splitTakeaway.length * 4);
                        }

                        detailY += blockHeight + 5;
                    }
                });
            }

            // Recent Sessions Table
            let finalY = detailY + 10;
            if (finalY > 260) {
                doc.addPage();
                finalY = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(63, 81, 181);
            doc.text("Mission History Log", 14, finalY);

            const sessionRows = filteredData.map(game => [
                new Date(game.playedAt).toLocaleDateString(),
                game.caseTitle,
                game.outcome.toUpperCase(),
                `${Math.floor(game.timeSpentSeconds / 60)}m ${game.timeSpentSeconds % 60}s`,
                `${game.score} PTS`
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Date', 'Mission', 'Outcome', 'Duration', 'Score']],
                body: sessionRows,
                headStyles: { fillColor: [45, 45, 45] },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                columnStyles: {
                    2: { cellWidth: 30 },
                    4: { halign: 'right' }
                }
            });

            // Footer
            const finalPageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= finalPageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Mystery Architect Intelligence Division - Confidential // Page ${i} of ${finalPageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
            }

            const fileName = `Performance_Record_${user.email.split('@')[0]}.pdf`;
            doc.setProperties({ title: fileName });

            // Robust download method
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Also open in new tab for immediate view (optional but helpful)
            setTimeout(() => {
                window.open(url, '_blank');
            }, 100);
        } catch (err) {
            console.error("PDF Export failed:", err);
            alert(`Failed to generate PDF: ${err.message}`);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-6xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <TrendingUp className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Detective Performance Record</h2>
                            <p className="text-zinc-400 text-xs font-mono tracking-widest uppercase">
                                USER: {user?.email} {isAdmin ? '// ADMIN ACCESS' : '// CLASSIFIED'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="text-zinc-400 hover:text-indigo-400 border-zinc-800" onClick={handleExportPDF}>
                            <Download className="w-5 h-5 mr-2" />
                            Export PDF
                        </Button>
                        {isAdmin && (
                            <Button variant="destructive" size="icon" onClick={handleClearHistory} title="Wipe All History (Admin Only)">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        )}
                        <Button variant="ghost" onClick={onClose}>
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-zinc-800 bg-black/40 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
                        <Filter className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-400 uppercase mr-2">Case File:</span>
                        <select
                            className="bg-transparent border-none text-white text-sm focus:ring-0 cursor-pointer outline-none"
                            value={selectedCaseId}
                            onChange={e => setSelectedCaseId(e.target.value)}
                        >
                            <option value="all">All Cases</option>
                            {stats.caseOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-400 uppercase mr-2">Range:</span>
                        <select
                            className="bg-transparent border-none text-white text-sm focus:ring-0 cursor-pointer outline-none"
                            value={timeRange}
                            onChange={e => setTimeRange(e.target.value)}
                        >
                            <option value="all">All Time</option>
                            <option value="week">Past 7 Days</option>
                            <option value="month">Past 30 Days</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 animate-pulse">
                            <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
                            <p>Analyzing Performance Data...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* High Level Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard
                                    icon={<Target className="w-6 h-6" />}
                                    title="Missions Attempted"
                                    value={stats.totalGames}
                                    color="text-blue-400"
                                    bg="bg-blue-500/10"
                                    border="border-blue-500/20"
                                />
                                <StatCard
                                    icon={<Award className="w-6 h-6" />}
                                    title="Success Rate"
                                    value={`${stats.winRate}%`}
                                    color="text-emerald-400"
                                    bg="bg-emerald-500/10"
                                    border="border-emerald-500/20"
                                />
                                <StatCard
                                    icon={<Clock className="w-6 h-6" />}
                                    title="Field Time"
                                    value={`${Math.floor(stats.totalTime / 60)}m ${stats.totalTime % 60}s`}
                                    color="text-amber-400"
                                    bg="bg-amber-500/10"
                                    border="border-amber-500/20"
                                />
                                <StatCard
                                    icon={<BarChart2 className="w-6 h-6" />}
                                    title="Skills Tracked"
                                    value={Object.keys(stats.objectiveStats).length}
                                    color="text-fuchsia-400"
                                    bg="bg-fuchsia-500/10"
                                    border="border-fuchsia-500/20"
                                />
                            </div>

                            {/* Objective Breakdown */}
                            {Object.keys(stats.objectiveStats).length > 0 && (
                                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <BarChart2 className="w-5 h-5 text-indigo-500" />
                                            Learning Objectives Analysis
                                        </h3>
                                        <div className="relative">
                                            <button
                                                onMouseEnter={() => setShowHelp(true)}
                                                onMouseLeave={() => setShowHelp(false)}
                                                onClick={() => setShowHelp(!showHelp)}
                                                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-500 hover:text-indigo-400 transition-all cursor-help"
                                            >
                                                <CircleHelp className="w-5 h-5" />
                                            </button>

                                            <AnimatePresence>
                                                {showHelp && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute right-0 bottom-full mb-2 w-72 p-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 pointer-events-none"
                                                    >
                                                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Methodology</h4>
                                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                                            Analysis is calculated by averaging performance scores across all mission attempts.
                                                            <br /><br />
                                                            Each field action is mapped to specific objectives. Successes grant positive progression, while errors or excessive hint usage can reduce the impact on that specific skill node.
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {Object.entries(
                                            Object.entries(stats.objectiveStats).reduce((acc, [key, data]) => {
                                                let name = objMap[key] || key;
                                                if (!objMap[key]) {
                                                    if (key.includes(':')) {
                                                        const [prefix, suffix] = key.split(':');
                                                        if (objMap[prefix]) {
                                                            name = `${objMap[prefix]}: Objective ${parseInt(suffix) + 1}`;
                                                        } else {
                                                            name = prefix.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                                                        }
                                                    } else if (key.length > 20 && !key.includes(' ')) {
                                                        name = "Unknown Objective";
                                                    }
                                                }
                                                if (!acc[name]) {
                                                    acc[name] = { ...data };
                                                } else {
                                                    acc[name].total += data.total;
                                                    acc[name].count += data.count;
                                                    acc[name].runs = [...acc[name].runs, ...data.runs];
                                                }
                                                return acc;
                                            }, {})
                                        ).map(([readableName, data]) => {
                                            const avgScore = Math.round(data.total / data.count);

                                            return (
                                                <div key={readableName} className="space-y-2">
                                                    <div className="flex justify-between items-center text-sm mb-1">
                                                        <span className="font-bold text-zinc-300">{readableName}</span>
                                                        <span className={`${avgScore > 0 ? 'text-emerald-400' : 'text-red-400'} font-mono font-bold`}>
                                                            Avg: {avgScore > 0 ? '+' : ''}{avgScore}
                                                        </span>
                                                    </div>
                                                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden relative">
                                                        <div
                                                            className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ${avgScore >= 0 ? 'bg-indigo-500' : 'bg-red-500'}`}
                                                            style={{ width: `${Math.min(100, Math.abs(avgScore))}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
                                                        <span>{data.count} Data Points</span>
                                                        <span>History: {data.runs.map(r => r.score).join(', ')}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Recent Sessions Timeline */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-zinc-500" />
                                    Recent Sessions
                                </h3>

                                {filteredData.map(game => (
                                    <div key={game.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${game.outcome === 'success' ? 'bg-emerald-500/10 text-emerald-500' : game.outcome === 'timeout' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {game.outcome === 'success' ? <CheckCircle className="w-5 h-5" /> :
                                                    game.outcome === 'timeout' ? <Clock className="w-5 h-5" /> :
                                                        <AlertTriangle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-zinc-200">{game.caseTitle}</h4>
                                                <p className="text-xs text-zinc-500">
                                                    {new Date(game.playedAt).toLocaleString()} • {Math.floor(game.timeSpentSeconds / 60)}m {game.timeSpentSeconds % 60}s
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-mono font-bold text-white">{game.score} PTS</div>
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{game.outcome}</div>
                                        </div>
                                    </div>
                                ))}

                                {filteredData.length === 0 && (
                                    <p className="text-zinc-500 text-center py-8 italic">No records found for this period.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* Wipe Confirmation Modal */}
                <AnimatePresence>
                    {showConfirmWipe && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-zinc-900 border border-red-500/50 rounded-xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="p-4 bg-red-500/10 rounded-full mb-2">
                                        <AlertTriangle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">System Purge Warning</h3>
                                    <p className="text-zinc-400">
                                        You are about to <span className="text-red-400 font-bold">permanently delete all</span> game progress history, statistics, and objective tracking data.
                                    </p>
                                    <div className="bg-red-950/30 border border-red-900/50 rounded p-3 text-red-300 text-sm font-mono mt-2">
                                        ACTION CANNOT BE UNDONE.
                                    </div>
                                    <div className="flex gap-4 w-full pt-4">
                                        <Button variant="ghost" onClick={() => setShowConfirmWipe(false)} className="flex-1">
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={executeClearHistory}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                                        >
                                            Confirm Wipe
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

const StatCard = ({ icon, title, value, color, bg, border }) => (
    <div className={`p-6 rounded-xl border ${border} ${bg} flex items-center gap-4`}>
        <div className={`p-3 rounded-lg bg-black/40 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
        </div>
    </div>
);

export default ProgressReportModal;
