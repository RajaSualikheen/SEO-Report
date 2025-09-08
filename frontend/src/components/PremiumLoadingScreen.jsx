import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Globe, Zap, Eye, Target } from 'lucide-react';

const UniqueSEOLoadingScreen = ({ progress = 65 }) => {
    const [currentPhase, setCurrentPhase] = useState(0);
    const [currentTip, setCurrentTip] = useState(0);
    
    const phases = [
        { message: "Scanning website structure...", icon: Globe },
        { message: "Analyzing content quality...", icon: Eye },
        { message: "Evaluating backlink profile...", icon: TrendingUp },
        { message: "Generating insights...", icon: Target }
    ];

    const seoTips = [
        "Focus on creating high-quality, original content",
        "Optimize your page loading speed for better rankings",
        "Use descriptive, keyword-rich meta descriptions",
        "Build quality backlinks from authoritative sources",
        "Ensure your website is mobile-friendly",
        "Create a clear site structure with internal linking"
    ];

    useEffect(() => {
        const phaseIndex = Math.min(Math.floor(progress / 25), phases.length - 1);
        setCurrentPhase(phaseIndex);
    }, [progress]);

    useEffect(() => {
        const tipInterval = setInterval(() => {
            setCurrentTip((prev) => (prev + 1) % seoTips.length);
        }, 4000);
        return () => clearInterval(tipInterval);
    }, []);

    const currentPhaseData = phases[currentPhase];
    const CurrentIcon = currentPhaseData.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950 dark:to-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Search className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        CrestNova<span className="text-blue-600">.Sol</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">SEO Intelligence Platform</p>
                </div>

                {/* Hexagon Perimeter Progress */}
                <div className="relative mb-12">
                    <div className="relative w-64 h-64 mx-auto">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                            <defs>
                                <linearGradient id="hexStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>

                            {/* Hexagon background */}
                            <polygon 
                                points="100,20 170,60 170,140 100,180 30,140 30,60"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-gray-200 dark:text-gray-700"
                            />

                            {/* Progress perimeter stroke */}
                            <polygon
                                points="100,20 170,60 170,140 100,180 30,140 30,60"
                                fill="none"
                                stroke="url(#hexStroke)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    strokeDasharray: 480,
                                    strokeDashoffset: 480 - (480 * progress / 100),
                                    transition: 'stroke-dashoffset 1s ease-out'
                                }}
                            />
                        </svg>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div 
                                key={currentPhase}
                                className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center mb-4 border-2 border-gray-100 dark:border-gray-700"
                                style={{ animation: 'iconPop 0.5s ease-out' }}
                            >
                                <CurrentIcon className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                                {Math.round(progress)}%
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                                Complete
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                <div className="text-center mb-8">
                    <div 
                        key={currentPhase}
                        className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4"
                        style={{ animation: 'fadeSlide 0.4s ease-out' }}
                    >
                        {currentPhaseData.message}
                    </div>
                    <div className="flex justify-center space-x-2">
                        {phases.map((_, index) => (
                            <div
                                key={index}
                                className={`w-8 h-1 rounded-full transition-all duration-500 ${
                                    index <= currentPhase 
                                        ? 'bg-blue-600' 
                                        : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* SEO Tip Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                                SEO Tip
                            </div>
                            <div 
                                key={currentTip}
                                className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed"
                                style={{ animation: 'fadeIn 0.4s ease-out' }}
                            >
                                {seoTips[currentTip]}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Powered by advanced AI algorithms
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes iconPop {
                    0% { transform: scale(0.7); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeSlide {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default UniqueSEOLoadingScreen;
