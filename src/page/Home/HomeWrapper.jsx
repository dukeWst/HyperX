import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../routes/supabaseClient';
import Home from './Home';
import LazyLoading from '../enhancements/LazyLoading';

const HomeWrapper = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkUser = async () => {
            // 1. Kiểm tra session hiện tại
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session && mounted) {
                // Nếu đã có user -> Đá sang Dashboard ngay
                console.log("User detected, redirecting to Dashboard...");
                navigate('/dashboard', { replace: true });
                return;
            }

            // 2. Nếu chưa có, cho phép render Home
            if (mounted) {
                setIsLoading(false);
            }
        };

        checkUser();

        return () => { mounted = false; };
    }, [navigate]);

    if (isLoading) return <LazyLoading status="Checking session..." />;

    return <Home />;
};

export default HomeWrapper;