import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, documentId, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import { useConfig } from '../lib/config';
import { Users, FileText, CheckCircle, AlertTriangle, Clock, X, BarChart2, Filter, Download, Trash2, Shield, Target, Award, Brain, TrendingUp, Zap, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from './ui/shared';
import { generateAssessment, getAgencyBenchmarks } from '../utils/AssessmentEngine';
import RadarChart from './reports/RadarChart';


const AdminProgressModal = ({ onClose }) => {
    const { user } = useAuth();
    const { settings } = useConfig();
    // State
    const [step, setStep] = useState(1); // 1: Select Users, 2: View Report
    const [users, setUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [benchmarks, setBenchmarks] = useState(null);
    const [objMap, setObjMap] = useState({});
    const [confirmWipe, setConfirmWipe] = useState(false);
    const [isWiping, setIsWiping] = useState(false);
    const [statusModal, setStatusModal] = useState(null); // { type, title, message }
    const [searchTerm, setSearchTerm] = useState('');


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

    const handleWipeHistory = async () => {
        if (selectedUserIds.size === 0) return;
        setIsWiping(true);
        try {
            const userIds = Array.from(selectedUserIds);
            const userEmails = users.filter(u => userIds.includes(u.id) || userIds.includes(u.email)).map(u => u.email).filter(Boolean);

            if (userEmails.length === 0) {
                setStatusModal({
                    type: 'warning',
                    title: 'Invalid Selection',
                    message: "No valid users selected for the data purge operation."
                });
                setIsWiping(false);
                setConfirmWipe(false);
                return;
            }

            // Find all results for these users
            const resultsToWipe = [];
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
                snap.docs.forEach(d => resultsToWipe.push(d.id));
            }

            if (resultsToWipe.length === 0) {
                setStatusModal({
                    type: 'info',
                    title: 'No Data Found',
                    message: "There are no recorded game results for the selected personnel."
                });
                setIsWiping(false);
                setConfirmWipe(false);
                return;
            }

            // Batch Delete
            const batchChunks = [];
            for (let i = 0; i < resultsToWipe.length; i += 500) {
                batchChunks.push(resultsToWipe.slice(i, i + 500));
            }

            for (const batchChunk of batchChunks) {
                const batch = writeBatch(db);
                batchChunk.forEach(id => {
                    batch.delete(doc(db, "game_results", id));
                });
                await batch.commit();
            }

            setStatusModal({
                type: 'success',
                title: 'Data Purge Complete',
                message: `Successfully wiped history for ${userEmails.length} personnel. ${resultsToWipe.length} tactical records have been permanently removed.`
            });
            setConfirmWipe(false);
            setSelectedUserIds(new Set());
        } catch (err) {
            console.error("Wipe failed:", err);
            setStatusModal({
                type: 'error',
                title: 'Operation Failed',
                message: "An error occurred during the data purge. Please check connectivity and system logs."
            });
        } finally {
            setIsWiping(false);
        }
    };

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

            // Calculate Benchmarks
            const globalBenchmarks = getAgencyBenchmarks(allResults);
            setBenchmarks(globalBenchmarks);

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

                        if (!objectiveStats[name]) objectiveStats[name] = { total: 0, count: 0, runs: [] };
                        objectiveStats[name].total += score;
                        objectiveStats[name].count += 1;
                        objectiveStats[name].runs.push({ date: game.playedAt, score });
                    });
                });

                const baseUserRecord = {
                    name: userName,
                    displayName: userObj?.displayName || userName,
                    email: email,
                    stats: { totalPlayed, totalWins, totalTime, winRate: (totalWins / totalPlayed) * 100 },
                    byMission,
                    objectiveStats
                };

                // Add Deep Assessment
                baseUserRecord.assessment = generateAssessment(baseUserRecord, map);

                processed[email] = baseUserRecord;
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
        try {
            if (!reportData) return;
            if (!user || !user.email) {
                alert("Session invalid.");
                return;
            }

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
            doc.setTextColor(147, 51, 234);
            doc.text("CLASSIFIED // INTELLIGENCE DIVISION ASSESSMENT", 14, 125);

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
                doc.text(`Archetype: ${userData.assessment?.archetype || 'N/A'}`, 20, 44);
                doc.text(`Success Rate: ${Math.round(userData.stats.winRate)}%`, 70, 44);
                doc.text(`Efficiency: ${Math.round(userData.assessment?.efficiencyScore)}/100`, 120, 44);

                // Summary Block
                const summaryText = `" ${userData.assessment?.summary} "`;
                const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 36);
                const summaryLineHeight = 4;
                const summaryHeight = (splitSummary.length * summaryLineHeight) + 8;

                doc.setFillColor(240, 240, 245);
                doc.rect(14, 55, pageWidth - 28, summaryHeight, 'F');
                doc.setFontSize(8);
                doc.setTextColor(60);
                doc.text(splitSummary, 18, 60);

                let currentY = 55 + summaryHeight + 15;

                // Objectives Chart & Table
                if (Object.keys(userData.objectiveStats).length > 0) {
                    const objectiveData = Object.entries(userData.objectiveStats);

                    // Check for page break before Evolution Matrix
                    if (currentY > 230) {
                        doc.addPage();
                        currentY = 20;
                    }

                    let chartY = currentY + 10;
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.setFont(undefined, 'bold');
                    doc.text("PERSONNEL INTELLIGENCE EVOLUTION MATRIX", 14, chartY - 6);

                    objectiveData.forEach(([name, stat], i) => {
                        const sortedRuns = [...(stat.runs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
                        const spacing = 13;
                        const y = chartY + (i * spacing);

                        const firstScore = sortedRuns[0]?.score || 0;
                        const lastScore = sortedRuns[sortedRuns.length - 1]?.score || 0;
                        const diff = lastScore - firstScore;

                        doc.setFontSize(8);
                        doc.setTextColor(60);
                        doc.setFont(undefined, 'bold');
                        doc.text(String(name).substring(0, 35), 14, y);

                        if (sortedRuns.length > 1) {
                            doc.setFontSize(7);
                            if (diff > 0) {
                                doc.setTextColor(16, 185, 129);
                                doc.text(`+${diff}% IMPROVEMENT`, 14, y + 4);
                            } else if (diff < 0) {
                                doc.setTextColor(220, 38, 38);
                                doc.text(`${diff}% DECREASE`, 14, y + 4);
                            }
                        }

                        // Progress Track
                        const trackX = 70;
                        const trackWidth = pageWidth - trackX - 25;
                        const trackHeight = 3.5;

                        doc.setFillColor(242, 242, 247);
                        doc.roundedRect(trackX, y - 3, trackWidth, trackHeight, 1.5, 1.5, 'F');

                        const firstX = trackX + (Math.max(0, firstScore) / 100 * trackWidth);
                        const lastX = trackX + (Math.max(0, lastScore) / 100 * trackWidth);

                        if (sortedRuns.length > 1) {
                            doc.setDrawColor(diff >= 0 ? 192 : 252, diff >= 0 ? 132 : 165, diff >= 0 ? 252 : 165);
                            doc.setLineWidth(1.5);
                            doc.line(firstX, y - 1.25, lastX, y - 1.25);
                        }

                        sortedRuns.forEach((run, idx) => {
                            const runX = trackX + (Math.max(0, run.score) / 100 * trackWidth);
                            const isFirst = idx === 0;
                            const isLast = idx === sortedRuns.length - 1;

                            if (isFirst) {
                                doc.setFillColor(245, 158, 11);
                                doc.circle(runX, y - 1.25, 1.5, 'F');
                                doc.setFontSize(6);
                                doc.setTextColor(180, 83, 9);
                                const labelOffset = Math.abs(firstX - lastX) < 12 ? -5.5 : -4;
                                doc.text("ORIGIN", runX - 3, y + labelOffset);
                            } else if (isLast) {
                                doc.setFillColor(147, 51, 234);
                                doc.circle(runX, y - 1.25, 1.8, 'F');
                                doc.setFontSize(6);
                                doc.setTextColor(107, 33, 168);
                                const labelOffset = Math.abs(firstX - lastX) < 12 ? 2.5 : -4;
                                doc.text("CURRENT", runX - 4, y + labelOffset);
                            } else {
                                doc.setFillColor(216, 180, 254);
                                doc.circle(runX, y - 1.25, 1, 'F');
                            }
                        });

                        doc.setFontSize(7);
                        doc.setTextColor(100);
                        doc.setFont(undefined, 'bold');
                        doc.text(`${lastScore}%`, pageWidth - 20, y);
                    });

                    const tableStartY = chartY + (objectiveData.length * 13) + 12;
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

                    // --- Initial Intelligence Baseline ---
                    let baselineY = doc.lastAutoTable.finalY + 12;
                    if (baselineY > 240) {
                        doc.addPage();
                        baselineY = 20;
                    }
                    doc.setFontSize(14);
                    doc.setTextColor(107, 33, 168);
                    doc.text("Personnel Baseline Performance", 14, baselineY);

                    const baselineRows = objectiveData.map(([name, stat]) => {
                        const sortedRuns = [...(stat.runs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
                        const firstRun = sortedRuns[0];
                        const currentRun = sortedRuns[sortedRuns.length - 1];
                        return [
                            name,
                            firstRun ? new Date(firstRun.date).toLocaleDateString() : 'N/A',
                            firstRun ? `${firstRun.score}%` : '0%',
                            currentRun ? `${currentRun.score}%` : '0%',
                            firstRun && currentRun ? `${currentRun.score - firstRun.score}%` : '0%'
                        ];
                    });

                    autoTable(doc, {
                        startY: baselineY + 5,
                        head: [['Objective', 'Origin Date', 'Baseline Score', 'Current', 'Progress']],
                        body: baselineRows,
                        headStyles: { fillColor: [245, 158, 11] },
                        alternateRowStyles: { fillColor: [254, 252, 243] }
                    });

                    // Detailed Analysis Section
                    currentY = doc.lastAutoTable.finalY + 12;

                    const objectivesUsed = Object.keys(userData.objectiveStats);

                    objectivesUsed.forEach(objName => {
                        const details = objMap[`${objName}_details`];

                        if (details && (details.learningObjective || details.objective || details.keyTakeaway)) {
                            // Pre-calculate heights
                            doc.setFontSize(9);
                            const splitTitle = doc.splitTextToSize(`Analysis: ${objName}`, pageWidth - 36);

                            doc.setFontSize(8);
                            const splitFocus = details.learningObjective ? doc.splitTextToSize(`Objective: ${details.learningObjective}`, pageWidth - 36) : [];
                            const splitDetail = details.objective ? doc.splitTextToSize(`Detail: ${details.objective}`, pageWidth - 36) : [];
                            const splitTakeaway = details.keyTakeaway ? doc.splitTextToSize(`Takeaway: ${details.keyTakeaway}`, pageWidth - 36) : [];

                            const blockHeight = (splitTitle.length * 5) + (splitFocus.length * 4) + (splitDetail.length * 4) + (splitTakeaway.length * 4) + 10;

                            if (currentY + blockHeight > 270) {
                                doc.addPage();
                                currentY = 20;
                            }

                            doc.setFillColor(245, 240, 255);
                            doc.rect(14, currentY, pageWidth - 28, blockHeight, 'F');

                            let innerY = currentY + 6;
                            doc.setFontSize(9);
                            doc.setTextColor(147, 51, 234);
                            doc.setFont(undefined, 'bold');
                            doc.text(splitTitle, 18, innerY);
                            innerY += (splitTitle.length * 5) + 1;

                            doc.setFontSize(8);
                            doc.setFont(undefined, 'normal');
                            doc.setTextColor(100);

                            if (splitFocus.length > 0) {
                                doc.text(splitFocus, 18, innerY);
                                innerY += (splitFocus.length * 4);
                            }
                            if (splitDetail.length > 0) {
                                doc.text(splitDetail, 18, innerY);
                                innerY += (splitDetail.length * 4);
                            }
                            if (splitTakeaway.length > 0) {
                                doc.setTextColor(80);
                                doc.setFont(undefined, 'bold');
                                doc.text(splitTakeaway, 18, innerY);
                                innerY += (splitTakeaway.length * 4);
                            }

                            currentY += blockHeight + 4;
                        }
                    });
                }

                // Mission Log Table
                let finalY = currentY + 10;
                if (finalY > 260) {
                    doc.addPage();
                    finalY = 20;
                }
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
                doc.text(`${settings.systemName || 'Mystery Architect'} - Personnel Division - Page ${i}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
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

            // Also open in new tab
            setTimeout(() => {
                window.open(url, '_blank');
            }, 100);
        } catch (err) {
            console.error("Admin PDF Export failed:", err);
            alert(`Failed to generate Admin PDF: ${err.message}`);
        }
    };

    const toggleUser = (id) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedUserIds(newSet);
    };

    const filteredUsers = users.filter(u => {
        const term = searchTerm.toLowerCase();
        return (u.displayName?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term));
    });


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
                            <div className="mb-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Select Personnel ({filteredUsers.length})</h3>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="text-xs border-zinc-800" onClick={() => {
                                            const newSet = new Set(selectedUserIds);
                                            filteredUsers.forEach(u => newSet.add(u.id));
                                            setSelectedUserIds(newSet);
                                        }}>Select All</Button>
                                        <Button variant="outline" size="sm" className="text-xs border-zinc-800" onClick={() => setSelectedUserIds(new Set())}>Clear</Button>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-20 text-zinc-500 animate-pulse">Loading Users Directory...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredUsers.map(u => (
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
                                    {filteredUsers.length === 0 && !loading && (
                                        <div className="col-span-full py-12 text-center">
                                            <div className="inline-flex p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
                                                <Search className="w-8 h-8 text-zinc-700" />
                                            </div>
                                            <p className="text-zinc-500 font-medium">No personnel found matching "{searchTerm}"</p>
                                        </div>
                                    )}

                                </div>
                            )}

                            <div className="mt-8 flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    className="border-red-900/30 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                                    onClick={() => setConfirmWipe(true)}
                                    disabled={selectedUserIds.size === 0 || isWiping}
                                >
                                    <Trash2 className="w-5 h-5 mr-2" />
                                    Wipe History ({selectedUserIds.size})
                                </Button>
                                <Button
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleGenerateReport}
                                    disabled={selectedUserIds.size === 0 || isWiping}
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
                                    <div key={userData.email} className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">

                                        {/* Deep Persona Header */}
                                        <div className="bg-gradient-to-br from-zinc-900 to-black p-8 border-b border-zinc-800 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full"></div>
                                            <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative">
                                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                                                            {(userData.displayName || userData.name || userData.email).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="absolute -bottom-2 -right-2 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 flex items-center gap-1 shadow-lg">
                                                            <Shield className="w-3 h-3 text-purple-400" />
                                                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">{userData.assessment?.archetype || 'Agent'}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-1">{userData.displayName || userData.name}</h2>
                                                        <p className="text-zinc-500 text-sm font-mono flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            {userData.email}
                                                        </p>
                                                        <div className="flex gap-4 mt-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Efficiency</span>
                                                                <span className="text-lg font-mono font-bold text-white">{Math.round(userData.assessment?.efficiencyScore || 0)}%</span>
                                                            </div>
                                                            <div className="w-px h-8 bg-zinc-800"></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Growth Index</span>
                                                                <span className={`text-lg font-mono font-bold ${userData.assessment?.metrics.growthSkill?.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    {userData.assessment?.metrics.growthSkill?.trend > 0 ? '+' : ''}{userData.assessment?.metrics.growthSkill?.trend || 0}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* High Level Metrics */}
                                                <div className="grid grid-cols-3 gap-8 p-6 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm self-stretch">
                                                    <div className="text-center">
                                                        <div className="text-3xl font-black text-white">{userData.stats.totalPlayed}</div>
                                                        <div className="text-[9px] uppercase font-black tracking-[0.2em] text-zinc-500 mt-1">Missions</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-black text-emerald-400">{Math.round(userData.stats.winRate)}%</div>
                                                        <div className="text-[9px] uppercase font-black tracking-[0.2em] text-zinc-500 mt-1">S-Rate</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-black text-amber-500">{Math.floor(userData.stats.totalTime / 60)}m</div>
                                                        <div className="text-[9px] uppercase font-black tracking-[0.2em] text-zinc-500 mt-1">FLD-T</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                                            {/* Left Column: Intelligence Summary & Radar (Lg: 8 cols) */}
                                            <div className="lg:col-span-8 space-y-10">

                                                {/* Commander's Assessment */}
                                                <section className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 relative">
                                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">
                                                        Intelligence Assessment
                                                    </div>
                                                    <p className="text-zinc-300 leading-relaxed text-lg italic border-l-4 border-purple-600 pl-6 py-2">
                                                        "{userData.assessment?.summary}"
                                                    </p>
                                                    <div className="mt-6 flex flex-wrap gap-3">
                                                        {userData.assessment?.recommendations.map((rec, i) => (
                                                            <div key={i} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-xs text-blue-300 font-bold">
                                                                <Target className="w-3 h-3" />
                                                                {rec}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {/* Skills Radar */}
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                            <Brain className="w-4 h-4 text-purple-500" />
                                                            Tactical Skill Profile
                                                        </h4>
                                                        <div className="bg-black/30 rounded-3xl p-6 border border-zinc-800/50 flex justify-center items-center h-[320px]">
                                                            <RadarChart
                                                                data={userData.assessment?.competencies}
                                                                size={280}
                                                                color="#a855f7"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Comparative Analysis */}
                                                    {benchmarks && (
                                                        <div className="space-y-6">
                                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                                Agency Benchmarking
                                                            </h4>
                                                            <div className="grid grid-cols-1 gap-4">
                                                                <ComparisonBar
                                                                    label="Win Rate"
                                                                    userVal={userData.stats.winRate}
                                                                    avgVal={benchmarks.avgWinRate}
                                                                    unit="%"
                                                                />
                                                                <ComparisonBar
                                                                    label="Mission Efficiency"
                                                                    userVal={userData.assessment?.efficiencyScore}
                                                                    avgVal={80}
                                                                    unit="/100"
                                                                />
                                                                <ComparisonBar
                                                                    label="Avg Score"
                                                                    userVal={Object.values(userData.objectiveStats).reduce((a, b) => a + (b.total / b.count), 0) / (Object.keys(userData.objectiveStats).length || 1)}
                                                                    avgVal={benchmarks.avgScore}
                                                                    unit="pts"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Column: Mission Log (Lg: 4 cols) */}
                                            <div className="lg:col-span-4 space-y-6">
                                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-zinc-500" />
                                                    Recent Field Log
                                                </h4>
                                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {Object.values(userData.byMission).map(mission => (
                                                        <div key={mission.title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 group hover:border-purple-500/50 transition-all">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="truncate pr-4">
                                                                    <div className="font-black text-white text-sm truncate uppercase tracking-tight">{mission.title}</div>
                                                                    <div className="text-[10px] text-zinc-500 font-mono mt-1">{mission.games.length} EXP_DATA SEGMENTS</div>
                                                                </div>
                                                                <Award className="w-5 h-5 text-indigo-500/50" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                {mission.games.map((g, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between bg-black/40 rounded-lg p-2 border border-zinc-800/30">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[9px] text-zinc-500 font-mono">{new Date(g.playedAt).toLocaleDateString()}</span>
                                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${g.outcome === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{g.outcome}</span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-sm font-black text-white">{g.score}</div>
                                                                            <div className="text-[8px] text-zinc-600 uppercase">PTS</div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {/* Wipe Confirmation Modal */}
                {confirmWipe && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Security Protocol: Wipe History</h3>
                                    <p className="text-zinc-500 text-sm mt-2">
                                        You are about to permanently delete the mission history and performance data for <span className="text-zinc-200 font-bold">{selectedUserIds.size} selected personnel</span>.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl">
                                <p className="text-red-400 text-xs font-mono text-center">THIS ACTION IS IRREVERSIBLE. ALL PSYCHOMETRIC AND MISSION DATA WILL BE PURGED.</p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 border-zinc-800" onClick={() => setConfirmWipe(false)}>Abort</Button>
                                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleWipeHistory} disabled={isWiping}>
                                    {isWiping ? 'Purging...' : 'Confirm Wipe'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Status Message Modal */}
                {statusModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-4"
                        >
                            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${statusModal.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {statusModal.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                            </div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">{statusModal.title}</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">{statusModal.message}</p>
                            <Button className="w-full mt-4" onClick={() => setStatusModal(null)}>Acknowledge</Button>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const ComparisonBar = ({ label, userVal = 0, avgVal = 1, unit = "" }) => {
    const isBetter = userVal >= avgVal;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-white">{Math.round(userVal)}{unit}</span>
                    <span className="text-[10px] text-zinc-600 uppercase font-bold">vs Avg {Math.round(avgVal || 0)}{unit}</span>
                </div>
            </div>
            <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden flex relative">
                <div
                    className={`h-full z-20 rounded-full transition-all duration-1000 ${isBetter ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, userVal))}%` }}
                ></div>
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white/40 z-30"
                    style={{ left: `${Math.min(100, Math.max(0, avgVal))}%` }}
                ></div>
            </div>
        </div>
    );
};

export default AdminProgressModal;
