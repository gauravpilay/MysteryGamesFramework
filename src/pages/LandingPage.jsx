import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Search,
    Cpu,
    Users,
    BarChart3,
    ChevronRight,
    Shield,
    Zap,
    Play,
    Lock,
    Boxes,
    MessageSquare,
    FileText,
    Layout,
    Globe
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: <Cpu className="w-6 h-6 text-indigo-400" />,
            title: "AI-Powered Case Generation",
            description: "Harness the power of Gemini to generate complex, branching mystery stories with consistent clues and deep character profiles in seconds."
        },
        {
            icon: <Users className="w-6 h-6 text-purple-400" />,
            title: "Real-time Collaboration",
            description: "Build cases together with your team. See live cursors, instant updates, and collaborative node editing in our advanced case architect."
        },
        {
            icon: <Layout className="w-6 h-6 text-blue-400" />,
            title: "Immersive Player Interface",
            description: "A high-fidelity dashboard for players to examine evidence, confront suspects, and piece together the puzzle with biometric-style feedback."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
            title: "Advanced Analytics",
            description: "Track player progress, time-on-field, and investigator performance with detailed PDF reports and real-time leaderboards."
        },
        {
            icon: <Shield className="w-6 h-6 text-red-400" />,
            title: "Enterprise Licensing",
            description: "Robust license management for companies and departments, ensuring secure access and feature-level control across your organization."
        },
        {
            icon: <Globe className="w-6 h-6 text-cyan-400" />,
            title: "Multi-Format Export",
            description: "Export your stories to PDF, Markdown, or Google Docs with a single click, ready for distribution or physical play."
        }
    ];

    return (
        <div className="min-h-screen bg-[#020205] text-white selection:bg-indigo-500/30 font-sans">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#020205]/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logo.jpg" alt="Simplee5 Logo" className="w-10 h-10 rounded-lg shadow-lg group-hover:scale-110 transition-transform object-contain" />
                        <span className="text-xl font-extrabold tracking-tight text-white italic">
                            Simplee<span className="text-orange-500 not-italic">5</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">How it Works</a>
                        <a href="#about" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">About</a>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-full text-sm font-bold transition-all hover:shadow-lg hover:shadow-indigo-600/30 flex items-center gap-2"
                            >
                                Dashboard <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-bold hover:text-indigo-400 transition-colors">Sign In</Link>
                                <Link
                                    to="/login"
                                    className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-full text-sm font-bold transition-all hover:shadow-lg hover:shadow-white/10"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/mystery_framework_hero.png"
                        alt="Hero Background"
                        className="w-full h-full object-cover opacity-40 scale-105"
                        style={{ filter: 'brightness(0.6) contrast(1.2)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#020205] via-transparent to-[#020205]"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020205] via-transparent to-[#020205]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in">
                            <Zap className="w-3 h-3 text-indigo-500" />
                            The Future of Case Investigation
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
                            Simplify Excellence.<br />
                            <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-orange-500 bg-clip-text text-transparent">
                                Master the Mystery.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed max-w-2xl">
                            The premier framework for investigators, game designers, and storytellers.
                            Build high-fidelity mystery experiences with AI-driven narratives,
                            real-time collaboration, and immersive player interfaces.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Link
                                to="/login"
                                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-lg font-bold transition-all hover:shadow-2xl hover:shadow-indigo-600/40 flex items-center justify-center gap-2 group"
                            >
                                Join the Agency <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2">
                                <Play className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                                See in Action
                            </button>
                        </div>

                        <div className="mt-16 flex items-center gap-8 text-zinc-500">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-white">500+</span>
                                <span className="text-xs uppercase tracking-wider">Cases Solved</span>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-white">99%</span>
                                <span className="text-xs uppercase tracking-wider">Accuracy</span>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-white">AI</span>
                                <span className="text-xs uppercase tracking-wider">Powered Logic</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating UI Elements (Decorative) */}
                <div className="hidden lg:block absolute right-[-100px] top-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
                    <div className="relative w-full h-full scale-75 xl:scale-100">
                        <div className="absolute top-0 right-20 w-80 h-96 glass-card rounded-3xl p-6 rotate-6 animate-pulse-glow" style={{ animationDuration: '4s' }}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">ACTIVE</div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                                <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                                <div className="h-20 w-full bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                                    <Cpu className="w-8 h-8 text-indigo-500/40" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-white/5 rounded"></div>
                                    <div className="h-2 w-full bg-white/5 rounded"></div>
                                    <div className="h-2 w-2/3 bg-white/5 rounded"></div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-10 right-40 w-72 h-64 glass-card rounded-3xl p-6 -rotate-12 animate-pulse-glow" style={{ animationDuration: '6s' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                    <Users className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="flex flex-col px-2">
                                    <span className="text-xs font-bold">Collaborators</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">4 Connected</span>
                                </div>
                            </div>
                            <div className="flex -space-x-3 mb-8">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 bg-zinc-800 border-2 border-[#020205] rounded-full flex items-center justify-center text-xs font-bold">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                                <div className="w-10 h-10 bg-indigo-600 border-2 border-[#020205] rounded-full flex items-center justify-center text-xs font-bold">+</div>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-indigo-500 neural-wave"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-[#05050a] relative">
                <div className="perspective-grid absolute inset-0 z-0"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Equipped for Investigation</h2>
                        <p className="text-zinc-400 italic">Advanced tools for the modern detective framework architect.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <div key={idx} className="glass-card group p-8 rounded-3xl transition-all hover:-translate-y-2">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-300 transition-colors">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats/Proof Section */}
            <section className="py-20 border-y border-white/5 bg-[#020205]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        <div>
                            <div className="text-4xl font-bold mb-2">10k+</div>
                            <div className="text-zinc-500 text-xs uppercase tracking-widest font-mono">Narratives Generated</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">250+</div>
                            <div className="text-zinc-500 text-xs uppercase tracking-widest font-mono">Agencies Joined</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">45ms</div>
                            <div className="text-zinc-500 text-xs uppercase tracking-widest font-mono">Sync Latency</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">99.9%</div>
                            <div className="text-zinc-500 text-xs uppercase tracking-widest font-mono">Uptime</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 blur-[120px] rounded-full"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="glass-card p-12 md:p-20 rounded-[40px] text-center border-indigo-500/20">
                        <h2 className="text-4xl md:text-6xl font-bold mb-8 italic tracking-tight">
                            Ready to break the <span className="text-indigo-500">unsolvable?</span>
                        </h2>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
                            Join the ranks of top-tier mystery architects. Deploy your first investigation framework in minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link
                                to="/login"
                                className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-xl font-bold transition-all hover:shadow-2xl hover:shadow-indigo-600/50 flex items-center gap-2 group"
                            >
                                Inaugurate System <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/login"
                                className="px-10 py-5 bg-zinc-900 border border-white/10 hover:bg-zinc-800 rounded-2xl text-xl font-bold transition-all"
                            >
                                Request Access
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 text-zinc-600 text-sm">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" alt="Simplee5 Logo" className="w-8 h-8 rounded-md grayscale opacity-60" />
                        <span className="font-bold tracking-tight italic">
                            Simplee<span className="not-italic">5</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                        <a href="#" className="hover:text-white transition-colors">Careers</a>
                    </div>

                    <p>© 2026 Mystery Games Framework. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
