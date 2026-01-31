import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Volume2, VolumeX, Film } from 'lucide-react';

/**
 * Cinematic Cutscene Generator
 * Transforms story nodes into animated, cinematic experiences with:
 * - Letterboxing and cinematic aspect ratio
 * - Animated text reveals with typewriter effects
 * - Dynamic camera movements and transitions
 * - Character animations and expressions
 * - Particle effects and atmospheric elements
 * - Multiple camera angles and shot types
 */

const CinematicCutscene = ({
    storyText,
    characterName = null,
    characterImage = null,
    mood = 'neutral', // 'neutral', 'tense', 'dramatic', 'mysterious', 'action'
    cameraAngle = 'medium', // 'closeup', 'medium', 'wide', 'dramatic'
    onComplete,
    autoPlay = true,
    showControls = true
}) => {
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [showCharacter, setShowCharacter] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [particles, setParticles] = useState([]);
    const textIndexRef = useRef(0);
    const audioRef = useRef(null);
    const textSegmentsRef = useRef([]);

    // Parse text into segments (sentences or paragraphs)
    // More robust parsing that handles various text formats
    const textSegments = React.useMemo(() => {
        if (!storyText || storyText.trim() === '') return ['No dialogue provided.'];

        // Try to split by sentences
        const segments = storyText.split(/(?<=[.!?])\s+/).filter(s => s.trim());

        // If no segments found (no punctuation), split by newlines or use whole text
        if (segments.length === 0) {
            const lines = storyText.split('\n').filter(s => s.trim());
            return lines.length > 0 ? lines : [storyText];
        }

        return segments;
    }, [storyText]);

    // Update ref whenever segments change
    useEffect(() => {
        textSegmentsRef.current = textSegments;
    }, [textSegments]);

    // Mood-based visual settings
    const moodSettings = {
        neutral: {
            bgGradient: 'from-zinc-900 via-zinc-800 to-zinc-900',
            textColor: 'text-zinc-100',
            accentColor: 'text-blue-400',
            particleColor: 'rgba(59, 130, 246, 0.3)',
            vignette: 'opacity-40'
        },
        tense: {
            bgGradient: 'from-red-950 via-zinc-900 to-red-950',
            textColor: 'text-red-100',
            accentColor: 'text-red-400',
            particleColor: 'rgba(239, 68, 68, 0.4)',
            vignette: 'opacity-60'
        },
        dramatic: {
            bgGradient: 'from-purple-950 via-zinc-900 to-indigo-950',
            textColor: 'text-purple-100',
            accentColor: 'text-purple-400',
            particleColor: 'rgba(168, 85, 247, 0.3)',
            vignette: 'opacity-50'
        },
        mysterious: {
            bgGradient: 'from-emerald-950 via-zinc-900 to-teal-950',
            textColor: 'text-emerald-100',
            accentColor: 'text-emerald-400',
            particleColor: 'rgba(16, 185, 129, 0.3)',
            vignette: 'opacity-50'
        },
        action: {
            bgGradient: 'from-orange-950 via-zinc-900 to-yellow-950',
            textColor: 'text-orange-100',
            accentColor: 'text-orange-400',
            particleColor: 'rgba(249, 115, 22, 0.4)',
            vignette: 'opacity-30'
        }
    };

    const currentMood = moodSettings[mood] || moodSettings.neutral;

    // Camera angle settings
    const cameraSettings = {
        closeup: { scale: 1.3, blur: 'blur-sm' },
        medium: { scale: 1.0, blur: 'blur-none' },
        wide: { scale: 0.8, blur: 'blur-none' },
        dramatic: { scale: 1.1, blur: 'blur-[1px]' }
    };

    const currentCamera = cameraSettings[cameraAngle] || cameraSettings.medium;

    // Generate atmospheric particles
    useEffect(() => {
        const particleCount = 30;
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 10 + 10,
            delay: Math.random() * 5
        }));
        setParticles(newParticles);
    }, [mood]);

    // Typewriter effect
    useEffect(() => {
        const segments = textSegmentsRef.current;
        if (!isPlaying || currentTextIndex >= segments.length) return;

        const currentSegment = segments[currentTextIndex];
        console.log('Cutscene - Current segment:', currentSegment);
        console.log('Cutscene - Text index:', currentTextIndex);

        setDisplayedText('');
        textIndexRef.current = 0;

        const typeInterval = setInterval(() => {
            if (textIndexRef.current < currentSegment.length) {
                setDisplayedText(currentSegment.slice(0, textIndexRef.current + 1));
                textIndexRef.current++;
            } else {
                clearInterval(typeInterval);

                // Auto-advance to next segment after a pause
                setTimeout(() => {
                    if (currentTextIndex + 1 < segments.length) {
                        setCurrentTextIndex(prev => prev + 1);
                    } else {
                        // Cutscene complete
                        setTimeout(() => {
                            if (onComplete) onComplete();
                        }, 2000);
                    }
                }, 1500);
            }
        }, 30); // Typing speed

        return () => clearInterval(typeInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTextIndex, isPlaying]);

    // Show character with delay
    useEffect(() => {
        if (characterImage) {
            const timer = setTimeout(() => setShowCharacter(true), 500);
            return () => clearTimeout(timer);
        }
    }, [characterImage]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSkip = () => {
        if (currentTextIndex + 1 < textSegments.length) {
            setCurrentTextIndex(prev => prev + 1);
        } else if (onComplete) {
            onComplete();
        }
    };

    const parseRichText = (text) => {
        if (!text) return '';

        // Bold: **text**
        let parsed = text.replace(/\*\*(.*?)\*\*/g, '<span class="font-black text-white drop-shadow-lg">$1</span>');

        // Colors
        const colors = {
            red: 'text-red-400',
            blue: 'text-blue-400',
            green: 'text-emerald-400',
            yellow: 'text-amber-300',
            indigo: 'text-indigo-400',
            orange: 'text-orange-400'
        };

        Object.entries(colors).forEach(([color, className]) => {
            const regex = new RegExp(`\\[${color}\\](.*?)\\[\\/${color}\\]`, 'g');
            parsed = parsed.replace(regex, `<span class="${className} font-bold drop-shadow-lg">$1</span>`);
        });

        return parsed;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            {/* Cinematic Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${currentMood.bgGradient}`}>
                {/* Animated Particles */}
                {particles.map(particle => (
                    <motion.div
                        key={particle.id}
                        className="absolute rounded-full"
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            backgroundColor: currentMood.particleColor,
                            filter: 'blur(1px)'
                        }}
                        animate={{
                            y: [0, -100, 0],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: particle.duration,
                            delay: particle.delay,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                ))}

                {/* Vignette */}
                <div className={`absolute inset-0 bg-[radial-gradient(circle,_transparent_40%,_black_100%)] ${currentMood.vignette}`} />

                {/* Scanlines */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
                }} />
            </div>

            {/* Letterbox Bars */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-black z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-black z-10" />

            {/* Main Content Area */}
            <div className="relative w-full h-full flex items-center justify-center px-8 py-20">
                <motion.div
                    className="relative w-full max-w-6xl h-full flex items-center justify-between gap-8"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: currentCamera.scale, opacity: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                >
                    {/* Character Display */}
                    {characterImage && (
                        <AnimatePresence>
                            {showCharacter && (
                                <motion.div
                                    className="relative w-1/3 h-full flex items-center justify-center"
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -100, opacity: 0 }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                >
                                    <div className="relative">
                                        {/* Holographic Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl animate-pulse" />

                                        <img
                                            src={characterImage}
                                            alt={characterName || 'Character'}
                                            className={`relative w-full h-auto max-h-[600px] object-contain drop-shadow-2xl ${currentCamera.blur}`}
                                            style={{
                                                filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))'
                                            }}
                                        />

                                        {/* Character Name Tag */}
                                        {characterName && (
                                            <motion.div
                                                className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-black/80 border border-${currentMood.accentColor.split('-')[1]}-500/50 rounded-lg backdrop-blur-sm`}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <p className={`text-sm font-bold tracking-wider uppercase ${currentMood.accentColor}`}>
                                                    {characterName}
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Text Display */}
                    <motion.div
                        className={`flex-1 ${characterImage ? 'w-2/3' : 'w-full text-center'}`}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="relative">
                            {/* Text Container */}
                            <div className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
                                {/* Decorative Corner Accents */}
                                <div className={`absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-${currentMood.accentColor.split('-')[1]}-500/50 rounded-tl-2xl`} />
                                <div className={`absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-${currentMood.accentColor.split('-')[1]}-500/50 rounded-tr-2xl`} />
                                <div className={`absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-${currentMood.accentColor.split('-')[1]}-500/50 rounded-bl-2xl`} />
                                <div className={`absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-${currentMood.accentColor.split('-')[1]}-500/50 rounded-br-2xl`} />

                                {/* Film Icon */}
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black border border-white/20 rounded-full p-3">
                                    <Film className={`w-6 h-6 ${currentMood.accentColor}`} />
                                </div>

                                {/* Text Content */}
                                <div className={`text-2xl leading-relaxed font-light ${currentMood.textColor} min-h-[200px] flex items-center justify-center`}>
                                    {displayedText ? (
                                        <>
                                            <p
                                                className="relative"
                                                dangerouslySetInnerHTML={{ __html: parseRichText(displayedText) }}
                                            />

                                            {/* Typing Cursor */}
                                            {isPlaying && textIndexRef.current < (textSegments[currentTextIndex]?.length || 0) && (
                                                <span className={`inline-block ml-1 w-2 h-6 ${currentMood.accentColor.replace('text-', 'bg-')} animate-pulse`} />
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-zinc-500 italic">Loading dialogue...</p>
                                    )}
                                </div>

                                {/* Progress Indicator */}
                                <div className="mt-6 flex gap-2 justify-center">
                                    {textSegments.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1 rounded-full transition-all duration-300 ${idx === currentTextIndex
                                                ? `w-8 ${currentMood.accentColor.replace('text-', 'bg-')}`
                                                : idx < currentTextIndex
                                                    ? 'w-4 bg-white/30'
                                                    : 'w-4 bg-white/10'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Playback Controls */}
            {showControls && (
                <motion.div
                    className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 z-20"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <button
                        onClick={handlePlayPause}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5 text-white" />
                        ) : (
                            <Play className="w-5 h-5 text-white" />
                        )}
                    </button>

                    <button
                        onClick={handleSkip}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Skip"
                    >
                        <SkipForward className="w-5 h-5 text-white" />
                    </button>

                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? (
                            <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                            <Volume2 className="w-5 h-5 text-white" />
                        )}
                    </button>

                    <div className="ml-4 text-xs text-white/60 font-mono">
                        {currentTextIndex + 1} / {textSegments.length}
                    </div>
                </motion.div>
            )}

            {/* Camera Angle Indicator */}
            <div className="absolute top-20 right-8 text-xs text-white/40 font-mono uppercase tracking-widest z-20">
                {cameraAngle} Shot
            </div>
        </div>
    );
};

export default CinematicCutscene;
