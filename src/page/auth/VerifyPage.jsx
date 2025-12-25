import { useLocation, Link } from "react-router-dom";

export default function VerifyPage() {
    const location = useLocation();
    const email = location.state?.email || "your-email@example.com";
    const message = location.state?.message || "Please check your inbox to verify your account.";

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#09090b] overflow-hidden text-white font-sans selection:bg-cyan-500/30">

            {/* --- BACKGROUND EFFECTS --- */}
            <div className="absolute inset-0 z-0">
                {/* 1. Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
                
                {/* 2. Gradient Orbs */}
                <div className="absolute top-[-10%] left-[20%] w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[20%] w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            {/* --- MAIN CARD --- */}
            <div className="relative z-10 w-full max-w-lg px-6">
                
                {/* Decorative border container with glow */}
                <div className="relative bg-[#09090b]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl">
                    
                    {/* Top Glow Line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>

                    {/* ICON SECTION */}
                    <div className="flex justify-center mb-8">
                        <div className="relative group">
                            {/* Animated Rings */}
                            <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping"></div>
                            <div className="relative w-24 h-24 bg-[#09090b] border border-cyan-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)] group-hover:border-cyan-400 transition-colors duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* CONTENT SECTION */}
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                            Check Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Inbox</span>
                        </h1>

                        <p className="text-gray-400 text-base leading-relaxed">
                            {message}
                        </p>

                        {/* Email Display Box */}
                        {email && (
                            <div className="my-6 py-3 px-4 bg-white/5 border border-white/10 rounded-lg inline-flex items-center gap-3 max-w-full">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-gray-200 font-mono text-sm truncate">{email}</span>
                            </div>
                        )}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-8 space-y-4">
                        <Link
                            to="/signin"
                            className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-bold text-black bg-white transition-all hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] overflow-hidden"
                        >
                            <span className="relative z-10 uppercase tracking-widest flex items-center gap-2">
                                Access System <span className="text-lg">→</span>
                            </span>
                        </Link>

                        <div className="text-center">
                            <Link 
                                to="/" 
                                className="text-xs text-gray-500 font-medium hover:text-cyan-400 transition-colors uppercase tracking-wider"
                            >
                                ← Return to Homepage
                            </Link>
                        </div>
                    </div>
                </div>
                
                {/* Footer / Copyright subtle text */}
                <div className="mt-8 text-center">
                     <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">
                        HyperX Security Systems &copy; {new Date().getFullYear()}
                     </p>
                </div>
            </div>
        </div>
    );
}