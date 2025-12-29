
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Home from './Home';

const HomeWrapper = ({ user }) => {
    const navigate = useNavigate();

    useEffect(() => {
        // Nếu đã có user -> Đá sang Community ngay lập tức mà không cần fetch lại
        if (user) {
            console.log("User detected from prop, redirecting to Community...");
            navigate('/community', { replace: true });
        }
    }, [user, navigate]);

    // Nếu có user, trả về null để redirect nhanh, không hiện LazyLoading
    if (user) return null;

    return <Home />;
};

export default HomeWrapper;