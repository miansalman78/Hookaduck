import { useRef, useEffect, forwardRef, useImperativeHandle, memo } from 'react';
import gsap from 'gsap';

interface FishingRodProps {
    isActive: boolean;
    hookedDuck?: React.ReactNode;
}

export interface FishingRodRef {
    animateToTarget: (targetX: number, targetY: number) => Promise<void>;
    liftUp: () => Promise<void>;
    reset: () => Promise<void>;
}

const FishingRod = memo(forwardRef<FishingRodRef, FishingRodProps>(
    ({ isActive, hookedDuck }, ref) => {
        const rodRef = useRef<HTMLDivElement>(null);
        const lineRef = useRef<HTMLDivElement>(null);
        const hookRef = useRef<HTMLDivElement>(null);
        const armRef = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => ({
            animateToTarget: async (targetX: number, targetY: number) => {
                if (!rodRef.current || !lineRef.current || !hookRef.current || !armRef.current) return;

                const rodContainer = rodRef.current.parentElement?.parentElement;
                if (!rodContainer) return;

                // KILL IDLE ANIMATION when active
                gsap.killTweensOf(rodRef.current);

                const timeline = gsap.timeline();

                // Calculate rotation based on depth
                const rotationAngle = 5 + (targetY / 60);

                // Move arm and rod to aim at target
                timeline.to(armRef.current, {
                    x: targetX - 440,
                    y: targetY * 0.1, // Reduced vertical movement
                    rotation: rotationAngle, // Gentler tilt
                    duration: 1,
                    ease: 'power2.inOut'
                });

                // Counter-rotate the line container so it stays vertical (gravity)
                timeline.to(rodRef.current, {
                    rotation: -rotationAngle,
                    duration: 1,
                    ease: 'power2.inOut'
                }, '<'); // Run at start of previous animation

                // Update line and hook sync
                const lineTargetHeight = targetY - 260;

                timeline.to(lineRef.current, {
                    height: lineTargetHeight,
                    duration: 1.2,
                    ease: 'power2.inOut'
                }, '-=0.5');

                timeline.to(hookRef.current, {
                    y: lineTargetHeight,
                    duration: 1.2,
                    ease: 'power2.inOut'
                }, '-=1.2');

                await timeline;
            },

            liftUp: async () => {
                if (!lineRef.current || !hookRef.current || !armRef.current || !rodRef.current) return;

                const timeline = gsap.timeline();

                // Retract line
                const RETRACTED_HEIGHT = 40;

                timeline.to([lineRef.current, hookRef.current], {
                    height: RETRACTED_HEIGHT,
                    y: RETRACTED_HEIGHT,
                    duration: 1.5,
                    ease: 'power2.in'
                });

                // Pull arm back slightly and OUT UP
                timeline.to(armRef.current, {
                    y: -150, // Pull up significantly
                    rotation: -10, // Tilt back up
                    duration: 1.5,
                    ease: 'power2.in'
                }, '-=1.5');

                // Counter-rotate rodRef during lift up to maintain verticality
                timeline.to(rodRef.current, {
                    rotation: 10, // Counter the arm rotation
                    duration: 1.5,
                    ease: 'power2.in'
                }, '-=1.5');

                await timeline;
            },

            reset: async () => {
                if (!armRef.current || !lineRef.current || !hookRef.current || !rodRef.current) return;

                gsap.set(armRef.current, {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    clearProps: 'all'
                });
                gsap.set(rodRef.current, {
                    rotation: 0,
                    clearProps: 'all'
                });
                gsap.set(lineRef.current, {
                    height: 80,
                    clearProps: 'all'
                });
                gsap.set(hookRef.current, {
                    y: 80,
                    clearProps: 'all'
                });

                // RESTART IDLE ANIMATION
                if (rodRef.current) {
                    gsap.to(rodRef.current, {
                        rotation: 3,
                        duration: 2,
                        ease: 'sine.inOut',
                        yoyo: true,
                        repeat: -1
                    });
                }
            }
        }));

        // Initial Idle Animation
        useEffect(() => {
            if (!isActive && rodRef.current) {
                gsap.to(rodRef.current, {
                    rotation: 3,
                    duration: 2,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1
                });
            }
        }, [isActive]);

        return (
            <div className="fishing-rod-stage absolute inset-0 pointer-events-none z-[2000]">
                {/* Arm and Rod Assembly - Always visible */}
                <div
                    ref={armRef}
                    className="absolute top-[10%] left-[20px] flex items-center z-[100]"
                    style={{ transformOrigin: 'left center' }}
                >
                    <div className="relative">
                        {/* Hand holding the fishing rod - Always visible */}
                        <img
                            src="/hand.png"
                            alt="Hand holding fishing rod"
                            className="w-[900px] h-auto drop-shadow-2xl"
                            style={{ transformOrigin: 'left center' }}
                        />

                        {/* Hook/Ring - Always visible at rod tip */}
                        <div className="absolute z-10 left-[400px] top-[155px]">
                            {/* The Ring Hook - Always visible */}
                            <div className="flex flex-col items-center">
                                {/* Metallic Connector */}
                                <div className="w-[4px] h-6 bg-zinc-400"></div>

                                {/* The Ring Hook */}
                                <div className="w-10 h-14 border-[5px] border-zinc-400 rounded-b-full bg-transparent border-t-0 relative shadow-2xl">
                                    <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-7 h-[4px] bg-zinc-400"></div>
                                    {/* Hook Point */}
                                    <div className="absolute bottom-[4px] right-[-7px] w-4 h-4 bg-zinc-400 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Functional Line - Always visible hanging part */}
                        <div
                            ref={rodRef}
                            className="absolute z-10 w-0 h-0 left-[420px] top-[210px] overflow-visible"
                        >
                            <div className="absolute left-0 top-0 w-0 h-0 origin-top pointer-events-none flex justify-center">
                                {/* Visual Line (Fishing line) */}
                                <div
                                    ref={lineRef}
                                    className="w-[8px] h-[80px] bg-gradient-to-b from-yellow-600 to-yellow-400 border-x border-yellow-700 shadow-[2px_0_4px_rgba(0,0,0,0.5)] rounded-b-md"
                                    style={{ transformOrigin: 'top center', willChange: 'height' }}
                                ></div>

                                {/* Hook at end of line (for duck attachment) */}
                                <div
                                    ref={hookRef}
                                    className="absolute top-[80px] left-1/2 -translate-x-1/2 flex flex-col items-center"
                                >
                                    {/* Small knot/connector at end of line */}
                                    <div className="w-3 h-3 bg-yellow-600 rounded-full mb-[-2px]"></div>

                                    {/* Hooked Duck Attachment Point - Shifted down to align hook with head */}
                                    {hookedDuck && (
                                        <div className="relative transform scale-125 translate-y-[15px] origin-top drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)]">
                                            {hookedDuck}

                                            {/* Water Drops Effect - Falling from the duck */}
                                            <div className="absolute inset-x-0 bottom-0 h-0 flex justify-center overflow-visible pointer-events-none">
                                                {[...Array(5)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="absolute w-2 h-3 bg-blue-300 rounded-full opacity-80 animate-drop-fall"
                                                        style={{
                                                            left: `${(i - 2) * 10}px`, // Spread drops horizontally
                                                            animationDelay: `${i * 0.15}s`,
                                                            animationDuration: '0.8s'
                                                        }}
                                                    ></div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
));

FishingRod.displayName = 'FishingRod';
export default FishingRod;
