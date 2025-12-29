import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../routes/supabaseClient";
import LazyLoading from "../enhancements/LazyLoading";

const AuthSignIn = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [loggingIn, setLoggingIn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { email, password } = formData;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setLoading(false);
                let errorText = "Đã xảy ra lỗi.";
                if (error.message.includes("Invalid login credentials")) errorText = "Email hoặc mật khẩu sai.";
                else if (error.message.includes("Email not confirmed")) errorText = "Vui lòng xác thực email.";
                else errorText = error.message;
                setMessage({ type: "error", text: errorText });
                return;
            }

            if (data.user && !data.user.email_confirmed_at) {
                setLoading(false);
                await supabase.auth.signOut();
                setTimeout(() => navigate("/verify"), 1500);
                return;
            }

            setLoading(false);
            setMessage({ type: "success", text: `Chào mừng trở lại!` });
            setLoggingIn(true);
            setTimeout(() => navigate("/community"), 800);

        } catch (e) {
            setLoading(false);
            setMessage({ type: "error", text: e.message });
        }
    };

    return (
        <div className="flex min-h-screen bg-[#09090b] text-white font-sans selection:bg-cyan-500/30">
            {loggingIn && <LazyLoading status={'Authenticating...'} />}

            {/* --- LEFT SIDE: FORM (Chiếm 2/5 ~ 40%) --- */}
            {/* Thay đổi chính: lg:w-2/5 */}
            <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:flex-none lg:w-2/5 lg:px-12 xl:px-16 z-20 bg-[#09090b] relative border-r border-white/5 shadow-2xl">
                
                {/* Decorative glow behind form */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                     <div className="absolute top-[-10%] left-[-20%] w-[20rem] h-[20rem] bg-indigo-500/5 rounded-full blur-3xl"></div>
                </div>

                <div className="mx-auto w-full max-w-sm relative z-10">
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                            Welcome back!
                        </h1>
                        <p className="mt-3 text-sm text-gray-200 font-light tracking-wide">
                            ENTER THE SYSTEM
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        
                        {/* INPUT 1: EMAIL */}
                        <div className="relative group">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                className="peer block w-full border-b border-gray-600 bg-transparent py-3 px-0 text-white placeholder-transparent focus:border-cyan-400 focus:outline-none transition-colors duration-300"
                                placeholder="Email"
                            />
                            <label
                                htmlFor="email"
                                className="absolute left-0 -top-3.5 text-xs text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-cyan-400 cursor-text"
                            >
                                Email Address
                            </label>
                            {/* Glow effect on focus */}
                            <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-500 peer-focus:w-full"></div>
                        </div>

                        {/* INPUT 2: PASSWORD */}
                        <div className="relative group">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                className="peer block w-full border-b border-gray-600 bg-transparent py-3 px-0 text-white placeholder-transparent focus:border-cyan-400 focus:outline-none transition-colors duration-300"
                                placeholder="Password"
                            />
                            <label
                                htmlFor="password"
                                className="absolute left-0 -top-3.5 text-xs text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-cyan-400 cursor-text"
                            >
                                Password
                            </label>
                             {/* Glow effect on focus */}
                             <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-500 peer-focus:w-full"></div>
                        </div>

                        {/* Message Box */}
                        {message && (
                            <div className={`text-sm py-2 px-3 border-l-2 ${message.type === 'error' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-green-500 text-green-400 bg-green-500/5'} animate-pulse`}>
                                {message.text}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-bold text-black bg-white transition-all hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                            >
                                <span className="relative z-10 uppercase tracking-widest">
                                    {loading ? "Processing..." : "Sign In"}
                                </span>
                            </button>
                            
                            <div className="mt-6 flex justify-between items-center text-xs text-gray-500 font-medium">
                                <Link to="/signup" className="hover:text-cyan-400 transition-colors">
                                    CREATE ACCOUNT
                                </Link>
                                <Link to="/forgot-password" className="hover:text-cyan-400 transition-colors">
                                    FORGOT PASSWORD?
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- RIGHT SIDE: COVER / ARTWORK (Tự động chiếm phần còn lại ~ 3/5) --- */}
            {/* flex-1 sẽ lấy hết không gian còn lại sau khi Form lấy 2/5 */}
            <div className="relative hidden w-0 flex-1 lg:block overflow-hidden bg-[#050505]">
                
                {/* Abstract Background Layers */}
                <div className="absolute inset-0 w-full h-full bg-[#050505]">
                    {/* 1. Gradient Orbs */}
                    <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-900/20 rounded-full blur-[100px] mix-blend-screen"></div>

                    {/* 2. Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
                </div>

                {/* 3. Glass Card in Center */}
                <div className="absolute inset-0 flex items-center justify-center p-20 z-10">
                    <div className="relative w-full max-w-lg aspect-square">
                        {/* Animated Border Ring */}
                        <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_10s_linear_infinite]"></div>
                        <div className="absolute inset-4 rounded-full border border-white/5 animate-[spin_15s_linear_infinite_reverse]"></div>
                        
                        {/* Glassmorphism content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm">
                            <h2 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-tighter drop-shadow-2xl">
                                FUTURE
                                <br />
                                READY
                            </h2>
                            <div className="mt-4 h-1 w-24 bg-cyan-500/50 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthSignIn;