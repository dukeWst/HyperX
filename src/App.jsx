import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import routes from './routes/config';
import { useEffect, useState } from 'react';
import Header from './layouts/Header';
import Footer from './layouts/Footer';
import { supabase } from './supabaseClient';

function AppRoutes({ user }) {
  const location = useLocation(); // ✅ OK vì nằm bên trong Router
  const hideHeaderPaths = ['/signin', '/signup', '/verify'];

  return (
    <>
      {!hideHeaderPaths.includes(location.pathname) && <Header user={user} />}
      <Routes>
        {routes.map((route, index) => {
          const ElementComponent = route.private ? (
            <ProtectedRoute element={route.element} />
          ) : (
            <route.element />
          );

          return <Route key={index} path={route.path} element={ElementComponent} />;
        })}
      </Routes>
      {!hideHeaderPaths.includes(location.pathname) && <Footer />}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(data.session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <AppRoutes user={user} />
    </Router>
  );
}
