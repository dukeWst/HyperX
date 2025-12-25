import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LazyLoading from '../page/enhancements/LazyLoading';

const PrivateRoute = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Kiểm tra session hiện tại
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Lắng nghe thay đổi auth (đăng nhập/đăng xuất)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <LazyLoading status="Verifying access..." />;
    }

    // Nếu có session -> Cho phép đi tiếp (Render Outlet - trang con)
    // Nếu không -> Đá về trang Sign In, kèm theo state để biết redirect từ đâu
    return session ? <Outlet /> : <Navigate to="/signin" state={{ from: location }} replace />;
};

export default PrivateRoute;