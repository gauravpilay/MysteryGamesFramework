import React from 'react';

export const Logo = ({ className = "w-10 h-10" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" /> {/* Indigo 500 */}
                <stop offset="100%" stopColor="#d946ef" /> {/* Fuchsia 500 */}
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        {/* 'O' - The Base Ring */}
        <circle cx="50" cy="50" r="42" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" className="opacity-90" />

        {/* 'G' - The Inner Geometric Arc */}
        <path d="M 70 35 A 25 25 0 1 0 70 65 L 70 55 L 58 55" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80" />

        {/* 'A' - The Central Peak */}
        <path d="M 35 65 L 50 30 L 65 65" stroke="url(#logoGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 42 55 H 58" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
);
