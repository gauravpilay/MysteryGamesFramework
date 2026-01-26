import React, { memo, useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Handle, Position, NodeResizer } from 'reactflow';
import { FileText, User, Search, GitMerge, Terminal, MessageSquare, Music, Image as ImageIcon, Star, MousePointerClick, Trash2, Plus, Copy, Fingerprint, Bell, HelpCircle, ToggleLeft, Unlock, Binary, Grid3x3, Folder, ChevronDown, ChevronUp, Maximize, X, Save, File, FolderOpen, AlertCircle, Brain, Cpu, Send, Loader2, Check, Filter, ShieldAlert, Box, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { callAI } from '../../lib/ai';
import { useConfig } from '../../lib/config';

// ... (existing code for SetterNode) ...

export const LockpickNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Lockpick Minigame" icon={Unlock} selected={selected} headerClass="bg-amber-950/30 text-amber-200" colorClass="border-amber-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 mb-1">Difficulty (Pins)</p>
                    <div className="flex gap-2">
                        <select
                            className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:border-indigo-500 outline-none"
                            value={data.difficulty || 'easy'}
                            onChange={(e) => handleChange('difficulty', e.target.value)}
                        >
                            <option value="easy">Easy (3 Pins)</option>
                            <option value="medium">Medium (5 Pins)</option>
                            <option value="hard">Hard (7 Pins)</option>
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Unlock Reward (Logic Variable)</p>
                        <InputField
                            placeholder="e.g. door_unlocked"
                            value={data.variableId}
                            onChange={(e) => handleChange('variableId', e.target.value)}
                            className="font-mono text-amber-500/80"
                        />
                    </div>
                    <div className="mt-2 p-2 bg-black/40 border border-amber-900/20 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-3 h-3" /> Reward Points
                            </p>
                            <InputField
                                type="number"
                                placeholder="Pts"
                                value={data.score}
                                onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                className="w-20 text-right bg-amber-950/30 border-amber-900/30 text-amber-200"
                            />
                        </div>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                </div>
            </NodeWrapper>
            <Handle type="source" position={Position.Bottom} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});

export const DecryptionNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Cyber Decryption" icon={Binary} selected={selected} headerClass="bg-lime-950/30 text-lime-200" colorClass="border-lime-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 mb-1">Target Phrase (To Be Decoded)</p>
                    <InputField
                        placeholder="e.g. SECRET"
                        value={data.targetPhrase}
                        onChange={(e) => handleChange('targetPhrase', e.target.value)}
                        className="font-mono text-lime-500 uppercase"
                    />
                    <p className="text-[10px] text-zinc-500 mb-1">Time Limit (Seconds)</p>
                    <InputField
                        type="number"
                        placeholder="30"
                        value={data.timeLimit}
                        onChange={(e) => handleChange('timeLimit', parseInt(e.target.value) || 30)}
                    />
                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Success Variable</p>
                        <InputField
                            placeholder="e.g. data_decrypted"
                            value={data.variableId}
                            onChange={(e) => handleChange('variableId', e.target.value)}
                            className="font-mono text-lime-500/80"
                        />
                    </div>
                    <div className="mt-2 p-2 bg-black/40 border border-lime-900/20 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-lime-400 uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-3 h-3" /> Points
                            </p>
                            <InputField
                                type="number"
                                placeholder="0"
                                value={data.score}
                                onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                className="w-20 text-right bg-lime-950/30 border-lime-900/30 text-lime-200"
                            />
                        </div>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                </div>
            </NodeWrapper>
            <Handle type="source" position={Position.Bottom} className="!bg-lime-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});

export const KeypadNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Security Keypad" icon={Grid3x3} selected={selected} headerClass="bg-slate-950/30 text-slate-200" colorClass="border-slate-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 mb-1">Passcode (Numeric)</p>
                    <InputField
                        placeholder="e.g. 1234"
                        value={data.passcode}
                        onChange={(e) => handleChange('passcode', e.target.value)}
                        className="font-mono text-slate-300 tracking-widest text-center"
                    />
                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Success Variable</p>
                        <InputField
                            placeholder="e.g. vault_open"
                            value={data.variableId}
                            onChange={(e) => handleChange('variableId', e.target.value)}
                            className="font-mono text-slate-500/80"
                        />
                    </div>
                    <div className="mt-2 p-2 bg-black/40 border border-slate-900/20 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-3 h-3" /> Points
                            </p>
                            <InputField
                                type="number"
                                placeholder="0"
                                value={data.score}
                                onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                className="w-20 text-right bg-slate-950/30 border-slate-900/30 text-slate-200"
                            />
                        </div>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                </div>
            </NodeWrapper>
            <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});

// ... existing code ...

export const IdentifyNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Identify Culprit" icon={Fingerprint} selected={selected} headerClass="bg-red-950/50 text-red-200" colorClass="border-red-900/50" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <div className="p-2 bg-red-950/20 border border-red-900/30 rounded text-center">
                        <p className="text-[10px] text-red-300 font-bold uppercase tracking-wider mb-1">Mission Critical</p>
                        <p className="text-[10px] text-zinc-400">Triggers Accusation Sequence</p>
                    </div>

                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Correct Culprit Name (Must match Suspect Node)</p>
                        <InputField
                            placeholder="e.g. Col. Mustard"
                            value={data.culpritName}
                            onChange={(e) => handleChange('culpritName', e.target.value)}
                            className="border-red-900/30 focus:border-red-500"
                        />
                    </div>

                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Solution Reasoning</p>
                        <TextArea
                            placeholder="Explain why they are guilty..."
                            rows={3}
                            value={data.reasoning}
                            onChange={(e) => handleChange('reasoning', e.target.value)}
                        />
                    </div>

                    <div className="mt-3 p-2 bg-black/40 border border-red-900/20 rounded-lg space-y-2">
                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3" /> Accusation Scoring
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <span className="absolute left-2 top-1.5 text-[8px] text-green-500/50 font-bold uppercase">Win</span>
                                <InputField
                                    type="number"
                                    placeholder="0"
                                    value={data.score}
                                    onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                    className="pl-8 text-right bg-green-950/10 border-green-900/30 text-green-400"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <span className="absolute left-2 top-1.5 text-[8px] text-red-500/50 font-bold uppercase">Fail</span>
                                <InputField
                                    type="number"
                                    placeholder="0"
                                    value={data.penalty}
                                    onChange={(e) => handleChange('penalty', parseInt(e.target.value) || 0)}
                                    className="pl-8 text-right bg-red-950/10 border-red-900/30 text-red-400"
                                />
                            </div>
                        </div>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                </div>
            </NodeWrapper>
            {/* No output handle needed usually as this ends the game? 
                 Actually, maybe you want success/failure outputs?
                 For now, let's assume it leads to Game Over screens, but maybe for advanced use we add outputs.
                 Let's add generic output just in case they want to chain 'Aftermath'.
             */}
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-red-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});
import { Card, Button } from '../ui/shared';

const NodeWrapper = ({ children, title, icon: Icon, colorClass = "border-zinc-700", headerClass = "bg-zinc-900", selected, data, onLabelChange, id }) => {

    const handleDrop = (e) => {
        const type = e.dataTransfer.getData('application/reactflow');
        if (type === 'action') {
            e.stopPropagation();
            e.preventDefault();
            const newAction = {
                id: crypto.randomUUID(),
                label: 'New Action',
                variant: 'default'
            };
            const currentActions = data.actions || [];
            data.onChange && data.onChange(id, { ...data, actions: [...currentActions, newAction] });
        }
    };

    const deleteAction = (actionId) => {
        const currentActions = data.actions || [];
        data.onChange && data.onChange(id, { ...data, actions: currentActions.filter(a => a.id !== actionId) });
    };

    const updateAction = (actionId, updates) => {
        const currentActions = data.actions || [];
        data.onChange && data.onChange(id, {
            ...data,
            actions: currentActions.map(a => a.id === actionId ? { ...a, ...updates } : a)
        });
    };

    // Extract color for glow effect
    const glowColor = selected ? (colorClass.includes('red') ? 'rgba(239,68,68,0.5)' :
        colorClass.includes('blue') ? 'rgba(59,130,246,0.5)' :
            colorClass.includes('green') ? 'rgba(34,197,94,0.5)' :
                colorClass.includes('yellow') ? 'rgba(234,179,8,0.5)' :
                    colorClass.includes('purple') || colorClass.includes('violet') ? 'rgba(139,92,246,0.5)' :
                        'rgba(99,102,241,0.5)') : 'transparent';

    return (
        <div
            className={`w-72 rounded-2xl border transition-all duration-300 relative group pointer-events-auto
                ${selected ? 'scale-[1.02] z-50' : 'hover:border-zinc-500 z-10'}
                ${colorClass} backdrop-blur-md bg-black/80 shadow-2xl`}
            style={{
                boxShadow: selected ? `0 0 30px ${glowColor}, inset 0 0 20px ${glowColor}` : '0 10px 30px -10px rgba(0,0,0,0.5)'
            }}
            onDrop={handleDrop}
            onDragOver={(e) => {
                if (e.dataTransfer.types.includes('application/reactflow')) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }
            }}
        >
            {/* Tech Corners */}
            <div className={`absolute -top-px -left-px w-3 h-3 border-t border-l rounded-tl-lg ${selected ? 'border-white' : 'border-zinc-600'} transition-colors`}></div>
            <div className={`absolute -top-px -right-px w-3 h-3 border-t border-r rounded-tr-lg ${selected ? 'border-white' : 'border-zinc-600'} transition-colors`}></div>
            <div className={`absolute -bottom-px -left-px w-3 h-3 border-b border-l rounded-bl-lg ${selected ? 'border-white' : 'border-zinc-600'} transition-colors`}></div>
            <div className={`absolute -bottom-px -right-px w-3 h-3 border-b border-r rounded-br-lg ${selected ? 'border-white' : 'border-zinc-600'} transition-colors`}></div>

            <div className={`flex items-center gap-3 px-4 py-3 rounded-t-2xl border-b border-white/5 ${headerClass} bg-opacity-20 backdrop-blur-sm relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-50"></div>
                <div className={`p-1.5 rounded-lg bg-black/40 shadow-inner border border-white/10 relative z-10`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest flex-1 relative z-10 drop-shadow-sm">{title}</span>
                {data.onDuplicate && (
                    <button
                        className="p-1.5 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-all relative z-10"
                        onClick={(e) => { e.stopPropagation(); data.onDuplicate(id); }}
                        title="Duplicate Node"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            {onLabelChange && (
                <div className="px-4 pt-4 pb-2">
                    <InputField
                        placeholder="Node Identifier"
                        value={data.label}
                        onChange={(e) => onLabelChange(e.target.value)}
                        className="!bg-white/5 !border-white/10 !text-sm !font-bold text-white placeholder:text-zinc-600 focus:!bg-black focus:!border-indigo-500 transition-all rounded-lg"
                    />
                </div>
            )}
            <div className="p-4 space-y-3">
                {children}

                {/* Nested Actions List */}
                {data.actions && data.actions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <MousePointerClick className="w-3 h-3 text-indigo-400" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Interactive elements</span>
                        </div>
                        <div className="space-y-2">
                            {data.actions.map((action, i) => (
                                <div key={action.id} className="relative bg-black/40 border border-white/5 rounded-lg p-2 group hover:border-indigo-500/30 transition-colors">
                                    <InputField
                                        value={action.label}
                                        placeholder="Action Label"
                                        onChange={(e) => updateAction(action.id, { label: e.target.value })}
                                        className="mb-2 !bg-transparent !border-transparent hover:!bg-white/5 !px-1.5 !py-0.5 !text-xs !font-medium"
                                    />
                                    <div className="flex justify-between items-center px-1">
                                        <select
                                            className="bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-400 rounded px-2 py-1 hover:border-zinc-500 transition-colors cursor-pointer outline-none"
                                            value={action.variant || 'default'}
                                            onChange={(e) => updateAction(action.id, { variant: e.target.value })}
                                        >
                                            <option value="default">Default</option>
                                            <option value="primary">Primary</option>
                                            <option value="danger">Danger</option>
                                            <option value="success">Success</option>
                                            <option value="warning">Warning</option>
                                            <option value="mystic">Mystic</option>
                                            <option value="tech">Tech</option>
                                        </select>
                                        <button onClick={() => deleteAction(action.id)} className="text-zinc-600 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <Handle
                                        type="source"
                                        position={Position.Right}
                                        id={action.id}
                                        className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-black shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all hover:scale-150 hover:bg-white"
                                        style={{ right: -16, top: '50%' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-3 text-[9px] text-center text-zinc-700 font-mono tracking-widest border border-dashed border-zinc-800/50 rounded-lg p-2 hover:border-zinc-700 hover:text-zinc-500 transition-colors cursor-default">
                    DROP ACTION TO LINK
                </div>
            </div>
        </div >
    );
};

export const InputField = ({ value, onChange, placeholder, className = "", ...props }) => (
    <input
        className={`w-full bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 nodrag ${className}`}
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        {...props}
    />
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
    <textarea
        className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-indigo-500/50 nodrag"
        placeholder={placeholder}
        rows={rows}
        value={value || ''}
        onChange={onChange}
    />
);

export const StoryNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Story Segment" icon={FileText} selected={selected} headerClass="bg-blue-950/30 text-blue-200" colorClass="border-blue-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <TextArea
                    placeholder="Enter narrative text..."
                    value={data.text}
                    onChange={(e) => handleChange('text', e.target.value)}
                />
                <div className="mt-3 p-2 bg-black/40 border border-blue-900/20 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                            <Star className="w-3 h-3" /> Rewards
                        </p>
                        <InputField
                            type="number"
                            placeholder="Pts"
                            value={data.score}
                            onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                            className="w-20 text-right bg-blue-950/30 border-blue-900/30 text-blue-200"
                        />
                    </div>
                    <ObjectiveSelector
                        values={data.learningObjectiveIds}
                        onChange={(v) => handleChange('learningObjectiveIds', v)}
                        objectives={data.learningObjectives}
                    />
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});

export const SuspectNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };
    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Suspect Profile" icon={User} selected={selected} headerClass="bg-red-950/30 text-red-200" colorClass="border-red-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <InputField placeholder="Suspect Name" value={data.name} onChange={(e) => handleChange('name', e.target.value)} />
                    <InputField placeholder="Role / Title" value={data.role} onChange={(e) => handleChange('role', e.target.value)} />
                    <TextArea placeholder="Alibi Description" rows={2} value={data.alibi} onChange={(e) => handleChange('alibi', e.target.value)} />
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-red-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});

export const EvidenceNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!storage) {
            alert("Firebase Storage not initialized.");
            return;
        }

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `evidence/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            handleChange('image', url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Check console.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Evidence / Clue" icon={Search} selected={selected} headerClass="bg-yellow-950/30 text-yellow-200" colorClass="border-yellow-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    {/* Label managed by NodeWrapper now */}
                    <TextArea placeholder="Description of the clue..." rows={2} value={data.description} onChange={(e) => handleChange('description', e.target.value)} />

                    {/* Image Upload for Evidence */}
                    <div className="relative group pt-2">
                        {data.image ? (
                            <div className="relative w-full h-32 bg-zinc-900 rounded overflow-hidden mb-1 border border-zinc-800 group-hover:border-zinc-600 transition-colors">
                                <img src={data.image} alt="Evidence" className="w-full h-full object-cover" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleChange('image', null); }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 backdrop-blur-sm rounded-full text-white transition-all shadow-lg"
                                    title="Remove Image"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative w-full">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <div className="p-3 border border-dashed border-zinc-700 rounded text-center text-zinc-500 group-hover:bg-zinc-900/50 group-hover:border-zinc-500 transition-colors cursor-pointer">
                                    <div className="flex flex-col items-center gap-1">
                                        <ImageIcon className="w-4 h-4 mb-1" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">
                                            {isUploading ? "Uploading..." : "Upload Evidence Image"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Logic ID */}
                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Logic ID (For branching)</p>
                        <InputField
                            placeholder="e.g. found_weapon"
                            value={data.variableId}
                            onChange={(e) => handleChange('variableId', e.target.value)}
                            className="font-mono text-yellow-500/80"
                        />
                        {data.condition && <p className="text-[8px] text-zinc-600 mt-0.5">Legacy: {data.condition}</p>}
                    </div>
                    <div className="mt-2 p-2 bg-black/40 border border-yellow-900/20 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-3 h-3" /> Discovery Pts
                            </p>
                            <InputField
                                type="number"
                                placeholder="0"
                                value={data.score}
                                onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                className="w-20 text-right bg-yellow-950/30 border-yellow-900/30 text-yellow-200"
                            />
                        </div>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});

export const LogicNode = memo(({ id, data, selected }) => {
    // Logic nodes might have multiple handles? Or just one output that branches?
    // User asked for "Branching logic (Success/Failure paths)".
    // So maybe two source handles.
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Logic Gate" icon={GitMerge} selected={selected} headerClass="bg-emerald-950/30 text-emerald-200" colorClass="border-emerald-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>

                <div className="space-y-2">
                    <div>
                        <p className="text-[10px] text-zinc-400 mb-1">Logic Type</p>
                        <select
                            className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:border-indigo-500 outline-none"
                            value={data.logicType || 'if'}
                            onChange={(e) => handleChange('logicType', e.target.value)}
                        >
                            <option value="if">IF (Branch)</option>
                            <option value="while">WHILE (Loop/Wait)</option>
                        </select>
                    </div>

                    <div>
                        <p className="text-[10px] text-zinc-400 mb-1">Check Variable / Previous Output</p>
                        <InputField
                            placeholder="e.g. 'terminal_1_output' or 'has_key'"
                            value={data.variable}
                            onChange={(e) => handleChange('variable', e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="w-1/3">
                            <p className="text-[10px] text-zinc-400 mb-1">Op</p>
                            <select
                                className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:border-indigo-500 outline-none"
                                value={data.operator || '=='}
                                onChange={(e) => handleChange('operator', e.target.value)}
                            >
                                <option value="==">==</option>
                                <option value="!=">!=</option>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value="contains">in</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-zinc-400 mb-1">Value</p>
                            <InputField
                                placeholder="Target value"
                                value={data.value}
                                onChange={(e) => handleChange('value', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-3 p-2 bg-black/40 border border-emerald-900/20 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <Star className="w-3 h-3" /> Rewards
                        </p>
                        <InputField
                            type="number"
                            placeholder="Pts"
                            value={data.score}
                            onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                            className="w-20 text-right bg-emerald-950/30 border-emerald-900/30 text-emerald-200"
                        />
                    </div>
                    <ObjectiveSelector
                        values={data.learningObjectiveIds}
                        onChange={(v) => handleChange('learningObjectiveIds', v)}
                        objectives={data.learningObjectives}
                    />
                </div>

                <div className="flex justify-between mt-3 px-1 text-[10px] uppercase font-bold text-zinc-500">
                    <span>True</span>
                    <span>False</span>
                </div>
            </NodeWrapper>
            {/* Logic nodes don't typically support the generic 'actions' via drop, or if they do, we handle it similarly. 
                But logic nodes have specific True/False outputs. If user adds actions here, it might be ambiguous. 
                For now, let's allow it but the handles will conflict visually with True/False if not careful.
                Actually, Logic Node is automatic, player doesn't click "Action" on it. Logic evaluates instantly.
                So we skip conditional handle logic here.
            */}
            <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} className="!bg-rose-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});

const VFSEditorModal = ({ vfs, onChange, onClose }) => {
    const [entries, setEntries] = useState(() => {
        // Convert vfs map to manageable array
        return Object.entries(vfs || {}).map(([path, data]) => ({
            id: crypto.randomUUID(),
            path,
            type: data.type || 'file',
            content: data.content || '',
            children: data.children || []
        })).sort((a, b) => a.path.localeCompare(b.path));
    });

    const addEntry = () => {
        setEntries([...entries, { id: crypto.randomUUID(), path: '/new_file.txt', type: 'file', content: '', children: [] }]);
    };

    const removeEntry = (id) => {
        setEntries(entries.filter(e => e.id !== id));
    };

    const updateEntry = (id, updates) => {
        setEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const handleSave = () => {
        const newVfs = {};
        entries.forEach(e => {
            const path = e.path.startsWith('/') ? e.path : '/' + e.path;
            newVfs[path] = {
                type: e.type,
                ...(e.type === 'file' ? { content: e.content } : { children: [] })
            };
        });

        // Ensure root exists
        if (!newVfs['/']) newVfs['/'] = { type: 'dir', children: [] };

        // Reconstruct children lists
        Object.keys(newVfs).forEach(path => {
            if (path === '/') return;
            const lastSlash = path.lastIndexOf('/');
            const parentPath = lastSlash === 0 ? '/' : path.substring(0, lastSlash);
            const name = path.substring(lastSlash + 1);

            if (newVfs[parentPath] && newVfs[parentPath].type === 'dir') {
                if (!newVfs[parentPath].children) newVfs[parentPath].children = [];
                if (!newVfs[parentPath].children.includes(name)) {
                    newVfs[parentPath].children.push(name);
                }
            } else if (!newVfs[parentPath]) {
                // Auto-create parent if missing
                newVfs[parentPath] = { type: 'dir', children: [name] };
            }
        });

        onChange(newVfs);
        onClose();
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-green-500/10"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/30 font-sans">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20">
                            <FolderOpen className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">OS File System Architect</h3>
                            <p className="text-xs text-zinc-500 font-medium">Design the virtual directory structure and secret contents</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-4 font-sans">
                    {entries.map((entry) => (
                        <div key={entry.id} className="group relative bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-4 items-start hover:bg-white/[0.07] hover:border-green-500/30 transition-all">
                            <div className="pt-1">
                                {entry.type === 'dir' ? <Folder className="w-5 h-5 text-indigo-400" /> : <FileText className="w-5 h-5 text-green-400" />}
                            </div>

                            <div className="flex-1 grid grid-cols-12 gap-4">
                                <div className="col-span-4">
                                    <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1 ml-1 tracking-widest">Virtual Path</p>
                                    <InputField
                                        value={entry.path}
                                        onChange={(e) => updateEntry(entry.id, { path: e.target.value })}
                                        className="!bg-black font-mono text-green-500 !text-[11px]"
                                        placeholder="/home/user/secret.txt"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1 ml-1 tracking-widest">Type</p>
                                    <select
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-green-500 cursor-pointer"
                                        value={entry.type}
                                        onChange={(e) => updateEntry(entry.id, { type: e.target.value })}
                                    >
                                        <option value="file">FILE</option>
                                        <option value="dir">FOLDER</option>
                                    </select>
                                </div>
                                <div className="col-span-6">
                                    {entry.type === 'file' ? (
                                        <>
                                            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1 ml-1 tracking-widest">Contents</p>
                                            <TextArea
                                                value={entry.content}
                                                onChange={(e) => updateEntry(entry.id, { content: e.target.value })}
                                                rows={1}
                                                className="!bg-black !min-h-[40px] text-zinc-400 font-mono"
                                                placeholder="Enter data for this file..."
                                            />
                                        </>
                                    ) : (
                                        <div className="h-full flex items-center pt-5">
                                            <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest italic">Virtual Directory Node</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => removeEntry(entry.id)}
                                className="mt-5 p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="Delete Entry"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addEntry}
                        className="w-full py-6 border-2 border-dashed border-white/5 rounded-2xl text-zinc-500 hover:text-green-500 hover:border-green-500/50 hover:bg-green-500/5 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-[0.3em] text-[10px]"
                    >
                        <Plus className="w-4 h-4" />
                        Add Node to File System
                    </button>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-white/5 bg-zinc-900/30 flex justify-between items-center font-sans">
                    <div className="flex items-center gap-3 text-amber-500/70 bg-amber-500/5 px-4 py-2 rounded-xl border border-amber-500/10">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Paths must begin with "/"</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">Cancel</button>
                        <button
                            onClick={handleSave}
                            className="px-10 py-3 bg-green-600 hover:bg-green-500 text-black text-[11px] font-black rounded-xl transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] flex items-center gap-2 uppercase tracking-widest"
                        >
                            <Save className="w-4 h-4" />
                            Commit File System
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export const TerminalNode = memo(({ id, data, selected }) => {
    const [showVfsModal, setShowVfsModal] = useState(false);
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Terminal Challenge" icon={Terminal} selected={selected} headerClass="bg-zinc-800 text-green-400" colorClass="border-green-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-4 font-mono">
                    <div className="relative group p-1.5 bg-green-950/10 border border-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">OS Mode: Advanced</span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Primary Task</p>
                                <select
                                    className="w-full bg-black border border-green-900/30 rounded px-2 py-1.5 text-[10px] text-green-400 focus:border-green-500 outline-none"
                                    value={data.terminalType || 'content'}
                                    onChange={(e) => handleChange('terminalType', e.target.value)}
                                >
                                    <option value="content">Find Secret String (cat/grep)</option>
                                    <option value="password">Submit Password (submit)</option>
                                    <option value="legacy">Legacy Command Match</option>
                                </select>
                            </div>

                            {data.terminalType === 'content' && (
                                <div>
                                    <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Secret String to Find</p>
                                    <InputField
                                        className="text-green-400 bg-black border-green-900/40 focus:border-green-500"
                                        placeholder="e.g. Sector 7"
                                        value={data.solveContent}
                                        onChange={(e) => handleChange('solveContent', e.target.value)}
                                    />
                                </div>
                            )}

                            {data.terminalType === 'password' && (
                                <div>
                                    <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Submit Password</p>
                                    <InputField
                                        className="text-green-400 bg-black border-green-900/40 focus:border-green-500"
                                        placeholder="e.g. mystery_2024"
                                        value={data.solvePassword}
                                        onChange={(e) => handleChange('solvePassword', e.target.value)}
                                    />
                                </div>
                            )}

                            {data.terminalType === 'legacy' && (
                                <div>
                                    <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Exact Command Match</p>
                                    <InputField
                                        className="text-green-400 bg-black border-green-900/40 focus:border-green-500"
                                        placeholder="e.g. override --all"
                                        value={data.command}
                                        onChange={(e) => handleChange('command', e.target.value)}
                                    />
                                </div>
                            )}

                            <div>
                                <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Boot Prompt</p>
                                <TextArea
                                    placeholder="e.g. SYSTEM LOCKED. ANALYZE FILES..."
                                    rows={2}
                                    value={data.prompt}
                                    onChange={(e) => handleChange('prompt', e.target.value)}
                                    className="text-[10px] border-green-900/20"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Virtual File System</p>
                                    <button
                                        onClick={() => {
                                            const defaultVFS = {
                                                '/': { type: 'dir', children: ['home', 'secrets.txt'] },
                                                '/home': { type: 'dir', children: ['user'] },
                                                '/home/user': { type: 'dir', children: ['diary.txt'] },
                                                '/secrets.txt': { type: 'file', content: 'The location is Sector 7.' },
                                                '/home/user/diary.txt': { type: 'file', content: 'I saw something strange today...' }
                                            };
                                            handleChange('vfs', defaultVFS);
                                        }}
                                        className="text-[8px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors"
                                    >
                                        Template
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowVfsModal(true)}
                                    className="w-full py-2 bg-black/60 border border-green-900/30 rounded flex items-center justify-center gap-2 text-[10px] text-green-500 hover:bg-green-500/10 hover:border-green-500 transition-all group"
                                >
                                    <FolderOpen className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    <span>CONFIGURE FILES & FOLDERS</span>
                                </button>
                                {showVfsModal && (
                                    <VFSEditorModal
                                        vfs={data.vfs || { '/': { type: 'dir', children: [] } }}
                                        onChange={(newVfs) => handleChange('vfs', newVfs)}
                                        onClose={() => setShowVfsModal(false)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-2 bg-black/40 border border-green-900/20 rounded-lg space-y-2">
                        <p className="text-[9px] font-bold text-green-400 uppercase tracking-wider flex items-center gap-1">
                            <Star className="w-3 h-3" /> Bounty & Logic
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <span className="absolute left-2 top-1.5 text-[8px] text-green-500/50 font-bold uppercase">Reward</span>
                                <InputField
                                    type="number"
                                    placeholder="0"
                                    value={data.score}
                                    onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                    className="pl-9 text-right bg-green-950/30 border-green-900/30 text-green-400"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <span className="absolute left-2 top-1.5 text-[8px] text-red-500/50 font-bold uppercase">Risk</span>
                                <InputField
                                    type="number"
                                    placeholder="0"
                                    value={data.penalty}
                                    onChange={(e) => handleChange('penalty', parseInt(e.target.value) || 0)}
                                    className="pl-9 text-right bg-red-950/10 border-red-900/30 text-red-400 font-bold"
                                />
                            </div>
                        </div>
                        <div>
                            <InputField
                                placeholder="Logic ID (e.g. hacked)"
                                value={data.variableId}
                                onChange={(e) => handleChange('variableId', e.target.value)}
                                className="font-mono text-green-500/80 !bg-black/60 !border-green-900/30 mt-1"
                            />
                        </div>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3 !border-2 !border-black" />
            )
            }
        </>
    );
});
// AIPersonaModal removed and replaced with inline editing in InterrogationNode


export const ThreeDSceneNode = memo(({ id, data, selected }) => {
    const { settings } = useConfig();
    const [isUploading, setIsUploading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!storage) {
            alert("Firebase Storage not initialized.");
            return;
        }

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `blueprints/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            handleChange('blueprintUrl', url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Blueprint upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    const generate3DLayout = async () => {
        if (!data.blueprintUrl) {
            alert("Please upload a blueprint first.");
            return;
        }

        setIsParsing(true);
        try {
            let imageData = null;

            // Only fetch and convert to base64 if we are not in simulation mode
            if (settings.aiApiKey && settings.aiApiKey !== 'SIMULATION_MODE') {
                const imgResponse = await fetch(data.blueprintUrl);
                const blob = await imgResponse.blob();
                imageData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            }

            const systemPrompt = `
                Act as a Master 3D Architect. 
                Reconstruct the provided blueprint into a 3D Floor Plan.
                
                GEOMETRY RULES:
                - Use a Global World Coordinate System (X, Z).
                - Use a 1 unit = 1 meter scale.
                - For each room, determine its center point and define all contents using Global coordinates.
                - Doors must be placed at the exact gaps between rooms.

                JSON FORMAT:
                {
                  "rooms": [
                    {
                      "name": "Room Name",
                      "color": "#hex",
                      "center": { "x": number, "z": number },
                      "walls": [{ "x1": number, "z1": number, "x2": number, "z2": number }],
                      "doors": [{ "x1": number, "z1": number, "x2": number, "z2": number }],
                      "furniture": [{ "type": "desk|chair|cabinet|box", "position": {"x": number, "z": number}, "rotation": number }]
                    }
                  ]
                }
            `.trim();

            const userMessage = "Analyze floor plan. Output ONLY JSON.";

            const responseText = await callAI(
                data.aiProvider || 'gemini',
                systemPrompt,
                userMessage,
                settings.aiApiKey || 'SIMULATION_MODE',
                imageData || data.blueprintUrl // fallback to URL if fetch failed or simulation
            );

            // NEW: Ultra-Robust JSON Extraction & Repair
            // NEW: Recursive Repair Engine for AI-Generated Geometry
            const extractAndRepairJSON = (raw) => {
                const firstBrace = raw.indexOf('{');
                const lastBrace = raw.lastIndexOf('}');
                if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON object detected in AI response.");

                let json = raw.substring(firstBrace, lastBrace + 1);

                // 1. Level 1 NormalIZATION: Remove control characters and markdown
                json = json
                    .replace(/```json|```/g, '')
                    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                    .trim();

                const deepRepair = (str) => {
                    let cleaned = str
                        .replace(/,\s*([\]}])/g, '$1')        // Trailing commas
                        .replace(/}\s*({|")/g, '},$1')        // Missing comma between objects or key
                        .replace(/]\s*({|")/g, '],$1')        // Missing comma after array
                        .replace(/([0-9]|"|true|false|null)\s*({|")/g, '$1,$2') // Missing comma after value
                        .replace(/("\w+")\s*("\w+":)/g, '$1,$2') // Missing comma between key-value pairs
                        .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Unquoted keys (middle)
                        .replace(/^{\s*([a-zA-Z0-9_]+)\s*:/g, '{"$1":')    // Unquoted keys (start)
                        .replace(/:\s*'([^']*)'/g, ': "$1"') // Single to double quotes
                        .replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2') // Fix spaced decimals
                        .trim();

                    // Recursive fix for common missing commas like "value" "other"
                    for (let i = 0; i < 3; i++) {
                        cleaned = cleaned.replace(/("[\w\s]+")\s+(")/g, '$1,$2');
                    }
                    return cleaned;
                };

                // Fast path
                try {
                    return JSON.parse(json);
                } catch (e1) {
                    console.warn("Primary JSON parse failed. Initiating Deep Repair...");
                    try {
                        const repaired = deepRepair(json);
                        return JSON.parse(repaired);
                    } catch (e2) {
                        console.warn("Deep Repair failed. Attempting Structural Recovery...");
                        // Level 3: Truncation & Bracing Repair
                        let fixed = deepRepair(json);

                        const openBraces = (fixed.match(/{/g) || []).length;
                        const closeBraces = (fixed.match(/}/g) || []).length;
                        const openBrackets = (fixed.match(/\[/g) || []).length;
                        const closeBrackets = (fixed.match(/]/g) || []).length;

                        let recovery = fixed;
                        // Close missing brackets for truncated responses
                        for (let i = 0; i < openBraces - closeBraces; i++) recovery += '}';
                        for (let i = 0; i < openBrackets - closeBrackets; i++) recovery += ']';

                        try {
                            return JSON.parse(recovery);
                        } catch (e3) {
                            // Level 4: Emergency Truncation (Find last valid closure)
                            console.warn("Structural Recovery failed. Truncating to last valid object...");
                            const lastIdx = Math.max(recovery.lastIndexOf('}'), recovery.lastIndexOf(']'));
                            if (lastIdx > 0) {
                                try { return JSON.parse(recovery.substring(0, lastIdx + 1)); } catch (e4) { }
                            }
                            throw e2; // Re-throw the original deep-repair error if all fails
                        }
                    }
                }
            };

            const layout = extractAndRepairJSON(responseText);
            handleChange('layout', layout);
        } catch (error) {
            console.error("3D Generation failed", error);
            alert("3D Generation failed: " + error.message);
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="3D Holodeck" icon={Box} selected={selected} headerClass="bg-cyan-950/30 text-cyan-200" colorClass="border-cyan-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-4">
                    <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl space-y-3">
                        <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5" /> 2D Blueprint
                        </p>

                        <div className="relative group">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                            />
                            <div className="border border-dashed border-cyan-900/40 p-4 text-center rounded-lg group-hover:bg-cyan-900/10 transition-all">
                                {isUploading ? (
                                    <div className="flex flex-col items-center py-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mb-2" />
                                        <p className="text-[10px] text-cyan-500 font-bold uppercase">Uploading Data...</p>
                                    </div>
                                ) : data.blueprintUrl ? (
                                    <img src={data.blueprintUrl} className="max-h-24 mx-auto rounded border border-cyan-900/20" alt="Blueprint" />
                                ) : (
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-cyan-500 font-bold uppercase">Click to upload map</p>
                                        <p className="text-[8px] text-zinc-500">JPG, PNG or Sketch</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={generate3DLayout}
                            disabled={isParsing || !data.blueprintUrl}
                            className={`w-full py-3 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isParsing
                                ? "bg-zinc-800 text-zinc-500"
                                : "bg-cyan-600 hover:bg-cyan-500 text-black shadow-lg shadow-cyan-600/20"
                                }`}
                        >
                            {isParsing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Parsing Geometry...
                                </>
                            ) : (
                                <>
                                    <Cpu className="w-3.5 h-3.5" />
                                    Generate 3D World
                                </>
                            )}
                        </button>
                    </div>

                    {data.layout && (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <CheckCircle className="w-3 h-3" /> 3D Data Ready
                                </p>
                                <span className="text-[8px] text-zinc-500 uppercase font-bold">
                                    {data.layout.rooms?.length || 0} Rooms
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {data.layout.rooms?.map((r, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[7px] text-zinc-400 uppercase font-black">
                                        {r.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-2 border-t border-cyan-900/20">
                        <p className="text-[9px] text-zinc-500 mb-2 uppercase font-black">Exploration Goals</p>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                </div>
            </NodeWrapper>
            <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});


export const InterrogationNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        const newData = { ...data, [key]: val };

        // Auto-generate system prompt if any persona fields change
        const personaFields = ['name', 'personality', 'speakingStyle', 'alibi', 'secret'];
        if (personaFields.includes(key)) {
            newData.systemPrompt = `
NAME: ${newData.name || ''}
PERSONALITY: ${newData.personality || ''}
SPEAKING STYLE: ${newData.speakingStyle || ''}
ALIBI: ${newData.alibi || ''}
SECRET: ${newData.secret || ''}

INSTRUCTIONS:
You are the suspect described above. 
Respond to questions realistically based on your persona.
Try to protect your SECRET unless the detective provides strong evidence or corners you in a logical trap.
Keep responses concise but immersive.
`.trim();
        }

        data.onChange && data.onChange(id, newData);
    };

    const applyTemplate = () => {
        const template = {
            name: "Dr. Alistair Thorne",
            personality: "Brilliant but socially awkward forensic pathologist. Precise, logical, and slightly morose.",
            speakingStyle: "Uses medical jargon, speaks in short sentences, rarely makes eye contact.",
            alibi: "I was in the lab performing an autopsy on the victim from the previous case. Logs show I clocked in at 10 PM.",
            secret: "I accidentally switched the samples, which might have led to a false conviction years ago."
        };

        const systemPrompt = `
NAME: ${template.name}
PERSONALITY: ${template.personality}
SPEAKING STYLE: ${template.speakingStyle}
ALIBI: ${template.alibi}
SECRET: ${template.secret}

INSTRUCTIONS:
You are the suspect described above. 
Respond to questions realistically based on your persona.
Try to protect your SECRET unless the detective provides strong evidence or corners you in a logical trap.
Keep responses concise but immersive.
`.trim();

        data.onChange && data.onChange(id, { ...data, ...template, systemPrompt });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} id="in-1" className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} id="in-2" className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="AI Interrogation" icon={Brain} selected={selected} headerClass="bg-indigo-950/30 text-indigo-200" colorClass="border-indigo-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-4">
                    {/* Model Selector */}
                    <div className="p-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                        <p className="text-[9px] text-indigo-400 mb-1.5 uppercase font-black tracking-widest flex items-center gap-1.5">
                            <Cpu className="w-3 h-3" /> Core Engine
                        </p>
                        <select
                            className="w-full bg-black border border-indigo-900/30 rounded px-2 py-1.5 text-[10px] text-indigo-200 focus:border-indigo-500 outline-none cursor-pointer"
                            value={data.aiProvider || 'gemini'}
                            onChange={(e) => handleChange('aiProvider', e.target.value)}
                        >
                            <option value="gemini">Google Gemini 2.0</option>
                            <option value="openai">OpenAI ChatGPT 4</option>
                        </select>
                    </div>

                    {/* Suspect Persona Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Suspect Persona</p>
                            <button
                                onClick={applyTemplate}
                                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                                <Star className="w-3 h-3" /> Use Template
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <p className="text-[8px] text-indigo-400/70 uppercase font-bold ml-1">Name</p>
                                <InputField
                                    value={data.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="Suspect Name"
                                    className="!bg-black/40 !py-1 !px-2"
                                />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[8px] text-indigo-400/70 uppercase font-bold ml-1">Voice Style</p>
                                <InputField
                                    value={data.speakingStyle}
                                    onChange={(e) => handleChange('speakingStyle', e.target.value)}
                                    placeholder="e.g. Grumpy"
                                    className="!bg-black/40 !py-1 !px-2"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[8px] text-indigo-400/70 uppercase font-bold ml-1">Traits & History</p>
                            <TextArea
                                value={data.personality}
                                onChange={(e) => handleChange('personality', e.target.value)}
                                placeholder="Describe their traits and past..."
                                rows={2}
                                className="!bg-black/40 !text-[10px]"
                            />
                        </div>

                        <div className="space-y-1">
                            <p className="text-[8px] text-indigo-400/70 uppercase font-bold ml-1">The Alibi</p>
                            <TextArea
                                value={data.alibi}
                                onChange={(e) => handleChange('alibi', e.target.value)}
                                placeholder="Where were they during the crime?"
                                rows={2}
                                className="!bg-black/40 !text-[10px]"
                            />
                        </div>

                        <div className="space-y-1 p-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                            <p className="text-[8px] text-red-400 uppercase font-black tracking-wider flex items-center gap-1.5 ml-1 mb-1">
                                <ShieldAlert className="w-2.5 h-2.5" /> Critical Secret
                            </p>
                            <TextArea
                                value={data.secret}
                                onChange={(e) => handleChange('secret', e.target.value)}
                                placeholder="The truth they are hiding..."
                                rows={2}
                                className="!bg-black/60 !border-red-900/20 focus:!border-red-500 !text-[10px]"
                            />
                        </div>
                    </div>

                    {/* Scoring & Logic */}
                    <div className="pt-2 border-t border-indigo-900/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-3 h-3" /> Achievement Score
                            </p>
                            <InputField
                                type="number"
                                placeholder="0"
                                value={data.score}
                                onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                className="w-16 text-right bg-indigo-950/30 border-indigo-900/30 text-indigo-200"
                            />
                        </div>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});


export const MessageNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Secure Chat" icon={MessageSquare} selected={selected} headerClass="bg-violet-950/30 text-violet-200" colorClass="border-violet-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <InputField placeholder="Sender Name (e.g. Handler)" value={data.sender} onChange={(e) => handleChange('sender', e.target.value)} />
                    <TextArea placeholder="Message content..." rows={3} value={data.message} onChange={(e) => handleChange('message', e.target.value)} />
                    <div className="mt-2 p-2 bg-black/40 border border-violet-900/20 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-3 h-3" /> Intel Pts
                            </p>
                            <InputField
                                type="number"
                                placeholder="0"
                                value={data.score}
                                onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                className="w-20 text-right bg-violet-950/30 border-violet-900/30 text-violet-200"
                            />
                        </div>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-violet-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});

export const MusicNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Background Audio" icon={Music} selected={selected} headerClass="bg-pink-950/30 text-pink-200" colorClass="border-pink-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 mb-1">Audio Source URL (MP3/WAV)</p>
                    <InputField
                        placeholder="https://example.com/suspense.mp3"
                        value={data.url}
                        onChange={(e) => handleChange('url', e.target.value)}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">Note:</span>
                        <span className="text-[10px] text-zinc-400">Plays when this node is reached.</span>
                    </div>
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-pink-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});

export const MediaNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!storage) {
            alert("Firebase Storage not initialized.");
            return;
        }

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `media/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            handleChange('url', url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Check console.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Media Asset" icon={ImageIcon} selected={selected} headerClass="bg-orange-950/30 text-orange-200" colorClass="border-orange-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <select
                            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded p-1 w-1/3"
                            value={data.mediaType || 'image'}
                            onChange={(e) => handleChange('mediaType', e.target.value)}
                        >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                        </select>
                        <InputField
                            placeholder={data.mediaType === 'video' ? "Video URL (mp4/yt)" : "Image URL"}
                            value={data.url}
                            onChange={(e) => handleChange('url', e.target.value)}
                            className="w-2/3"
                        />
                    </div>
                    {/* Simulated Upload Button for Images */}
                    {(!data.mediaType || data.mediaType === 'image') && (
                        <div className="relative group">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                            <div className="border border-dashed border-zinc-700 p-1 text-center text-[10px] text-zinc-500 rounded group-hover:bg-zinc-800 transition-colors">
                                {isUploading ? "Uploading..." : "Or click to upload file"}
                            </div>
                        </div>
                    )}
                    <TextArea
                        placeholder="Description text displayed with media..."
                        rows={3}
                        value={data.text}
                        onChange={(e) => handleChange('text', e.target.value)}
                    />
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});

export const ActionNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper title="Button Action" icon={MousePointerClick} selected={selected} headerClass="bg-indigo-950/30 text-indigo-200" colorClass="border-indigo-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 mb-1">Button Configuration</p>
                    <InputField
                        placeholder="Button Text (e.g. 'Open Door')"
                        value={data.label}
                        onChange={(e) => handleChange('label', e.target.value)}
                    />

                    <div className="flex gap-2">
                        <div className="w-1/2">
                            <p className="text-[10px] text-zinc-500 mb-1">Style</p>
                            <select
                                className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:border-indigo-500 outline-none"
                                value={data.variant || 'default'}
                                onChange={(e) => handleChange('variant', e.target.value)}
                            >
                                <option value="default">Default (Zinc)</option>
                                <option value="primary">Primary (Blue)</option>
                                <option value="danger">Danger (Red)</option>
                                <option value="success">Success (Green)</option>
                                <option value="warning">Warning (Yellow)</option>
                                <option value="mystic">Mystic (Purple)</option>
                                <option value="tech">Tech (Cyan)</option>
                                <option value="outline">Outline</option>
                            </select>
                        </div>
                        <div className="w-1/2">
                            <p className="text-[10px] text-zinc-500 mb-1">Effect</p>
                            <select
                                className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:border-indigo-500 outline-none"
                                value={data.effect || 'none'}
                                onChange={(e) => handleChange('effect', e.target.value)}
                            >
                                <option value="none">None</option>
                                <option value="shake">Shake</option>
                                <option value="pulse">Pulse</option>
                            </select>
                        </div>
                    </div>
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});

export const NotificationNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Notification" icon={Bell} selected={selected} headerClass="bg-sky-950/30 text-sky-200" colorClass="border-sky-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <TextArea
                        placeholder="Notification Message..."
                        rows={3}
                        value={data.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                    />
                    <div className="pt-2 border-t border-sky-900/20">
                        <p className="text-[10px] text-zinc-500 mb-1">Button Configuration</p>
                        <div className="flex gap-2">
                            <InputField
                                placeholder="Button Text (e.g. Continue)"
                                value={data.buttonText}
                                onChange={(e) => handleChange('buttonText', e.target.value)}
                                className="w-2/3"
                            />
                            <select
                                className="w-1/3 bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:border-indigo-500 outline-none"
                                value={data.buttonStyle || 'default'}
                                onChange={(e) => handleChange('buttonStyle', e.target.value)}
                            >
                                <option value="default">Default</option>
                                <option value="primary">Blue</option>
                                <option value="danger">Red</option>
                                <option value="success">Green</option>
                                <option value="warning">Yellow</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-2 p-2 bg-black/40 border border-sky-900/20 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-3 h-3" /> Interaction Pts
                            </p>
                            <InputField
                                type="number"
                                placeholder="0"
                                value={data.score}
                                onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                className="w-20 text-right bg-sky-950/30 border-sky-900/30 text-sky-200"
                            />
                        </div>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});

export const QuestionNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    const addOption = () => {
        const currentOptions = data.options || [];
        handleChange('options', [...currentOptions, { id: crypto.randomUUID(), text: '', isCorrect: false }]);
    };

    const updateOption = (optId, updates) => {
        const currentOptions = data.options || [];
        handleChange('options', currentOptions.map(o => o.id === optId ? { ...o, ...updates } : o));
    };

    const deleteOption = (optId) => {
        const currentOptions = data.options || [];
        handleChange('options', currentOptions.filter(o => o.id !== optId));
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Question" icon={HelpCircle} selected={selected} headerClass="bg-fuchsia-950/30 text-fuchsia-200" colorClass="border-fuchsia-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <TextArea
                        placeholder="Ask a question..."
                        rows={2}
                        value={data.question}
                        onChange={(e) => handleChange('question', e.target.value)}
                    />

                    <div className="w-1/2 mb-2">
                        <p className="text-[10px] text-zinc-500 mb-1">Type</p>
                        <select
                            className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:border-indigo-500 outline-none"
                            value={data.selectionType || 'single'}
                            onChange={(e) => handleChange('selectionType', e.target.value)}
                        >
                            <option value="single">Single Select</option>
                            <option value="multi">Multi Select</option>
                        </select>
                    </div>

                    <div className="mt-3 p-2 bg-black/40 border border-fuchsia-900/20 rounded-lg space-y-2">
                        <p className="text-[9px] font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3" /> Question Scoring
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <span className="absolute left-2 top-1.5 text-[8px] text-green-500/50 font-bold uppercase">Win</span>
                                <InputField
                                    type="number"
                                    placeholder="0"
                                    value={data.score}
                                    onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                    className="pl-8 text-right bg-green-950/10 border-green-900/30 text-green-400"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <span className="absolute left-2 top-1.5 text-[8px] text-red-500/50 font-bold uppercase">Fail</span>
                                <InputField
                                    type="number"
                                    placeholder="0"
                                    value={data.penalty}
                                    onChange={(e) => handleChange('penalty', parseInt(e.target.value) || 0)}
                                    className="pl-8 text-right bg-red-950/10 border-red-900/30 text-red-400"
                                />
                            </div>
                        </div>
                        <ObjectiveSelector
                            values={data.learningObjectiveIds}
                            onChange={(v) => handleChange('learningObjectiveIds', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>

                    {/* Logic ID */}
                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Logic ID (Set on Correct)</p>
                        <InputField
                            placeholder="e.g. quiz_passed"
                            value={data.variableId}
                            onChange={(e) => handleChange('variableId', e.target.value)}
                            className="font-mono text-fuchsia-500/80"
                        />
                    </div>

                    <div className="pt-2 border-t border-fuchsia-900/20">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Answers / Options</p>
                            <button onClick={addOption} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </div>

                        <div className="space-y-1">
                            {(data.options || []).map((opt) => (
                                <div key={opt.id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={opt.isCorrect}
                                        onChange={(e) => updateOption(opt.id, { isCorrect: e.target.checked })}
                                        className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0 w-3 h-3"
                                        title="Mark as correct"
                                    />
                                    <InputField
                                        placeholder="Option text"
                                        value={opt.text}
                                        onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                                        className="!py-0.5"
                                    />
                                    <button onClick={() => deleteOption(opt.id)} className="text-zinc-600 hover:text-red-500">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-fuchsia-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});

export const SetterNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Set State / Variable" icon={ToggleLeft} selected={selected} headerClass="bg-cyan-950/30 text-cyan-200" colorClass="border-cyan-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Variable / Logic ID</p>
                        <InputField
                            placeholder="e.g. has_key_card"
                            value={data.variableId}
                            onChange={(e) => handleChange('variableId', e.target.value)}
                            className="font-mono text-cyan-400"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="w-1/2">
                            <p className="text-[10px] text-zinc-500 mb-1">Operation</p>
                            <select
                                className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:border-indigo-500 outline-none"
                                value={data.operation || 'set'}
                                onChange={(e) => handleChange('operation', e.target.value)}
                            >
                                <option value="set">Set To</option>
                                <option value="toggle">Toggle (Bool)</option>
                                <option value="increment">Increment (+)</option>
                                <option value="decrement">Decrement (-)</option>
                            </select>
                        </div>
                        <div className="w-1/2">
                            <p className="text-[10px] text-zinc-500 mb-1">Value</p>
                            <InputField
                                placeholder="true"
                                value={data.value}
                                onChange={(e) => handleChange('value', e.target.value)}
                                disabled={['toggle', 'increment', 'decrement'].includes(data.operation) && data.operation !== 'set'}
                                className={['toggle', 'increment', 'decrement'].includes(data.operation) && data.operation !== 'set' ? "opacity-50 cursor-not-allowed" : ""}
                            />
                        </div>
                    </div>
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-black" />
            )}
        </>
    );
});

const ObjectiveModal = ({ isOpen, onClose, values, onChange, objectives }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    if (!isOpen) return null;

    const selectedIds = Array.isArray(values) ? values : (values ? [values] : []);

    const toggleObjective = (id) => {
        const newValues = selectedIds.includes(id)
            ? selectedIds.filter(v => v !== id)
            : [...selectedIds, id];
        onChange(newValues);
    };

    const categoriesList = ['All', ...objectives.map(cat => cat.category)];

    const filteredObjectives = objectives.map(cat => ({
        ...cat,
        objectives: cat.objectives
            .map((obj, i) => ({
                id: `${cat.id}:${i}`,
                label: typeof obj === 'string' ? obj : (obj.learningObjective || obj.name || 'Untitled')
            }))
            .filter(obj =>
                (selectedCategory === 'All' || cat.category === selectedCategory) &&
                obj.label.toLowerCase().includes(searchQuery.toLowerCase())
            )
    })).filter(cat => cat.objectives.length > 0);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(79,70,229,0.15)] relative"
            >
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none" />

                {/* Header */}
                <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/40 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                            <Star className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                Link Learning Objectives
                                <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2.5 py-1 rounded-full border border-indigo-500/30 font-bold">
                                    {selectedIds.length} Linked
                                </span>
                            </h3>
                            <p className="text-sm text-zinc-500 font-medium">Connect this node to specific learning outcomes for automated assessment</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="group p-3 bg-white/5 hover:bg-red-500/20 rounded-2xl text-zinc-400 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/30"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden relative z-10">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-white/5 bg-black/20 p-6 flex flex-col gap-6">
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 ml-1">Categories</p>
                            <div className="space-y-1.5 overflow-y-auto max-h-[50vh] custom-scrollbar pr-2">
                                {categoriesList.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group
                                            ${selectedCategory === cat
                                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                                : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300 border border-transparent'}`}
                                    >
                                        <span className="truncate">{cat}</span>
                                        {selectedCategory === cat && <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain className="w-4 h-4 text-indigo-400" />
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Education Engine</p>
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-relaxed italic">Linking objectives helps in generating detailed performance reports for players based on their actions.</p>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Search Bar */}
                        <div className="p-6 border-b border-white/5 bg-black/10">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search objectives..."
                                    className="w-full bg-black border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Objectives List */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid gap-8">
                                {filteredObjectives.map(cat => (
                                    <div key={cat.id} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-[1px] flex-1 bg-white/5" />
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] whitespace-nowrap">{cat.category}</h4>
                                            <div className="h-[1px] flex-1 bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                            {cat.objectives.map((obj) => {
                                                const isSelected = selectedIds.includes(obj.id);
                                                return (
                                                    <motion.div
                                                        key={obj.id}
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => toggleObjective(obj.id)}
                                                        className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4
                                                            ${isSelected
                                                                ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(79,70,229,0.1)]'
                                                                : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0
                                                            ${isSelected
                                                                ? 'bg-indigo-500 border-indigo-400 text-white'
                                                                : 'bg-black border-white/10 text-transparent group-hover:border-white/30'}`}
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </div>
                                                        <span className={`text-xs font-medium leading-relaxed transition-colors
                                                            ${isSelected ? 'text-indigo-100' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                                            {obj.label}
                                                        </span>
                                                        {isSelected && (
                                                            <div className="absolute inset-0 border-2 border-indigo-500/50 rounded-2xl pointer-events-none animate-pulse" />
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {filteredObjectives.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="p-6 rounded-full bg-white/5 mb-4 border border-white/5">
                                            <Filter className="w-10 h-10 text-zinc-700" />
                                        </div>
                                        <h5 className="text-lg font-bold text-zinc-300">No matching objectives</h5>
                                        <p className="text-sm text-zinc-500 max-w-xs">Try adjusting your search or category filters to find the right educational outcome.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-6 border-t border-white/5 bg-zinc-900/40 flex items-center justify-between relative z-10">
                    <p className="text-xs text-zinc-500 font-medium">
                        Showing <span className="text-zinc-300 font-bold">{filteredObjectives.reduce((acc, cat) => acc + cat.objectives.length, 0)}</span> educational targets
                    </p>
                    <button
                        onClick={onClose}
                        className="px-10 py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95 border border-indigo-400/30 flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Finalize Links
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

const ObjectiveSelector = ({ values = [], onChange, objectives }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!objectives || objectives.length === 0) return null;

    const selectedIds = Array.isArray(values) ? values : (values ? [values] : []);

    return (
        <div className="mt-1 relative">
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-black/40 border border-zinc-800 text-zinc-400 hover:text-indigo-400 rounded-xl px-2 py-2.5 text-[9px] uppercase font-black tracking-widest hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all flex items-center justify-between group"
            >
                <div className="flex items-center gap-2">
                    <div className={`p-1 rounded bg-zinc-900 transition-colors ${selectedIds.length > 0 ? 'bg-indigo-500/20' : 'group-hover:bg-indigo-500/10'}`}>
                        <Star className={`w-3 h-3 ${selectedIds.length > 0 ? 'text-indigo-400 animate-pulse' : 'text-zinc-600'}`} />
                    </div>
                    <span className={selectedIds.length > 0 ? "text-indigo-300" : ""}>
                        {selectedIds.length > 0 ? `${selectedIds.length} Linked objectives` : 'Link Objectives'}
                    </span>
                </div>
                <div className="p-1 rounded-full bg-zinc-900 group-hover:bg-indigo-500/20 group-hover:rotate-90 transition-all">
                    <Maximize className="w-2.5 h-2.5" />
                </div>
            </button>

            <AnimatePresence>
                {isModalOpen && (
                    <ObjectiveModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        objectives={objectives}
                        values={values}
                        onChange={onChange}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export const GroupNode = memo(({ id, data, selected }) => {
    const isCollapsed = data.collapsed;
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            {!isCollapsed && (
                <NodeResizer
                    minWidth={300}
                    minHeight={200}
                    isVisible={selected}
                    lineClassName="!border-indigo-500"
                    handleClassName="!h-3 !w-3 !bg-white !border-2 !border-indigo-500 !rounded"
                />
            )}
            <div
                className={`rounded-2xl border-2 transition-all duration-300 relative pointer-events-none
                    ${selected ? 'border-indigo-500' : 'border-zinc-800 border-dashed'} 
                    ${isCollapsed ? 'w-56 h-14 bg-zinc-900 shadow-xl' : 'w-full h-full bg-transparent'}`}
                style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
            >
                {/* Background Instruction (Behind nodes) */}
                {!isCollapsed && !selected && (
                    <div className="absolute inset-0 z-[-1] pointer-events-none opacity-40 flex items-center justify-center">
                        <div className="border-2 border-indigo-500/10 inset-8 absolute rounded-3xl border-dashed flex items-center justify-center">
                            <div className="text-[10px] text-zinc-800 font-black uppercase tracking-[0.4em] animate-pulse">
                                Drop Items Here
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className={`p-3 h-14 flex items-center justify-between gap-2 relative z-10 pointer-events-auto transition-colors
                    ${isCollapsed ? 'bg-zinc-900 border border-zinc-700 shadow-xl rounded-2xl' : 'border-b border-zinc-800/10 bg-zinc-950/20'}`}
                    style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-1.5 rounded-lg transition-all shadow-inner
                            ${isCollapsed ? 'bg-amber-500 text-black shadow-amber-500/20' : 'bg-zinc-800 text-zinc-400'}`}>
                            <Folder className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            {isCollapsed && <span className="text-[7px] font-black text-amber-500 uppercase tracking-tighter mb-0.5 opacity-70">Sub-Graph</span>}
                            <input
                                className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-zinc-100 focus:outline-none w-full nodrag truncate"
                                value={data.label || 'New Sub-Graph'}
                                onChange={(e) => handleChange('label', e.target.value)}
                                placeholder="Group Name"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {data.onUngroup && !isCollapsed && (
                            <button
                                onClick={() => data.onUngroup(id)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-500 hover:text-white nodrag"
                                title="Dissolve Group"
                            >
                                <Maximize className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            onClick={() => handleChange('collapsed', !isCollapsed)}
                            className={`p-2 rounded-xl transition-all nodrag shadow-lg
                                ${isCollapsed ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700' : 'hover:bg-white/10 text-zinc-500 hover:text-white'}`}
                        >
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
});
