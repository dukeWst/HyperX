import { useLocation, Link } from "react-router-dom";

export default function VerifyPage() {
    const location = useLocation();
    const email = location.state?.email || "";
    const message = location.state?.message || "Please verify your email";

    return (
        <div className="relative isolate px-6 pt-14 lg:px-8 bg-gray-900 min-h-screen">

            {/* === TOP GRADIENT (GIỮ NGUYÊN) === */}
            <div
                aria-hidden="true"
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            >
                <div
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                    className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
                />
            </div>

            {/* === CONTENT BOX (CSS LẠI) === */}
            <div className="mx-auto max-w-xl py-32 sm:py-48 lg:py-20">
                <div className="relative bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl px-10 py-12 shadow-2xl shadow-black/40">
                    <h1 className="text-center text-4xl font-bold tracking-tight text-white">
                        Check Your Email
                    </h1>

                    <p className="mt-4 text-center text-gray-300 text-lg leading-relaxed">
                        {message}
                    </p>

                    {email && (
                        <p className="mt-2 text-center text-sm text-gray-400">
                            A confirmation link was sent to{" "}
                            <span className="font-semibold text-indigo-400">{email}</span>
                        </p>
                    )}

                    <div className="mt-8 flex justify-center">
                        <Link
                            to="/signin"
                            className="px-5 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-semibold text-white shadow-lg shadow-indigo-500/20"
                        >
                            Go to Sign In
                        </Link>
                    </div>
                </div>
            </div>

            {/* === BOTTOM GRADIENT (GIỮ NGUYÊN) === */}
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            >
                <div
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                    className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
                />
            </div>
        </div>
    );
}
