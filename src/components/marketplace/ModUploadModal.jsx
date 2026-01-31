import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Tag, FileText, Package } from 'lucide-react';
import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ModUploadModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        author: '',
        type: 'case',
        category: '',
        tags: '',
        thumbnailUrl: '',
        version: '1.0.0',
        compatibility: '1.0.0+'
    });
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            const modData = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                downloads: 0,
                views: 0,
                rating: 0,
                reviewCount: 0,
                featured: false,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            await addDoc(collection(db, 'marketplace_mods'), modData);

            alert('✓ Mod uploaded successfully!');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error uploading mod:', error);
            alert('Error uploading mod. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
                className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-2 border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="border-b border-white/10 bg-gradient-to-r from-zinc-900/90 to-black/90 backdrop-blur-xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Upload Mod</h2>
                                <p className="text-xs text-zinc-400 mt-0.5">Share your creation with the community</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X className="w-6 h-6 text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar p-6 space-y-6" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Mod Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., The Midnight Mansion Mystery"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Description *
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe your mod..."
                            rows={4}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                        />
                    </div>

                    {/* Author & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">Author Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                placeholder="Your name"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                <Package className="w-4 h-4 inline mr-2" />
                                Type *
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                            >
                                <option value="case">🔍 Case</option>
                                <option value="character">👤 Character</option>
                                <option value="theme">🎨 Theme</option>
                                <option value="plugin">🔌 Plugin</option>
                            </select>
                        </div>
                    </div>

                    {/* Category & Tags */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">Category</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g., Murder Mystery"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                <Tag className="w-4 h-4 inline mr-2" />
                                Tags
                            </label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="Victorian, Mansion, Murder"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                            <p className="text-xs text-zinc-500 mt-1">Separate with commas</p>
                        </div>
                    </div>

                    {/* Thumbnail URL */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            <ImageIcon className="w-4 h-4 inline mr-2" />
                            Thumbnail URL
                        </label>
                        <input
                            type="url"
                            value={formData.thumbnailUrl}
                            onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                    </div>

                    {/* Version & Compatibility */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">Version</label>
                            <input
                                type="text"
                                value={formData.version}
                                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                placeholder="1.0.0"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">Compatibility</label>
                            <input
                                type="text"
                                value={formData.compatibility}
                                onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
                                placeholder="1.0.0+"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Uploading...' : 'Upload Mod'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
