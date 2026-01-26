import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    PointerLockControls,
    Sky,
    Environment,
    ContactShadows,
    PerspectiveCamera,
    Box,
    Plane,
    Text,
    useCursor,
    Billboard
} from '@react-three/drei';
import * as THREE from 'three';
import { X, Search, Box as BoxIcon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Wall Component
const Wall = ({ start, end, height = 3.5, thickness = 0.25, color = "#2c3e50" }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    return (
        <group position={[midX, height / 2, midY]} rotation={[0, -angle, 0]}>
            <Box args={[distance, height, thickness]}>
                <meshStandardMaterial
                    color={color}
                    metalness={0.1}
                    roughness={0.9}
                />
            </Box>
            {/* Baseboard */}
            <Box args={[distance + 0.05, 0.2, thickness + 0.02]} position={[0, -height / 2 + 0.1, 0]}>
                <meshStandardMaterial color="#1a1a1a" />
            </Box>
            {/* Top Trim */}
            <Box args={[distance + 0.1, 0.1, thickness + 0.05]} position={[0, height / 2, 0]}>
                <meshStandardMaterial color="#000000" />
            </Box>
        </group>
    );
};

// Door Component
const Door = ({ start, end, height = 3.5, thickness = 0.3 }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    return (
        <group position={[midX, height / 2, midY]} rotation={[0, -angle, 0]}>
            {/* Frame Top */}
            <Box args={[distance, 0.4, thickness + 0.2]} position={[0, height / 2 - 0.2, 0]}>
                <meshStandardMaterial color="#34495e" metalness={0.5} />
            </Box>
            {/* Frame Left */}
            <Box args={[0.3, height, thickness + 0.2]} position={[-distance / 2 + 0.15, 0, 0]}>
                <meshStandardMaterial color="#34495e" metalness={0.5} />
            </Box>
            {/* Frame Right */}
            <Box args={[0.3, height, thickness + 0.2]} position={[distance / 2 - 0.15, 0, 0]}>
                <meshStandardMaterial color="#34495e" metalness={0.5} />
            </Box>
            {/* The Actual Door (Slightly Open) */}
            <Box args={[distance - 0.6, height - 0.4, 0.15]} position={[0.3, -0.2, 0.3]} rotation={[0, 0.6, 0]}>
                <meshStandardMaterial
                    color="#3498db"
                    roughness={0.5}
                    emissive="#3498db"
                    emissiveIntensity={0.5}
                />
            </Box>
            {/* Door Glow Indicator */}
            <pointLight position={[0, 0, 0.5]} intensity={1.5} distance={4} color="#3498db" />
        </group>
    );
};

// Movement Hook
function usePersonControls() {
    const keys = { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right', Space: 'jump' };
    const moveFieldByKey = (key) => keys[key];
    const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false, jump: false });

    useEffect(() => {
        const handleKeyDown = (e) => setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: true }));
        const handleKeyUp = (e) => setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: false }));
        // Attaching to document is standard for first-person controls in a canvas
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);
    return movement;
}

// First Person Player Controller
const PlayerController = ({ spawnPoint, layout, setActiveZone }) => {
    const { forward, backward, left, right } = usePersonControls();
    const velocity = useRef(new THREE.Vector3());
    const direction = useRef(new THREE.Vector3());
    const speed = 6;
    const lastZoneUpdate = useRef(0);

    useFrame((state, delta) => {
        const { camera, clock } = state;

        // Calculate direction
        direction.current.z = Number(forward) - Number(backward);
        direction.current.x = Number(right) - Number(left);
        direction.current.normalize();

        // Update velocity
        velocity.current.z = direction.current.z * speed;
        velocity.current.x = direction.current.x * speed;

        // Apply movement relative to camera rotation
        const sideVector = new THREE.Vector3();
        const frontVector = new THREE.Vector3();

        camera.getWorldDirection(frontVector);
        frontVector.y = 0;
        frontVector.normalize();

        sideVector.crossVectors(camera.up, frontVector);

        const moveX = (frontVector.x * velocity.current.z) + (sideVector.x * velocity.current.x);
        const moveZ = (frontVector.z * velocity.current.z) + (sideVector.z * velocity.current.x);

        camera.position.x += moveX * delta;
        camera.position.z += moveZ * delta;

        // Zone Detection Logic (Throttle to every 200ms)
        const now = clock.getElapsedTime();
        if (now - lastZoneUpdate.current > 0.2) {
            lastZoneUpdate.current = now;
            let closestRoom = null;
            let minDistance = 10; // Detection threshold (meters)

            layout.rooms.forEach(room => {
                if (!room.center) return;
                const dist = Math.sqrt(
                    Math.pow(camera.position.x - room.center.x, 2) +
                    Math.pow(camera.position.z - room.center.z, 2)
                );
                if (dist < minDistance) {
                    minDistance = dist;
                    closestRoom = room.name;
                }
            });

            if (closestRoom) {
                setActiveZone(closestRoom);
            }
        }
    });

    return (
        <group>
            {/* Investigation Torch attached to player */}
            <pointLight position={[0, 0, 0]} intensity={1.5} distance={8} color="#ffffff" />
        </group>
    );
};

// Room Label Component
const RoomLabel = ({ position, text }) => {
    return (
        <Billboard
            position={[position.x, 3.2, position.y]}
            follow={true}
            lockX={false}
            lockY={false}
            lockZ={false}
        >
            <Text
                fontSize={0.4}
                color="white"
                anchorX="center"
                anchorY="middle"
                font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
            >
                {text}
                <meshStandardMaterial emissive="white" emissiveIntensity={0.5} />
            </Text>
        </Billboard>
    );
};

// Floor Component
const Floor = ({ width = 100, length = 100 }) => {
    return (
        <group>
            <Plane args={[width, length]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <meshStandardMaterial color="#4a4a4a" roughness={0.8} metalness={0.1} />
            </Plane>
            <gridHelper args={[width, 50, "#666", "#333"]} position={[0, 0, 0]} />
        </group>
    );
};

// furniture helper
const Furniture = ({ type, position, rotation = 0, color = "#7f8c8d", scale = [1, 1, 1], label }) => {
    // Standardize scale if it comes as an object or missing
    const s = Array.isArray(scale) ? scale : [1, 1, 1];
    const hoverScale = 1.02;

    return (
        <group position={[position.x, 0.02, position.z]} rotation={[0, rotation, 0]}>
            <group scale={s}>
                {type === 'desk' && (
                    <group>
                        <Box args={[1, 0.1, 0.6]} position={[0, 0.75, 0]}>
                            <meshStandardMaterial color="#2c3e50" metalness={0.2} roughness={0.1} />
                        </Box>
                        <Box args={[0.08, 0.75, 0.08]} position={[-0.45, 0.375, -0.25]}><meshStandardMaterial color="#1a1a1a" /></Box>
                        <Box args={[0.08, 0.75, 0.08]} position={[0.45, 0.375, -0.25]}><meshStandardMaterial color="#1a1a1a" /></Box>
                        <Box args={[0.08, 0.75, 0.08]} position={[-0.45, 0.375, 0.25]}><meshStandardMaterial color="#1a1a1a" /></Box>
                        <Box args={[0.08, 0.75, 0.08]} position={[0.45, 0.375, 0.25]}><meshStandardMaterial color="#1a1a1a" /></Box>
                    </group>
                )}
                {type === 'cabinet' && (
                    <group>
                        <Box args={[1, 1, 0.5]} position={[0, 0.5, 0]}>
                            <meshStandardMaterial color="#34495e" metalness={0.6} />
                        </Box>
                        <Box args={[0.9, 0.4, 0.05]} position={[0, 0.7, 0.23]}><meshStandardMaterial color="#2c3e50" /></Box>
                        <Box args={[0.9, 0.4, 0.05]} position={[0, 0.25, 0.23]}><meshStandardMaterial color="#2c3e50" /></Box>
                    </group>
                )}
                {type === 'chair' && (
                    <group position={[0, 0, 0]}>
                        <Box args={[0.5, 0.1, 0.5]} position={[0, 0.45, 0]}><meshStandardMaterial color="#2c3e50" /></Box>
                        <Box args={[0.5, 0.6, 0.1]} position={[0, 0.75, -0.2]}><meshStandardMaterial color="#2c3e50" /></Box>
                        <Box args={[0.05, 0.45, 0.05]} position={[-0.2, 0.225, -0.2]}><meshStandardMaterial color="#000" /></Box>
                        <Box args={[0.05, 0.45, 0.05]} position={[0.2, 0.225, -0.2]}><meshStandardMaterial color="#000" /></Box>
                        <Box args={[0.05, 0.45, 0.05]} position={[-0.2, 0.225, 0.2]}><meshStandardMaterial color="#000" /></Box>
                        <Box args={[0.05, 0.45, 0.05]} position={[0.2, 0.225, 0.2]}><meshStandardMaterial color="#000" /></Box>
                    </group>
                )}
                {type === 'table' && (
                    <group>
                        <Box args={[1.5, 0.1, 1.5]} position={[0, 0.75, 0]}>
                            <meshStandardMaterial color="#7f8c8d" roughness={0.5} />
                        </Box>
                        <Box args={[0.1, 0.75, 0.1]} position={[0, 0.375, 0]}><meshStandardMaterial color="#2c3e50" /></Box>
                    </group>
                )}
                {!['desk', 'cabinet', 'chair', 'table'].includes(type) && (
                    <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} />
                    </Box>
                )}
            </group>

            {/* Holographic Wireframe Highlight for visibility */}
            <group scale={[s[0] * 1.01, s[1] * 1.01, s[2] * 1.01]} position={[0, s[1] / 2, 0]}>
                <Box args={[1, 1, 1]}>
                    <meshBasicMaterial color="#ffffff" wireframe opacity={0.15} transparent />
                </Box>
            </group>

            {/* ID Label */}
            {label && (
                <Billboard position={[0, s[1] + 0.5, 0]}>
                    <Text fontSize={0.15} color="#cyan" anchorX="center" outlineWidth={0.01} outlineColor="black">
                        {label.toUpperCase()}
                    </Text>
                </Billboard>
            )}
        </group>
    );
};

/**
 * layout: {
 *   rooms: [
 *     { name: "Kitchen", walls: [{x1, z1, x2, z2}, ...], center: {x, z} }
 *   ]
 * }
 */
export const ThreeDWorld = ({ layout, onClose }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [activeZone, setActiveZone] = useState(layout?.rooms?.[0]?.name || "Investigation Area");
    const controlsRef = useRef();

    if (!layout || !layout.rooms || layout.rooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950 text-white font-mono p-12 text-center">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
                    <BoxIcon className="w-12 h-12 text-red-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold mb-2 uppercase tracking-tighter">Geometric Sync Failed</h3>
                <p className="text-zinc-500 text-sm max-w-md mb-8">The neural reconstruction data for this scene is corrupted or incomplete. Please regenerate the 3D layout in the editor.</p>
                <button onClick={onClose} className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all">Return to Field</button>
            </div>
        );
    }

    const firstRoom = layout.rooms[0];
    const spawnPoint = firstRoom.center ? [firstRoom.center.x, 1.7, firstRoom.center.z + 2] : [0, 1.7, 5];

    return (
        <div className="relative w-full h-full bg-black select-none">
            {/* HUD Overlay */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5">
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-1">Investigation Zone</h2>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                        <p className="text-[10px] text-cyan-400 font-bold uppercase">{activeZone}</p>
                    </div>
                </div>
            </div>

            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-20 p-2.5 bg-black/40 hover:bg-rose-600/80 text-white rounded-full backdrop-blur-md border border-white/10 transition-all group"
                title="Exit Reconstruction"
            >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Controls Help */}
            <AnimatePresence>
                {isLocked && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex gap-4"
                    >
                        <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-white/10 rounded text-white">WASD</span> MOVE
                        </div>
                        <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-white/10 rounded text-white">ESC</span> EXIT
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Canvas shadows gl={{ antialias: true }}>
                <PerspectiveCamera makeDefault position={spawnPoint} fov={75} />
                <PlayerController spawnPoint={spawnPoint} layout={layout} setActiveZone={setActiveZone} />
                <Sky sunPosition={[10, 20, 10]} turbidity={0.01} rayleigh={0.2} />
                <Environment preset="city" />

                <ambientLight intensity={0.8} />
                <pointLight position={[0, 10, 0]} intensity={4} castShadow />
                <pointLight position={[15, 10, 15]} intensity={2.5} />
                <pointLight position={[-15, 10, -15]} intensity={2.5} />

                {/* Neon Accents */}
                <pointLight position={spawnPoint} intensity={2} color="#06b6d4" distance={15} />

                <Suspense fallback={null}>
                    {/* Render Rooms */}
                    {layout.rooms.map((room, rIdx) => (
                        <group key={`room-${rIdx}`}>
                            {room.walls.map((wall, wIdx) => (
                                <Wall
                                    key={`wall-${rIdx}-${wIdx}`}
                                    start={{ x: wall.x1, y: wall.z1 }}
                                    end={{ x: wall.x2, y: wall.z2 }}
                                    color={room.color || "#2c3e50"}
                                />
                            ))}

                            {/* Render Doors */}
                            {room.doors?.map((door, dIdx) => (
                                <Door
                                    key={`door-${rIdx}-${dIdx}`}
                                    start={{ x: door.x1, y: door.z1 }}
                                    end={{ x: door.x2, y: door.z2 }}
                                />
                            ))}

                            {/* Render Furniture */}
                            {room.furniture?.map((item, fIdx) => (
                                <Furniture
                                    key={`furn-${rIdx}-${fIdx}`}
                                    type={item.type}
                                    position={item.position}
                                    rotation={item.rotation}
                                    color={item.color}
                                    scale={item.scale}
                                    label={item.label}
                                />
                            ))}

                            {/* Room Center UI (Absolute) */}
                            {room.center && <RoomLabel position={room.center} text={room.name} />}

                            {room.center && (
                                <mesh position={[room.center.x, 0.01, room.center.z]} rotation={[-Math.PI / 2, 0, 0]}>
                                    <circleGeometry args={[1, 32]} />
                                    <meshStandardMaterial color={room.color} opacity={0.1} transparent />
                                </mesh>
                            )}
                        </group>
                    ))}

                    <Floor />
                </Suspense>

                <PointerLockControls
                    ref={controlsRef}
                    onLock={() => setIsLocked(true)}
                    onUnlock={() => setIsLocked(false)}
                />
            </Canvas>

            {/* Entry Overlay */}
            {!isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-[2px] z-30 transition-all duration-700">
                    <div className="text-center space-y-6">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"></div>
                            <div className="relative p-6 bg-zinc-900/50 border border-cyan-500/30 rounded-full animate-pulse">
                                <Search className="w-12 h-12 text-cyan-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Neural Reconstitution Complete</h3>
                            <p className="text-zinc-500 text-sm font-medium">Click anywhere to synchronize with the scene</p>
                        </div>
                        <button
                            onClick={() => controlsRef.current?.lock()}
                            className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-widest text-sm"
                        >
                            Establish Link
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThreeDWorld;
