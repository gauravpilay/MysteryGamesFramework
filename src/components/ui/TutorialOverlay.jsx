import React, { useState, useEffect } from 'react';
import { Button } from './shared';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TutorialOverlay = ({ steps, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);

    useEffect(() => {
        const updateRect = () => {
            const step = steps[currentStep];
            if (step.targetId) {
                const element = document.getElementById(step.targetId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    setTargetRect({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    });
                }
            } else {
                setTargetRect(null);
            }
        };

        updateRect();
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, [currentStep, steps]);

    const step = steps[currentStep];

    const nextStep = () => {
        if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
        else onClose();
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    return (
        <div className="fixed inset-0 z-50 pointer-events-auto">
            {/* Backdrop with cutout using simple div overlays */}
            {/* Top */}
            <div className="absolute bg-black/70 transition-all duration-300 ease-out" style={{ top: 0, left: 0, right: 0, height: targetRect ? targetRect.top : '100%' }} />
            {/* Bottom */}
            <div className="absolute bg-black/70 transition-all duration-300 ease-out" style={{ top: targetRect ? targetRect.top + targetRect.height : '100%', left: 0, right: 0, bottom: 0 }} />
            {/* Left */}
            <div className="absolute bg-black/70 transition-all duration-300 ease-out" style={{ top: targetRect ? targetRect.top : 0, left: 0, width: targetRect ? targetRect.left : '100%', height: targetRect ? targetRect.height : 0 }} />
            {/* Right */}
            <div className="absolute bg-black/70 transition-all duration-300 ease-out" style={{ top: targetRect ? targetRect.top : 0, left: targetRect ? targetRect.left + targetRect.width : '100%', right: 0, height: targetRect ? targetRect.height : 0 }} />

            {/* Highlight Border */}
            {targetRect && (
                <motion.div
                    layoutId="highlight-box"
                    className="absolute border-2 border-indigo-500 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.5)] pointer-events-none"
                    style={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                    }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            {/* Tooltip Card */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl max-w-md w-full pointer-events-auto relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>

                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <div className="flex gap-1 text-xs text-zinc-600">
                            {steps.map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-indigo-500' : 'bg-zinc-800'}`} />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <Button variant="ghost" size="sm" onClick={prevStep}>
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                                </Button>
                            )}
                            <Button size="sm" onClick={nextStep}>
                                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                                {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
