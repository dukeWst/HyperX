import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../routes/supabaseClient";
import LazyLoading from "../enhancements/LazyLoading";

const AuthSignUp = () => {
    const navigate = useNavigate();

    // 1. Thêm state quản lý bước (Step)
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "", // 2. Thêm confirm password
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Xóa thông báo lỗi khi người dùng gõ lại
        if (message) setMessage(null);
    };

    // Xử lý chuyển sang Step 2
    const handleNextStep = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone) {
            setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin." });
            return;
        }
        setMessage(null);
        setStep(2);
    };

    // Xử lý quay lại Step 1
    const handlePrevStep = () => {
        setMessage(null);
        setStep(1);
    };

    // Xử lý Submit cuối cùng
    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { email, password, confirmPassword, name, phone } = formData;

        // Validate Password match
        if (password !== confirmPassword) {
            setLoading(false);
            setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp." });
            return;
        }

        if (password.length < 6) {
            setLoading(false);
            setMessage({ type: "error", text: "Mật khẩu phải có ít nhất 6 ký tự." });
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: { full_name: name, phone_number: phone },
                },
            });

            if (error) throw error;

            setLoading(false);
            navigate("/verify", {
                state: {
                    email,
                    message: "Please check your email to verify your account."
                }
            });

        } catch (error) {
            console.error("Supabase sign up error:", error.message);
            setLoading(false);
            setMessage({ type: "error", text: "Đăng ký thất bại. Vui lòng thử lại." });
        }
    };

    // Keep auth listener hook
    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {});
        return () => { authListener.subscription.unsubscribe(); };
    }, []);

    return (
        <div className="flex min-h-screen bg-[#09090b] text-white font-sans selection:bg-cyan-500/30">
            {loading && <LazyLoading status={'Initiating Sequence...'} />}

            {/* --- LEFT SIDE: FORM (2/5) --- */}
            <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:flex-none lg:w-2/5 lg:px-12 xl:px-16 z-20 bg-[#09090b] relative border-r border-white/5 shadow-2xl">
                
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                     <div className="absolute top-[10%] left-[-20%] w-[20rem] h-[20rem] bg-indigo-500/5 rounded-full blur-3xl"></div>
                </div>

                <div className="mx-auto w-full max-w-sm relative z-10">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                            Get started now.
                        </h1>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-gray-400 font-light tracking-wide uppercase">
                                {step === 1 ? "Personal Details" : "Security Setup"}
                            </p>
                            {/* Step Indicator */}
                            <div className="flex space-x-1">
                                <div className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-gray-700'}`}></div>
                                <div className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-gray-700'}`}></div>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-8">
                        
                        {/* --- STEP 1: INFO --- */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300 fade-in">
                                {/* FULL NAME */}
                                <div className="relative group">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="peer block w-full border-b border-gray-600 bg-transparent py-2.5 px-0 text-white placeholder-transparent focus:border-cyan-400 focus:outline-none transition-colors duration-300"
                                        placeholder="Full Name"
                                    />
                                    <label htmlFor="name" className="absolute left-0 -top-3.5 text-xs text-gray-400 transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-cyan-400 cursor-text">
                                        Full Name
                                    </label>
                                    <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-500 peer-focus:w-full"></div>
                                </div>

                                {/* PHONE */}
                                <div className="relative group">
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="peer block w-full border-b border-gray-600 bg-transparent py-2.5 px-0 text-white placeholder-transparent focus:border-cyan-400 focus:outline-none transition-colors duration-300"
                                        placeholder="Phone"
                                    />
                                    <label htmlFor="phone" className="absolute left-0 -top-3.5 text-xs text-gray-400 transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-cyan-400 cursor-text">
                                        Phone Number
                                    </label>
                                    <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-500 peer-focus:w-full"></div>
                                </div>

                                {/* EMAIL */}
                                <div className="relative group">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="peer block w-full border-b border-gray-600 bg-transparent py-2.5 px-0 text-white placeholder-transparent focus:border-cyan-400 focus:outline-none transition-colors duration-300"
                                        placeholder="Email"
                                    />
                                    <label htmlFor="email" className="absolute left-0 -top-3.5 text-xs text-gray-400 transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-cyan-400 cursor-text">
                                        Email Address
                                    </label>
                                    <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-500 peer-focus:w-full"></div>
                                </div>

                                {/* Next Button */}
                                <div className="pt-2">
                                    <button
                                        onClick={handleNextStep}
                                        className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-bold text-black bg-white transition-all hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] overflow-hidden"
                                    >
                                        <span className="relative z-10 uppercase tracking-widest flex items-center gap-2">
                                            Continue <span className="text-lg">→</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* --- STEP 2: PASSWORD --- */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                                {/* PASSWORD */}
                                <div className="relative group">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="peer block w-full border-b border-gray-600 bg-transparent py-2.5 px-0 text-white placeholder-transparent focus:border-cyan-400 focus:outline-none transition-colors duration-300"
                                        placeholder="Password"
                                    />
                                    <label htmlFor="password" className="absolute left-0 -top-3.5 text-xs text-gray-400 transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-cyan-400 cursor-text">
                                        Create Password
                                    </label>
                                    <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-500 peer-focus:w-full"></div>
                                </div>

                                {/* CONFIRM PASSWORD */}
                                <div className="relative group">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="peer block w-full border-b border-gray-600 bg-transparent py-2.5 px-0 text-white placeholder-transparent focus:border-cyan-400 focus:outline-none transition-colors duration-300"
                                        placeholder="Confirm Password"
                                    />
                                    <label htmlFor="confirmPassword" className="absolute left-0 -top-3.5 text-xs text-gray-400 transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-cyan-400 cursor-text">
                                        Confirm Password
                                    </label>
                                    <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-500 peer-focus:w-full"></div>
                                </div>

                                {/* Action Buttons (Back + Submit) */}
                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handlePrevStep}
                                        className="w-1/3 flex justify-center py-3.5 px-4 text-sm font-bold text-gray-400 border border-gray-700 hover:border-white hover:text-white transition-all uppercase tracking-widest"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSignUp}
                                        disabled={loading}
                                        className="flex-1 group relative flex justify-center py-3.5 px-4 text-sm font-bold text-black bg-white transition-all hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                    >
                                        <span className="relative z-10 uppercase tracking-widest">
                                            {loading ? "Processing..." : "Complete"}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Message Box */}
                        {message && (
                            <div className={`text-sm py-2 px-3 border-l-2 ${message.type === 'error' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-green-500 text-green-400 bg-green-500/5'} animate-pulse`}>
                                {message.text}
                            </div>
                        )}

                        <div className="mt-6 flex justify-between items-center text-xs text-gray-500 font-medium">
                            <Link to="/signin" className="hover:text-cyan-400 transition-colors uppercase">
                                Already a member?
                            </Link>
                            <Link to="/" className="hover:text-cyan-400 transition-colors uppercase">
                                Back Home
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- RIGHT SIDE: ARTWORK (3/5) --- */}
            <div className="relative hidden w-0 flex-1 lg:block overflow-hidden bg-[#050505]">
                <div className="absolute inset-0 w-full h-full bg-[#050505]">
                    <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-900/20 rounded-full blur-[100px] mix-blend-screen"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center p-20 z-10">
                    <div className="relative w-full max-w-lg aspect-square">
                        <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_12s_linear_infinite]"></div>
                        <div className="absolute inset-8 rounded-full border border-white/5 animate-[spin_18s_linear_infinite_reverse]"></div>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm">
                            <h2 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-tighter drop-shadow-2xl text-center leading-tight">
                                JOIN THE
                                <br />
                                NETWORK
                            </h2>
                            {/* Step Indicator Visual on Cover */}
                            <div className="mt-6 flex items-center space-x-3">
                                <span className={`text-sm font-bold ${step === 1 ? 'text-cyan-400' : 'text-gray-600'}`}>01</span>
                                <div className="h-[1px] w-12 bg-gray-700">
                                    <div className={`h-full bg-cyan-400 transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'}`}></div>
                                </div>
                                <span className={`text-sm font-bold ${step === 2 ? 'text-cyan-400' : 'text-gray-600'}`}>02</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthSignUp;