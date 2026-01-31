import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Star, Zap, Award, Sparkles } from 'lucide-react';

/**
 * Progress Celebration Component
 * Triggers celebration animations for achievements and milestones
 * Features:
 * - Confetti explosions
 * - Animated trophy/badge reveal
 * - Sound effects (optional)
 * - Customizable celebration types
 */

const CELEBRATION_TYPES = {
    achievement: {
        icon: Trophy,
        title: 'Achievement Unlocked!',
        color: 'from-amber-500 to-orange-600',
        confettiColors: ['#f59e0b', '#f97316', '#fbbf24']
    },
    milestone: {
        icon: Star,
        title: 'Milestone Reached!',
        color: 'from-indigo-500 to-purple-600',
        confettiColors: ['#6366f1', '#8b5cf6', '#a855f7']
    },
    levelup: {
        icon: Zap,
        title: 'Level Up!',
        color: 'from-emerald-500 to-teal-600',
        confettiColors: ['#10b981', '#14b8a6', '#06b6d4']
    },
    perfect: {
        icon: Award,
        title: 'Perfect Score!',
        color: 'from-pink-500 to-rose-600',
        confettiColors: ['#ec4899', '#f43f5e', '#fb7185']
    },
    streak: {
        icon: Sparkles,
        title: 'Streak Bonus!',
        color: 'from-yellow-500 to-amber-600',
        confettiColors: ['#eab308', '#f59e0b', '#fbbf24']
    }
};

const ProgressCelebration = ({
    show = false,
    type = 'achievement',
    message = '',
    subtitle = '',
    onComplete = null,
    duration = 3000,
    enableSound = false
}) => {
    const [visible, setVisible] = useState(false);
    const celebrationType = CELEBRATION_TYPES[type] || CELEBRATION_TYPES.achievement;
    const Icon = celebrationType.icon;

    useEffect(() => {
        if (show) {
            setVisible(true);
            triggerCelebration();

            // Auto-hide after duration
            const timer = setTimeout(() => {
                setVisible(false);
                if (onComplete) {
                    setTimeout(onComplete, 500);
                }
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, duration, onComplete]);

    const triggerCelebration = () => {
        // Confetti burst
        const colors = celebrationType.confettiColors;

        // Center burst
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors
        });

        // Side bursts
        setTimeout(() => {
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });
        }, 200);

        // Continuous sparkles
        const sparkleInterval = setInterval(() => {
            confetti({
                particleCount: 3,
                spread: 360,
                ticks: 50,
                gravity: 0,
                decay: 0.94,
                startVelocity: 30,
                colors: colors,
                origin: {
                    x: Math.random(),
                    y: Math.random() - 0.2
                }
            });
        }, 100);

        setTimeout(() => clearInterval(sparkleInterval), 2000);

        // Play sound effect (if enabled)
        if (enableSound) {
            playSuccessSound();
        }
    };

    const playSuccessSound = () => {
        // Create a simple success sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
                >
                    {/* Main Celebration Card */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180, y: 100 }}
                        animate={{ scale: 1, rotate: 0, y: 0 }}
                        exit={{ scale: 0, rotate: 180, y: -100 }}
                        transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 20,
                            duration: 0.6
                        }}
                        className="relative pointer-events-auto"
                    >
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${celebrationType.color} opacity-30 blur-3xl rounded-full`} />

                        {/* Card Container */}
                        <div className="relative bg-zinc-900 border-4 border-white/20 rounded-3xl p-12 shadow-2xl max-w-md">
                            {/* Animated Rings */}
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={`absolute inset-0 rounded-3xl border-2 border-gradient-to-br ${celebrationType.color}`}
                                    initial={{ scale: 1, opacity: 0.5 }}
                                    animate={{
                                        scale: [1, 1.5, 2],
                                        opacity: [0.5, 0.2, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        delay: i * 0.3,
                                        repeat: Infinity,
                                        ease: 'easeOut'
                                    }}
                                />
                            ))}

                            {/* Icon */}
                            <motion.div
                                className="relative mx-auto mb-6"
                                animate={{
                                    rotate: [0, 10, -10, 10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    repeatDelay: 1
                                }}
                            >
                                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${celebrationType.color} flex items-center justify-center shadow-2xl`}>
                                    <Icon className="w-12 h-12 text-white" />
                                </div>

                                {/* Sparkles around icon */}
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 bg-white rounded-full"
                                        style={{
                                            top: '50%',
                                            left: '50%',
                                            transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-50px)`
                                        }}
                                        animate={{
                                            scale: [0, 1, 0],
                                            opacity: [0, 1, 0]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            delay: i * 0.1,
                                            repeat: Infinity,
                                            repeatDelay: 0.5
                                        }}
                                    />
                                ))}
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                className={`text-3xl font-black text-center mb-3 bg-gradient-to-r ${celebrationType.color} bg-clip-text text-transparent uppercase tracking-tight`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {celebrationType.title}
                            </motion.h2>

                            {/* Message */}
                            {message && (
                                <motion.p
                                    className="text-xl font-bold text-white text-center mb-2"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    {message}
                                </motion.p>
                            )}

                            {/* Subtitle */}
                            {subtitle && (
                                <motion.p
                                    className="text-sm text-zinc-400 text-center"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {subtitle}
                                </motion.p>
                            )}

                            {/* Decorative Elements */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/20 rounded-tl-2xl" />
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/20 rounded-tr-2xl" />
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white/20 rounded-bl-2xl" />
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white/20 rounded-br-2xl" />
                        </div>
                    </motion.div>

                    {/* Background Particles */}
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={`absolute w-3 h-3 rounded-full bg-gradient-to-br ${celebrationType.color}`}
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`
                            }}
                            animate={{
                                y: [0, -100, 0],
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                delay: Math.random() * 0.5,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProgressCelebration;
