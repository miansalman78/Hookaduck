import { useRef, useEffect, memo } from 'react';
import gsap from 'gsap';

interface DuckProps {
    id: string;
    position: number;
    isSelected: boolean;
    isDisabled: boolean;
    onClick: () => void;
    showPrize: boolean;
    prizeName?: string;
}

function Duck({
    id,
    position,
    isSelected,
    isDisabled,
    onClick,
    showPrize,
    prizeName
}: DuckProps) {
    const duckRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isSelected && duckRef.current) {
            // Add a subtle bounce when selected
            gsap.to(duckRef.current, {
                scale: 1.1,
                duration: 0.3,
                ease: 'back.out(1.7)'
            });
        }
    }, [isSelected]);

    return (
        <div
            ref={duckRef}
            className={`duck-container relative cursor-pointer transition-all ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            onClick={!isDisabled ? onClick : undefined}
        >
            {/* Bobbing and Floating Animation Wrapper */}
            <style jsx>{`
                @keyframes duck-float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-8px) rotate(5deg); }
                    50% { transform: translateY(0) rotate(0deg); }
                    75% { transform: translateY(6px) rotate(-5deg); }
                }
                .animate-duck-float {
                    animation: duck-float ${2 + Math.random() * 2}s ease-in-out infinite;
                    animation-delay: ${Math.random() * -5}s;
                }
            `}</style>

            {/* Duck Body */}
            <div className={`relative w-24 h-24 transition-transform duration-500 animate-duck-float ${showPrize ? 'rotate-180' : ''}`}>
                {!showPrize ? (
                    // Exact match 3D glossy rubber duck - IMAGE BASED
                    <div className="w-full h-full relative group flex items-center justify-center">

                        {/* SHADOW FIX: Rotate X to lie flat on water surface (since duck is standing up) */}
                        <div
                            className="absolute top-[85%] left-1/2 -translate-x-1/2 w-[70%] h-4 bg-black/40 rounded-full blur-[4px] -z-20"
                            style={{ transform: 'rotateX(80deg) translateZ(-10px)' }}
                        ></div>

                        {/* Duck Image */}
                        <img
                            src="/duck.png"
                            alt="Rubber Duck"
                            className="w-full h-full object-contain drop-shadow-lg scale-125 translate-y-[-10px]"
                            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                        />
                    </div>
                ) : (
                    // Back of duck (prize reveal)
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-3 shadow-2xl transform rotate-180">
                            <div className="text-white text-center font-bold text-xs leading-tight">
                                {prizeName || 'Prize!'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Selection indicator */}
            {isSelected && !showPrize && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            )}
        </div>
    );
}

export default memo(Duck);
