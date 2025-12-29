import React from 'react'
import { Link } from 'react-router-dom'

const HomeBody_1 = () => {
    return (
        <div className="relative isolate px-6 pt-14 lg:px-8 overflow-hidden">
            
            {/* TECH SPOTLIGHT: Một luồng sáng Cyan cực mạnh từ trên xuống */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
            </div>
            
            {/* Atmospheric Glow */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(50rem_40rem_at_top,theme(colors.cyan.500),transparent)] opacity-10" />

            <div className="mx-auto max-w-5xl py-32 sm:py-48 lg:py-64 text-center">
                <div className="hidden sm:mb-12 sm:flex sm:justify-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="group relative rounded-full px-4 py-1 text-xs font-bold leading-6 text-cyan-400 ring-1 ring-cyan-500/20 hover:ring-cyan-500/40 transition-all duration-300 backdrop-blur-xl bg-cyan-500/5 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        HX SYSTEM STATUS: STABLE 2.4.0 
                        <Link to="/docs" className="font-black text-white ml-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            VIEW UPDATES <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </div>
                
                <h1 className="text-6xl font-black tracking-tighter text-white sm:text-8xl lg:text-[7rem] leading-[0.9] lg:leading-[0.85] animate-in zoom-in-95 duration-1000">
                    ARCHITECT <br className="hidden lg:block"/> 
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white/80 to-cyan-500 inline-block py-2">
                        THE FUTURE.
                    </span>
                </h1>
                
                <p className="mt-8 text-lg lg:text-xl leading-relaxed text-gray-500 font-medium max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                    We provide the planetary-scale infrastructure needed to transform raw creativity into global digital ecosystems instantly.
                </p>
                
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <Link
                        to="/community"
                        className="w-full sm:w-auto px-10 py-5 bg-white text-black text-base font-black rounded-2xl shadow-[0_20px_40px_rgba(6,182,212,0.2)] hover:shadow-[0_25px_50px_rgba(6,182,212,0.4)] hover:bg-cyan-50 hover:scale-[1.05] active:scale-95 transition-all duration-300 uppercase tracking-tighter"
                    >
                        Initialize Project
                    </Link>
                    <Link to="/docs" className="group text-base font-black leading-6 text-gray-500 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest text-xs">
                        Core Documentation <span aria-hidden="true" className="group-hover:translate-x-2 transition-transform duration-300">&rarr;</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default HomeBody_1