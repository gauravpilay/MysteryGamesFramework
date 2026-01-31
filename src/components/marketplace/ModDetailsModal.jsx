import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart, Star, User, Calendar, Eye, Shield, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function ModDetailsModal({ mod, onClose, onInstall, isInstalled, isFavorited, onToggleFavorite }) {
    const [currentScreenshot, setCurrentScreenshot] = useState(0);

    const screenshots = mod.screenshots || [mod.thumbnailUrl];

    const nextScreenshot = () => {
        setCurrentScreenshot((prev) => (prev + 1) % screenshots.length);
    };

    const prevScreenshot = () => {
        setCurrentScreenshot((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-2 border-white/20 rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-xl transition-colors backdrop-blur-sm"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '90vh' }}>
                        {/* Hero Section with Screenshots */}
                        <div className="relative h-96 bg-zinc-900">
                            {screenshots.length > 0 && (
                                <>
                                    <img
                                        src={screenshots[currentScreenshot]}
                                        alt={`Screenshot ${currentScreenshot + 1}`}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Screenshot Navigation */}
                                    {screenshots.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevScreenshot}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-xl transition-colors backdrop-blur-sm"
                                            >
                                                <ChevronLeft className="w-6 h-6 text-white" />
                                            </button>
                                            <button
                                                onClick={nextScreenshot}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-xl transition-colors backdrop-blur-sm"
                                            >
                                                <ChevronRight className="w-6 h-6 text-white" />
                                            </button>

                                            {/* Dots */}
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                {screenshots.map((_, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setCurrentScreenshot(index)}
                                                        className={`w-2 h-2 rounded-full transition-all ${index === currentScreenshot
                                                                ? 'bg-white w-8'
                                                                : 'bg-white/50 hover:bg-white/70'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-full">
                                            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">{mod.type}</span>
                                        </div>
                                        {mod.featured && (
                                            <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full">
                                                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">⭐ Featured</span>
                                            </div>
                                        )}
                                    </div>

                                    <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-3">{mod.title}</h1>

                                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span>by <span className="text-white font-semibold">{mod.author}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{mod.createdAt ? new Date(mod.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            <span>{(mod.views || 0).toLocaleString()} views</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Download className="w-4 h-4" />
                                            <span>{(mod.downloads || 0).toLocaleString()} downloads</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onToggleFavorite(mod)}
                                        className={`px-6 py-3 rounded-xl border-2 font-bold transition-all ${isFavorited
                                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                                : 'bg-white/5 border-white/20 text-zinc-400 hover:border-rose-500/30 hover:text-rose-400'
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-400' : ''}`} />
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onInstall(mod)}
                                        disabled={isInstalled}
                                        className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${isInstalled
                                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-indigo-500/50'
                                            }`}
                                    >
                                        <Download className="w-5 h-5" />
                                        {isInstalled ? 'Installed' : 'Install Mod'}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-6 h-6 ${i < Math.floor(mod.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-zinc-700'}`}
                                        />
                                    ))}
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-white">{mod.rating ? mod.rating.toFixed(1) : 'N/A'}</div>
                                    <div className="text-xs text-zinc-500">{mod.reviewCount || 0} reviews</div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-8">
                                <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Description</h2>
                                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{mod.description || 'No description provided.'}</p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-4 h-4 text-emerald-400" />
                                        <span className="text-xs text-zinc-500 uppercase tracking-wider">Version</span>
                                    </div>
                                    <div className="text-xl font-black text-white">{mod.version || '1.0.0'}</div>
                                </div>

                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs text-zinc-500 uppercase tracking-wider">Compatibility</span>
                                    </div>
                                    <div className="text-xl font-black text-white">{mod.compatibility || 'All Versions'}</div>
                                </div>
                            </div>

                            {/* Tags */}
                            {mod.tags && mod.tags.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Tags</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {mod.tags.map((tag, index) => (
                                            <div key={index} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                                <span className="text-sm text-zinc-300">{tag}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reviews Section (Placeholder) */}
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Reviews</h2>
                                <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
                                    <p className="text-zinc-500">Reviews coming soon!</p>
                                    <p className="text-zinc-600 text-sm mt-2">Be the first to review this mod</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
