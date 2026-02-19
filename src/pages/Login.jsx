import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useConfig } from '../lib/config';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../components/ui/Logo';
import { Shield, Zap, Lock, Sparkles } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { user, login, loginWithEmail, signUpWithEmail, resetPassword, error, setError, isAuthenticating } = useAuth();
    const { settings } = useConfig();
    const [view, setView] = useState('login'); // login, signup, forgot
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [resetSent, setResetSent] = useState(false);

    useEffect(() => {
        if (user) {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    // While navigation is in-flight, render nothing to avoid a form flash
    if (user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (view === 'login') {
                await loginWithEmail(email, password);
            } else if (view === 'signup') {
                await signUpWithEmail(email, password, displayName);
            } else if (view === 'forgot') {
                await resetPassword(email);
                setResetSent(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleView = (newView) => {
        setView(newView);
        setError(null);
        setResetSent(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-gray-950 to-black text-white p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-black/40 p-10 backdrop-blur-xl shadow-[0_0_40px_rgba(79,70,229,0.15)]"
            >
                <div className="text-center mb-6">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.1
                        }}
                        className="relative mx-auto w-32 h-32 mb-8 group"
                    >
                        {/* Animated Outer Glow */}
                        <div className="absolute inset-[-10px] rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-500 opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-orange-500/20 ring-1 ring-white/20"></div>

                        {/* Main Circular Image */}
                        <div className="relative w-full h-full rounded-full border-4 border-white/10 p-1.5 backdrop-blur-xl bg-gradient-to-b from-white/10 to-transparent overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
                                <img
                                    src="/logo.jpg"
                                    alt="Simplee5 Hero"
                                    className="w-full h-full object-cover transform scale-110 group-hover:scale-125 transition-transform duration-700"
                                />
                            </div>
                        </div>

                        {/* Floating Decorative Elements */}
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg border border-white/20"
                        >
                            <Sparkles className="w-4 h-4 text-white" />
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-1 -left-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border border-white/20"
                        >
                            <Shield className="w-4 h-4 text-white" />
                        </motion.div>
                    </motion.div>

                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
                        Mystery <span className="text-orange-500 not-italic">Architect</span>
                    </h1>
                    <p className="mt-3 text-sm text-gray-400 font-medium tracking-wide">
                        {view === 'login' && 'RE-ENGINEERING EXCELLENCE'}
                        {view === 'signup' && 'JOIN THE ELITE AGENCY'}
                        {view === 'forgot' && 'SYSTEM CREDENTIAL RECOVERY'}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-center"
                    >
                        <p className="text-sm text-red-400 font-medium whitespace-pre-wrap">
                            {error}
                        </p>
                        <button
                            onClick={() => setError(null)}
                            className="mt-2 text-xs text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-wider font-bold"
                        >
                            Dismiss
                        </button>
                    </motion.div>
                )}

                {resetSent ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/50 p-6 rounded-xl text-center space-y-4"
                    >
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-emerald-400 font-medium">Reset link sent to your email!</p>
                        <p className="text-sm text-gray-400">Please check your inbox (and spam folder) for further instructions.</p>
                        <button
                            onClick={() => toggleView('login')}
                            className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors block w-full pt-2"
                        >
                            Back to Sign In
                        </button>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        <AnimatePresence mode="wait">
                            {view === 'signup' && (
                                <motion.div
                                    key="signup-field"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-1"
                                >
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                        placeholder="Sherlock Holmes"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                placeholder="detective@agency.com"
                            />
                        </div>

                        {view !== 'forgot' && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                                    {view === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => toggleView('forgot')}
                                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest"
                                        >
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isAuthenticating}
                            className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-lg"
                        >
                            {isAuthenticating ? 'Processing...' : (
                                view === 'login' ? 'Sign In' : (view === 'signup' ? 'Create Account' : 'Send Reset Link')
                            )}
                        </button>
                    </form>
                )}

                {view !== 'forgot' && (
                    <>
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#0b0b14] px-4 text-gray-500 font-medium tracking-widest">Or continue with</span>
                            </div>
                        </div>

                        <button
                            onClick={login}
                            type="button"
                            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/20"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </button>
                    </>
                )}

                <p className="text-center text-sm text-gray-400 mt-8">
                    {view === 'login' && (
                        <>
                            Don't have an account?{' '}
                            <button
                                onClick={() => toggleView('signup')}
                                className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
                            >
                                Sign up
                            </button>
                        </>
                    )}
                    {view === 'signup' && (
                        <>
                            Already have an account?{' '}
                            <button
                                onClick={() => toggleView('login')}
                                className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
                            >
                                Sign in
                            </button>
                        </>
                    )}
                    {(view === 'forgot' && !resetSent) && (
                        <button
                            onClick={() => toggleView('login')}
                            className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors underline decoration-indigo-500/30 underline-offset-4"
                        >
                            Return to Login
                        </button>
                    )}
                </p>

                <div className="mt-10 text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">Developed By Gaurav Pilay</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
