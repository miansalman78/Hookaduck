'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import Duck from './Duck';
import FishingRod, { FishingRodRef } from './FishingRod';
import PrizeModal from './PrizeModal';
import { GameState, Prize } from './types';

// Mock prize data for Milestone 1
const MOCK_PRIZES: Prize[] = [
    { id: 'p1', name: '10% Discount', isClaimed: false },
    { id: 'p2', name: 'Free Drink', isClaimed: false },
    { id: 'p3', name: 'Free Dessert', isClaimed: false },
    { id: 'p4', name: '20% Off Next Visit', isClaimed: false },
    { id: 'p5', name: 'VIP Access', isClaimed: false },
    { id: 'p6', name: 'Free Appetizer', isClaimed: false },
    { id: 'p7', name: '15% Discount', isClaimed: false },
    { id: 'p8', name: 'Free Coffee', isClaimed: false },
    { id: 'p9', name: 'Buy 1 Get 1', isClaimed: false },
    { id: 'p10', name: 'Mystery Prize', isClaimed: false },
    { id: 'p11', name: 'Special Burger', isClaimed: false },
    { id: 'p12', name: 'Free Topping', isClaimed: false },
    { id: 'p13', name: 'Extra Fries', isClaimed: false },
    { id: 'p14', name: 'Ice Cream Cup', isClaimed: false },
    { id: 'p15', name: 'Grand Prize', isClaimed: false },
];

const DUCKS_DATA = [
    { id: 'd1', prizeId: 'p1' },
    { id: 'd2', prizeId: 'p2' },
    { id: 'd3', prizeId: 'p3' },
    { id: 'd4', prizeId: 'p4' },
    { id: 'd5', prizeId: 'p5' },
    { id: 'd6', prizeId: 'p6' },
    { id: 'd7', prizeId: 'p7' },
    { id: 'd8', prizeId: 'p8' },
    { id: 'd9', prizeId: 'p9' },
    { id: 'd10', prizeId: 'p10' },
    { id: 'd11', prizeId: 'p11' },
    { id: 'd12', prizeId: 'p12' },
    { id: 'd13', prizeId: 'p13' },
    { id: 'd14', prizeId: 'p14' },
    { id: 'd15', prizeId: 'p15' },
];

export default function HookADuckGame() {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [selectedDuckId, setSelectedDuckId] = useState<string | null>(null);
    const [revealedPrize, setRevealedPrize] = useState<Prize | null>(null);
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isDuckOnHook, setIsDuckOnHook] = useState(false);
    const [splashPosition, setSplashPosition] = useState<{ x: number, y: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const fishingRodRef = useRef<FishingRodRef>(null);
    const animationRef = useRef<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const soundRef = useRef<HTMLAudioElement>(null);
    const bgMusicRef = useRef<HTMLAudioElement>(null);
    const duckRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Use refs for high-frequency physics to avoid re-renders
    const duckPhysics = useRef(DUCKS_DATA.map((duck, index) => {
        const radius = 50 + (index * 25);
        // Distribute ducks at different depths but keep them fixed on their lane
        const speed = 0.8 + Math.random() * 0.8;
        const startX = (Math.random() - 0.5) * 400;
        const laneY = (Math.random() - 0.5) * 400; // Random starting depth

        return {
            id: duck.id,
            x: startX,
            y: laneY, // This Y will remain constant
            vx: Math.random() > 0.5 ? speed : -speed,
            vy: 0, // Only move left/right
            facingLeft: false
        };
    }));

    // Ensure video loops seamlessly and stays playing
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.playbackRate = 1.0;

        const handleTimeUpdate = () => {
            // "Buffer" loop: Reset slightly before the absolute end to avoid browser stutter
            // User requested: "video end go hi na" (don't let it reach the end)
            if (video.duration && video.currentTime > video.duration - 0.2) {
                video.currentTime = 0;
                video.play();
            }
        };

        // Aggressive playback enforcement
        const ensurePlaying = () => {
            if (video.paused && video.readyState >= 2) {
                video.play().catch(() => { });
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('pause', ensurePlaying);

        // Force play on mount
        ensurePlaying();

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('pause', ensurePlaying);
        };
    }, []);

    // Ensure component is mounted (client-side only)
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Autonomous duck movement with boundary collision
    useEffect(() => {
        if (gameState !== 'idle' || !isMounted) return;

        const POOL_RADIUS_X = 350;
        const POOL_RADIUS_Y = 280;

        const animationLoop = () => {
            // 1. Boundary & Movement
            duckPhysics.current.forEach((duck, index) => {
                const el = duckRefs.current[index];
                if (!el) return;

                // Update position (Horizontal Only)
                duck.x += duck.vx;
                // duck.y remains unchanged

                // Boundary collision (Elliptical check but only reflecting horizontally)
                const distAtCurrentY = (duck.x * duck.x) / (POOL_RADIUS_X * POOL_RADIUS_X) +
                    (duck.y * duck.y) / (POOL_RADIUS_Y * POOL_RADIUS_Y);

                if (distAtCurrentY >= 0.9) {
                    // Simple reversal of horizontal velocity
                    duck.vx *= -1;
                    // Push back slightly to avoid sticking
                    duck.x += duck.vx * 2;
                }

                duck.facingLeft = duck.vx < 0;
            });

            // 2. Duck-to-Duck Collision Detection (One-dimensional for horizontal lanes)
            const ducks = duckPhysics.current;
            const MIN_DIST_X = 100; // Distance to keep apart horizontally
            const LANE_HEIGHT = 60; // How close they must be vertically to collide

            for (let i = 0; i < ducks.length; i++) {
                for (let j = i + 1; j < ducks.length; j++) {
                    const d1 = ducks[i];
                    const d2 = ducks[j];

                    // Only collide if they are in the same or nearby "lane"
                    const dy = Math.abs(d2.y - d1.y);
                    if (dy < LANE_HEIGHT) {
                        const dx = d2.x - d1.x;
                        const dist = Math.abs(dx);

                        if (dist < MIN_DIST_X) {
                            // Resolve horizontal overlap
                            const overlap = MIN_DIST_X - dist;
                            const moveX = (overlap / 2) * (dx > 0 ? 1 : -1);

                            d1.x -= moveX;
                            d2.x += moveX;

                            // Reverse horizontal velocities
                            const tempVx = d1.vx;
                            d1.vx = d2.vx;
                            d2.vx = tempVx;
                        }
                    }
                }
            }

            // 3. Apply styles to DOM
            duckPhysics.current.forEach((duck, index) => {
                const el = duckRefs.current[index];
                if (!el) return;

                const scale = 1 + (duck.y / 600);
                const zIndex = Math.floor(duck.y + 600);

                // Add a subtle oscillating rotation based on position/time
                const time = performance.now() * 0.002;
                const waveRotation = Math.sin(time + index) * 5;

                el.style.transform = `translate3d(calc(-50% + ${duck.x}px), calc(-50% + ${duck.y}px), 0) rotateX(-90deg) rotateY(${waveRotation}deg) scale(${scale}) scaleX(${duck.facingLeft ? 1 : -1})`;
                el.style.zIndex = zIndex.toString();
            });

            animationRef.current = requestAnimationFrame(animationLoop);
        };

        animationRef.current = requestAnimationFrame(animationLoop);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current as number);
            }
        };
    }, [gameState, isMounted]);

    const handleDuckClick = async (duckId: string, duckIndex: number) => {
        if (gameState !== 'idle') return;

        setGameState('selecting');
        setSelectedDuckId(duckId);
        setIsDuckOnHook(false);

        // Pause background music when duck is picked
        if (bgMusicRef.current) {
            bgMusicRef.current.pause();
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        const duckElement = duckRefs.current[duckIndex];
        const rodElement = document.querySelector('.fishing-rod-container') || document.querySelector('.fishing-rod-stage');
        if (!duckElement || !rodElement) return;

        const duckRect = duckElement.getBoundingClientRect();
        const rodRect = rodElement.getBoundingClientRect();

        // Aim for the duck's head area (approx 15px from the top)
        const targetX = (duckRect.left + duckRect.width / 2) - rodRect.left;
        const targetY = (duckRect.top + 15) - rodRect.top;

        setGameState('hooking');

        // Play drum sound effect
        if (soundRef.current) {
            soundRef.current.currentTime = 0;
            soundRef.current.play().catch(e => console.log('Audio play failed:', e));
        }

        if (fishingRodRef.current) {
            await fishingRodRef.current.animateToTarget(targetX, targetY);

            // Trigger Splash exactly when line hits duck and starts lifting
            const duckData = DUCKS_DATA[duckIndex]; // Get original pos data from physics ref instead?
            // Actually better to use the physics current pos
            const currentPhysics = duckPhysics.current[duckIndex];
            setSplashPosition({ x: currentPhysics.x, y: currentPhysics.y });

            // Clear splash after animation
            setTimeout(() => setSplashPosition(null), 1000);

            setIsDuckOnHook(true);
            await new Promise(resolve => setTimeout(resolve, 300));
            await fishingRodRef.current.liftUp();
        }

        setGameState('revealing');
        const duck = DUCKS_DATA.find(d => d.id === duckId);
        const prize = MOCK_PRIZES.find(p => p.id === duck?.prizeId);

        if (prize) {
            setRevealedPrize(prize);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setShowPrizeModal(true);
        }

        setGameState('complete');
    };

    const resetGame = () => {
        setGameState('idle');
        setSelectedDuckId(null);
        setIsDuckOnHook(false);
        setRevealedPrize(null);
        setShowPrizeModal(false);

        // Stop selection sound effect
        if (soundRef.current) {
            soundRef.current.pause();
            soundRef.current.currentTime = 0;
        }

        // Resume background music
        if (bgMusicRef.current) {
            bgMusicRef.current.play().catch(e => console.log('BG Music resume failed:', e));
        }

        if (fishingRodRef.current) {
            fishingRodRef.current.reset();
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-transparent">
            {/* Game Title Badge */}
            <div className="absolute top-8 left-8 z-[60] pointer-events-none select-none animate-badge-in">
                <div className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-black/10">
                    <h1 className="text-base md:text-xl font-black text-black uppercase tracking-tight">
                        Pick your duck <span className="text-orange-600 font-bold">to reveal your prize</span>
                    </h1>
                </div>
            </div>

            {/* Background Video */}
            <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
            >
                <source src="/background.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Sound Effect */}
            <audio ref={soundRef} src="/music.mpeg" preload="auto" />
            <audio ref={bgMusicRef} src="/bgmusic.mpeg" preload="auto" loop autoPlay />

            {/* Cinematic 3D Stage */}
            <div className="relative w-full h-full [perspective:1400px] z-10">
                <FishingRod
                    ref={fishingRodRef}
                    isActive={gameState !== 'idle'}
                    hookedDuck={
                        isDuckOnHook && selectedDuckId ? (
                            <div className="transform rotateX(-60deg) scale-110">
                                <Duck
                                    id={selectedDuckId}
                                    position={0}
                                    isSelected={true}
                                    isDisabled={true}
                                    onClick={() => { }}
                                    showPrize={gameState === 'revealing' || gameState === 'complete'}
                                    prizeName={revealedPrize?.name}
                                    displayNumber={DUCKS_DATA.findIndex(d => d.id === selectedDuckId) + 1}
                                />
                            </div>
                        ) : null
                    }
                />

                {/* THE BASIN: True 3D Cylinder Reconstruction */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-[-450px] transition-all duration-1000 ease-out"
                    style={{
                        transform: 'rotateX(90deg) rotateZ(0deg)',
                        transformStyle: 'preserve-3d',
                        width: '1200px',
                        height: '1200px'
                    }}
                >
                    {/* OUTER WALL BASE (The very bottom floor) */}
                    <div
                        className="absolute inset-0 rounded-full bg-[#e65100] shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
                        style={{
                            transform: 'translateZ(-110px)',
                            background: '#511f00ff' // Darker orange
                        }}
                    ></div>

                    {/* DARK ORANGE CYLINDER SIDE: Stacking rings to create a solid wall */}
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute inset-0 rounded-full border-[80px] border-[#e65100]"
                            style={{
                                transform: `translateZ(-${i * 5.5}px)`,
                                boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.69), 0 0 1px #e65100',
                                background: 'transparent'
                            }}
                        ></div>
                    ))}

                    {/* THE TOP RIM */}
                    <div className="absolute inset-0 rounded-full border-[80px] border-[#fb8c00] shadow-[0_10px_0_#ef6c00,inset_0_5px_15px_rgba(0,0,0,0.3)] z-50">
                        <div className="absolute inset-[-10px] rounded-full border-[10px] border-white/10 filter blur-[4px]"></div>
                        <div className="absolute inset-[-10px] rounded-full border-t-[14px] border-white/20 filter blur-[3px] opacity-90"></div>
                        <div className="absolute inset-[-0px] rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none"></div>
                    </div>

                    {/* INNER BASIN */}
                    <div
                        className="absolute inset-[80px] rounded-full border-[15px] border-[#e65100] z-40 shadow-[inset_0_30px_80px_rgba(0,0,0,0.9)]"
                        style={{
                            transform: 'translateZ(-1px)',
                            height: 'calc(100% - 80px)',
                            transformStyle: 'preserve-3d',
                            background: 'transparent'
                        }}
                    >
                        {/* WATER SURFACE */}
                        <div
                            ref={containerRef}
                            className="absolute inset-0 rounded-full shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] overflow-hidden"
                            style={{
                                background: '#006064',
                                transform: 'translateZ(-30px)',
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10 mix-blend-overlay"></div>
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#006064] via-[#00838f] to-[#0097a7]"></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                    {[...Array(4)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute rounded-full border-[2px] border-white/10 animate-pool-wave"
                                            style={{ animationDelay: `${i * 2}s` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            {/* Splash Effect */}
                            {splashPosition && (
                                <div
                                    className="absolute z-20 pointer-events-none"
                                    style={{
                                        left: `calc(50% + ${splashPosition.x}px)`,
                                        top: `calc(50% + ${splashPosition.y}px)`
                                    }}
                                >
                                    {/* Main Splash Column */}
                                    <div className="absolute left-0 bottom-0 w-8 bg-blue-200/60 blur-sm rounded-t-full splash-water origin-bottom"></div>
                                    <div className="absolute left-[-10px] bottom-0 w-6 bg-white/40 blur-md rounded-t-full splash-water origin-bottom" style={{ animationDelay: '0.1s', height: '40px' }}></div>
                                    <div className="absolute left-[10px] bottom-0 w-6 bg-white/40 blur-md rounded-t-full splash-water origin-bottom" style={{ animationDelay: '0.05s', height: '50px' }}></div>

                                    {/* Splash Ring */}
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-[4px] border-white/50 rounded-full animate-ping"></div>
                                </div>
                            )}
                        </div>

                        {/* Ducks Layer */}
                        <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                            {isMounted && DUCKS_DATA.map((duck, index) => (
                                <div
                                    key={duck.id}
                                    ref={el => { duckRefs.current[index] = el }}
                                    data-duck-id={duck.id}
                                    className="absolute"
                                    style={{
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%) rotateX(-90deg)', // Initial
                                        transition: 'none',
                                        visibility: (isDuckOnHook && selectedDuckId === duck.id) ? 'hidden' : 'visible'
                                    }}
                                >
                                    <Duck
                                        id={duck.id}
                                        position={index}
                                        isSelected={selectedDuckId === duck.id}
                                        isDisabled={gameState !== 'idle' && selectedDuckId !== duck.id}
                                        onClick={() => handleDuckClick(duck.id, index)}
                                        showPrize={selectedDuckId === duck.id && gameState === 'revealing'}
                                        prizeName={revealedPrize?.name}
                                        displayNumber={index + 1}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Play Again Button */}
                {gameState === 'complete' && !showPrizeModal && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
                        <button
                            onClick={resetGame}
                            className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-10 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-white"
                        >
                            🎮 Play Again
                        </button>
                    </div>
                )}

                <PrizeModal
                    isOpen={showPrizeModal}
                    prizeName={revealedPrize?.name || ''}
                    onClose={resetGame}
                />
            </div>
        </div >
    );
}
