import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdvancedTerminal = ({ node, edges, onComplete, onFail, addLog }) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([
        { type: 'info', content: 'Initializing Secure Connection...' },
        { type: 'info', content: 'Bypassing Node-Red Firewall...' },
        { type: 'success', content: 'Connection Established. Welcome, Agent.' }
    ]);
    const [currentPath, setCurrentPath] = useState('/');
    const scrollRef = useRef(null);

    // Initial File System from node data or default
    const [fs, setFs] = useState(node.data.vfs || {
        '/': { type: 'dir', children: ['home', 'etc', 'logs', 'secure_data.txt'] },
        '/home': { type: 'dir', children: ['user'] },
        '/home/user': { type: 'dir', children: ['notes.txt', 'passwords.txt'] },
        '/etc': { type: 'dir', children: ['config.sys', 'network.conf'] },
        '/logs': { type: 'dir', children: ['access.log', 'system.log'] },
        '/secure_data.txt': { type: 'file', content: 'CLASSIFIED: The target is located at Sector 7.' },
        '/home/user/notes.txt': { type: 'file', content: 'Reminder: The server password starts with "Alpha".' },
        '/home/user/passwords.txt': { type: 'file', content: 'Root: redacted\nAdmin: mystery_2024' },
        '/etc/config.sys': { type: 'file', content: 'SYS_VERSION=4.2.0\nDEBUG=FALSE' },
        '/etc/network.conf': { type: 'file', content: 'IP=192.168.1.104\nGATEWAY=192.168.1.1' },
        '/logs/access.log': { type: 'file', content: '10:45:01 LOGIN user\n10:48:22 ACCESS /etc/config.sys' },
        '/logs/system.log': { type: 'file', content: '09:00:00 KERNEL_START\n09:00:01 CPU_CHECK_OK' }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const executeCommand = (cmdStr) => {
        const fullCmd = cmdStr.trim();
        if (!fullCmd) return;

        const parts = fullCmd.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        setHistory(prev => [...prev, { type: 'command', content: `${currentPath} $ ${fullCmd}` }]);

        switch (cmd) {
            case 'help':
                setHistory(prev => [...prev, {
                    type: 'info',
                    content: 'Available Commands:\nls - List directory contents\ncd <dir> - Change directory\ncat <file> - Display file content\nmkdir <dir> - Create directory\ntouch <file> - Create an empty file\ngrep <pattern> <file> - Search for pattern in file\nclear - Clear terminal screen\nexit - Close terminal\nsubmit <password> - Submit access code'
                }]);
                break;

            case 'clear':
                setHistory([]);
                break;

            case 'ls':
                const dir = fs[currentPath];
                if (dir && dir.type === 'dir') {
                    setHistory(prev => [...prev, { type: 'output', content: dir.children.join('  ') }]);
                }
                break;

            case 'cd':
                const target = args[0];
                if (!target || target === '/') {
                    setCurrentPath('/');
                } else if (target === '..') {
                    if (currentPath !== '/') {
                        const parts = currentPath.split('/').filter(Boolean);
                        parts.pop();
                        setCurrentPath('/' + parts.join('/'));
                    }
                } else {
                    let fullTarget = currentPath === '/' ? `/${target}` : `${currentPath}/${target}`;
                    if (fs[fullTarget] && fs[fullTarget].type === 'dir') {
                        setCurrentPath(fullTarget);
                    } else {
                        setHistory(prev => [...prev, { type: 'error', content: `cd: no such directory: ${target}` }]);
                    }
                }
                break;

            case 'cat':
                const fileName = args[0];
                if (!fileName) {
                    setHistory(prev => [...prev, { type: 'error', content: 'usage: cat <filename>' }]);
                    break;
                }
                let filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
                if (fs[filePath] && fs[filePath].type === 'file') {
                    setHistory(prev => [...prev, { type: 'output', content: fs[filePath].content }]);

                    // Logic for completing the node
                    const completionKey = node.data.solveContent || '';
                    if (completionKey && fs[filePath].content.includes(completionKey)) {
                        setHistory(prev => [...prev, { type: 'success', content: 'DATA RECOVERED. MISSION OBJECTIVE MET.' }]);
                        setTimeout(() => onComplete(fullCmd), 1500);
                    }
                } else {
                    setHistory(prev => [...prev, { type: 'error', content: `cat: ${fileName}: No such file` }]);
                }
                break;

            case 'grep':
                if (args.length < 2) {
                    setHistory(prev => [...prev, { type: 'error', content: 'usage: grep <pattern> <filename>' }]);
                    break;
                }
                const pattern = args[0];
                const gFile = args[1];
                let gPath = currentPath === '/' ? `/${gFile}` : `${currentPath}/${gFile}`;

                if (fs[gPath] && fs[gPath].type === 'file') {
                    const lines = fs[gPath].content.split('\n');
                    const matches = lines.filter(l => l.includes(pattern));
                    if (matches.length > 0) {
                        setHistory(prev => [...prev, { type: 'output', content: matches.join('\n') }]);
                    }
                } else {
                    setHistory(prev => [...prev, { type: 'error', content: `grep: ${gFile}: No such file` }]);
                }
                break;

            case 'mkdir':
                const newDir = args[0];
                if (!newDir) {
                    setHistory(prev => [...prev, { type: 'error', content: 'usage: mkdir <dirname>' }]);
                    break;
                }
                let newDirPath = currentPath === '/' ? `/${newDir}` : `${currentPath}/${newDir}`;
                if (fs[newDirPath]) {
                    setHistory(prev => [...prev, { type: 'error', content: `mkdir: cannot create directory ‘${newDir}’: File exists` }]);
                } else {
                    const updatedFs = { ...fs };
                    updatedFs[newDirPath] = { type: 'dir', children: [] };
                    updatedFs[currentPath].children.push(newDir);
                    setFs(updatedFs);
                    setHistory(prev => [...prev, { type: 'info', content: `Created directory: ${newDir}` }]);
                }
                break;

            case 'touch':
                const newFile = args[0];
                if (!newFile) {
                    setHistory(prev => [...prev, { type: 'error', content: 'usage: touch <filename>' }]);
                    break;
                }
                let newFilePath = currentPath === '/' ? `/${newFile}` : `${currentPath}/${newFile}`;
                if (fs[newFilePath]) {
                    setHistory(prev => [...prev, { type: 'info', content: `Updated timestamp for: ${newFile}` }]);
                } else {
                    const updatedFs = { ...fs };
                    updatedFs[newFilePath] = { type: 'file', content: '' };
                    updatedFs[currentPath].children.push(newFile);
                    setFs(updatedFs);
                    setHistory(prev => [...prev, { type: 'info', content: `Created empty file: ${newFile}` }]);
                }
                break;

            case 'exit':
                setHistory(prev => [...prev, { type: 'info', content: 'Terminating session...' }]);
                setTimeout(() => onFail(), 500);
                break;

            case 'submit':
                const answer = args[0];
                if (answer && node.data.solvePassword && answer === node.data.solvePassword) {
                    setHistory(prev => [...prev, { type: 'success', content: 'ACCESS GRANTED. OVERRIDING SYSTEM...' }]);
                    setTimeout(() => onComplete(fullCmd), 1000);
                } else {
                    setHistory(prev => [...prev, { type: 'error', content: 'INCORRECT ACCESS CODE.' }]);
                }
                break;

            default:
                if (fullCmd === node.data.command) {
                    setHistory(prev => [...prev, { type: 'success', content: 'LEGACY OVERRIDE DETECTED. ACCESS GRANTED.' }]);
                    setTimeout(() => onComplete(fullCmd), 1000);
                } else {
                    setHistory(prev => [...prev, { type: 'error', content: `command not found: ${cmd}` }]);
                }
        }
    };

    return (
        <div className="flex flex-col h-full bg-black text-green-500 font-mono text-sm overflow-hidden border border-green-900/20 shadow-[inset_0_0_50px_rgba(0,100,0,0.1)]">
            {/* Header */}
            <div className="bg-zinc-900/80 backdrop-blur-md px-4 py-2 border-b border-green-900/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onFail()}
                        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors shadow-[0_0_10px_rgba(239,68,68,0.5)] cursor-pointer"
                        title="Close Session"
                    />
                    <TerminalIcon className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-green-400">CORE_OS.SH // {node.data.label}</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-zinc-700/50 hover:bg-zinc-600 transition-colors" />
                    <div className="w-2 h-2 rounded-full bg-zinc-700/50 hover:bg-zinc-600 transition-colors" />
                    <div className="w-2 h-2 rounded-full bg-zinc-700/50 hover:bg-zinc-600 transition-colors" />
                </div>
            </div>

            {/* Terminal View */}
            <div
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-green-900/50 scrollbar-track-black"
            >
                <div className="space-y-1.5">
                    {history.map((line, i) => (
                        <div key={i} className={`whitespace-pre-wrap transition-opacity duration-300 ${line.type === 'command' ? 'text-white font-bold' :
                            line.type === 'error' ? 'text-rose-500' :
                                line.type === 'success' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' :
                                    line.type === 'info' ? 'text-sky-400' :
                                        'text-green-500/80'
                            }`}>
                            {line.content}
                        </div>
                    ))}

                    {/* Animated prompt when waiting for input */}
                    <div className="flex items-center gap-2 mt-4 text-white">
                        <span className="text-emerald-500 font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">{currentPath} $</span>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    executeCommand(input);
                                    setInput('');
                                }
                            }}
                            className="flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 text-white caret-emerald-500"
                            autoFocus
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-zinc-950 px-5 py-2 text-[9px] text-zinc-500 border-t border-zinc-900 flex justify-between shrink-0 font-bold uppercase tracking-widest">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-green-500" /> STATUS: {currentPath === '/' ? 'ROOT_ACL' : 'SUB_DIR'}</span>
                    <span>UID: 0 (ROOT)</span>
                </div>
                <div className="flex gap-4">
                    <span>ASYNC_IO: ACTIVE</span>
                    <span>SECURE_LINK: {Math.random().toString(16).substring(2, 8)}</span>
                </div>
            </div>

            {/* CRT Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
        </div>
    );
};

export default AdvancedTerminal;
