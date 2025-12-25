import React from 'react'
import { Link } from 'react-router-dom'

const HomeBody_4 = () => {
    return (
        // 1. Thêm 'flex items-center justify-center' để căn giữa nội dung theo chiều dọc
        // 2. Giữ 'h-screen' để chiếm toàn bộ chiều cao màn hình
        <div className="relative isolate overflow-hidden h-screen flex items-center justify-center bg-gray-900/40 border-t border-white/10 backdrop-blur-lg">
            
            {/* --- BACKGROUND EFFECTS --- */}
            
            {/* A. KHỐI SÁNG TỪ TRÊN XUỐNG (Spotlight Effect) */}
            {/* Khối này nằm ở top-0, giữa màn hình, tỏa ánh sáng Indigo xuống dưới */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-indigo-500/20 blur-[120px] rounded-b-full pointer-events-none -z-10"></div>

            {/* B. Grid Pattern (Làm mờ bớt để không tranh chấp với ánh sáng trên) */}
            <svg
                viewBox="0 0 1024 1024"
                className="absolute left-1/2 top-1/2 -z-20 h-[80rem] w-[80rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] opacity-60"
                aria-hidden="true"
            >
                <circle cx={512} cy={512} r={512} fill="url(#gradient-cta)" fillOpacity="0.4" />
                <defs>
                    <radialGradient id="gradient-cta">
                        <stop stopColor="#6366f1" /> {/* Indigo */}
                        <stop offset={1} stopColor="#a855f7" /> {/* Purple */}
                    </radialGradient>
                </defs>
            </svg>

            {/* --- NỘI DUNG CHÍNH (Đã được căn giữa nhờ Flexbox ở thẻ cha) --- */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
                
                <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-8">
                    Ready to Streamline Your Workflow? <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-indigo-200 to-indigo-400">
                        Join the revolution today.
                    </span>
                </h2>
                
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300 font-light">
                    Stop wrestling with distribution infrastructure. Focus on what you do best: Creating amazing software. We handle the rest.
                </p>
                
                <div className="mt-12 flex items-center justify-center gap-x-8">
                    {/* Nút chính */}
                    <Link
                        to="/product"
                        className="group relative bg-white px-10 py-4 text-base font-bold text-gray-900 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] hover:shadow-[0_0_60px_-15px_rgba(99,102,241,0.7)] hover:scale-105 transition-all duration-300"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                        Get Started Free
                    </Link>
                    
                    {/* Nút phụ */}
                    <Link to="/docs" className="group text-base font-semibold leading-6 text-white flex items-center gap-2 hover:text-indigo-300 transition-colors">
                        Contact Sales <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </Link>
                </div>

            </div>
        </div>
    )
}

export default HomeBody_4