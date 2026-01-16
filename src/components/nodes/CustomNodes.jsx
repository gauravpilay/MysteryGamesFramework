import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, User, Search, GitMerge, Terminal, MessageSquare, Music, Image as ImageIcon, Star, MousePointerClick, Trash2, Plus } from 'lucide-react';
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

    return (
        <Card
            className={`w-64 shadow-lg transition-all ${selected ? 'ring-2 ring-indigo-500 shadow-indigo-500/20' : ''} ${colorClass} bg-black text-left`}
            onDrop={handleDrop}
            onDragOver={(e) => {
                if (e.dataTransfer.types.includes('application/reactflow')) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }
            }}
        >
            <div className={`flex items-center gap-2 px-3 py-2 border-b border-zinc-800 rounded-t-xl ${headerClass}`}>
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider flex-1">{title}</span>
            </div>
            {onLabelChange && (
                <div className="px-3 pt-3 pb-1 border-b border-zinc-900/50">
                    <InputField
                        placeholder="Node Label / Title"
                        value={data.label}
                        onChange={(e) => onLabelChange(e.target.value)}
                        className="font-bold text-zinc-300"
                    />
                </div>
            )}
            <div className="p-3">
                {children}

                {/* Nested Actions List */}
                {data.actions && data.actions.length > 0 && (
                    <div className="mt-4 border-t border-zinc-800 pt-3 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <MousePointerClick className="w-3 h-3 text-indigo-400" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Actions</span>
                        </div>
                        {data.actions.map((action, i) => (
                            <div key={action.id} className="relative bg-zinc-900/50 border border-zinc-800 rounded p-2 group">
                                <InputField
                                    value={action.label}
                                    placeholder="Action Label"
                                    onChange={(e) => updateAction(action.id, { label: e.target.value })}
                                    className="mb-1 !bg-black"
                                />
                                <div className="flex justify-between items-center mt-1">
                                    <select
                                        className="bg-black/50 border border-zinc-800 text-[10px] text-zinc-400 rounded px-1 py-0.5 max-w-[80px]"
                                        value={action.variant || 'default'}
                                        onChange={(e) => updateAction(action.id, { variant: e.target.value })}
                                    >
                                        <option value="default">Def</option>
                                        <option value="primary">Blue</option>
                                        <option value="danger">Red</option>
                                        <option value="success">Green</option>
                                        <option value="warning">Yel</option>
                                        <option value="mystic">Purp</option>
                                        <option value="tech">Cyan</option>
                                    </select>
                                    <button onClick={() => deleteAction(action.id)} className="text-zinc-600 hover:text-red-500">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={action.id}
                                    className="!bg-indigo-500 !w-2 !h-2 !border-black transition-all hover:scale-150"
                                    style={{ right: -14, top: '50%' }}
                                />
                            </div>
                        ))}
                    </div>
                )}
                {/* Drag Hint */}
                <div className="mt-2 text-[8px] text-center text-zinc-700 uppercase tracking-widest border border-dashed border-zinc-800 rounded p-1">
                    Drop Action Here
                </div>
            </div>
        </Card>
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
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-900/20">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <InputField
                        type="number"
                        placeholder="Points Awarded"
                        value={data.score}
                        onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                        className="bg-black/50"
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
    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper id={id} title="Evidence / Clue" icon={Search} selected={selected} headerClass="bg-yellow-950/30 text-yellow-200" colorClass="border-yellow-900/30" data={data} onLabelChange={(v) => handleChange('label', v)}>
                <div className="space-y-2">
                    {/* Label managed by NodeWrapper now */}
                    <TextArea placeholder="Description of the clue..." rows={2} value={data.description} onChange={(e) => handleChange('description', e.target.value)} />
                    <div className="p-2 border border-dashed border-zinc-700 rounded text-center text-[10px] text-zinc-500 cursor-pointer hover:bg-zinc-900/50">
                        Click to upload image (Simulated)
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

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-emerald-900/20">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <InputField
                        type="number"
                        placeholder="Points Awarded"
                        value={data.score}
                        onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                        className="bg-black/50"
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
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <InputField
                            type="number"
                            placeholder="Hack Reward Points"
                            value={data.score}
                            onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                            className="bg-black/50"
                        />
                    </div>
                </div>
            </NodeWrapper>
            {(!data.actions || data.actions.length === 0) && (
                <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3 !border-2 !border-black" />
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
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => handleChange('url', reader.result);
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            <div className="border border-dashed border-zinc-700 p-1 text-center text-[10px] text-zinc-500 rounded group-hover:bg-zinc-800 transition-colors">
                                Or click to upload file
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
