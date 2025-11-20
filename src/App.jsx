import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import routes from './routes/config';
import Header from './layouts/Header';
import Footer from './layouts/Footer';

const ProtectedRoute = ({ element: Component, ...rest }) => {
  // Logic kiểm tra xác thực (ví dụ: kiểm tra token trong localStorage)
  const isAuthenticated = localStorage.getItem('authToken');

  // Nếu không xác thực, chuyển hướng về trang đăng nhập hoặc trang chủ
  if (!isAuthenticated) {
    // Có thể dùng <Navigate to="/login" replace /> nếu cần chuyển hướng trong React Router v6
    return <h1>Vui lòng đăng nhập để truy cập trang này.</h1>;
  }

  // Nếu đã xác thực, hiển thị component
  return <Component {...rest} />;
};

function App() {

  return (
    <>
      <Router>
        <Header />
        <Routes>
          {routes.map((route, index) => {
            const ElementComponent = route.private ? (
              <ProtectedRoute element={route.element} />
            ) : (
              <route.element />
            );

            return (
              <Route
                key={index}
                path={route.path}
                element={ElementComponent}
              />
            );
          })}
        </Routes>
        <Footer />
      </Router>
    </>
  )
}

export default App
