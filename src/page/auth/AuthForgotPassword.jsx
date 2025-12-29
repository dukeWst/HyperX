import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../routes/supabaseClient";

const AuthForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Artificial delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`, // Optional: useful if we have an update page
            });
            
            setLoading(false);
            
            if (error) {
                // Supabase security: sometimes it doesn't return error for unregistered emails to prevent enumeration,
                // but if it does, handle it.
                setMessage({ type: "error", text: error.message });
            } else {
                setIsSent(true);
                // Update message for resend context if already sent? 
                // For now, consistent message is fine.
                setMessage({ type: "success", text: `We’ve sent a password reset email to ${email}. Please check your email.` });
            }

        } catch (err) {
            setLoading(false);
            setMessage({ type: "error", text: err.message });
        }
    };

    return (
        <div className="flex min-h-screen bg-[#09090b] text-white font-sans selection:bg-cyan-500/30">
            {/* Removed LazyLoading overlay */}

            {/* --- LEFT SIDE: FORM --- */}
            <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:flex-none lg:w-2/5 lg:px-12 xl:px-16 z-20 bg-[#09090b] relative border-r border-white/5 shadow-2xl">
                
                {/* Decorative glow behind form */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                     <div className="absolute top-[-10%] left-[-20%] w-[20rem] h-[20rem] bg-indigo-500/5 rounded-full blur-3xl"></div>
                </div>

                <div className="mx-auto w-full max-w-sm relative z-10">
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                            Reset Password
                        </h1>
                        <p className="mt-3 text-sm text-gray-200 font-light tracking-wide">
                            {isSent ? "CHECK YOUR EMAIL" : "RECOVER YOUR ACCOUNT"}
                        </p>
                    </div>

                    {!isSent ? (
                        <form onSubmit={handleSubmit} className="space-y-10">
                            
                            {/* INPUT: EMAIL */}
                            <div className="relative group">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="peer block w-full border-b border-gray-600 bg-transparent py-3 px-0 text-white placeholder-transparent focus:border-cyan-400 focus:outline-none transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Email"
                                />
                                <label
                                    htmlFor="email"
                                    className="absolute left-0 -top-3.5 text-xs text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-cyan-400 cursor-text"
                                >
                                    Email Address
                                </label>
                                <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-500 peer-focus:w-full"></div>
                            </div>

                            {/* Message Box (Error) */}
                            {message && message.type === 'error' && (
                                <div className="text-sm py-2 px-3 border-l-2 border-red-500 text-red-400 bg-red-500/5 animate-pulse">
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
                                        {loading ? "Sending..." : "Send Reset Link"}
                                    </span>
                                </button>
                                
                                <div className="mt-6 flex justify-center text-xs text-gray-500 font-medium">
                                    <Link to="/signin" className="hover:text-cyan-400 transition-colors uppercase">
                                        Back to Sign In
                                    </Link>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-lg">
                                <p className="text-green-400 text-sm font-medium leading-relaxed text-center">
                                    {message?.text}
                                </p>
                             </div>

                             <div className="pt-4 flex flex-col gap-3">
                                {/* Resend Button */}
                                <button
                                    onClick={() => handleSubmit(null)}
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-bold text-white bg-white/10 border border-white/10 transition-all hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                >
                                     <span className="relative z-10 uppercase tracking-widest">
                                        {loading ? "Resending..." : "Resend Email"}
                                    </span>
                                </button>

                                <Link
                                    to="/signin"
                                    className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-bold text-black bg-white transition-all hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] overflow-hidden"
                                >
                                     <span className="relative z-10 uppercase tracking-widest">
                                        Back to Login
                                    </span>
                                </Link>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- RIGHT SIDE: COVER / ARTWORK --- */}
            <div className="relative hidden w-0 flex-1 lg:block overflow-hidden bg-[#050505]">
                
                {/* Abstract Background Layers */}
                <div className="absolute inset-0 w-full h-full bg-[#050505]">
                    <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-900/20 rounded-full blur-[100px] mix-blend-screen"></div>

                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
                </div>

                {/* Glass Card in Center */}
                <div className="absolute inset-0 flex items-center justify-center p-20 z-10">
                    <div className="relative w-full max-w-lg aspect-square">
                        <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_10s_linear_infinite]"></div>
                        <div className="absolute inset-4 rounded-full border border-white/5 animate-[spin_15s_linear_infinite_reverse]"></div>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm">
                            <h2 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-tighter drop-shadow-2xl text-center">
                                RECOVER
                                <br />
                                ACCESS
                            </h2>
                            <div className="mt-4 h-1 w-24 bg-cyan-500/50 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForgotPassword;
