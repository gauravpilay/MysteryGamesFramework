import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import { useConfig } from '../lib/config';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Zap, Sparkles, TrendingUp, Calendar, Target, Award, Clock, BarChart2, Filter, ChevronDown, CheckCircle, AlertTriangle, Trash2, Download, CircleHelp, Shield } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button, Card } from './ui/shared';
import { generateAssessment } from '../utils/AssessmentEngine';
import RadarChart from './reports/RadarChart';
import AnimatedStatCard from './reports/AnimatedStatCard';
import AchievementBadge from './reports/AchievementBadge';
import JourneyTimeline from './reports/JourneyTimeline';
import ProgressCelebration from './reports/ProgressCelebration';

const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return '0m 0s';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
};


const ProgressReportModal = ({ onClose }) => {
    const { user } = useAuth();
    const { settings } = useConfig();
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState([]);
    const [selectedCaseId, setSelectedCaseId] = useState('all');
    const [timeRange, setTimeRange] = useState('all'); // 'all', 'week', 'month'
    const [showConfirmWipe, setShowConfirmWipe] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [celebration, setCelebration] = useState(null);
    const [showTimeline, setShowTimeline] = useState(false);

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
                let name = objMap[objId] || objId;
                if (!objMap[objId]) {
                    if (objId.includes(':')) {
                        const [prefix, suffix] = objId.split(':');
                        if (objMap[prefix]) {
                            name = `${objMap[prefix]}: Objective ${parseInt(suffix) + 1}`;
                        } else {
                            name = prefix.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                        }
                    }
                }

                if (!objectiveStats[name]) objectiveStats[name] = { total: 0, count: 0, runs: [] };

                const cappedScore = Math.min(100, score);
                objectiveStats[name].total += cappedScore;
                objectiveStats[name].count += 1;
                objectiveStats[name].runs.push({ date: game.playedAt, score: cappedScore });
            });
        });

        // Group by Mission for assessment
        const byMission = {};
        filteredData.forEach(game => {
            if (!byMission[game.caseId]) {
                byMission[game.caseId] = {
                    title: game.caseTitle,
                    games: []
                };
            }
            byMission[game.caseId].games.push(game);
        });

        const assessmentData = {
            stats: { totalPlayed: totalGames, totalWins: totalWins, totalTime, winRate },
            objectiveStats,
            byMission
        };

        const assessment = generateAssessment(assessmentData, objMap);

        // Calculate achievements
        const achievements = [
            {
                id: 'first_mission',
                name: 'First Steps',
                description: 'Complete your first mission',
                icon: 'target',
                rarity: 'common',
                unlocked: totalGames > 0,
                progress: totalGames > 0 ? 100 : 0,
                unlockedAt: totalGames > 0 ? filteredData[filteredData.length - 1]?.playedAt : null
            },
            {
                id: 'five_missions',
                name: 'Getting Started',
                description: 'Complete 5 missions',
                icon: 'zap',
                rarity: 'rare',
                unlocked: totalGames >= 5,
                progress: Math.min(100, (totalGames / 5) * 100),
                unlockedAt: totalGames >= 5 ? filteredData[4]?.playedAt : null
            },
            {
                id: 'ten_missions',
                name: 'Dedicated Detective',
                description: 'Complete 10 missions',
                icon: 'shield',
                rarity: 'epic',
                unlocked: totalGames >= 10,
                progress: Math.min(100, (totalGames / 10) * 100),
                unlockedAt: totalGames >= 10 ? filteredData[9]?.playedAt : null
            },
            {
                id: 'perfect_score',
                name: 'Perfectionist',
                description: 'Achieve 100% success rate with at least 5 missions',
                icon: 'award',
                rarity: 'legendary',
                unlocked: winRate === 100 && totalGames >= 5,
                progress: totalGames >= 5 ? winRate : (totalGames / 5) * 100,
                unlockedAt: winRate === 100 && totalGames >= 5 ? filteredData[filteredData.length - 1]?.playedAt : null
            },
            {
                id: 'high_achiever',
                name: 'High Achiever',
                description: 'Maintain 80% or higher success rate',
                icon: 'trophy',
                rarity: 'epic',
                unlocked: winRate >= 80 && totalGames >= 3,
                progress: Math.min(100, winRate),
                unlockedAt: winRate >= 80 && totalGames >= 3 ? filteredData[filteredData.length - 1]?.playedAt : null
            },
            {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Complete a mission in under 5 minutes',
                icon: 'zap',
                rarity: 'rare',
                unlocked: filteredData.some(g => g.timeSpentSeconds < 300),
                progress: filteredData.some(g => g.timeSpentSeconds < 300) ? 100 : Math.min(100, (300 - Math.min(...filteredData.map(g => g.timeSpentSeconds || 999))) / 300 * 100),
                unlockedAt: filteredData.find(g => g.timeSpentSeconds < 300)?.playedAt
            }
        ];

        return { caseOptions, totalGames, winRate, totalTime, objectiveStats, assessment, achievements };
    }, [rawData, filteredData, objMap]);


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
            const pageHeight = doc.internal.pageSize.getHeight();

            // ========== COVER PAGE ==========
            // Gradient Background Effect (simulated with rectangles)
            doc.setFillColor(15, 23, 42); // Dark blue-gray
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // Top accent bar
            doc.setFillColor(99, 102, 241); // Indigo
            doc.rect(0, 0, pageWidth, 8, 'F');

            // Title with shadow effect
            doc.setFontSize(28);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.text("DETECTIVE", pageWidth / 2, 60, { align: 'center' });
            doc.setFontSize(32);
            doc.setTextColor(99, 102, 241);
            doc.text("PERFORMANCE RECORD", pageWidth / 2, 72, { align: 'center' });

            // Decorative line
            doc.setDrawColor(99, 102, 241);
            doc.setLineWidth(0.5);
            doc.line(40, 80, pageWidth - 40, 80);

            // User Info Box
            doc.setFillColor(30, 41, 59);
            doc.roundedRect(30, 95, pageWidth - 60, 35, 3, 3, 'F');

            doc.setFontSize(10);
            doc.setTextColor(148, 163, 184);
            doc.setFont(undefined, 'normal');
            doc.text("AGENT ID:", 40, 105);
            doc.text("GENERATED:", 40, 113);
            doc.text("PERIOD:", 40, 121);

            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.text(user?.email, 70, 105);
            doc.text(new Date().toLocaleString(), 70, 113);
            doc.text(timeRange === 'all' ? 'All Time' : timeRange === 'week' ? 'Past 7 Days' : 'Past 30 Days', 70, 121);

            // Stats Preview Cards
            const cardY = 145;
            const cardWidth = 38;
            const cardHeight = 30;
            const cardGap = 5;
            const startX = (pageWidth - (cardWidth * 4 + cardGap * 3)) / 2;

            const statCards = [
                { label: 'MISSIONS', value: stats.totalGames, color: [59, 130, 246] },
                { label: 'SUCCESS', value: `${stats.winRate}%`, color: [16, 185, 129] },
                { label: 'TIME', value: formatDuration(stats.totalTime), color: [245, 158, 11] },
                { label: 'SKILLS', value: Object.keys(stats.objectiveStats).length, color: [168, 85, 247] }
            ];

            statCards.forEach((card, i) => {
                const x = startX + (cardWidth + cardGap) * i;

                // Card background
                doc.setFillColor(30, 41, 59);
                doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'F');

                // Accent border
                doc.setDrawColor(...card.color);
                doc.setLineWidth(1);
                doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'S');

                // Value
                doc.setFontSize(16);
                doc.setTextColor(...card.color);
                doc.setFont(undefined, 'bold');
                doc.text(String(card.value), x + cardWidth / 2, cardY + 15, { align: 'center' });

                // Label
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184);
                doc.setFont(undefined, 'normal');
                doc.text(card.label, x + cardWidth / 2, cardY + 23, { align: 'center' });
            });

            // Archetype Badge
            doc.setFillColor(99, 102, 241);
            doc.roundedRect(30, 190, pageWidth - 60, 20, 3, 3, 'F');
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.text(`ARCHETYPE: ${stats.assessment?.archetype || 'SPECIAL AGENT'}`, pageWidth / 2, 202, { align: 'center' });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`${settings.systemName || 'Mystery Architect'} Intelligence Division - Confidential`, pageWidth / 2, pageHeight - 15, { align: 'center' });
            doc.text('Page 1', pageWidth / 2, pageHeight - 10, { align: 'center' });

            // ========== PAGE 2: ACHIEVEMENTS ==========
            if (stats.achievements && stats.achievements.length > 0) {
                doc.addPage();

                // Header
                doc.setFillColor(15, 23, 42);
                doc.rect(0, 0, pageWidth, pageHeight, 'F');
                doc.setFillColor(99, 102, 241);
                doc.rect(0, 0, pageWidth, 8, 'F');

                doc.setFontSize(20);
                doc.setTextColor(99, 102, 241);
                doc.setFont(undefined, 'bold');
                doc.text("HALL OF FAME", 14, 25);

                doc.setFontSize(10);
                doc.setTextColor(148, 163, 184);
                doc.setFont(undefined, 'normal');
                const unlockedCount = stats.achievements.filter(a => a.unlocked).length;
                doc.text(`${unlockedCount} of ${stats.achievements.length} Achievements Unlocked`, 14, 33);

                // Achievement Grid
                let achY = 45;
                const achWidth = (pageWidth - 40) / 2;

                stats.achievements.forEach((achievement, index) => {
                    if (index > 0 && index % 2 === 0) {
                        achY += 35;
                    }

                    const x = 14 + (index % 2) * (achWidth + 10);

                    // Achievement card
                    const rarityColors = {
                        common: [161, 161, 170],
                        rare: [59, 130, 246],
                        epic: [168, 85, 247],
                        legendary: [245, 158, 11]
                    };

                    const color = rarityColors[achievement.rarity] || rarityColors.common;

                    // Background
                    doc.setFillColor(30, 41, 59);
                    doc.roundedRect(x, achY, achWidth, 28, 2, 2, 'F');

                    // Border (thicker for unlocked)
                    doc.setDrawColor(...color);
                    doc.setLineWidth(achievement.unlocked ? 1 : 0.3);
                    doc.roundedRect(x, achY, achWidth, 28, 2, 2, 'S');

                    // Rarity badge
                    doc.setFillColor(...color);
                    doc.rect(x, achY, 25, 6, 'F');
                    doc.setFontSize(6);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont(undefined, 'bold');
                    doc.text(achievement.rarity.toUpperCase(), x + 12.5, achY + 4, { align: 'center' });

                    // Icon placeholder (circle)
                    if (achievement.unlocked) {
                        doc.setFillColor(...color);
                        doc.circle(x + 8, achY + 17, 4, 'F');
                    } else {
                        doc.setFillColor(71, 85, 105);
                        doc.circle(x + 8, achY + 17, 4, 'F');
                        // Lock symbol
                        doc.setFillColor(148, 163, 184);
                        doc.rect(x + 6.5, achY + 16, 3, 3, 'F');
                    }

                    // Name
                    doc.setFontSize(9);
                    doc.setTextColor(achievement.unlocked ? 255 : 148, achievement.unlocked ? 255 : 163, achievement.unlocked ? 255 : 184);
                    doc.setFont(undefined, 'bold');
                    doc.text(achievement.name, x + 16, achY + 14);

                    // Description
                    doc.setFontSize(7);
                    doc.setTextColor(148, 163, 184);
                    doc.setFont(undefined, 'normal');
                    const descLines = doc.splitTextToSize(achievement.description, achWidth - 20);
                    doc.text(descLines, x + 16, achY + 19);

                    // Progress bar (for locked)
                    if (!achievement.unlocked && achievement.progress > 0) {
                        const barWidth = achWidth - 20;
                        const barX = x + 16;
                        const barY = achY + 24;

                        doc.setFillColor(71, 85, 105);
                        doc.rect(barX, barY, barWidth, 2, 'F');

                        doc.setFillColor(...color);
                        doc.rect(barX, barY, (barWidth * achievement.progress) / 100, 2, 'F');

                        doc.setFontSize(6);
                        doc.setTextColor(...color);
                        doc.text(`${Math.round(achievement.progress)}%`, barX + barWidth, barY + 1.5, { align: 'right' });
                    } else if (achievement.unlocked && achievement.unlockedAt) {
                        doc.setFontSize(6);
                        doc.setTextColor(16, 185, 129);
                        doc.text(`Unlocked: ${new Date(achievement.unlockedAt).toLocaleDateString()}`, x + 16, achY + 26);
                    }
                });

                // Overall Progress
                const progressY = achY + 40;
                doc.setFontSize(10);
                doc.setTextColor(148, 163, 184);
                doc.text("Overall Achievement Progress", 14, progressY);

                const progressBarWidth = pageWidth - 60;
                const progressBarX = 30;
                const progressBarY = progressY + 5;
                const progressPercent = (unlockedCount / stats.achievements.length) * 100;

                doc.setFillColor(30, 41, 59);
                doc.roundedRect(progressBarX, progressBarY, progressBarWidth, 6, 3, 3, 'F');

                doc.setFillColor(245, 158, 11);
                doc.roundedRect(progressBarX, progressBarY, (progressBarWidth * progressPercent) / 100, 6, 3, 3, 'F');

                doc.setFontSize(12);
                doc.setTextColor(245, 158, 11);
                doc.setFont(undefined, 'bold');
                doc.text(`${Math.round(progressPercent)}%`, pageWidth / 2, progressBarY + 4.5, { align: 'center' });

                // Footer
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(`${settings.systemName || 'Mystery Architect'} Intelligence Division - Confidential`, pageWidth / 2, pageHeight - 15, { align: 'center' });
                doc.text('Page 2', pageWidth / 2, pageHeight - 10, { align: 'center' });
            }

            // ========== PAGE 3: ASSESSMENT & SUMMARY ==========
            doc.addPage();

            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            doc.setFillColor(99, 102, 241);
            doc.rect(0, 0, pageWidth, 8, 'F');

            doc.setFontSize(20);
            doc.setTextColor(99, 102, 241);
            doc.setFont(undefined, 'bold');
            doc.text("PERFORMANCE ASSESSMENT", 14, 25);

            let currentY = 40;

            // Assessment Summary
            doc.setFillColor(30, 41, 59);
            doc.roundedRect(14, currentY, pageWidth - 28, 40, 3, 3, 'F');

            doc.setFontSize(10);
            doc.setTextColor(148, 163, 184);
            doc.text("AGENT PROFILE", 20, currentY + 8);

            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            const summaryLines = doc.splitTextToSize(`"${stats.assessment?.summary}"`, pageWidth - 48);
            doc.text(summaryLines, 20, currentY + 16);

            currentY += 50;

            // Recommendations
            if (stats.assessment?.recommendations && stats.assessment.recommendations.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(99, 102, 241);
                doc.setFont(undefined, 'bold');
                doc.text("STRATEGIC RECOMMENDATIONS", 14, currentY);

                currentY += 10;

                stats.assessment.recommendations.forEach((rec, index) => {
                    doc.setFillColor(30, 41, 59);
                    doc.roundedRect(14, currentY, pageWidth - 28, 12, 2, 2, 'F');

                    // Number badge
                    doc.setFillColor(99, 102, 241);
                    doc.circle(20, currentY + 6, 3, 'F');
                    doc.setFontSize(8);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont(undefined, 'bold');
                    doc.text(String(index + 1), 20, currentY + 7.5, { align: 'center' });

                    // Recommendation text
                    doc.setFontSize(9);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont(undefined, 'normal');
                    const recLines = doc.splitTextToSize(rec, pageWidth - 50);
                    doc.text(recLines, 28, currentY + 7);

                    currentY += 15;
                });
            }

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`${settings.systemName || 'Mystery Architect'} Intelligence Division - Confidential`, pageWidth / 2, pageHeight - 15, { align: 'center' });
            doc.text('Page 3', pageWidth / 2, pageHeight - 10, { align: 'center' });

            // ========== CONTINUE WITH EXISTING CONTENT (Learning Objectives, etc.) ==========
            doc.addPage();
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            currentY = 20;

            // Learning Objectives Table
            if (Object.keys(stats.objectiveStats).length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(63, 81, 181);
                doc.text("Learning Objectives Analysis", 14, currentY);

                let chartY = currentY + 15;

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
                        if (!acc[name]) {
                            acc[name] = { ...data, runs: [...(data.runs || [])] };
                        } else {
                            acc[name].total += data.total;
                            acc[name].count += data.count;
                            acc[name].runs = [...(acc[name].runs || []), ...(data.runs || [])];
                        }
                        return acc;
                    }, {})
                );

                // Visual Progression Chart
                if (currentY > 230) {
                    doc.addPage();
                    currentY = 20;
                }
                chartY = currentY + 15;
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.setFont(undefined, 'bold');
                doc.text("INTELLIGENCE EVOLUTION & SKILL ADAPTATION MODEL", 14, chartY - 6);

                objectiveData.forEach(([name, data], i) => {
                    const sortedRuns = [...(data.runs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
                    const spacing = 13;
                    const y = chartY + (i * spacing);

                    // Name and Improvement Calculation
                    const firstScore = sortedRuns[0]?.score || 0;
                    const lastScore = sortedRuns[sortedRuns.length - 1]?.score || 0;
                    const diff = lastScore - firstScore;

                    doc.setFontSize(8);
                    doc.setTextColor(60);
                    doc.setFont(undefined, 'bold');
                    doc.text(String(name).substring(0, 45), 14, y);

                    if (sortedRuns.length > 1) {
                        doc.setFontSize(7);
                        if (diff > 0) {
                            doc.setTextColor(16, 185, 129); // Emerald
                            doc.text(`+${diff}% IMPROVEMENT`, 14, y + 4);
                        } else if (diff < 0) {
                            doc.setTextColor(239, 68, 68); // Red
                            doc.text(`${diff}% DECREASE`, 14, y + 4);
                        }
                    }

                    // Progress Track
                    const trackX = 70;
                    const trackWidth = pageWidth - trackX - 25;
                    const trackHeight = 3.5;

                    // Track background
                    doc.setFillColor(245, 245, 250);
                    doc.roundedRect(trackX, y - 3, trackWidth, trackHeight, 1.5, 1.5, 'F');

                    // Base/First attempt line
                    const firstX = trackX + (Math.max(0, firstScore) / 100 * trackWidth);
                    const lastX = trackX + (Math.max(0, lastScore) / 100 * trackWidth);

                    // Connection line (Progression)
                    if (sortedRuns.length > 1) {
                        doc.setDrawColor(diff >= 0 ? 199 : 254, diff >= 0 ? 210 : 202, diff >= 0 ? 254 : 202);
                        doc.setLineWidth(1.5);
                        doc.line(firstX, y - 1.25, lastX, y - 1.25);
                    }

                    // Attempt Markers
                    sortedRuns.forEach((run, idx) => {
                        const runX = trackX + (Math.max(0, run.score) / 100 * trackWidth);
                        const isFirst = idx === 0;
                        const isLast = idx === sortedRuns.length - 1;

                        if (isFirst) {
                            doc.setFillColor(245, 158, 11); // Amber 500
                            doc.circle(runX, y - 1.25, 1.5, 'F');
                            doc.setFontSize(6);
                            doc.setTextColor(180, 83, 9);

                            // Prevent overlap with CURRENT label
                            const labelOffset = Math.abs(firstX - lastX) < 12 ? -5.5 : -4;
                            doc.text("ORIGIN", runX - 3, y + labelOffset);
                        } else if (isLast) {
                            doc.setFillColor(79, 70, 229); // Indigo 600
                            doc.circle(runX, y - 1.25, 1.8, 'F');
                            doc.setFontSize(6);
                            doc.setTextColor(67, 56, 202);

                            // Prevent overlap with ORIGIN label
                            const labelOffset = Math.abs(firstX - lastX) < 12 ? 2.5 : -4;
                            doc.text("CURRENT", runX - 4, y + labelOffset);
                        } else {
                            doc.setFillColor(165, 180, 252); // Indigo 300
                            doc.circle(runX, y - 1.25, 1, 'F');
                        }
                    });

                    // Percent readout
                    doc.setFontSize(7);
                    doc.setTextColor(100);
                    doc.setFont(undefined, 'bold');
                    doc.text(`${lastScore}%`, pageWidth - 20, y);
                });

                const tableStartY = chartY + (objectiveData.length * 13) + 10;
                const objectiveRows = objectiveData.map(([name, data]) => [
                    name,
                    `${Math.min(100, Math.round(data.total / data.count))}%`,
                    data.count
                ]);

                autoTable(doc, {
                    startY: tableStartY,
                    head: [['Objective', 'Avg Score', 'Data Points']],
                    body: objectiveRows,
                    headStyles: { fillColor: [63, 81, 181] },
                    alternateRowStyles: { fillColor: [245, 247, 251] }
                });

                // --- Initial Intelligence Baseline ---
                let baselineY = doc.lastAutoTable.finalY + 15;
                if (baselineY > 240) {
                    doc.addPage();
                    baselineY = 20;
                }
                doc.setFontSize(14);
                doc.setTextColor(63, 81, 181);
                doc.text("Initial Intelligence Baseline", 14, baselineY);

                const baselineRows = objectiveData.map(([name, data]) => {
                    const sortedRuns = [...(data.runs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
                    const firstRun = sortedRuns[0];
                    const currentRun = sortedRuns[sortedRuns.length - 1];
                    const firstScore = firstRun?.score || 0;
                    const currentScore = currentRun?.score || 0;
                    return [
                        name,
                        firstRun ? new Date(firstRun.date).toLocaleDateString() : 'N/A',
                        `${firstScore}%`,
                        `${currentScore}%`,
                        `${currentScore - firstScore > 0 ? '+' : ''}${currentScore - firstScore}%`
                    ];
                });

                autoTable(doc, {
                    startY: baselineY + 5,
                    head: [['Objective', 'Baseline Date', 'Origin Score', 'Current', 'Net Growth']],
                    body: baselineRows,
                    headStyles: { fillColor: [245, 158, 11] },
                    alternateRowStyles: { fillColor: [255, 252, 243] }
                });

                // Detailed Learning Paths Section
                currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : currentY + 20;

                // Check for page break
                if (currentY > 240) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(14);
                doc.setTextColor(63, 81, 181);
                doc.text("Detailed Learning Path Analysis", 14, currentY);
                currentY += 10;

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

                        if (currentY + blockHeight > 270) {
                            doc.addPage();
                            currentY = 20;
                        }

                        doc.setDrawColor(230);
                        doc.setFillColor(250, 250, 252);
                        doc.rect(14, currentY, pageWidth - 28, blockHeight, 'F');

                        let innerY = currentY + 7;
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

                        currentY += blockHeight + 5;
                    }
                });
            }

            // Recent Sessions Table
            let finalY = currentY + 10;
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
                formatDuration(game.timeSpentSeconds),
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
                doc.text(`${settings.systemName || 'Mystery Architect'} Intelligence Division - Confidential // Page ${i} of ${finalPageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
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
                        <div className="space-y-12">
                            {/* High Level Stats - Enhanced with Animations */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <AnimatedStatCard
                                    icon={Target}
                                    title="Missions Attempted"
                                    value={stats.totalGames}
                                    color="text-blue-400"
                                    bg="bg-blue-500/10"
                                    border="border-blue-500/20"
                                    delay={0}
                                    sparkle={true}
                                />
                                <AnimatedStatCard
                                    icon={Award}
                                    title="Success Rate"
                                    value={stats.winRate}
                                    suffix="%"
                                    color="text-emerald-400"
                                    bg="bg-emerald-500/10"
                                    border="border-emerald-500/20"
                                    delay={0.1}
                                    sparkle={stats.winRate >= 80}
                                />
                                <AnimatedStatCard
                                    icon={Clock}
                                    title="Field Time"
                                    value={formatDuration(stats.totalTime)}
                                    color="text-amber-400"
                                    bg="bg-amber-500/10"
                                    border="border-amber-500/20"
                                    delay={0.2}
                                />
                                <AnimatedStatCard
                                    icon={BarChart2}
                                    title="Skills Tracked"
                                    value={Object.keys(stats.objectiveStats).length}
                                    color="text-fuchsia-400"
                                    bg="bg-fuchsia-500/10"
                                    border="border-fuchsia-500/20"
                                    delay={0.3}
                                />
                            </div>

                            {/* NEW: Personal Growth Story Section */}
                            <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-900/40 to-black rounded-3xl border border-indigo-500/20 p-8 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full"></div>
                                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                                    <div className="lg:col-span-12">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded">Career Path</div>
                                            <h3 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                                                {stats.assessment?.archetype} Status
                                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                            </h3>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-10">
                                            <div className="flex-1 space-y-6">
                                                <p className="text-xl text-zinc-300 leading-relaxed font-medium italic border-l-4 border-indigo-500 pl-8 py-2">
                                                    "{stats.assessment?.summary}"
                                                </p>
                                                <div className="flex flex-wrap gap-3 pt-4">
                                                    {stats.assessment?.recommendations.map((rec, i) => (
                                                        <div key={i} className="flex items-center gap-3 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl px-5 py-3 text-sm text-zinc-300 group hover:border-indigo-500/50 transition-all cursor-default shadow-lg">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                                                <Zap className="w-3 h-3 text-indigo-400" />
                                                            </div>
                                                            {rec}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Skills Radar integrated in story */}
                                            <div className="lg:w-[320px] flex flex-col items-center justify-center bg-black/20 rounded-3xl p-6 border border-white/5">
                                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Competency Radar</h4>
                                                <RadarChart
                                                    data={stats.assessment?.competencies}
                                                    size={240}
                                                    color="#6366f1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Achievements Showcase */}
                            {stats.achievements && stats.achievements.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="bg-gradient-to-br from-zinc-900/40 via-black/40 to-zinc-900/40 rounded-3xl border border-zinc-800/50 p-8 relative overflow-hidden"
                                >
                                    {/* Background Glow */}
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full" />

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded">
                                                        Achievements
                                                    </div>
                                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                                                    Hall of Fame
                                                </h3>
                                                <p className="text-sm text-zinc-500 mt-1">
                                                    {stats.achievements.filter(a => a.unlocked).length} of {stats.achievements.length} unlocked
                                                </p>
                                            </div>
                                        </div>

                                        {/* Achievement Badges Grid */}
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 justify-items-center">
                                            {stats.achievements.map((achievement, index) => (
                                                <motion.div
                                                    key={achievement.id}
                                                    initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                    transition={{
                                                        duration: 0.5,
                                                        delay: 0.5 + (index * 0.1),
                                                        type: 'spring',
                                                        stiffness: 200
                                                    }}
                                                >
                                                    <AchievementBadge
                                                        {...achievement}
                                                        size="lg"
                                                        showTooltip={true}
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-8 pt-6 border-t border-zinc-800">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-zinc-400">Overall Progress</span>
                                                <span className="text-amber-400 font-bold">
                                                    {Math.round((stats.achievements.filter(a => a.unlocked).length / stats.achievements.length) * 100)}%
                                                </span>
                                            </div>
                                            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(stats.achievements.filter(a => a.unlocked).length / stats.achievements.length) * 100}%` }}
                                                    transition={{ duration: 1.5, delay: 1, ease: 'easeOut' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

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
                                        {Object.entries(stats.objectiveStats).map(([readableName, data]) => {
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
                                                        <span>{avgScore >= 75 ? 'Peak performance achieved.' : 'Further field experience recommended.'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}


                            {/* Mission Journey Timeline */}
                            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                                        Mission Journey
                                    </h3>
                                    <button
                                        onClick={() => setShowTimeline(!showTimeline)}
                                        className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-sm font-bold text-indigo-400 transition-colors"
                                    >
                                        {showTimeline ? 'Hide Timeline' : 'Show Timeline'}
                                    </button>
                                </div>

                                {showTimeline ? (
                                    <JourneyTimeline
                                        missions={filteredData}
                                        onMissionClick={(mission) => {
                                            console.log('Mission clicked:', mission);
                                        }}
                                    />
                                ) : (
                                    <div className="text-center py-12 text-zinc-500">
                                        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Click "Show Timeline" to view your mission journey</p>
                                    </div>
                                )}

                                {filteredData.length === 0 && (
                                    <p className="text-zinc-500 text-center py-8 italic">No records found for this period.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Celebration Component */}
                <ProgressCelebration
                    show={celebration !== null}
                    type={celebration?.type || 'achievement'}
                    message={celebration?.message || ''}
                    subtitle={celebration?.subtitle || ''}
                    onComplete={() => setCelebration(null)}
                    duration={3000}
                    enableSound={false}
                />

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
