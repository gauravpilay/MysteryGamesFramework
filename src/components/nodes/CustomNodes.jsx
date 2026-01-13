import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, User, Search, GitMerge, Terminal, MessageSquare } from 'lucide-react';
import { Card } from '../ui/shared';

const NodeWrapper = ({ children, title, icon: Icon, colorClass = "border-zinc-700", headerClass = "bg-zinc-900", selected }) => (
    <Card className={`w-64 shadow-lg transition-all ${selected ? 'ring-2 ring-indigo-500 shadow-indigo-500/20' : ''} ${colorClass} bg-black text-left`}>
        <div className={`flex items-center gap-2 px-3 py-2 border-b border-zinc-800 rounded-t-xl ${headerClass}`}>
            <Icon className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>
        <div className="p-3">
            {children}
        </div>
    </Card>
);

const InputField = ({ value, onChange, placeholder, className = "" }) => (
    <input
        className={`w-full bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 nodrag ${className}`}
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
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

export const StoryNode = memo(({ data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(data.id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper title="Story Segment" icon={FileText} selected={selected} headerClass="bg-blue-950/30 text-blue-200" colorClass="border-blue-900/30">
                <TextArea
                    placeholder="Enter narrative text..."
                    value={data.text}
                    onChange={(e) => handleChange('text', e.target.value)}
                />
            </NodeWrapper>
            <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});

export const SuspectNode = memo(({ data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(data.id, { ...data, [key]: val });
    };
    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper title="Suspect Profile" icon={User} selected={selected} headerClass="bg-red-950/30 text-red-200" colorClass="border-red-900/30">
                <div className="space-y-2">
                    <InputField placeholder="Suspect Name" value={data.name} onChange={(e) => handleChange('name', e.target.value)} />
                    <InputField placeholder="Role / Title" value={data.role} onChange={(e) => handleChange('role', e.target.value)} />
                    <TextArea placeholder="Alibi Description" rows={2} value={data.alibi} onChange={(e) => handleChange('alibi', e.target.value)} />
                </div>
            </NodeWrapper>
            <Handle type="source" position={Position.Bottom} className="!bg-red-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});

export const EvidenceNode = memo(({ data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(data.id, { ...data, [key]: val });
    };
    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper title="Evidence / Clue" icon={Search} selected={selected} headerClass="bg-yellow-950/30 text-yellow-200" colorClass="border-yellow-900/30">
                <div className="space-y-2">
                    <InputField placeholder="Evidence Name" value={data.label} onChange={(e) => handleChange('label', e.target.value)} />
                    <TextArea placeholder="Description of the clue..." rows={2} value={data.description} onChange={(e) => handleChange('description', e.target.value)} />
                    <div className="p-2 border border-dashed border-zinc-700 rounded text-center text-[10px] text-zinc-500 cursor-pointer hover:bg-zinc-900/50">
                        Click to upload image (Simulated)
                    </div>
                </div>
            </NodeWrapper>
            <Handle type="source" position={Position.Bottom} className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});

export const LogicNode = memo(({ data, selected }) => {
    // Logic nodes might have multiple handles? Or just one output that branches?
    // User asked for "Branching logic (Success/Failure paths)".
    // So maybe two source handles.
    const handleChange = (key, val) => {
        data.onChange && data.onChange(data.id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper title="Logic Gate" icon={GitMerge} selected={selected} headerClass="bg-emerald-950/30 text-emerald-200" colorClass="border-emerald-900/30">
                <p className="text-[10px] text-zinc-400 mb-2">Define condition for branching:</p>
                <InputField placeholder="Condition (e.g. key_found)" value={data.condition} onChange={(e) => handleChange('condition', e.target.value)} />
                <div className="flex justify-between mt-3 px-1 text-[10px] uppercase font-bold text-zinc-500">
                    <span>True</span>
                    <span>False</span>
                </div>
            </NodeWrapper>
            {/* Two source handles for True/False */}
            <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-black" />
            <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} className="!bg-rose-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});

export const TerminalNode = memo(({ data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(data.id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper title="Terminal Challenge" icon={Terminal} selected={selected} headerClass="bg-zinc-800 text-green-400" colorClass="border-green-900/30">
                <div className="space-y-2 font-mono">
                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Challenge Prompt</p>
                        <TextArea placeholder="e.g. Find the IP in headers..." rows={2} value={data.prompt} onChange={(e) => handleChange('prompt', e.target.value)} />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Expected Command / Answer</p>
                        <InputField className="text-green-400 bg-black/50" placeholder="grep '192' access.log" value={data.command} onChange={(e) => handleChange('command', e.target.value)} />
                    </div>
                </div>
            </NodeWrapper>
            <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});

export const MessageNode = memo(({ data, selected }) => {
    const handleChange = (key, val) => {
        data.onChange && data.onChange(data.id, { ...data, [key]: val });
    };

    return (
        <>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3 !border-2 !border-black" />
            <NodeWrapper title="Secure Chat" icon={MessageSquare} selected={selected} headerClass="bg-violet-950/30 text-violet-200" colorClass="border-violet-900/30">
                <div className="space-y-2">
                    <InputField placeholder="Sender Name (e.g. Handler)" value={data.sender} onChange={(e) => handleChange('sender', e.target.value)} />
                    <TextArea placeholder="Message content..." rows={3} value={data.message} onChange={(e) => handleChange('message', e.target.value)} />
                </div>
            </NodeWrapper>
            <Handle type="source" position={Position.Bottom} className="!bg-violet-500 !w-3 !h-3 !border-2 !border-black" />
        </>
    );
});
