import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, User, Search, GitMerge, Terminal, MessageSquare, Music, Image as ImageIcon, Star, MousePointerClick, Trash2, Plus, Copy, Fingerprint, Bell, HelpCircle, ToggleLeft, Unlock, Binary, Grid3x3 } from 'lucide-react';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
                            value={data.learningObjectiveId}
                            onChange={(v) => handleChange('learningObjectiveId', v)}
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
            className={`w-72 rounded-2xl border transition-all duration-300 relative group
                ${selected ? 'scale-[1.02] z-50' : 'hover:border-zinc-500 z-10'}
                ${colorClass} backdrop-blur-xl bg-black/80 shadow-2xl`}
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
        </div>
    );
};

const InputField = ({ value, onChange, placeholder, className = "", ...props }) => (
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
                        value={data.learningObjectiveId}
                        onChange={(v) => handleChange('learningObjectiveId', v)}
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
                        value={data.learningObjectiveId}
                        onChange={(v) => handleChange('learningObjectiveId', v)}
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

export const TerminalNode = memo(({ id, data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Terminal Challenge" icon={Terminal} selected={selected} headerClass="bg-zinc-800 text-green-400" colorClass="border-green-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2 font-mono">
                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Challenge Prompt (Visible to Player)</p>
                        <TextArea placeholder="e.g. SYSTEM LOCKED. ENTER OVERRIDE KEY..." rows={2} value={data.prompt} onChange={(e) => handleChange('prompt', e.target.value)} />
                    </div>
                    <div className="pt-2 border-t border-zinc-800">
                        <p className="text-[10px] text-zinc-500 mb-1 font-bold text-green-600">REQUIRED COMMAND (SECRET ANSWER)</p>
                        <InputField
                            className="text-green-400 bg-black border-green-900/40 focus:border-green-500"
                            placeholder="e.g. sudo override"
                            value={data.command}
                            onChange={(e) => handleChange('command', e.target.value)}
                        />
                    </div>
                    <div className="mt-3 p-2 bg-black/40 border border-green-900/20 rounded-lg space-y-2">
                        <p className="text-[9px] font-bold text-green-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3" /> Challenge Scoring
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <span className="absolute left-2 top-1.5 text-[8px] text-green-500/50 font-bold uppercase">Win</span>
                                <InputField
                                    type="number"
                                    placeholder="0"
                                    value={data.score}
                                    onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                                    className="pl-8 text-right bg-green-950/30 border-green-900/30 text-green-400"
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
                            value={data.learningObjectiveId}
                            onChange={(v) => handleChange('learningObjectiveId', v)}
                            objectives={data.learningObjectives}
                        />
                    </div>
                    {/* Logic ID */}
                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Logic ID (Set on Success)</p>
                        <InputField
                            placeholder="e.g. mainframe_hacked"
                            value={data.variableId}
                            onChange={(e) => handleChange('variableId', e.target.value)}
                            className="font-mono text-green-500/80"
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
                            value={data.learningObjectiveId}
                            onChange={(v) => handleChange('learningObjectiveId', v)}
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

const ObjectiveSelector = ({ value, onChange, objectives }) => {
    if (!objectives || objectives.length === 0) return null;

    return (
        <div className="mt-1">
            <select
                className="w-full bg-black border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-indigo-500"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">-- Associate Learning Objective --</option>
                {objectives.map(cat => (
                    <optgroup key={cat.id} label={cat.category}>
                        {cat.objectives.map((obj, i) => (
                            <option key={`${cat.id}:${i}`} value={`${cat.id}:${i}`}>
                                {obj.substring(0, 40)}{obj.length > 40 ? '...' : ''}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
};
