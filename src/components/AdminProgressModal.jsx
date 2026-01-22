import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, documentId } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import { Users, FileText, CheckCircle, AlertTriangle, Clock, X, BarChart2, Filter, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from './ui/shared';

const AdminProgressModal = ({ onClose }) => {
    const { user } = useAuth();
    // State
    const [step, setStep] = useState(1); // 1: Select Users, 2: View Report
    const [users, setUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [objMap, setObjMap] = useState({});

    // Fetch Users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // 1. Fetch official user records
                const userSnapshot = await getDocs(collection(db, "users"));
                let userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 2. Discover users from game_results who might be missing from 'users' collection
                try {
                    const resultsSnap = await getDocs(collection(db, "game_results"));
                    const distinctEmails = [...new Set(resultsSnap.docs.map(d => d.data().userId))];

                    distinctEmails.forEach(email => {
                        if (!email) return;
                        const existing = userList.find(u => u.email === email || u.id === email);
                        if (!existing) {
                            userList.push({
                                id: email,
                                email: email,
                                displayName: resultsSnap.docs.find(d => d.data().userId === email)?.data().userDisplayName || email.split('@')[0],
                                role: 'User'
                            });
                        } else if (!existing.displayName) {
                            // Fill in display name if missing from record
                            existing.displayName = resultsSnap.docs.find(d => d.data().userId === email)?.data().userDisplayName || email.split('@')[0];
                        }
                    });
                } catch (e) {
                    console.error("Discovery failed", e);
                }

                setUsers(userList);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch users:", err);
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const userIds = Array.from(selectedUserIds);
            const userEmails = users.filter(u => userIds.includes(u.id) || userIds.includes(u.email)).map(u => u.email).filter(Boolean);

            if (userEmails.length === 0) {
                alert("No valid users selected");
                setLoading(false);
                return;
            }

            let allResults = [];
            // Chunking for 'in' query (limit 10)
            const chunks = [];
            for (let i = 0; i < userEmails.length; i += 10) {
                chunks.push(userEmails.slice(i, i + 10));
            }

            for (const chunk of chunks) {
                const q = query(
                    collection(db, "game_results"),
                    where("userId", "in", chunk)
                );
                const snap = await getDocs(q);
                snap.docs.forEach(d => allResults.push({ id: d.id, ...d.data() }));
            }

            // Sort Client Side
            allResults.sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));

            // Build Objective Map
            const map = {};
            const caseIds = [...new Set(allResults.map(d => d.caseId))];

            if (caseIds.length > 0) {
                const casesSnap = await getDocs(collection(db, "cases"));
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
                                        // Also map by title for the stats lookup in PDF
                                        map[`${title}_details`] = details;
                                        map[`${cat.id}:${title}_details`] = details;
                                    }
                                    map[title] = title;
                                });
                            }
                        });
                    }
                });
            }

            // Process Data
            const processed = {};

            userEmails.forEach(email => {
                const userGames = allResults.filter(r => r.userId === email);
                if (userGames.length === 0) return;

                const userObj = users.find(u => u.email === email);
                const userName = userObj ? (userObj.displayName || userObj.email) : email;

                const totalPlayed = userGames.length;
                const totalWins = userGames.filter(g => g.outcome === 'success').length;
                const totalTime = userGames.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0);

                // Group by Mission
                const byMission = {};
                userGames.forEach(game => {
                    if (!byMission[game.caseId]) {
                        byMission[game.caseId] = {
                            title: game.caseTitle,
                            games: []
                        };
                    }
                    byMission[game.caseId].games.push(game);
                });

                // Objective Aggregation
                const objectiveStats = {};
                userGames.forEach(game => {
                    const scores = game.objectiveScores || {};
                    Object.entries(scores).forEach(([key, score]) => {
                        let name = map[key] || key;
                        if (!map[key]) {
                            if (key.includes(':')) {
                                const [prefix, suffix] = key.split(':');
                                if (map[prefix]) {
                                    name = `${map[prefix]}: Objective ${parseInt(suffix) + 1}`;
                                } else {
                                    name = prefix.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                                }
                            } else if (key.length > 20 && !key.includes(' ')) {
                                name = "Unknown Objective";
                            }
                        }

                        if (!objectiveStats[name]) objectiveStats[name] = { total: 0, count: 0, scores: [] };
                        objectiveStats[name].total += score;
                        objectiveStats[name].count += 1;
                        objectiveStats[name].scores.push(score);
                    });
                });

                processed[email] = {
                    name: userName,
                    displayName: userObj?.displayName || userName,
                    email: email,
                    stats: { totalPlayed, totalWins, totalTime },
                    byMission,
                    objectiveStats
                };
            });

            setReportData(processed);
            setObjMap(map);
            setStep(2);
        } catch (e) {
            console.error(e);
            alert("Error generating report");
        } finally {
            setLoading(false);
        }
    };

    const handleExportAdminPDF = () => {
        if (!reportData) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // cover Page
        doc.setFontSize(28);
        doc.setTextColor(147, 51, 234); // Purple
        doc.text("Agency Personnel Progress Report", 14, 80);

        doc.setLineWidth(1);
        doc.setDrawColor(147, 51, 234);
        doc.line(14, 85, 100, 85);

        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(`Generated By Index: ${user?.email || 'Administrator'}`, 14, 100);
        doc.text(`Date of Issue: ${new Date().toLocaleString()}`, 14, 107);
        doc.text(`Personnel Count: ${Object.keys(reportData).length}`, 14, 114);

        doc.setFontSize(10);
        doc.text("CLASSIFIED // INTERNAL USE ONLY", 14, 125);

        // Add a page for each user
        Object.values(reportData).forEach((userData, index) => {
            doc.addPage();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(63, 81, 181);
            doc.text(`${userData.displayName || userData.name}`, 14, 20);
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text(`Email: ${userData.email}`, 14, 25);

            // Stats Section
            doc.setDrawColor(220);
            doc.setFillColor(249, 250, 251);
            doc.rect(14, 32, pageWidth - 28, 20, 'F');

            doc.setTextColor(50);
            doc.setFontSize(10);
            doc.text(`Missions: ${userData.stats.totalPlayed}`, 20, 44);
            doc.text(`Successes: ${userData.stats.totalWins}`, 70, 44);
            doc.text(`Field Time: ${Math.floor(userData.stats.totalTime / 60)}m`, 120, 44);

            // Objectives Chart & Table
            if (Object.keys(userData.objectiveStats).length > 0) {
                const objectiveData = Object.entries(userData.objectiveStats);

                let chartY = 64;
                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text("SKILLS MATRIX DISTRIBUTION", 14, chartY - 5);

                objectiveData.forEach(([name, stat], i) => {
                    const score = Math.round(stat.total / stat.count);
                    const barWidth = (pageWidth - 90) * (Math.abs(score) / 100);

                    doc.setTextColor(80);
                    doc.text(name.length > 30 ? name.substring(0, 27) + "..." : name, 14, chartY + (i * 8));

                    doc.setFillColor(242, 242, 247);
                    doc.rect(70, chartY + (i * 8) - 3, pageWidth - 95, 3, 'F');

                    doc.setFillColor(147, 51, 234);
                    doc.rect(70, chartY + (i * 8) - 3, barWidth, 3, 'F');
                });

                const tableStartY = chartY + (objectiveData.length * 8) + 10;
                const objectiveRows = objectiveData.map(([name, stat]) => [
                    name,
                    `${Math.round(stat.total / stat.count)}%`,
                    stat.count
                ]);

                autoTable(doc, {
                    startY: tableStartY,
                    head: [['Skill / Objective', 'Avg Performance', 'Data Points']],
                    body: objectiveRows,
                    theme: 'striped',
                    headStyles: { fillColor: [147, 51, 234] }
                });

                // Detailed Analysis Section
                let detailY = doc.lastAutoTable.finalY + 12;

                const objectivesUsed = Object.keys(userData.objectiveStats);

                objectivesUsed.forEach(objName => {
                    // Try to find details by name
                    const details = objMap[`${objName}_details`];

                    if (details && (details.learningObjective || details.objective || details.keyTakeaway)) {
                        if (detailY > 250) {
                            doc.addPage();
                            detailY = 20;
                        }

                        doc.setFillColor(245, 240, 255);
                        doc.rect(14, detailY, pageWidth - 28, 30, 'F');

                        doc.setFontSize(9);
                        doc.setTextColor(147, 51, 234);
                        doc.setFont(undefined, 'bold');
                        doc.text(`Analysis: ${objName}`, 18, detailY + 7);

                        doc.setFontSize(8);
                        doc.setFont(undefined, 'normal');
                        doc.setTextColor(100);

                        let innerY = detailY + 13;
                        if (details.learningObjective) {
                            doc.text(`Objective: ${details.learningObjective}`, 18, innerY);
                            innerY += 4;
                        }
                        if (details.objective) {
                            const splitObj = doc.splitTextToSize(`Detail: ${details.objective}`, pageWidth - 40);
                            doc.text(splitObj, 18, innerY);
                            innerY += (splitObj.length * 4);
                        }
                        if (details.keyTakeaway) {
                            doc.setTextColor(80);
                            doc.setFont(undefined, 'bold');
                            doc.text(`Takeaway: ${details.keyTakeaway}`, 18, innerY);
                        }

                        detailY += 35;
                    }
                });
            }

            // Mission Log Table
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 68;
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text("Recent Mission Logs", 14, finalY);

            const missionRows = [];
            Object.values(userData.byMission).forEach(mission => {
                mission.games.forEach(g => {
                    missionRows.push([
                        new Date(g.playedAt).toLocaleDateString(),
                        mission.title,
                        g.outcome.toUpperCase(),
                        `${g.score} PTS`
                    ]);
                });
            });

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Date', 'Mission', 'Outcome', 'Score']],
                body: missionRows.slice(0, 15), // Limit to top 15 for space
                headStyles: { fillColor: [45, 45, 45] }
            });
        });

        // Add page numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Agency Confidential - Report #${i}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }

        const fileName = `Personnel_Agency_Report_${new Date().toISOString().split('T')[0]}.pdf`;
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

        // Also open in new tab for immediate view
        window.open(url, '_blank');
    };

    const toggleUser = (id) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedUserIds(newSet);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-6xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Admin Progress Report</h2>
                            <p className="text-zinc-500 text-xs font-mono uppercase">Multi-User Analysis Platform</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {step === 2 && reportData && (
                            <Button variant="outline" className="text-zinc-400 hover:text-purple-400 border-zinc-800" onClick={handleExportAdminPDF}>
                                <Download className="w-5 h-5 mr-2" />
                                Export PDF Report
                            </Button>
                        )}
                        <Button variant="ghost" onClick={onClose}>
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {step === 1 && (
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="mb-6 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Select Users to Analyze</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedUserIds(new Set(users.map(u => u.id)))}>Select All</Button>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedUserIds(new Set())}>Clear</Button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-20 text-zinc-500 animate-pulse">Loading Users Directory...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {users.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => toggleUser(u.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${selectedUserIds.has(u.id)
                                                ? 'bg-purple-500/20 border-purple-500 text-white'
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedUserIds.has(u.id) ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                                {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="font-bold truncate">{u.displayName || u.email || 'Unknown Agent'}</div>
                                                <div className="text-xs opacity-70 truncate">{u.email}</div>
                                            </div>
                                            {selectedUserIds.has(u.id) && <CheckCircle className="w-5 h-5 ml-auto text-purple-400" />}
                                        </div>
                                    ))}
                                    {users.length === 0 && !loading && (
                                        <div className="col-span-full text-center text-zinc-500">No users found in directory.</div>
                                    )}
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <Button
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleGenerateReport}
                                    disabled={selectedUserIds.size === 0}
                                >
                                    Generate Report ({selectedUserIds.size})
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && reportData && (
                        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
                            <div className="mb-6">
                                <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-400 hover:text-white">← Back to User Selection</Button>
                            </div>

                            <div className="space-y-12">
                                {Object.values(reportData).map(userData => (
                                    <div key={userData.email} className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">

                                        {/* User Header */}
                                        <div className="bg-zinc-900 p-6 flex items-center justify-between border-b border-zinc-800">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-xl font-bold text-white">
                                                    {(userData.displayName || userData.name || userData.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white">{userData.displayName || userData.name}</h2>
                                                    <p className="text-zinc-400 text-sm font-mono">{userData.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-6 text-center">
                                                <div>
                                                    <div className="text-2xl font-bold text-white">{userData.stats.totalPlayed}</div>
                                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">Missions</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-emerald-400">{userData.stats.totalWins}</div>
                                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">Successes</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-amber-400">{Math.floor(userData.stats.totalTime / 60)}m</div>
                                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">Field Time</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Left Col: Mission History */}
                                            <div>
                                                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Mission Log</h4>
                                                <div className="space-y-4">
                                                    {Object.values(userData.byMission).map(mission => (
                                                        <div key={mission.title} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-bold text-white">{mission.title}</span>
                                                                <span className="text-xs font-mono text-zinc-500">{mission.games.length} Attempts</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {mission.games.map((g, idx) => (
                                                                    <div key={idx} className="flex justify-between text-xs text-zinc-400 border-l-2 border-zinc-800 pl-3 py-1">
                                                                        <span>{new Date(g.playedAt).toLocaleDateString()}</span>
                                                                        <span className={`capitalize font-bold ${g.outcome === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{g.outcome}</span>
                                                                        <span>{g.score} pts</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Right Col: Skills Matrix */}
                                            <div>
                                                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Skills & Objectives Matrix</h4>
                                                <div className="bg-black/20 rounded-xl p-4 border border-zinc-800/50">
                                                    {Object.entries(userData.objectiveStats).map(([objName, stat]) => {
                                                        const avg = Math.round(stat.total / stat.count);
                                                        return (
                                                            <div key={objName} className="mb-4 last:mb-0">
                                                                <div className="flex justify-between text-sm mb-1">
                                                                    <span className="text-zinc-300 font-medium">{objName}</span>
                                                                    <span className={`font-mono font-bold ${avg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{avg > 0 ? '+' : ''}{avg}</span>
                                                                </div>
                                                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                                    <div className={`h-full ${avg >= 0 ? 'bg-indigo-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.abs(avg))}%` }}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {Object.keys(userData.objectiveStats).length === 0 && (
                                                        <div className="text-zinc-500 italic text-sm">No objective data recorded yet.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AdminProgressModal;
