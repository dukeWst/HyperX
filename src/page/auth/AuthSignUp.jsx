import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const AuthSignUp = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };




    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const { email, password, name, phone } = formData;

        // 1️⃣ CHECK EMAIL TỒN TẠI TRƯỚC
        const { data: exists, error: checkError } = await supabase.rpc(
            "check_user_exists",
            { email }
        );

        if (checkError) {
            console.error(checkError);
            setMessage("User already registered");
            setLoading(false);
            return;
        }

        if (exists) {
            setMessage("Error: Email already exists.");
            setLoading(false);
            return;
        }

        // 2️⃣ Create user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: { full_name: name, phone_number: phone },
            },
        });

        setLoading(false);

        if (error) {
            let msg = error.message;

            if (msg.includes("already registered")) {
                setMessage("Error: Email already exists.");
            } else {
                setMessage(`Error: ${msg}`);
            }

            return;
        }

        // 3️⃣ Redirect user to verify screen
        navigate("/verify", {
            state: {
                email,
                message: "Please check your email to verify your account."
            }
        });
    };


    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => { }
        );
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <div className="relative isolate px-6 pt-14 pb-24  lg:px-8 bg-gray-900 min-h-screen">

            {/* === TOP GRADIENT === */}
            <div
                aria-hidden="true"
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            >
                <div
                    style={{
                        clipPath:
                            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                    className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                />
            </div>

            {/* === BOX SIGN UP (KHÔNG CĂN GIỮA) === */}
            <div className="relative max-w-md mx-auto bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl px-10 py-12 shadow-2xl shadow-black/40">

                <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                    Sign up for <span className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-500 bg-clip-text text-transparent">
                        HyperX
                    </span>
                </h2>

                <form onSubmit={handleSignUp} className="mt-8 space-y-6">

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-100">
                            Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            disabled={loading}
                            className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white
                            outline outline-1 outline-white/10 placeholder:text-gray-500
                            focus:outline-2 focus:outline-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-100">
                            Phone
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={loading}
                            className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white
                            outline outline-1 outline-white/10 placeholder:text-gray-500
                            focus:outline-2 focus:outline-indigo-500"
                        />
                    </div>

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
                        <label htmlFor="password" className="block text-sm font-medium text-gray-100">
                            Password
                        </label>
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
                            className={`px-4 py-2 rounded-md text-center text-sm font-medium bg-red-900/50 text-red-300 ${message.startsWith("Error")
                                }`}
                        >
                            {message}
                        </div>
                    )}


                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-indigo-500 py-2.5 font-semibold text-white
                        hover:bg-indigo-400 transition disabled:opacity-50"
                    >
                        {loading ? "Please wait..." : "Sign up"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">

                    <div className="pb-3">Already have an account?{" "}
                        <Link to="/signin" className="font-semibold text-indigo-400 hover:text-indigo-300">
                            Sign in
                        </Link>
                    </div>
                    <Link to="/" className="font-semibold text-indigo-400 hover:text-indigo-300 border-t border-gray-700 pt-1">
                        Back to home
                    </Link>
                </p>
            </div>


        </div>
    );
};

export default AuthSignUp;
