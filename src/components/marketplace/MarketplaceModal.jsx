import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, TrendingUp, Star, Upload, Grid3x3, List, Package, Users, Zap, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ModCard from './ModCard';
import ModDetailsModal from './ModDetailsModal';
import ModUploadModal from './ModUploadModal';
import { sampleMods } from '../../data/sampleMods';

export default function MarketplaceModal({ isOpen, onClose, currentUser }) {
    const [mods, setMods] = useState([]);
    const [filteredMods, setFilteredMods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedMod, setSelectedMod] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [installedMods, setInstalledMods] = useState(new Set());
    const [favoriteMods, setFavoriteMods] = useState(new Set());
    const [stats, setStats] = useState({ totalMods: 0, totalDownloads: 0, totalCreators: 0 });

    useEffect(() => {
        if (isOpen) {
            fetchMods();
            loadUserData();
        }
    }, [isOpen]);

    useEffect(() => {
        filterAndSortMods();
    }, [mods, searchQuery, selectedType, sortBy]);

    const fetchMods = async () => {
        setLoading(true);
        try {
            const modsRef = collection(db, 'marketplace_mods');
            const q = query(modsRef, orderBy('createdAt', 'desc'), limit(50));
            const snapshot = await getDocs(q);

            const modsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setMods(modsData);

            // Calculate stats
            const totalDownloads = modsData.reduce((sum, mod) => sum + (mod.downloads || 0), 0);
            const uniqueCreators = new Set(modsData.map(mod => mod.authorId)).size;
            setStats({
                totalMods: modsData.length,
                totalDownloads,
                totalCreators: uniqueCreators
            });
        } catch (error) {
            console.error('Error fetching mods:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserData = () => {
        // Load from localStorage
        const installed = JSON.parse(localStorage.getItem('installedMods') || '[]');
        const favorites = JSON.parse(localStorage.getItem('favoriteMods') || '[]');
        setInstalledMods(new Set(installed));
        setFavoriteMods(new Set(favorites));
    };

    const filterAndSortMods = () => {
        let filtered = [...mods];

        // Filter by type
        if (selectedType !== 'all') {
            filtered = filtered.filter(mod => mod.type === selectedType);
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(mod =>
                mod.title?.toLowerCase().includes(query) ||
                mod.description?.toLowerCase().includes(query) ||
                mod.author?.toLowerCase().includes(query) ||
                mod.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Sort
        switch (sortBy) {
            case 'popular':
                filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                break;
            case 'recent':
                filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                break;
            case 'rating':
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'trending':
                // Simple trending: recent + popular
                filtered.sort((a, b) => {
                    const aScore = (a.downloads || 0) * 0.7 + (a.createdAt?.seconds || 0) * 0.3;
                    const bScore = (b.downloads || 0) * 0.7 + (b.createdAt?.seconds || 0) * 0.3;
                    return bScore - aScore;
                });
                break;
        }

        setFilteredMods(filtered);
    };

    const handleInstall = async (mod) => {
        if (installedMods.has(mod.id)) return;

        // Simulate installation
        const newInstalled = new Set(installedMods);
        newInstalled.add(mod.id);
        setInstalledMods(newInstalled);
        localStorage.setItem('installedMods', JSON.stringify([...newInstalled]));

        // Update download count (in real app, this would be server-side)
        console.log(`Installing mod: ${mod.title}`);

        // Show success notification
        alert(`✓ ${mod.title} installed successfully!`);
    };

    const handleToggleFavorite = (mod) => {
        const newFavorites = new Set(favoriteMods);
        if (newFavorites.has(mod.id)) {
            newFavorites.delete(mod.id);
        } else {
            newFavorites.add(mod.id);
        }
        setFavoriteMods(newFavorites);
        localStorage.setItem('favoriteMods', JSON.stringify([...newFavorites]));
    };

    const loadSampleData = async () => {
        if (!db) {
            alert('Database not connected');
            return;
        }

        const confirmed = window.confirm('Load 8 sample mods into the marketplace? This will add new mods to your database.');
        if (!confirmed) return;

        setLoading(true);
        try {
            for (const mod of sampleMods) {
                const modData = {
                    ...mod,
                    authorId: currentUser?.uid || 'sample-user',
                    createdAt: Timestamp.fromDate(mod.createdAt),
                    updatedAt: Timestamp.now()
                };

                await addDoc(collection(db, 'marketplace_mods'), modData);
            }

            alert('✓ Sample mods loaded successfully!');
            fetchMods(); // Refresh the list
        } catch (error) {
            console.error('Error loading sample mods:', error);
            alert('Error loading sample mods. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const featuredMods = mods.filter(mod => mod.featured).slice(0, 4);
    const trendingMods = [...mods].sort((a, b) => {
        const aScore = (a.downloads || 0) * 0.7 + (a.createdAt?.seconds || 0) * 0.3;
        const bScore = (b.downloads || 0) * 0.7 + (b.createdAt?.seconds || 0) * 0.3;
        return bScore - aScore;
    }).slice(0, 4);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-7xl max-h-[90vh] bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-2 border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative border-b border-white/10 bg-gradient-to-r from-zinc-900/90 to-black/90 backdrop-blur-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Community Marketplace</h2>
                                    <p className="text-xs text-zinc-400 mt-0.5">Discover & install amazing mods</p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6 text-zinc-400" />
                            </button>
                        </div>

                        {/* Stats Bar */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <Package className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Total Mods</span>
                                </div>
                                <div className="text-2xl font-black text-white">{stats.totalMods}</div>
                            </div>
                            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Downloads</span>
                                </div>
                                <div className="text-2xl font-black text-white">{stats.totalDownloads.toLocaleString()}</div>
                            </div>
                            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Creators</span>
                                </div>
                                <div className="text-2xl font-black text-white">{stats.totalCreators}</div>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex gap-3 mt-6">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search mods, authors, tags..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>

                            {/* Type Filter */}
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                            >
                                <option value="all">All Types</option>
                                <option value="case">🔍 Cases</option>
                                <option value="character">👤 Characters</option>
                                <option value="theme">🎨 Themes</option>
                                <option value="plugin">🔌 Plugins</option>
                            </select>

                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                            >
                                <option value="popular">Popular</option>
                                <option value="recent">Recent</option>
                                <option value="rating">Top Rated</option>
                                <option value="trending">Trending</option>
                            </select>

                            {/* View Mode */}
                            <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    <Grid3x3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Load Sample Data Button */}
                            {mods.length === 0 && (
                                <button
                                    onClick={loadSampleData}
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center gap-2"
                                >
                                    <Database className="w-4 h-4" />
                                    Load Samples
                                </button>
                            )}

                            {/* Upload Button */}
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-indigo-500/50 transition-all flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Upload
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto custom-scrollbar p-6 space-y-8" style={{ maxHeight: 'calc(90vh - 280px)' }}>
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-zinc-400">Loading marketplace...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Featured Mods */}
                                {featuredMods.length > 0 && searchQuery === '' && selectedType === 'all' && (
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Star className="w-5 h-5 text-amber-500" />
                                            <h3 className="text-lg font-black text-white uppercase tracking-wider">Featured Mods</h3>
                                        </div>
                                        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
                                            {featuredMods.map(mod => (
                                                <ModCard
                                                    key={mod.id}
                                                    mod={mod}
                                                    onInstall={handleInstall}
                                                    onViewDetails={setSelectedMod}
                                                    onToggleFavorite={handleToggleFavorite}
                                                    isFavorited={favoriteMods.has(mod.id)}
                                                    isInstalled={installedMods.has(mod.id)}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Trending Mods */}
                                {trendingMods.length > 0 && searchQuery === '' && selectedType === 'all' && (
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Zap className="w-5 h-5 text-emerald-500" />
                                            <h3 className="text-lg font-black text-white uppercase tracking-wider">Trending Now</h3>
                                        </div>
                                        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
                                            {trendingMods.map(mod => (
                                                <ModCard
                                                    key={mod.id}
                                                    mod={mod}
                                                    onInstall={handleInstall}
                                                    onViewDetails={setSelectedMod}
                                                    onToggleFavorite={handleToggleFavorite}
                                                    isFavorited={favoriteMods.has(mod.id)}
                                                    isInstalled={installedMods.has(mod.id)}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* All Mods */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider">
                                            {searchQuery || selectedType !== 'all' ? 'Search Results' : 'All Mods'}
                                        </h3>
                                        <span className="text-sm text-zinc-500">{filteredMods.length} mods</span>
                                    </div>
                                    {filteredMods.length > 0 ? (
                                        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
                                            {filteredMods.map(mod => (
                                                <ModCard
                                                    key={mod.id}
                                                    mod={mod}
                                                    onInstall={handleInstall}
                                                    onViewDetails={setSelectedMod}
                                                    onToggleFavorite={handleToggleFavorite}
                                                    isFavorited={favoriteMods.has(mod.id)}
                                                    isInstalled={installedMods.has(mod.id)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20">
                                            <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                                            <p className="text-zinc-500">No mods found</p>
                                            <p className="text-zinc-600 text-sm mt-2">Try adjusting your filters</p>
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Mod Details Modal */}
                {selectedMod && (
                    <ModDetailsModal
                        mod={selectedMod}
                        onClose={() => setSelectedMod(null)}
                        onInstall={handleInstall}
                        isInstalled={installedMods.has(selectedMod.id)}
                        isFavorited={favoriteMods.has(selectedMod.id)}
                        onToggleFavorite={handleToggleFavorite}
                    />
                )}

                {/* Upload Modal */}
                <ModUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={fetchMods}
                />
            </div>
        </AnimatePresence>
    );
}
