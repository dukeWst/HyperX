import { lazy, Profiler } from 'react';

// ... Các import cũ giữ nguyên ...
import AuthSignIn from '../page/auth/AuthSignIn';
import AuthSignUp from '../page/auth/AuthSignUp';
const Home = lazy(() => import('../page/dashboard/DashboardPage'));
import NotFound from '../page/notfound/NotFound'
import VerifyPage from '../page/auth/VerifyPage'
import AuthCallback from '../page/auth/AuthCallback';
import Product from '../page/product/page/Product';
import NewProduct from '../page/product/page/NewProduct';

// 1. THÊM IMPORT NÀY (Nhớ tạo file ProductDetail.jsx trước nhé)
import ProductDetail from '../page/product/page/ProductDetail'; 

import Docs from '../page/docs/docs';
import Setting from '../page/setting/Setting';
import Community from '../page/community/CommunityPage';

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
    
    // ✅ QUAN TRỌNG: Đặt route Edit lên trước
    {
        path: "/product/edit/:id", 
        element: NewProduct,      
        private: true,
        name: "Sửa sản phẩm",
    },

    // ⬇️ Đặt route Detail xuống dưới cùng trong nhóm /product/
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
        // -----------------------------------------------------------
    {
        path: "*",
        element: NotFound,
        private: false,
        name: "Không Tìm Thấy",
    },
];

export default routes;