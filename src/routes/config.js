import { lazy } from 'react';

// ... Các import cũ giữ nguyên ...
import AuthSignIn from '../page/auth/AuthSignIn';
import AuthSignUp from '../page/auth/AuthSignUp';
const Home = lazy(() => import('../page/dashboard/DashboardPage'));
import NotFound from '../page/notfound/NotFound'
import VerifyPage from '../page/auth/VerifyPage'
import AuthCallback from '../page/auth/AuthCallback';
import Product from '../page/product/page/Product';
import NewProduct from '../page/product/page/NewProduct';

// Import ProductDetail
import ProductDetail from '../page/product/page/ProductDetail'; 

import Docs from '../page/docs/docs';
import Setting from '../page/setting/Setting';
import Community from '../page/community/CommunityPage';
import UserProfile from '../page/profile/UserProfile';
import PostDetail from '../page/community/PostDetail';

const routes = [
    {
        path: "/",
        element: Home,
        exact: true,
        name: "Trang Chủ",
    },
        // -----------------------------------------------------------
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
        // -----------------------------------------------------------
    
    // === PHẦN PROFILE (Cần 2 routes) ===
    {
        path: "/profile",
        element: UserProfile,
        private: true,
        name: "Trang cá nhân",
    },
    // 👇👇👇 QUAN TRỌNG: THÊM ROUTE NÀY ĐỂ XEM PROFILE NGƯỜI KHÁC 👇👇👇
    {
        path: "/profile/:id",
        element: UserProfile,
        private: true,
        name: "Trang cá nhân người dùng",
    },

        // -----------------------------------------------------------
    {
        path: "/product",
        element: Product,
        private: true,
        name: "Sản phẩm",
    },
    {
        path: "/create-product", 
        element: NewProduct,
        private: true,
        name: "Thêm sản phẩm",
    },
    
    {
        path: "/product/edit/:id", 
        element: NewProduct,      
        private: true,
        name: "Sửa sản phẩm",
    },

    {
        path: "/product/:id", 
        element: ProductDetail,   
        private: true,
        name: "Chi tiết sản phẩm",
    },

    // -----------------------------------------------------------
    {
        path: "/docs",
        element: Docs, 
        name: "Tài liệu",
    },
        // -----------------------------------------------------------
    {
        path: "/setting",
        element: Setting, 
        private: true,
        name: "Cài đặt",
    },
        // -----------------------------------------------------------
    {
        path: "/community",
        element: Community,
        private: true,
        name: "Cộng đồng",
    },
    {
        path: "/post/:id",  // Đường dẫn chi tiết bài viết
        element: PostDetail,
        private: true,      // Yêu cầu đăng nhập mới xem được (tùy bạn chọn)
        name: "Chi tiết bài viết",
    },
        // -----------------------------------------------------------
    {
        path: "*",
        element: NotFound,
        private: false,
        name: "Không Tìm Thấy",
    },
];

export default routes;