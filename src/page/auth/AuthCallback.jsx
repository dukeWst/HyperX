import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import LazyLoading from "../../LazyLoading";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true); // 🔥 bật loading

    useEffect(() => {
        const process = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (data?.session) {
                    // Cập nhật verify vào DB nếu cần
                    const { error: updateError } = await supabase
                        .from("user_profiles")
                        .update({ email_verified: true })
                        .eq("id", data.session.user.id);

                    if (updateError) {
                        console.warn("Update verify failed:", updateError);
                    }

                    // 🔥 NGĂN AUTO LOGIN
                    await supabase.auth.signOut();
                }

                // 🔥 Hiệu ứng loading trước khi vào trang signin
                setTimeout(() => {
                    setLoading(false);
                    navigate("/signin", {
                        replace: true,
                        state: {
                            message: "Email xác thực thành công! Vui lòng đăng nhập."
                        }
                    });
                }, 600); // thời gian loading 1.2s

            } catch (err) {
                console.error("Callback error:", err);
                setError(err.message);

                setTimeout(() => navigate("/signin"), 2000);
            }
        };

        process();
    }, [navigate]);

    // 🔥 GIAO DIỆN LOADING
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <LazyLoading status={'Please wait...'} />
            </div>
        );
    }

    // Nếu lỗi
    if (error) {
        return (
            <div className="text-white p-10 text-center">
                <p className="text-red-400">Error: {error}</p>
                <p className="mt-2">Redirecting to sign in...</p>
            </div>
        );
    }

    return null;
}
