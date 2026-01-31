import { motion } from 'framer-motion';
import { Download, Heart, Star, Eye, User, Calendar, Tag } from 'lucide-react';
import { useState } from 'react';

export default function ModCard({ mod, onInstall, onViewDetails, onToggleFavorite, isFavorited = false, isInstalled = false }) {
    const [isHovered, setIsHovered] = useState(false);

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getTypeColor = (type) => {
        const colors = {
            case: 'from-indigo-500 to-purple-600',
            character: 'from-emerald-500 to-teal-600',
            theme: 'from-amber-500 to-orange-600',
            plugin: 'from-rose-500 to-pink-600'
        };
        return colors[type] || colors.case;
    };

    const getTypeIcon = (type) => {
        const icons = {
            case: '🔍',
            character: '👤',
            theme: '🎨',
            plugin: '🔌'
        };
        return icons[type] || '📦';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative group cursor-pointer"
            onClick={() => onViewDetails(mod)}
        >
            {/* Glow Effect */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${getTypeColor(mod.type)} opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-2xl`}></div>

            <div className="relative bg-gradient-to-br from-zinc-900/90 to-black/90 border-2 border-white/10 group-hover:border-white/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl transition-all">
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-zinc-800">
                    {mod.thumbnailUrl ? (
                        <img
                            src={mod.thumbnailUrl}
                            alt={mod.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${getTypeColor(mod.type)} opacity-20 flex items-center justify-center`}>
                            <span className="text-6xl">{getTypeIcon(mod.type)}</span>
                        </div>
                    )}

                    {/* Overlay on Hover */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4"
                    >
                        <div className="text-xs text-white/80 line-clamp-2">{mod.description}</div>
                    </motion.div>

                    {/* Type Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/20">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">{mod.type}</span>
                    </div>

                    {/* Featured Badge */}
                    {mod.featured && (
                        <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">⭐ Featured</span>
                        </div>
                    )}

                    {/* Installed Badge */}
                    {isInstalled && (
                        <div className="absolute bottom-3 right-3 px-3 py-1 bg-emerald-500/90 backdrop-blur-md rounded-full">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">✓ Installed</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Title */}
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all">
                        {mod.title}
                    </h3>

                    {/* Author */}
                    <div className="flex items-center gap-2 mb-3">
                        <User className="w-3 h-3 text-zinc-500" />
                        <span className="text-xs text-zinc-400">by <span className="text-zinc-300 font-semibold">{mod.author}</span></span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < Math.floor(mod.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-zinc-700'}`}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-zinc-400">
                            {mod.rating ? mod.rating.toFixed(1) : 'N/A'}
                        </span>
                        <span className="text-xs text-zinc-600">
                            ({mod.reviewCount || 0})
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="text-xs font-semibold text-zinc-400">{formatNumber(mod.views || 0)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Download className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="text-xs font-semibold text-zinc-400">{formatNumber(mod.downloads || 0)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-zinc-600" />
                            <span className="text-[10px] text-zinc-600">
                                {mod.createdAt ? new Date(mod.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recent'}
                            </span>
                        </div>
                    </div>

                    {/* Tags */}
                    {mod.tags && mod.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {mod.tags.slice(0, 3).map((tag, index) => (
                                <div key={index} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full">
                                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider">{tag}</span>
                                </div>
                            ))}
                            {mod.tags.length > 3 && (
                                <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider">+{mod.tags.length - 3}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onInstall(mod);
                            }}
                            disabled={isInstalled}
                            className={`flex-1 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${isInstalled
                                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-indigo-500/50'
                                }`}
                        >
                            {isInstalled ? '✓ Installed' : '⬇ Install'}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(mod);
                            }}
                            className={`px-3 py-2.5 rounded-xl border-2 transition-all ${isFavorited
                                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                    : 'bg-white/5 border-white/10 text-zinc-500 hover:border-rose-500/30 hover:text-rose-400'
                                }`}
                        >
                            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-400' : ''}`} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
