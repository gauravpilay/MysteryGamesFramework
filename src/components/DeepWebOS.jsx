import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, Minimize2, Maximize2, Terminal, Shield, Lock, Search, Send, User, Hash, Camera, FileText, Database, ShieldAlert, Zap, Radio, Check } from 'lucide-react';

const DeepWebOS = ({ data, onComplete }) => {
    // Screen Size Detection
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // UI State
    const [windows, setWindows] = useState([
        { id: 'browser', title: data.systemName || 'SilkRoad Archive', icon: Globe, isOpen: true, zIndex: 10, x: 50, y: 50, width: 620, height: 450 },
        { id: 'chat', title: 'Encrypted Comms', icon: Hash, isOpen: true, zIndex: 11, x: 700, y: 50, width: 320, height: 480 },
        { id: 'cctv', title: 'CAM_FEED_SEC_4', icon: Camera, isOpen: false, zIndex: 9, x: 400, y: 200, width: 450, height: 320 },
        { id: 'notepad', title: 'Investigation Notes', icon: FileText, isOpen: false, zIndex: 8, x: 100, y: 450, width: 350, height: 300 },
        { id: 'db', title: 'Global Intel DB', icon: Database, isOpen: false, zIndex: 7, x: 500, y: 400, width: 400, height: 350 }
    ]);

    // Hacking Game State
    const [isBreached, setIsBreached] = useState(false);
    const [hackingProgress, setHackingProgress] = useState(0);
    const [isHacking, setIsHacking] = useState(false);
    const [signalNodes, setSignalNodes] = useState([]);
    const [hackingDifficulty, setHackingDifficulty] = useState(
        data.securityLevel === 'high' ? 0.5 : data.securityLevel === 'medium' ? 0.7 : 1.0
    );

    // App State
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: 'Ghost_Protocol', text: '[ACCESS_GRANTED] Uplink stable.', time: '21:04' },
        { id: 2, sender: 'Ghost_Protocol', text: `Target system: ${data.systemName || 'Confidential archive'}.`, time: '21:05' },
        { id: 3, sender: 'Ghost_Protocol', text: 'Initiate Neural Pulse to sync with their mainframe.', time: '21:05' }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [foundFragments, setFoundFragments] = useState([]);
    const [notes, setNotes] = useState("");
    const [dbSearch, setDbSearch] = useState("");
    const [dbResult, setDbResult] = useState(null);
    const [cctvGlitch, setCctvGlitch] = useState(false);

    const fragments = data.content ? data.content.split('\n').filter(f => f.trim() !== '') : ['ACCESS_LOG_NULL'];

    // Windows Logic
    const bringToFront = (id) => {
        setWindows(prev => {
            const maxZ = Math.max(...prev.map(w => w.zIndex));
            return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
        });
    };

    const toggleWindow = (id) => {
        setWindows(prev => {
            const win = prev.find(w => w.id === id);
            if (isMobile && !win.isOpen) {
                // On mobile, close others when opening one
                return prev.map(w => w.id === id ? { ...w, isOpen: true, zIndex: 100 } : { ...w, isOpen: false });
            }
            return prev.map(w => w.id === id ? { ...w, isOpen: !w.isOpen } : w);
        });
        if (!isMobile) bringToFront(id);
    };

    // Hacking Minigame Logic
    useEffect(() => {
        let interval;
        if (isHacking) {
            interval = setInterval(() => {
                const id = Math.random().toString(36).substr(2, 9);
                const newNode = {
                    id,
                    x: 15 + Math.random() * 70,
                    y: 25 + Math.random() * 60,
                };
                setSignalNodes(prev => [...prev, newNode]);

                setTimeout(() => {
                    setSignalNodes(prev => prev.filter(n => n.id !== id));
                }, 4000);
            }, 2000 / hackingDifficulty);
        }
        return () => clearInterval(interval);
    }, [isHacking, hackingDifficulty]);

    const handleNodeClick = (id) => {
        setSignalNodes(prev => prev.filter(n => n.id !== id));
        setHackingProgress(prev => {
            const next = Math.min(prev + 25, 100);
            if (next >= 100) {
                setIsHacking(false);
                setIsBreached(true);
                addChatMessage('Ghost_Protocol', 'Firewall dissolved. System is ours.');
            }
            return next;
        });
    };

    const addChatMessage = (sender, text) => {
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            sender,
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        addChatMessage('Detective', newMessage);
        setNewMessage('');
        setTimeout(() => {
            addChatMessage('Ghost_Protocol', 'Signal received. Uplink sustained.');
        }, 1500);
    };

    const handleDbSearch = (e) => {
        e.preventDefault();
        const query = dbSearch.toLowerCase().trim();
        if (!query) return;
        setDbResult({ loading: true });
        setTimeout(() => {
            setDbResult({
                found: true,
                id: `ID_${Math.floor(Math.random() * 10000)}`,
                status: 'ACTIVE',
                notes: `System record matches search: ${query}. Status verified.`
            });
        }, 1000);
    };

    const extractFragment = (f) => {
        if (foundFragments.includes(f)) return;
        setFoundFragments(prev => [...prev, f]);
        addChatMessage('SYSTEM', `Extracted: ${f.substring(0, 15)}...`);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#020205] overflow-hidden font-mono select-none text-emerald-500 text-xs md:text-sm">
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#10b98110_0%,_transparent_70%)]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
                    backgroundSize: isMobile ? '40px 40px' : '80px 80px'
                }}></div>
            </div>

            {/* DESKTOP ICONS */}
            <div className={`absolute z-10 ${isMobile ? 'bottom-20 left-4 right-4 flex justify-between' : 'top-10 left-10 flex flex-col gap-6'}`}>
                <DesktopIcon icon={Globe} label={isMobile ? "" : "Neural Browser"} onClick={() => toggleWindow('browser')} />
                <DesktopIcon icon={Hash} label={isMobile ? "" : "Comms"} onClick={() => toggleWindow('chat')} />
                <DesktopIcon icon={Camera} label={isMobile ? "" : "CCTVs"} onClick={() => toggleWindow('cctv')} />
                <DesktopIcon icon={Database} label={isMobile ? "" : "Intel DB"} onClick={() => toggleWindow('db')} />
                <DesktopIcon icon={FileText} label={isMobile ? "" : "Notes"} onClick={() => toggleWindow('notepad')} />
            </div>

            {/* TASKBAR */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-zinc-950/90 border-t border-emerald-500/20 backdrop-blur-xl flex items-center px-4 md:px-6 justify-between z-[200]">
                <div className="flex items-center gap-2 md:gap-4 max-w-[70%] overflow-x-auto no-scrollbar">
                    <div className="p-2 rounded bg-emerald-500 text-black hidden md:block">
                        <Terminal className="w-5 h-5" />
                    </div>
                    {windows.map(w => w.isOpen && (
                        <button
                            key={w.id}
                            onClick={() => bringToFront(w.id)}
                            className={`h-10 px-3 md:px-4 rounded border transition-all flex items-center gap-2 text-[10px] font-black uppercase shrink-0 ${w.zIndex === Math.max(...windows.map(win => win.zIndex)) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-transparent border-white/10 text-zinc-500'}`}
                        >
                            <w.icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{w.title}</span>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onComplete && onComplete()}
                    className="px-4 md:px-8 py-2 bg-red-900/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded border border-red-500/30"
                >
                    {isMobile ? <X className="w-4 h-4" /> : "Abort"}
                </button>
            </div>

            {/* WINDOWS */}
            <div className={`absolute inset-0 ${isMobile ? 'pt-4 pb-20' : 'pt-16 pb-20'} overflow-hidden pointer-events-none`}>
                <AnimatePresence>
                    {windows.map(w => w.isOpen && (
                        <motion.div
                            key={w.id}
                            initial={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.95, opacity: 0, y: 20 }}
                            style={{
                                position: 'absolute',
                                left: isMobile ? 0 : w.x,
                                top: isMobile ? 0 : w.y,
                                width: isMobile ? '100%' : w.width,
                                height: isMobile ? 'calc(100% - 64px)' : w.height,
                                zIndex: w.zIndex,
                                pointerEvents: 'auto'
                            }}
                            className={`bg-black/95 ${isMobile ? '' : 'border border-emerald-500/30 rounded-xl'} shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl`}
                        >
                            <div className="h-11 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                                <div className="flex items-center gap-3">
                                    <w.icon className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 truncate">{w.title}</span>
                                </div>
                                <button onClick={() => toggleWindow(w.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-zinc-600 hover:text-red-500"><X className="w-4 h-4" /></button>
                            </div>

                            <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar">
                                {w.id === 'browser' && (
                                    <div className="h-full flex flex-col">
                                        {!isBreached ? (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-emerald-500/20 flex items-center justify-center mb-6 relative">
                                                    {isHacking ? <Zap className="w-8 h-8 md:w-10 md:h-10 text-emerald-400 animate-pulse" /> : <Lock className="w-8 h-8 md:w-10 md:h-10 text-red-500" />}
                                                </div>
                                                <h2 className="text-lg md:text-xl font-black text-white uppercase mb-8">{isHacking ? 'SYNCING...' : 'ENCRYPTED'}</h2>
                                                {isHacking ? (
                                                    <div className="w-full max-w-md bg-zinc-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden h-[300px]">
                                                        <div className="flex justify-between items-center mb-6">
                                                            <span className="text-[10px] uppercase font-black">Sync Progress</span>
                                                            <span className="text-[10px] font-black text-emerald-400">{hackingProgress}%</span>
                                                        </div>
                                                        <div className="w-full h-1 bg-black rounded-full overflow-hidden mb-8">
                                                            <motion.div className="h-full bg-emerald-500" animate={{ width: `${hackingProgress}%` }} />
                                                        </div>
                                                        <AnimatePresence>
                                                            {signalNodes.map(node => (
                                                                <motion.button
                                                                    key={node.id}
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    exit={{ scale: 0 }}
                                                                    onPointerDown={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                                                                    className="absolute w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center z-50 cursor-pointer"
                                                                    style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
                                                                >
                                                                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
                                                                </motion.button>
                                                            ))}
                                                        </AnimatePresence>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setIsHacking(true)} className="px-10 py-3 bg-emerald-600 text-black font-black uppercase rounded-lg">Initiate Bypass</button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs font-black uppercase text-emerald-400">Breach Successful</div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {fragments.map((f, i) => (
                                                        <button key={i} onClick={() => extractFragment(f)} className={`p-4 rounded border text-left text-xs ${foundFragments.includes(f) ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5 text-zinc-500'}`}>
                                                            {foundFragments.includes(f) ? f : "REDACTED_DATA_FRAGMENT_0" + i}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {w.id === 'chat' && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex-1 space-y-4 overflow-y-auto mb-4 custom-scrollbar">
                                            {chatMessages.map(msg => (
                                                <div key={msg.id} className={`flex flex-col ${msg.sender === 'Detective' ? 'items-end' : 'items-start'}`}>
                                                    <span className="text-[8px] font-black text-zinc-600 uppercase mb-1">{msg.sender}</span>
                                                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${msg.sender === 'Detective' ? 'bg-emerald-500/10 text-emerald-100 rounded-tr-none' : 'bg-zinc-900 text-zinc-300 rounded-tl-none'}`}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-white/5 pt-4">
                                            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 bg-black border border-emerald-500/30 rounded px-3 py-2 text-xs text-emerald-400" placeholder="Type message..." />
                                            <button type="submit" className="p-2 text-emerald-500"><Send className="w-5 h-5" /></button>
                                        </form>
                                    </div>
                                )}

                                {w.id === 'cctv' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="aspect-video bg-zinc-900 border border-white/5 rounded relative overflow-hidden group">
                                                <div className="absolute top-2 left-2 text-[8px] font-black text-red-500 bg-black/50 px-1 rounded">REC // FEED_{i}</div>
                                                <Camera className="absolute inset-0 m-auto w-8 h-8 opacity-10 group-hover:opacity-30 transition-opacity" />
                                                <div className="absolute inset-0 bg-white/5 opacity-5 pointer-events-none" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {w.id === 'notepad' && (
                                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-full bg-transparent resize-none text-xs md:text-sm text-emerald-100 focus:outline-none" placeholder="Record evidence here..." />
                                )}

                                {w.id === 'db' && (
                                    <div className="space-y-4">
                                        <form onSubmit={handleDbSearch} className="flex gap-2">
                                            <input type="text" value={dbSearch} onChange={(e) => setDbSearch(e.target.value)} className="flex-1 bg-zinc-900 border border-white/10 rounded px-4 py-2 text-xs" placeholder="Search entity ID..." />
                                            <button type="submit" className="px-4 bg-emerald-600 text-black rounded"><Search className="w-4 h-4" /></button>
                                        </form>
                                        {dbResult && (
                                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded space-y-2">
                                                <div className="text-[10px] font-black uppercase text-emerald-400">{dbResult.id} // VERIFIED</div>
                                                <p className="text-xs text-zinc-300 italic">"{dbResult.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

const DesktopIcon = ({ icon: Icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group p-2">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
            <Icon className="w-6 h-6 text-zinc-600 group-hover:text-emerald-400" />
        </div>
        {label && <span className="text-[9px] font-black uppercase text-zinc-600 group-hover:text-emerald-500 transition-colors">{label}</span>}
    </button>
);

export default DeepWebOS;
