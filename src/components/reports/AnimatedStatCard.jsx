import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';

/**
 * Animated Stat Card with Counter Animation
 * Features:
 * - Number counting animation
 * - Particle effects
 * - Holographic tilt effect
 * - Glassmorphism design
 * - Glow effects on hover
 */

const AnimatedStatCard = ({
    icon: Icon,
    title,
    value,
    suffix = '',
    prefix = '',
    color = 'text-blue-400',
    bg = 'bg-blue-500/10',
    border = 'border-blue-500/20',
    delay = 0,
    trend = null, // { value: number, direction: 'up' | 'down' }
    sparkle = false
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [displayValue, setDisplayValue] = useState(0);
    const [particles, setParticles] = useState([]);

    // Extract numeric value
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : value;

    const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(value));

    // Animated counter
    useEffect(() => {
        if (!isInView || !isNumeric) {
            if (!isNumeric) setDisplayValue(value);
            return;
        }

        const numericVal = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : value;
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = numericVal / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;

            if (step >= steps) {
                setDisplayValue(numericVal);
                clearInterval(timer);
            } else {
                // Easing function
                const progress = step / steps;
                const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
                setDisplayValue(Math.floor(numericVal * eased));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [isInView, value, isNumeric]);

    // Generate particles for sparkle effect
    useEffect(() => {
        if (!sparkle) return;

        const particleCount = 20;
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2
        }));
        setParticles(newParticles);
    }, [sparkle]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{
                scale: 1.05,
                rotateY: 5,
                rotateX: -5,
                transition: { duration: 0.3 }
            }}
            className="relative group perspective-1000"
        >
            {/* Card Container */}
            <div className={`relative ${bg} ${border} border-2 rounded-2xl p-6 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.3)]`}>
                {/* Holographic Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Animated Border Glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: `linear-gradient(45deg, transparent, ${color.replace('text-', 'rgba(').replace('-400', ', 0.3)')}, transparent)`,
                        backgroundSize: '200% 200%',
                        animation: 'gradient-shift 3s ease infinite'
                    }}
                />

                {/* Sparkle Particles */}
                {sparkle && particles.map(particle => (
                    <motion.div
                        key={particle.id}
                        className="absolute rounded-full bg-white/60"
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            filter: 'blur(1px)'
                        }}
                        animate={{
                            y: [-20, -60, -20],
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0]
                        }}
                        transition={{
                            duration: particle.duration,
                            delay: particle.delay,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                ))}

                {/* Content */}
                <div className="relative z-10">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={isInView ? { scale: 1, rotate: 0 } : {}}
                        transition={{ duration: 0.6, delay: delay + 0.2, type: 'spring', stiffness: 200 }}
                        className={`w-14 h-14 rounded-xl ${bg} ${border} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                        <Icon className={`w-7 h-7 ${color}`} />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        {title}
                    </h3>

                    {/* Value with Counter Animation */}
                    <div className="flex items-baseline gap-2">
                        <motion.div
                            className={`text-4xl font-black ${color} drop-shadow-lg`}
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : {}}
                            transition={{ duration: 0.3, delay: delay + 0.4 }}
                        >
                            {prefix}{displayValue}{suffix}
                        </motion.div>

                        {/* Trend Indicator */}
                        {trend && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.4, delay: delay + 0.6 }}
                                className={`flex items-center gap-1 text-xs font-bold ${trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'
                                    }`}
                            >
                                <svg
                                    className={`w-4 h-4 ${trend.direction === 'down' ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                {trend.value}%
                            </motion.div>
                        )}
                    </div>

                    {/* Animated Progress Bar (optional) */}
                    {isNumeric && numericValue <= 100 && (
                        <motion.div
                            className="mt-4 h-1.5 bg-zinc-800/50 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : {}}
                            transition={{ duration: 0.3, delay: delay + 0.5 }}
                        >
                            <motion.div
                                className={`h-full ${color.replace('text-', 'bg-')} rounded-full`}
                                initial={{ width: 0 }}
                                animate={isInView ? { width: `${displayValue}%` } : {}}
                                transition={{ duration: 1.5, delay: delay + 0.6, ease: 'easeOut' }}
                            />
                        </motion.div>
                    )}
                </div>

                {/* Corner Accents */}
                <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${border} rounded-tl-2xl opacity-50`} />
                <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${border} rounded-br-2xl opacity-50`} />
            </div>

            {/* External Glow Effect */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl -z-10 ${bg}`} />
        </motion.div>
    );
};

// Add keyframes for gradient animation
const style = document.createElement('style');
style.textContent = `
    @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
    }
`;
document.head.appendChild(style);

export default AnimatedStatCard;
