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
    Sphere,
    Cylinder,
    Capsule,
    Text,
    useCursor,
    Billboard,
    Sparkles,
    Float,
    MeshReflectorMaterial,
    MeshWobbleMaterial,
    BakeShadows,
    SoftShadows,
    PresentationControls,
    SpotLight
} from '@react-three/drei';
import * as THREE from 'three';
import { X, Search, Box as BoxIcon, Zap, User, Info, MessageSquare, Shield, Activity, Target, Cpu, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    EffectComposer,
    Bloom,
    Vignette,
    Noise,
    Scanline,
    ChromaticAberration,
    DepthOfField
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// Wall Component with realistic textures and trim
const Wall = ({ start, end, height = 3.5, thickness = 0.2, color = "#2c3e50" }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    return (
        <group position={[midX, height / 2, midY]} rotation={[0, -angle, 0]}>
            {/* Main Wall Face - Upgraded to Physical Material */}
            <Box args={[distance, height, thickness]}>
                <meshPhysicalMaterial
                    color={color}
                    metalness={0.6}
                    roughness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    emissive={color}
                    emissiveIntensity={0.02}
                />
            </Box>

            {/* Premium Metallic Trim */}
            <Box args={[distance + 0.1, 0.2, thickness + 0.1]} position={[0, -height / 2 + 0.1, 0]}>
                <meshStandardMaterial color="#334155" metalness={1} roughness={0.1} />
            </Box>
            <Box args={[distance + 0.1, 0.1, thickness + 0.1]} position={[0, height / 2 - 0.05, 0]}>
                <meshStandardMaterial color="#334155" metalness={1} roughness={0.1} />
            </Box>

            {/* Recessed Vertical Neon Strips */}
            <group position={[distance / 3, 0, 0]}>
                <Box args={[0.08, height - 0.4, thickness + 0.05]}>
                    <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} />
                </Box>
                <pointLight position={[0, 0, 0.5]} intensity={1.5} distance={3} color="#0ea5e9" />
            </group>
            <group position={[-distance / 3, 0, 0]}>
                <Box args={[0.08, height - 0.4, thickness + 0.05]}>
                    <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} />
                </Box>
                <pointLight position={[0, 0, 0.5]} intensity={1.5} distance={3} color="#0ea5e9" />
            </group>
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
                <meshStandardMaterial color="#34495e" metalness={0.5} roughness={0.2} />
            </Box>
            {/* Frame Left */}
            <Box args={[0.3, height, thickness + 0.2]} position={[-distance / 2 + 0.15, 0, 0]}>
                <meshStandardMaterial color="#34495e" metalness={0.5} roughness={0.2} />
            </Box>
            {/* Frame Right */}
            <Box args={[0.3, height, thickness + 0.2]} position={[distance / 2 - 0.15, 0, 0]}>
                <meshStandardMaterial color="#34495e" metalness={0.5} roughness={0.2} />
            </Box>
            {/* The Actual Door (Slightly Open) */}
            <Box args={[distance - 0.6, height - 0.4, 0.15]} position={[0.3, -0.2, 0.3]} rotation={[0, 0.6, 0]}>
                <meshStandardMaterial
                    color="#1e293b"
                    roughness={0.2}
                    metalness={0.8}
                    emissive="#3498db"
                    emissiveIntensity={0.2}
                />
            </Box>
            {/* Door Glow Indicator */}
            <pointLight position={[0.3, 0, 0.5]} intensity={1} distance={3} color="#3498db" />
        </group>
    );
};

// Person / NPC Component
// Person / NPC Component - Hyper-realistic Hologram Style
const Person = ({ name, role, position, rotation = 0, description }) => {
    const groupRef = useRef();
    const [opacity, setOpacity] = useState(0.4);

    useFrame((state) => {
        if (groupRef.current) {
            // Floating & Breathing
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.08;

            // Random Flicker for "Holodeck" glitch look
            if (Math.random() > 0.98) {
                setOpacity(Math.random() * 0.5 + 0.1);
                setTimeout(() => setOpacity(0.4), 50);
            }
        }
    });

    return (
        <group position={[position.x, 0, position.z]} rotation={[0, rotation, 0]}>
            <group ref={groupRef}>
                {/* Stylized Humanoid - Upgraded with scanlines and glow */}
                <group position={[0, 0.9, 0]}>
                    {/* Head */}
                    <Sphere args={[0.2, 32, 32]} position={[0, 0.8, 0]}>
                        <meshStandardMaterial
                            color="#38bdf8"
                            emissive="#38bdf8"
                            emissiveIntensity={4}
                            transparent
                            opacity={opacity}
                        />
                        <meshBasicMaterial color="#ffffff" wireframe />
                    </Sphere>

                    {/* Torso */}
                    <Capsule args={[0.25, 0.6, 8, 32]} position={[0, 0.2, 0]}>
                        <meshStandardMaterial
                            color="#0ea5e9"
                            emissive="#0ea5e9"
                            emissiveIntensity={2}
                            transparent
                            opacity={opacity * 0.8}
                        />
                        <meshBasicMaterial color="#ffffff" wireframe opacity={0.3} transparent />
                    </Capsule>

                    {/* Scrolling Scan Rings */}
                    <group position={[0, 0.3, 0]}>
                        <Suspense fallback={null}>
                            <Cylinder args={[0.6, 0.6, 0.02, 32]} position={[0, Math.sin(Date.now() / 1000) * 0.8, 0]}>
                                <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
                            </Cylinder>
                        </Suspense>
                    </group>
                </group>

                {/* Base Hologram Platform */}
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.5, 0.8, 32]} />
                    <meshBasicMaterial color="#38bdf8" transparent opacity={0.2} />
                </mesh>
                <Sparkles count={50} scale={2} size={3} speed={0.8} color="#38bdf8" />
            </group>

            {/* Interaction UI - Upgraded with background */}
            <Billboard position={[0, 2.6, 0]}>
                <group>
                    <Text
                        fontSize={0.24}
                        color="white"
                        anchorX="center"
                        font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                        outlineWidth={0.04}
                        outlineColor="#000000"
                    >
                        {name}
                    </Text>
                    <Text
                        position={[0, -0.3, 0]}
                        fontSize={0.16}
                        color={role === 'Suspect' ? '#f43f5e' : '#0ea5e9'}
                        anchorX="center"
                        font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                        outlineWidth={0.03}
                        outlineColor="#000000"
                    >
                        {role.toUpperCase()}
                    </Text>
                    {/* Role Icon */}
                    <Text
                        position={[-0.6, 0, 0]}
                        fontSize={0.3}
                        color="white"
                    >
                        {role === 'Suspect' ? '⚠️' : '👤'}
                    </Text>
                </group>
            </Billboard>
        </group>
    );
};

// Handheld Camera Effect Component
const HandheldCamera = () => {
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        state.camera.position.y += Math.sin(t * 1.5) * 0.0012;
        state.camera.rotation.z += Math.cos(t * 0.8) * 0.0008;
        state.camera.rotation.x += Math.sin(t * 1.2) * 0.0006;
    });
    return null;
};

// Movement Hook
function usePersonControls() {
    const keys = { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right', Space: 'jump' };
    const moveFieldByKey = (key) => keys[key];
    const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false, jump: false });

    useEffect(() => {
        const handleKeyDown = (e) => setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: true }));
        const handleKeyUp = (e) => setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: false }));
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
            {/* Investigation Torch attached to player - Enhanced with flicker */}
            <SpotLight
                position={[0, 0, 0]}
                intensity={2.5}
                distance={12}
                angle={0.4}
                penumbra={0.5}
                color="#ffffff"
            />
            <pointLight position={[0, 0, 0.5]} intensity={0.5} distance={2} color="#ffffff" />
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

// Floating Data Node - Extra premium detail
const FloatingDataNode = ({ position }) => {
    const meshRef = useRef();
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        meshRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.2;
        meshRef.current.rotation.y = t * 0.25;
        meshRef.current.rotation.z = t * 0.15;
    });

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <mesh ref={meshRef}>
                    <icosahedronGeometry args={[0.15, 0]} />
                    <meshStandardMaterial
                        color="#0ea5e9"
                        emissive="#38bdf8"
                        emissiveIntensity={10}
                        wireframe
                    />
                </mesh>
            </Float>
            <pointLight intensity={1} distance={4} color="#38bdf8" />
        </group>
    );
};

// Floor Component - Ultra-premium Reflector Floor with Grid
const Floor = ({ width = 100, length = 100 }) => {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[width, length]} />
                <MeshReflectorMaterial
                    blur={[300, 100]}
                    resolution={1024}
                    mixBlur={1}
                    mixStrength={60}
                    roughness={1}
                    depthScale={1.5}
                    minDepthThreshold={0.4}
                    maxDepthThreshold={1.4}
                    color="#0a0a0a"
                    metalness={0.8}
                    mirror={0.8}
                />
            </mesh>
            {/* Animated Grid Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <planeGeometry args={[width, length]} />
                <meshBasicMaterial color="#0ea5e9" transparent opacity={0.08} wireframe />
            </mesh>
            <gridHelper args={[width, 80, "#0ea5e9", "#000"]} position={[0, 0.02, 0]} opacity={0.15} transparent />
        </group>
    );
};

// furniture helper - Hyper-detailed Props
const Furniture = ({ type, position, rotation = 0, color = "#7f8c8d", scale = [1, 1, 1], label }) => {
    const s = Array.isArray(scale) ? scale : [1, 1, 1];

    return (
        <group position={[position.x, 0, position.z]} rotation={[0, rotation, 0]}>
            <group scale={s}>
                {type === 'desk' && (
                    <group>
                        {/* Table Top with high-end wood/glass look */}
                        <Box args={[1, 0.05, 0.6]} position={[0, 0.75, 0]}>
                            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.1} />
                        </Box>
                        {/* Designer Legs */}
                        <Cylinder args={[0.02, 0.02, 0.75]} position={[-0.45, 0.375, -0.25]}><meshStandardMaterial color="#94a3b8" metalness={1} /></Cylinder>
                        <Cylinder args={[0.02, 0.02, 0.75]} position={[0.45, 0.375, -0.25]}><meshStandardMaterial color="#94a3b8" metalness={1} /></Cylinder>
                        <Cylinder args={[0.02, 0.02, 0.75]} position={[-0.45, 0.375, 0.25]}><meshStandardMaterial color="#94a3b8" metalness={1} /></Cylinder>
                        <Cylinder args={[0.02, 0.02, 0.75]} position={[0.45, 0.375, 0.25]}><meshStandardMaterial color="#94a3b8" metalness={1} /></Cylinder>
                    </group>
                )}
                {type === 'monitor' && (
                    <group position={[0, 0.75, 0]}>
                        {/* Ultrawide Curve Monitor */}
                        <group rotation={[0, 0, 0]}>
                            <Box args={[0.8, 0.4, 0.05]} position={[0, 0.2, 0]}>
                                <meshStandardMaterial color="#0f172a" />
                            </Box>
                            <Box args={[0.78, 0.38, 0.01]} position={[0, 0.2, 0.03]}>
                                <meshStandardMaterial
                                    color="#000000"
                                    emissive="#38bdf8"
                                    emissiveIntensity={2}
                                />
                            </Box>
                            {/* Stand */}
                            <Cylinder args={[0.01, 0.01, 0.2]} position={[0, 0.1, -0.02]}><meshStandardMaterial color="#94a3b8" /></Cylinder>
                            <Box args={[0.2, 0.01, 0.15]} position={[0, 0, 0]}><meshStandardMaterial color="#1e293b" /></Box>
                        </group>
                    </group>
                )}
                {type === 'server' && (
                    <group>
                        <Box args={[0.6, 1.8, 0.8]} position={[0, 0.9, 0]}>
                            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
                        </Box>
                        {/* Blinking Server Lights */}
                        <Box args={[0.5, 0.05, 0.01]} position={[0, 1.6, 0.41]}>
                            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={5} />
                        </Box>
                        <Box args={[0.5, 0.05, 0.01]} position={[0, 1.4, 0.41]}>
                            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3} />
                        </Box>
                        <Box args={[0.5, 0.05, 0.01]} position={[0, 1.2, 0.41]}>
                            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
                        </Box>
                        <pointLight position={[0, 1.4, 0.6]} intensity={2} distance={3} color="#38bdf8" />
                    </group>
                )}
                {type === 'cabinet' && (
                    <group>
                        <Box args={[0.8, 1.2, 0.4]} position={[0, 0.6, 0]}>
                            <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.2} />
                        </Box>
                        {/* Handles */}
                        <Box args={[0.1, 0.02, 0.05]} position={[0, 0.9, 0.22]}><meshStandardMaterial color="#94a3b8" metalness={1} /></Box>
                        <Box args={[0.1, 0.02, 0.05]} position={[0, 0.4, 0.22]}><meshStandardMaterial color="#94a3b8" metalness={1} /></Box>
                    </group>
                )}
                {type === 'chair' && (
                    <group position={[0, 0.45, 0]}>
                        <Box args={[0.4, 0.1, 0.4]}><meshStandardMaterial color="#1e293b" /></Box>
                        <Box args={[0.4, 0.5, 0.05]} position={[0, 0.3, -0.18]}><meshStandardMaterial color="#1e293b" /></Box>
                        <Cylinder args={[0.02, 0.02, 0.4]} position={[0, -0.22, 0]}><meshStandardMaterial color="#94a3b8" /></Cylinder>
                        <Box args={[0.4, 0.02, 0.4]} position={[0, -0.4, 0]}><meshStandardMaterial color="#334155" /></Box>
                    </group>
                )}
                {type === 'couch' && (
                    <group>
                        {/* Modern Sleek Couch */}
                        <Box args={[2.2, 0.3, 0.9]} position={[0, 0.2, 0]}>
                            <meshStandardMaterial color="#1e293b" roughness={0.4} />
                        </Box>
                        <Box args={[2.2, 0.6, 0.2]} position={[0, 0.5, -0.35]}>
                            <meshStandardMaterial color="#1e293b" roughness={0.4} />
                        </Box>
                        <Box args={[0.2, 0.5, 0.9]} position={[-1.0, 0.4, 0]}>
                            <meshStandardMaterial color="#0f172a" roughness={0.4} />
                        </Box>
                        <Box args={[0.2, 0.5, 0.9]} position={[1.0, 0.4, 0]}>
                            <meshStandardMaterial color="#0f172a" roughness={0.4} />
                        </Box>
                    </group>
                )}
                {!['desk', 'monitor', 'server', 'couch', 'cabinet', 'chair'].includes(type) && (
                    <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
                        <meshPhysicalMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={0.2}
                            metalness={0.9}
                            roughness={0.1}
                            transparent
                            opacity={0.9}
                            transmission={0.5}
                            thickness={0.5}
                        />
                    </Box>
                )}
            </group>

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
            {/* Minority Report Style HUD Overlay */}
            <div className="absolute top-8 left-8 z-10 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                >
                    {/* Animated Scanning Line */}
                    <motion.div
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-0.5 bg-cyan-500/30 blur-sm pointer-events-none"
                    />

                    <div className="relative flex items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500/20 blur-xl animate-pulse rounded-full"></div>
                            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/30">
                                <Activity className="w-8 h-8 text-cyan-400" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-1 opacity-50 flex items-center gap-2">
                                <Target className="w-3 h-3 text-cyan-500" /> Current Sector
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping"></div>
                                <p className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">{activeZone}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex gap-6">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Neural Link</p>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">STABLE_OAK_82</p>
                        </div>
                        <div className="space-y-1 text-right ml-auto">
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Refresh Rate</p>
                            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-tight">144.02 MHz</p>
                        </div>
                    </div>
                </motion.div>
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

            <Canvas shadows gl={{ antialias: true, stencil: true, depth: true }} dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={spawnPoint} fov={65} />
                <PlayerController spawnPoint={spawnPoint} layout={layout} setActiveZone={setActiveZone} />
                <HandheldCamera />

                <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.1} inclination={0.6} distance={450000} />
                <Environment preset="city" />
                <BakeShadows />
                <SoftShadows size={25} samples={10} focus={0.5} />

                <ambientLight intensity={0.5} />

                {/* Cinema Lighting Setup - Volumetric Spottlights */}
                <SpotLight
                    position={[15, 20, 15]}
                    intensity={800}
                    angle={0.25}
                    penumbra={1}
                    castShadow
                    color="#38bdf8"
                    distance={50}
                    shadow-mapSize={[2048, 2048]}
                />
                <SpotLight
                    position={[-15, 18, -10]}
                    intensity={600}
                    angle={0.3}
                    penumbra={1}
                    castShadow
                    color="#f43f5e"
                    distance={45}
                />
                <pointLight position={[0, 10, 0]} intensity={250} color="#0ea5e9" distance={30} />

                {/* Atmosphere FX */}
                <Sparkles count={400} scale={25} size={2} speed={0.4} color="#38bdf8" />
                <fog attach="fog" args={['#000000', 5, 45]} />

                <EffectComposer multisampling={4}>
                    <Bloom
                        intensity={1.2}
                        luminanceThreshold={0.4}
                        luminanceSmoothing={0.9}
                        mipmapBlur={true}
                    />
                    <ChromaticAberration
                        blendFunction={BlendFunction.NORMAL}
                        offset={new THREE.Vector2(0.001, 0.001)}
                    />
                    <Scanline
                        blendFunction={BlendFunction.OVERLAY}
                        density={1.2}
                        opacity={0.1}
                    />
                    <Noise
                        opacity={0.05}
                        blendFunction={BlendFunction.SOFT_LIGHT}
                    />
                    <Vignette
                        eskil={false}
                        offset={0.1}
                        darkness={1.1}
                    />
                </EffectComposer>

                <ContactShadows resolution={2048} scale={30} blur={2} opacity={0.4} far={10} color="#000000" />

                <Suspense fallback={null}>
                    {/* Background Data Nodes */}
                    <FloatingDataNode position={[10, 4, 10]} />
                    <FloatingDataNode position={[-8, 3, 5]} />
                    <FloatingDataNode position={[5, 5, -12]} />

                    {/* Render Rooms */}
                    {layout.rooms.map((room, rIdx) => (
                        <group key={`room-${rIdx}`}>
                            {room.walls.map((wall, wIdx) => (
                                <Wall
                                    key={`wall-${rIdx}-${wIdx}`}
                                    start={{ x: wall.x1, y: wall.z1 }}
                                    end={{ x: wall.x2, y: wall.z2 }}
                                    color={room.color || "#111827"}
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

                            {/* Render Props */}
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

                            {/* Render NPCs */}
                            {room.people?.map((person, pIdx) => (
                                <Person
                                    key={`person-${rIdx}-${pIdx}`}
                                    name={person.name}
                                    role={person.role}
                                    position={person.position}
                                    rotation={person.rotation}
                                    description={person.description}
                                />
                            ))}

                            {/* Futuristic Room Indicators */}
                            {room.center && (
                                <group position={[room.center.x, 0.05, room.center.z]}>
                                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                        <ringGeometry args={[1.8, 2, 64]} />
                                        <meshBasicMaterial color={room.color} transparent opacity={0.2} />
                                    </mesh>
                                    <RoomLabel position={{ x: 0, y: -0.05 }} text={room.name} />
                                </group>
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
