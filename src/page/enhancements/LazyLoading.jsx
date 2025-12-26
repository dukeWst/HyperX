// src/components/LazyLoading.jsx
import React from 'react';

const LazyLoading = ({ status = "Loading...", isExiting = false }) => {
    return (
        // 1. Z-Index cực cao (10000) để đè lên tất cả
        // 2. Nền #05050A để đồng bộ với Home
        <div className={`fixed inset-0 flex items-center justify-center bg-[#05050A] z-[10000] ${isExiting ? 'animate-splash-exit' : ''}`}>
            
            {/* --- BACKGROUND EFFECTS --- */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative flex flex-col items-center gap-6">
                
                {/* --- PREMIUM SPINNER --- */}
                <div className="relative flex items-center justify-center">
                    <div className="premium-loader"></div>
                    {/* Small cyan glow in center */}
                    <div className="absolute h-2 w-2 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse"></div>
                </div>

                {/* --- TEXT STATUS --- */}
                <p className="text-sm font-bold tracking-[0.4em] uppercase animate-pulse text-cyan-500 mt-8">
                    {status}
                </p>
            </div>
        </div>
    );
};

export default LazyLoading;