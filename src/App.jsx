import { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath } from 'react-router-dom';
import { supabase } from './routes/supabaseClient';

// Layouts & Components
import Header from './layouts/Header';
import Footer from './layouts/Footer';
import LazyLoading from './page/enhancements/LazyLoading';
import ScrollToTop from './page/enhancements/ScrollTop';
import ChatBox from './components/ChatBox';

// Routes Config & Protection
// Routes Config & Protection
import routes from './routes/config'; 
import PrivateRoute from './routes/PrivateRoute'; 
import GuestRoute from './routes/GuestRoute';

// --- COMPONENT QUẢN LÝ ROUTES & LAYOUT ---
function AppRoutes({ user }) {
  const location = useLocation();

  // 1. Cải tiến logic ẩn Header (Dùng matchPath để chính xác hơn)
  const hideHeaderOn = ['/signin', '/signup', '/verify', '/auth/callback','/forgot-password','/update-password'];
  // Kiểm tra xem path hiện tại có khớp với bất kỳ pattern nào không
  const showHeader = !hideHeaderOn.some(path => matchPath({ path, end: true }, location.pathname));

  // 2. Cải tiến logic ẩn Footer
  const hideFooterOn = [
    ...hideHeaderOn,
    '/chatbot-ai',
    '/community',

    '/', 
    '/product',
    '/docs',
    '/create-product',
    '/product/edit/:id', 
    '/product/:id',      
    '/profile',
    '/profile/:id',
    '/setting',
  ];
  
  const showFooter = !hideFooterOn.some(path => matchPath({ path, end: true }, location.pathname)); // Changed end: false to true for exact matching on root, mostly.

  return (
    <>
      <ScrollToTop />
      
      {/* Header nhận prop user để hiển thị Avatar/Tên */}
      {showHeader && <Header user={user} />}

      <Suspense fallback={<LazyLoading />}>
        <Routes>
          
          {/* NHÓM 1: PUBLIC ROUTES & GUEST ROUTES */}
          {routes.map((route, index) => {
            if (!route.private) {
              const element = <route.element user={user} />;
              return (
                <Route 
                  key={index} 
                  path={route.path} 
                  element={
                    route.guestOnly ? (
                      <GuestRoute user={user}>
                        {element}
                      </GuestRoute>
                    ) : (
                      element
                    )
                  } 
                />
              );
            }
            return null;
          })}

          {/* NHÓM 2: PRIVATE ROUTES (Bảo vệ bởi PrivateRoute) */}
          <Route element={<PrivateRoute user={user} />}>

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
      <ChatBox currentUser={user} />
    </>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Lấy session ngay lập tức khi load trang với độ trễ tối thiểu để tạo hiệu ứng "Boot" sang trọng
    const hasBooted = sessionStorage.getItem('hyperx_has_booted');
    const MIN_LOAD_TIME = hasBooted ? 0 : 1500;
    const startTime = Date.now();

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("Supabase session error:", error.message);
          // If the error is about refresh token, we should clear the session
          if (error.message.includes("Refresh Token")) {
             supabase.auth.signOut();
          }
        }
        
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_LOAD_TIME - elapsed);
        
        setTimeout(() => {
          setUser(session?.user || null);
          setIsFadingOut(true); 
          
          if (!hasBooted) {
              sessionStorage.setItem('hyperx_has_booted', 'true');
          }

          setTimeout(() => {
            setIsAuthLoading(false);
          }, 1000);
        }, remaining);
      })
      .catch((err) => {
        console.error("Unexpected session error:", err);
        setIsAuthLoading(false);
      });

    // Lắng nghe sự thay đổi (Đăng nhập/Đăng xuất)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      // KHÔNG gọi setIsAuthLoading(false) ở đây để tránh race condition với bộ đếm thời gian khởi động bên trên
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <Router>
        <AppRoutes user={user} />
      </Router>
      {isAuthLoading && <LazyLoading status="Loading..." isExiting={isFadingOut} />}
    </>
  );
}