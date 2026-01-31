import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, Award, Crown, Shield, Sparkles, Lock } from 'lucide-react';

/**
 * Achievement Badge Component
 * Features:
 * - Animated unlock animations
 * - Glow effects
 * - Hover tooltips
 * - Rarity tiers (common, rare, epic, legendary)
 * - Progress tracking
 */

const BADGE_ICONS = {
    trophy: Trophy,
    star: Star,
    zap: Zap,
    target: Target,
    award: Award,
    crown: Crown,
    shield: Shield,
    sparkles: Sparkles
};

const RARITY_STYLES = {
    common: {
        gradient: 'from-zinc-600 to-zinc-800',
        glow: 'rgba(161, 161, 170, 0.4)',
        border: 'border-zinc-500/30',
        text: 'text-zinc-300'
    },
    rare: {
        gradient: 'from-blue-600 to-blue-800',
        glow: 'rgba(59, 130, 246, 0.5)',
        border: 'border-blue-500/40',
        text: 'text-blue-300'
    },
    epic: {
        gradient: 'from-purple-600 to-purple-900',
        glow: 'rgba(168, 85, 247, 0.6)',
        border: 'border-purple-500/50',
        text: 'text-purple-300'
    },
    legendary: {
        gradient: 'from-amber-500 via-orange-500 to-yellow-600',
        glow: 'rgba(251, 191, 36, 0.7)',
        border: 'border-amber-400/60',
        text: 'text-amber-200',
        shine: true
    }
};

const AchievementBadge = ({
    id,
    name,
    description,
    icon = 'trophy',
    rarity = 'common',
    unlocked = false,
    progress = 0, // 0-100
    unlockedAt = null,
    size = 'md', // 'sm', 'md', 'lg'
    showTooltip = true,
    onUnlock = null
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [celebrating, setCelebrating] = useState(false);

    const Icon = BADGE_ICONS[icon] || Trophy;
    const rarityStyle = RARITY_STYLES[rarity];

    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32'
    };

    const iconSizes = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-14 h-14'
    };

    const handleUnlock = () => {
        if (!unlocked && progress >= 100) {
            setCelebrating(true);
            setTimeout(() => setCelebrating(false), 2000);
            if (onUnlock) onUnlock(id);
        }
    };

    return (
        <div className="relative">
            <motion.div
                className="relative group cursor-pointer"
                onMouseEnter={() => showTooltip && setShowDetails(true)}
                onMouseLeave={() => showTooltip && setShowDetails(false)}
                onClick={handleUnlock}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Badge Container */}
                <div className={`relative ${sizeClasses[size]} rounded-full ${unlocked ? '' : 'opacity-40 grayscale'} transition-all duration-300`}>
                    {/* Outer Glow Ring */}
                    {unlocked && (
                        <motion.div
                            className={`absolute inset-0 rounded-full bg-gradient-to-br ${rarityStyle.gradient} opacity-20 blur-xl`}
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        />
                    )}

                    {/* Main Badge Circle */}
                    <div className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br ${rarityStyle.gradient} ${rarityStyle.border} border-4 flex items-center justify-center shadow-2xl overflow-hidden`}>
                        {/* Shine Effect for Legendary */}
                        {unlocked && rarityStyle.shine && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{
                                    x: ['-100%', '200%']
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                    ease: 'easeInOut'
                                }}
                            />
                        )}

                        {/* Locked Overlay */}
                        {!unlocked && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <Lock className="w-8 h-8 text-zinc-500" />
                            </div>
                        )}

                        {/* Icon */}
                        <Icon className={`${iconSizes[size]} ${rarityStyle.text} relative z-10`} />

                        {/* Progress Ring (if not unlocked) */}
                        {!unlocked && progress > 0 && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="45%"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="3"
                                />
                                <motion.circle
                                    cx="50%"
                                    cy="50%"
                                    r="45%"
                                    fill="none"
                                    stroke="rgba(99,102,241,0.8)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: progress / 100 }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{
                                        strokeDasharray: '1 1'
                                    }}
                                />
                            </svg>
                        )}
                    </div>

                    {/* Rarity Stars */}
                    {unlocked && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                            {Array.from({ length: rarity === 'legendary' ? 5 : rarity === 'epic' ? 4 : rarity === 'rare' ? 3 : 2 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                                >
                                    <Star className={`w-2.5 h-2.5 ${rarityStyle.text} fill-current`} />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Celebration Effect */}
                <AnimatePresence>
                    {celebrating && (
                        <>
                            {/* Burst Particles */}
                            {Array.from({ length: 12 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-gradient-to-r ${rarityStyle.gradient}`}
                                    initial={{ scale: 0, x: 0, y: 0 }}
                                    animate={{
                                        scale: [0, 1, 0],
                                        x: Math.cos((i / 12) * Math.PI * 2) * 100,
                                        y: Math.sin((i / 12) * Math.PI * 2) * 100,
                                        opacity: [1, 1, 0]
                                    }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                            ))}

                            {/* Glow Pulse */}
                            <motion.div
                                className={`absolute inset-0 rounded-full bg-gradient-to-br ${rarityStyle.gradient}`}
                                initial={{ scale: 1, opacity: 0.5 }}
                                animate={{ scale: 3, opacity: 0 }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Tooltip */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none"
                    >
                        <div className={`bg-zinc-900 border-2 ${rarityStyle.border} rounded-xl p-4 shadow-2xl backdrop-blur-xl min-w-[200px]`}>
                            {/* Rarity Badge */}
                            <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mb-2 bg-gradient-to-r ${rarityStyle.gradient} ${rarityStyle.text}`}>
                                {rarity}
                            </div>

                            {/* Name */}
                            <h4 className="text-sm font-bold text-white mb-1">{name}</h4>

                            {/* Description */}
                            <p className="text-xs text-zinc-400 mb-2">{description}</p>

                            {/* Progress or Unlock Date */}
                            {unlocked ? (
                                unlockedAt && (
                                    <p className="text-[10px] text-emerald-400 font-mono">
                                        Unlocked: {new Date(unlockedAt).toLocaleDateString()}
                                    </p>
                                )
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-zinc-500">
                                        <span>Progress</span>
                                        <span className="font-mono">{progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-indigo-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tooltip Arrow */}
                        <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-px w-3 h-3 rotate-45 bg-zinc-900 border-r-2 border-b-2 ${rarityStyle.border}`} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AchievementBadge;
