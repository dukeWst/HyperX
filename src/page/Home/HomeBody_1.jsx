import React from 'react'
import { Link } from 'react-router-dom'

const HomeBody_1 = () => {
    return (
        <div className="relative isolate px-6 pt-14 lg:px-8">
            
            {/* LIGHTING: Spotlight từ trên đỉnh xuống */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
            </div>
            
            {/* Glow chính giữa màu Indigo */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.500),transparent)] opacity-30" />

            <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56 text-center">
                <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                    <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-400 ring-1 ring-white/10 hover:ring-white/20 hover:text-white transition-all duration-300 backdrop-blur-sm">
                        Announcing our next round of funding. <Link to="/docs" className="font-semibold text-indigo-400"><span className="absolute inset-0" aria-hidden="true" />Read more <span aria-hidden="true">&rarr;</span></Link>
                    </div>
                </div>
                
                <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 pb-2 drop-shadow-2xl">
                    Architect the Future of Digital Connection.
                </h1>
                
                <p className="mt-6 text-lg leading-8 text-gray-300 font-light tracking-wide max-w-2xl mx-auto">
                    Don't just write code. Build ecosystems. We provide the infrastructure that turns your raw ideas into global communities instantly.
                </p>
                
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Link
                        to="/community"
                        className="bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300"
                    >
                        Start Building Now
                    </Link>
                    <Link to="/docs" className="text-sm font-semibold leading-6 text-white group flex items-center gap-2">
                        View Documentation <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default HomeBody_1