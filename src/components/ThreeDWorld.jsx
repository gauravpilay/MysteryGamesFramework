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
    useCursor
} from '@react-three/drei';
import * as THREE from 'three';
import { X, Search, Box as BoxIcon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Wall Component
const Wall = ({ start, end, height = 3.5, thickness = 0.25, color = "#1e272e" }) => {
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
                    metalness={0.2}
                    roughness={0.8}
                />
            </Box>
            {/* Top Trim */}
            <Box args={[distance + 0.1, 0.1, thickness + 0.05]} position={[0, height / 2, 0]}>
                <meshStandardMaterial color="#000000" />
            </Box>
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
const PlayerController = ({ spawnPoint }) => {
    const { forward, backward, left, right } = usePersonControls();
    const velocity = useRef(new THREE.Vector3());
    const direction = useRef(new THREE.Vector3());
    const speed = 6;

    useFrame((state, delta) => {
        const { camera } = state;

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
        <Text
            position={[position.x, 2.5, position.y]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
            rotation={[0, Math.PI, 0]}
        >
            {text}
        </Text>
    );
};

// Floor Component
const Floor = ({ width = 100, length = 100 }) => {
    return (
        <group>
            <Plane args={[width, length]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <meshStandardMaterial color="#2d3436" roughness={0.6} metalness={0.1} />
            </Plane>
            <gridHelper args={[width, 50, "#444", "#222"]} position={[0, 0, 0]} />
        </group>
    );
};

// furniture helper
const Furniture = ({ type, position, rotation = 0, color = "#7f8c8d", scale = [1, 1, 1] }) => {
    return (
        <group position={[position.x, 0.02, position.z]} rotation={[0, rotation, 0]}>
            {type === 'desk' && (
                <group position={[0, 0.4, 0]}>
                    <Box args={[1.5, 0.1, 0.8]}>
                        <meshStandardMaterial color="#34495e" />
                    </Box>
                    <Box args={[0.05, 0.8, 0.05]} position={[-0.7, -0.4, -0.35]}><meshStandardMaterial color="#2c3e50" /></Box>
                    <Box args={[0.05, 0.8, 0.05]} position={[0.7, -0.4, -0.35]}><meshStandardMaterial color="#2c3e50" /></Box>
                    <Box args={[0.05, 0.8, 0.05]} position={[-0.7, -0.4, 0.35]}><meshStandardMaterial color="#2c3e50" /></Box>
                    <Box args={[0.05, 0.8, 0.05]} position={[0.7, -0.4, 0.35]}><meshStandardMaterial color="#2c3e50" /></Box>
                </group>
            )}
            {type === 'cabinet' && (
                <Box args={[1, 2, 0.6]} position={[0, 1, 0]}>
                    <meshStandardMaterial color="#95a5a6" metalness={0.5} roughness={0.3} />
                </Box>
            )}
            {type === 'chair' && (
                <group position={[0, 0.45, 0]}>
                    <Box args={[0.5, 0.1, 0.5]}><meshStandardMaterial color="#2c3e50" /></Box>
                    <Box args={[0.5, 0.6, 0.05]} position={[0, 0.3, -0.22]}><meshStandardMaterial color="#2c3e50" /></Box>
                </group>
            )}
            {type === 'box' && (
                <Box args={[0.6, 0.6, 0.6]} position={[0, 0.3, 0]}>
                    <meshStandardMaterial color="#d35400" roughness={1} />
                </Box>
            )}
            {!['desk', 'cabinet', 'chair', 'box'].includes(type) && (
                <Box args={scale} position={[0, scale[1] / 2, 0]}>
                    <meshStandardMaterial color={color} />
                </Box>
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
                        <p className="text-[10px] text-cyan-400 font-bold uppercase">{firstRoom.name || "Reconstructed Area"}</p>
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
                <PlayerController spawnPoint={spawnPoint} />
                <Sky sunPosition={[-100, -20, -100]} turbidity={0.1} rayleigh={0.1} />
                <Environment preset="night" />

                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={2.5} castShadow />

                {/* Neon Accents */}
                <pointLight position={spawnPoint} intensity={1.5} color="#06b6d4" distance={10} />

                <Suspense fallback={null}>
                    {/* Render Rooms */}
                    {layout.rooms.map((room, rIdx) => (
                        <group key={`room-${rIdx}`}>
                            {room.walls.map((wall, wIdx) => (
                                <Wall
                                    key={`wall-${rIdx}-${wIdx}`}
                                    start={{ x: wall.x1, y: wall.z1 }}
                                    end={{ x: wall.x2, y: wall.z2 }}
                                    color={room.color || "#1e272e"}
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
                                />
                            ))}

                            {room.center && <RoomLabel position={room.center} text={room.name} />}
                            {/* Visual Floor for room */}
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
