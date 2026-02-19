import React from 'react';

const RadarChart = ({ data, size = 300, color = "#6366f1" }) => {
    if (!data || data.length < 3) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500 text-xs italic">
                Insufficient data for spider-graph generation (min 3 points).
            </div>
        );
    }

    const padding = size > 350 ? 55 : 40;
    const center = size / 2;
    const radius = (size / 2) - padding;
    const angles = data.map((_, i) => (i * 2 * Math.PI) / data.length - Math.PI / 2);

    const levels = [0.25, 0.5, 0.75, 1];

    const getPoint = (angle, dist) => ({
        x: center + dist * Math.cos(angle),
        y: center + dist * Math.sin(angle)
    });

    return (
        <div className="relative" style={{ width: size, height: size }}>
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
                            fill="rgba(39,39,42,0.2)"
                            stroke="rgba(63,63,70,0.5)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Level percentage labels (25%, 50%, 75%, 100%) */}
                {size > 350 && levels.map(level => {
                    const p = getPoint(-Math.PI / 2, radius * level);
                    return (
                        <text
                            key={`lvl-${level}`}
                            x={p.x + 4}
                            y={p.y}
                            textAnchor="start"
                            dominantBaseline="middle"
                            fill="rgba(113,113,122,0.7)"
                            style={{ fontSize: 8 }}
                        >
                            {level * 100}%
                        </text>
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
                            stroke="rgba(63,63,70,0.5)"
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
                            />
                            {data.map((d, i) => {
                                const val = Math.max(10, Math.min(100, d.avg)) / 100;
                                const p = getPoint(angles[i], radius * val);
                                const scoreFontSize = Math.max(7, size * 0.02);
                                return (
                                    <g key={i}>
                                        <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="#09090b" strokeWidth="2" />
                                        {/* Score % shown near each data point */}
                                        <text
                                            x={p.x}
                                            y={p.y - (size > 350 ? 10 : 8)}
                                            textAnchor="middle"
                                            dominantBaseline="auto"
                                            fill="#a5b4fc"
                                            style={{ fontSize: scoreFontSize, fontWeight: 700 }}
                                        >
                                            {Math.round(d.avg)}%
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    );
                })()}

                {/* Labels with two-line wrapping */}
                {data.map((d, i) => {
                    const labelGap = size > 350 ? 24 : 14;
                    const p = getPoint(angles[i], radius + labelGap);
                    const isLeft = p.x < center - 8;
                    const isRight = p.x > center + 8;
                    const anchor = isLeft ? 'end' : isRight ? 'start' : 'middle';
                    const fontSize = Math.max(8, size * 0.024);
                    const maxCharsPerLine = size > 350 ? 18 : 11;

                    // Word-wrap into up to two lines
                    const words = d.name.split(' ');
                    let line1 = '';
                    let line2 = '';
                    for (const word of words) {
                        const candidate = (line1 + (line1 ? ' ' : '') + word);
                        if (candidate.length <= maxCharsPerLine) {
                            line1 = candidate;
                        } else {
                            line2 = (line2 + (line2 ? ' ' : '') + word);
                        }
                    }

                    // Truncate line2 if still too long
                    if (line2.length > maxCharsPerLine + 3) {
                        line2 = line2.substring(0, maxCharsPerLine) + '…';
                    }

                    const lineHeight = fontSize * 1.25;

                    return (
                        <text
                            key={i}
                            textAnchor={anchor}
                            fill="#d4d4d8"
                            style={{ fontSize, fontWeight: 700 }}
                        >
                            <tspan
                                x={p.x}
                                y={p.y + (line2 ? -lineHeight / 2 : 0)}
                            >
                                {line1}
                            </tspan>
                            {line2 && (
                                <tspan
                                    x={p.x}
                                    y={p.y + lineHeight / 2}
                                    fill="#a1a1aa"
                                    style={{ fontSize: fontSize * 0.88 }}
                                >
                                    {line2}
                                </tspan>
                            )}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

export default RadarChart;
