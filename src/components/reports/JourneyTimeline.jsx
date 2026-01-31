import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle, XCircle, Clock, MapPin, TrendingUp, Award, Zap } from 'lucide-react';

/**
 * Journey Timeline Component
 * Visualizes the user's mission history as an interactive timeline
 * Features:
 * - Animated path drawing
 * - Interactive mission nodes
 * - Success/failure indicators
 * - Hover details
 * - Trend visualization
 */

const JourneyTimeline = ({ missions = [], onMissionClick = null }) => {
    const [selectedMission, setSelectedMission] = useState(null);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    if (!missions || missions.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No missions completed yet. Start your journey!</p>
            </div>
        );
    }

    // Sort missions by date
    const sortedMissions = [...missions].sort((a, b) =>
        new Date(a.playedAt) - new Date(b.playedAt)
    );

    return (
        <div ref={ref} className="relative py-8">
            {/* Timeline Path */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-zinc-800 rounded-full overflow-hidden">
                {/* Animated Progress Fill */}
                <motion.div
                    className="absolute top-0 left-0 right-0 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500"
                    initial={{ height: 0 }}
                    animate={isInView ? { height: '100%' } : {}}
                    transition={{ duration: 2, ease: 'easeOut' }}
                />
            </div>

            {/* Mission Nodes */}
            <div className="space-y-8">
                {sortedMissions.map((mission, index) => (
                    <MissionNode
                        key={mission.id || index}
                        mission={mission}
                        index={index}
                        total={sortedMissions.length}
                        isSelected={selectedMission?.id === mission.id}
                        onClick={() => {
                            setSelectedMission(mission);
                            if (onMissionClick) onMissionClick(mission);
                        }}
                        delay={index * 0.1}
                        isInView={isInView}
                    />
                ))}
            </div>

            {/* End Marker */}
            <motion.div
                className="flex items-center gap-4 ml-8 mt-8"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: sortedMissions.length * 0.1 + 0.5 }}
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                    <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white">Journey Continues...</p>
                    <p className="text-xs text-zinc-500">Keep pushing forward, Detective</p>
                </div>
            </motion.div>
        </div>
    );
};

const MissionNode = ({ mission, index, total, isSelected, onClick, delay, isInView }) => {
    const [showDetails, setShowDetails] = useState(false);
    const isSuccess = mission.outcome === 'success';
    const isFirst = index === 0;
    const isLast = index === total - 1;

    // Calculate performance metrics
    const timeInMinutes = Math.floor((mission.timeSpentSeconds || 0) / 60);
    const timeInSeconds = (mission.timeSpentSeconds || 0) % 60;

    return (
        <motion.div
            className="relative flex items-start gap-4 group cursor-pointer"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClick}
            onMouseEnter={() => setShowDetails(true)}
            onMouseLeave={() => setShowDetails(false)}
        >
            {/* Node Circle */}
            <motion.div
                className="relative z-10 flex-shrink-0"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
            >
                {/* Outer Glow Ring */}
                <motion.div
                    className={`absolute inset-0 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'
                        } opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300`}
                    animate={isSelected ? {
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3]
                    } : {}}
                    transition={{
                        duration: 2,
                        repeat: isSelected ? Infinity : 0,
                        ease: 'easeInOut'
                    }}
                />

                {/* Main Circle */}
                <div className={`relative w-16 h-16 rounded-full border-4 ${isSuccess
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400/50'
                        : 'bg-gradient-to-br from-red-500 to-red-700 border-red-400/50'
                    } flex items-center justify-center shadow-2xl transition-all duration-300 ${isSelected ? 'ring-4 ring-indigo-500/50' : ''
                    }`}>
                    {isSuccess ? (
                        <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                        <XCircle className="w-8 h-8 text-white" />
                    )}

                    {/* Special Markers */}
                    {isFirst && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 border-2 border-zinc-900 flex items-center justify-center">
                            <Zap className="w-3 h-3 text-white" />
                        </div>
                    )}
                    {isLast && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-500 border-2 border-zinc-900 flex items-center justify-center">
                            <Award className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>

                {/* Pulse Animation for Recent */}
                {isLast && (
                    <motion.div
                        className={`absolute inset-0 rounded-full border-2 ${isSuccess ? 'border-emerald-400' : 'border-red-400'
                            }`}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut'
                        }}
                    />
                )}
            </motion.div>

            {/* Mission Card */}
            <motion.div
                className={`flex-1 bg-zinc-900/50 border ${isSuccess ? 'border-emerald-500/20' : 'border-red-500/20'
                    } rounded-xl p-4 backdrop-blur-sm transition-all duration-300 ${showDetails ? 'bg-zinc-900/80 border-indigo-500/40 shadow-lg shadow-indigo-500/20' : ''
                    } ${isSelected ? 'ring-2 ring-indigo-500/50' : ''}`}
                whileHover={{ scale: 1.02 }}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h4 className="text-base font-bold text-white mb-1">
                            {mission.caseTitle || 'Untitled Mission'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(mission.playedAt).toLocaleDateString()}</span>
                            <span className="text-zinc-700">•</span>
                            <span>{timeInMinutes}m {timeInSeconds}s</span>
                        </div>
                    </div>

                    {/* Score Badge */}
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold ${isSuccess
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        {mission.score || 0} PTS
                    </div>
                </div>

                {/* Outcome */}
                <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isSuccess ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {mission.outcome || 'Unknown'}
                    </span>
                </div>

                {/* Expandable Details */}
                <motion.div
                    initial={false}
                    animate={{ height: showDetails ? 'auto' : 0, opacity: showDetails ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                >
                    <div className="pt-3 border-t border-zinc-800 space-y-2">
                        {/* Objective Scores */}
                        {mission.objectiveScores && Object.keys(mission.objectiveScores).length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                    Learning Objectives
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(mission.objectiveScores).slice(0, 4).map(([key, score]) => (
                                        <div key={key} className="flex items-center justify-between text-xs">
                                            <span className="text-zinc-400 truncate">{key.split(':')[0]}</span>
                                            <span className={`font-mono font-bold ${score >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                }`}>
                                                {score >= 0 ? '+' : ''}{score}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Additional Stats */}
                        <div className="flex gap-4 text-xs text-zinc-500">
                            {mission.hintsUsed !== undefined && (
                                <div>
                                    <span className="font-bold">Hints:</span> {mission.hintsUsed}
                                </div>
                            )}
                            {mission.accuracy !== undefined && (
                                <div>
                                    <span className="font-bold">Accuracy:</span> {mission.accuracy}%
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default JourneyTimeline;
