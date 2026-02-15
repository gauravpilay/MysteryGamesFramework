import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Send, X, Trophy, AlertCircle, Heart } from 'lucide-react';
import { Button, Card, Label } from './ui/shared';

const StarRating = ({ rating, setRating, hover, setHover }) => {
    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                    key={star}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="focus:outline-none"
                    type="button"
                >
                    <Star
                        className={`w-10 h-10 transition-colors ${(hover || rating) >= star
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                            : 'text-zinc-700'
                            }`}
                    />
                </motion.button>
            ))}
        </div>
    );
};

const FeedbackModal = ({ isOpen, onClose, onSubmit, caseTitle, isSimultaneous = false }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [difficulty, setDifficulty] = useState('');
    const [engagement, setEngagement] = useState('');
    const [comments, setComments] = useState('');
    const [step, setStep] = useState(1);

    const handleSubmit = () => {
        if (rating === 0) return;
        onSubmit({
            rating,
            difficulty,
            engagement,
            comments,
            timestamp: new Date().toISOString()
        });
    };

    if (!isOpen) return null;

    return (
        <div className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl`}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg"
            >
                <Card className="overflow-hidden border-zinc-800 bg-zinc-950/80 shadow-2xl relative">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 blur-[100px] rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-600/10 blur-[100px] rounded-full" />

                    <div className="p-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Mission Feedback</h2>
                                <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase mt-1">
                                    Operation: {caseTitle}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-4">
                                        <Label className="text-zinc-400">How would you rate your experience?</Label>
                                        <div className="flex justify-center py-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                                            <StarRating
                                                rating={rating}
                                                setRating={setRating}
                                                hover={hover}
                                                setHover={setHover}
                                            />
                                        </div>
                                        {rating > 0 && (
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-center text-amber-500 font-bold text-sm"
                                            >
                                                {rating === 5 ? "Incredible!" : rating === 4 ? "Great Experience" : rating === 3 ? "Pretty Good" : rating === 2 ? "Could be Better" : "Needs Work"}
                                            </motion.p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-zinc-400">Mission Difficulty</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Too Easy', 'Balanced', 'Challenging', 'Extreme'].map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setDifficulty(level)}
                                                    className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${difficulty === level
                                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                        }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold group"
                                        disabled={rating === 0}
                                        onClick={() => setStep(2)}
                                    >
                                        Next Component
                                        <motion.span
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                            <Send className="w-4 h-4 ml-2" />
                                        </motion.span>
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <Label className="text-zinc-400">Narrative Engagement</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Immersive', 'Good', 'Average', 'Poor'].map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setEngagement(level)}
                                                    className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${engagement === level
                                                        ? 'bg-fuchsia-600 border-fuchsia-500 text-white shadow-[0_0_15px_rgba(192,38,211,0.4)]'
                                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                        }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-zinc-400">Detailed Intelligence (Optional)</Label>
                                        <textarea
                                            value={comments}
                                            onChange={(e) => setComments(e.target.value)}
                                            placeholder="Any bugs, suggestions, or highlights?"
                                            className="w-full h-32 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-600 resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 rounded-xl"
                                            onClick={() => setStep(1)}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-black uppercase tracking-widest shadow-xl"
                                            onClick={handleSubmit}
                                        >
                                            Submit Report
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Info */}
                    <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-center gap-2">
                        <Heart className="w-3 h-3 text-fuchsia-500" />
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Thank you for helping us improve</span>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default FeedbackModal;
