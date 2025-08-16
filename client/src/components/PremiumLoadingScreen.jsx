import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const PremiumLoadingScreen = () => {
  // Generate floating particles to match your homepage theme
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: i * 0.3,
    size: Math.random() * 3 + 2,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 4 + 3,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Elements - Matching your homepage */}
      <div className="absolute inset-0">
        {/* Subtle Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(90deg, #3b82f6 1px, transparent 1px), linear-gradient(#3b82f6 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Floating Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-float"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      {/* Main Loading Card */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl p-16 w-full max-w-lg shadow-xl shadow-slate-200/40">
        
        {/* Header - Matching your brand */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-6 shadow-lg relative">
            <Sparkles className="w-8 h-8 text-white" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl animate-ping opacity-20"></div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">
            CrestNova<span className="text-blue-600">.Sol</span>
          </h1>
          <p className="text-slate-600 text-lg">Premium SEO Analysis Platform</p>
        </div>

        {/* Three Bar Loading Animation */}
        <div className="flex justify-center items-end space-x-4 mb-16">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-4 h-12 bg-gradient-to-t from-blue-600 to-blue-400 rounded-full animate-pulse-bar"
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: '1.2s'
              }}
            />
          ))}
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-slate-700 text-xl font-medium">
            Generating report takes time according to your website size be patient...
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-bar {
          0%, 100% { 
            transform: scaleY(0.4);
            opacity: 0.6;
          }
          50% { 
            transform: scaleY(1);
            opacity: 1;
          }
        }
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-20px) rotate(180deg); 
          }
        }
        .animate-pulse-bar {
          animation: pulse-bar 1.2s ease-in-out infinite;
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PremiumLoadingScreen;