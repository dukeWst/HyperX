import { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath } from 'react-router-dom';
import { supabase } from './routes/supabaseClient';

// Layouts & Components
import Header from './layouts/Header';
import Footer from './layouts/Footer';
import LazyLoading from './page/enhancements/LazyLoading';
import ScrollToTop from './page/enhancements/ScrollTop';

// Routes Config & Protection
import routes from './routes/config'; // File config đã sửa có HomeWrapper
import PrivateRoute from './routes/PrivateRoute'; // File PrivateRoute đã tạo ở bước trước

// --- COMPONENT QUẢN LÝ ROUTES & LAYOUT ---
function AppRoutes({ user }) {
  const location = useLocation();

  // 1. Cải tiến logic ẩn Header (Dùng matchPath để chính xác hơn)
  const hideHeaderOn = ['/signin', '/signup', '/verify', '/auth/callback',];
  // Kiểm tra xem path hiện tại có khớp với bất kỳ pattern nào không
  const showHeader = !hideHeaderOn.some(path => matchPath({ path, end: true }, location.pathname));

  // 2. Cải tiến logic ẩn Footer
  const hideFooterOn = [
    ...hideHeaderOn,
    '/chatbot-ai',
    '/community',
    '/product',
    '/docs',
    '/create-product',
    '/product/edit/:id', // Đường dẫn động
    '/product/:id',      // Đường dẫn động
    '/profile',
    '/profile/:id',
    '/setting',
    '/dashboard'      
  ];
  
  const showFooter = !hideFooterOn.some(path => matchPath({ path, end: false }, location.pathname));

  return (
    <>
      <ScrollToTop />
      
      {/* Header nhận prop user để hiển thị Avatar/Tên */}
      {showHeader && <Header user={user} />}

      <Suspense fallback={<LazyLoading />}>
        <Routes>
          
          {/* NHÓM 1: PUBLIC ROUTES (Bao gồm HomeWrapper, Signin, Signup...) */}
          {routes.map((route, index) => {
            if (!route.private) {
              return (
                <Route 
                  key={index} 
                  path={route.path} 
                  // Truyền user prop xuống để tương thích code cũ của bạn
                  element={<route.element user={user} />} 
                />
              );
            }
            return null;
          })}

          {/* NHÓM 2: PRIVATE ROUTES (Bảo vệ bởi PrivateRoute) */}
          <Route element={<PrivateRoute />}>
            {routes.map((route, index) => {
              if (route.private) {
                return (
                  <Route 
                    key={index} 
                    path={route.path} 
                    element={<route.element user={user} />} 
                  />
                );
              }
              return null;
            })}
          </Route>

        </Routes>
      </Suspense>

      {showFooter && <Footer />}
    </>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Lấy session ngay lập tức khi load trang
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setIsAuthLoading(false);
    });

    // Lắng nghe sự thay đổi (Đăng nhập/Đăng xuất)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsAuthLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (isAuthLoading) {
    return <LazyLoading status="Loading..." />;
  }

  return (
    <Router>
      <AppRoutes user={user} />
    </Router>
  );
}