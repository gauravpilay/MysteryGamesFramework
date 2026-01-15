import React from 'react';
import { useAuth } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../components/ui/Logo';

const Login = () => {
    const { user, login } = useAuth();

    if (user) return <Navigate to="/" />;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-gray-950 to-black text-white p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-black/40 p-10 backdrop-blur-xl shadow-[0_0_40px_rgba(79,70,229,0.15)]"
            >
                <div className="text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-900/10 ring-1 ring-indigo-500/20 mb-8 shadow-[0_0_30px_rgba(79,70,229,0.15)]">
                        <Logo className="h-16 w-16" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white">
                        Mystery Architect
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Design immersive, engaging, and interactive detective games.
                    </p>
                </div>

                <div className="mt-8">
                    <button
                        onClick={login}
                        className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        Let's Begin
                    </button>
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-600">Developed By Gaurav Pilay</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
