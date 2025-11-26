import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import LazyLoading from "../../LazyLoading";

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
                let errorText = "Đã xảy ra lỗi trong quá trình đăng nhập.";

                if (error.message.includes("Invalid login credentials")) {
                    errorText = "Email hoặc mật khẩu không chính xác.";
                } else if (error.message.includes("Email not confirmed")) {
                    errorText = "Email chưa được xác nhận. Vui lòng kiểm tra email.";
                } else {
                    errorText = error.message;
                }

                setMessage({ type: "error", text: errorText });
                return;
            }

            if (data.user && !data.user.email_confirmed_at) {
                setLoading(false);

                await supabase.auth.signOut();

                setTimeout(() => {
                    navigate("/verify", {
                        state: {
                            email,
                            message: "Please verify your email before signing in."
                        }
                    });
                }, 1500);

                return;
            }

            setLoading(false);

            setMessage({
                type: "success",
                text: `Đăng nhập thành công!`
            });

            // CHỈ chạy khi đăng nhập đúng
            setLoggingIn(true);

            setTimeout(() => {
                navigate("/");
            }, 800);


            setTimeout(() => {
                navigate("/");
            }, 1000);

        } catch (e) {
            setLoading(false);
            setMessage({ type: "error", text: e.message });
        }
    };

    return (
        <div className="relative isolate flex items-center justify-center min-h-screen px-6 bg-gray-900">
            {loggingIn && <LazyLoading status={'Logging in...'} />}

            {/* === TOP GRADIENT (GIỮ NGUYÊN) === */}
            <div
                aria-hidden="true"
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            >
                <div
                    style={{
                        clipPath:
                            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                    className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
                />
            </div>

            {/* === FORM KHUNG GIỐNG VERIFY === */}
            <div className="relative w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl px-10 py-12 shadow-2xl shadow-black/40">

                <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                    Sign in to <span className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-500 bg-clip-text text-transparent">
                        HyperX
                    </span>
                </h2>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-100">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white 
                            outline outline-1 outline-white/10 placeholder:text-gray-500
                            focus:outline-2 focus:outline-indigo-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-100">
                                Password
                            </label>

                            <Link className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                                Forgot password?
                            </Link>
                        </div>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                            className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white 
                            outline outline-1 outline-white/10 placeholder:text-gray-500
                            focus:outline-2 focus:outline-indigo-500"
                        />
                    </div>

                    {message && (
                        <div
                            className={`px-4 py-2 rounded-md text-center text-sm font-medium ${message.type === "error"
                                ? "bg-red-900/50 text-red-300"
                                : "bg-green-900/50 text-green-300"
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-indigo-500 py-2.5 font-semibold text-white 
                        hover:bg-indigo-400 transition disabled:opacity-50"
                    >

                        {loading ? "Signing in..." : "Sign in"}

                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                    <div className="pb-3">Not a member?{" "}
                        <Link to="/signup" className="font-semibold text-indigo-400 hover:text-indigo-300">
                            Sign up
                        </Link>
                    </div>
                    <Link to="/" className="font-semibold text-indigo-400 hover:text-indigo-300 border-t border-gray-700 pt-1">
                        Back to home
                    </Link>
                </p>

            </div>

            {/* === BOTTOM GRADIENT (GIỮ NGUYÊN) === */}

        </div>
    );
};

export default AuthSignIn;
