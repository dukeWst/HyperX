import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LazyLoading from '../page/enhancements/LazyLoading';
import NeedAuthModal from '../components/NeedAuthModal';

const PrivateRoute = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <LazyLoading status="Loading..." />;
    }

    if (session) {
        return <Outlet />;
    }

    // Nếu không có session, render một background ảo và Modal yêu cầu đăng nhập
    return (
        <div className="min-h-screen bg-[#020205] relative overflow-hidden flex items-center justify-center">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-cyan-900/10 rounded-full blur-[120px]"></div>
            </div>
            
            <NeedAuthModal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    navigate('/'); // Quay về Home nếu đóng modal
                }} 
            />
        </div>
    );
};

export default PrivateRoute;