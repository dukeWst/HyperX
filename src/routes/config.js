import { lazy, Profiler } from 'react'; // 1. Quan trọng: Phải import lazy

// 2. Chuyển đổi các import thường thành lazy import
import AuthSignIn from '../page/auth/AuthSignIn';
import AuthSignUp from '../page/auth/AuthSignUp';
const Home = lazy(() => import('../page/dashboard/DashboardPage'));
import NotFound from '../page/notfound/NotFound'
import VerifyPage from '../page/auth/VerifyPage'
import AuthCallback from '../page/auth/AuthCallback';
import Product from '../page/product/page/Product';
import NewProduct from '../page/product/page/NewProduct';
import Docs from '../page/docs/docs';
import Setting from '../page/setting/Setting';
import Community from '../page/community/Community';

const routes = [
    {
        path: "/",
        element: Home,
        exact: true,
        name: "Trang Chủ",
    },
    {
        path: "/signin",
        element: AuthSignIn,
        private: false,
        name: "Đăng Nhập",
    },
    {
        path: "/signup",
        element: AuthSignUp,
        private: false,
        name: "Đăng ký",
    },
    {
        path: "/verify",
        element: VerifyPage,
        name: "Xác thực",
    },
    {
        path: "/auth/callback",
        element: AuthCallback,
        name: "Xác thực người dùng",
    },
    {
        path: "/product",
        element: Product,
        private: true,
        name: "Sản phẩm",
    },
    {
        path: "/docs",
        element: Docs, // Lưu ý: Biến này phải khớp với const Docs bên trên
        name: "Tài liệu",
    },

    {
        path: "/setting",
        element: Setting, // Lưu ý: Biến này phải khớp với const Docs bên trên
        private: true,
        name: "Cài đặt",
    },

    {
        path: "/product/new-product",
        element: NewProduct,
        private: true,
        name: "Thêm sản phẩm",
    },
    {
        path: "/community",
        element: Community,
        private: true,
        name: "Cộng đồng",
    },
    // Not found
    {
        path: "*",
        element: NotFound,
        private: false,
        name: "Không Tìm Thấy",
    },
];

export default routes;