import React from 'react';

const RadarChart = ({ data, size = 300, color = "#6366f1" }) => {
    if (!data || data.length < 3) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500 text-xs italic">
                Insufficient data for spider-graph generation (min 3 points).
            </div>
        );
    }

    const padding = 40;
    const center = size / 2;
    const radius = (size / 2) - padding;
    const angles = data.map((_, i) => (i * 2 * Math.PI) / data.length - Math.PI / 2);

    // Calculate points for the outer polygon and levels
    const levels = [0.25, 0.5, 0.75, 1];

    const getPoint = (angle, dist) => ({
        x: center + dist * Math.cos(angle),
        y: center + dist * Math.sin(angle)
    });

    return (
        <div className="relative group" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                {/* Background Concentric Polygons */}
                {levels.map(level => {
                    const points = angles.map(angle => {
                        const p = getPoint(angle, radius * level);
                        return `${p.x},${p.y}`;
                    }).join(' ');
                    return (
                        <polygon
                            key={level}
                            points={points}
                            className="fill-zinc-800/20 stroke-zinc-700/50"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Axis lines */}
                {angles.map((angle, i) => {
                    const p = getPoint(angle, radius);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={p.x}
                            y2={p.y}
                            className="stroke-zinc-700/50"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                    );
                })}

                {/* The Data Polygon */}
                {(() => {
                    const points = data.map((d, i) => {
                        const val = Math.max(10, Math.min(100, d.avg)) / 100;
                        const p = getPoint(angles[i], radius * val);
                        return `${p.x},${p.y}`;
                    }).join(' ');

                    return (
                        <g>
                            <polygon
                                points={points}
                                fill={color}
                                fillOpacity="0.2"
                                stroke={color}
                                strokeWidth="2"
                                className="transition-all duration-1000 ease-out"
                            />
                            {data.map((d, i) => {
                                const val = Math.max(10, Math.min(100, d.avg)) / 100;
                                const p = getPoint(angles[i], radius * val);
                                return (
                                    <circle
                                        key={i}
                                        cx={p.x}
                                        cy={p.y}
                                        r="4"
                                        fill={color}
                                        className="stroke-zinc-950 stroke-2"
                                    />
                                );
                            })}
                        </g>
                    );
                })()}

                {/* Labels */}
                {data.map((d, i) => {
                    const p = getPoint(angles[i], radius + 15);
                    const isLeft = p.x < center;
                    const isRight = p.x > center;

                    return (
                        <text
                            key={i}
                            x={p.x}
                            y={p.y}
                            textAnchor={isLeft ? 'end' : isRight ? 'start' : 'middle'}
                            alignmentBaseline="middle"
                            className="fill-zinc-400 text-[9px] font-bold uppercase tracking-tight selection:bg-none"
                        >
                            {d.name.length > 20 ? d.name.substring(0, 17) + '...' : d.name}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

export default RadarChart;
