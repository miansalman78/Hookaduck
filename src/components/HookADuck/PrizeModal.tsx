'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface PrizeModalProps {
    isOpen: boolean;
    prizeName: string;
    onClose: () => void;
}

export default function PrizeModal({ isOpen, prizeName, onClose }: PrizeModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && modalRef.current && contentRef.current) {
            // Animate modal entrance
            gsap.fromTo(
                modalRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );

            gsap.fromTo(
                contentRef.current,
                { scale: 0.5, y: -50 },
                { scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
            );
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                ref={contentRef}
                className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-8 shadow-2xl max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Confetti effect */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${Math.random() * 20}%`,
                                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'][i % 5],
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random()}s`
                            }}
                        ></div>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                        🎉 Congratulations! 🎉
                    </h2>
                    <p className="text-white text-lg mb-2">You won:</p>
                    <div className="relative bg-white bg-opacity-20 backdrop-blur-md rounded-2xl p-6 mb-6 overflow-hidden border border-white/30">
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shine_2s_infinite]"></div>
                        <p className="text-3xl font-extrabold text-red-600 drop-shadow-md">
                            {prizeName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white text-purple-600 font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
                    >
                        Claim Prize
                    </button>
                </div>
            </div>
        </div>
    );
}
