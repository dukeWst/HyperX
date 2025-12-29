import { } from 'react';

// ... Các import cũ giữ nguyên ...
import AuthSignIn from '../page/auth/AuthSignIn';
import AuthSignUp from '../page/auth/AuthSignUp';
import NotFound from '../page/notfound/NotFound'
import VerifyPage from '../page/auth/VerifyPage'
import AuthCallback from '../page/auth/AuthCallback';
import AuthForgotPassword from '../page/auth/AuthForgotPassword';
import AuthUpdatePassword from '../page/auth/AuthUpdatePassword';
import Product from '../page/product/page/Product';
import NewProduct from '../page/product/page/NewProduct';
import HomeWrapper from '../page/Home/HomeWrapper';

// Import ProductDetail
import ProductDetail from '../page/product/page/ProductDetail'; 

import DocsPage from '../page/docs/Docs';
import Setting from '../page/setting/Setting';
import Community from '../page/community/CommunityPage';
import UserProfile from '../page/profile/UserProfile'
import PostDetail from '../page/community/PostDetail';
import HelpAndSupport from '../page/help&support/HelpAndSupport';

const MINIMUM_LOAD_DELAY = 500; 

// --- CẬP NHẬT: ƯU TIÊN IMPORT TRỰC TIẾP CHO CÁC TRANG CHÍNH ĐỂ CÓ CẢM GIÁC INSTANT ---
import Home from '../page/Home/Home';
import ChatbotAIPage from '../page/chatbotAI/ChatbotAI';

const routes = [
    {
        path: "/",
        element: HomeWrapper, 
        exact: true,
        name: "Trang Chủ",
    },
    {
        path: "/home",
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
    {
        path: "/forgot-password",
        element: AuthForgotPassword,
        name: "Quên mật khẩu",
    },
    {
        path: "/update-password",
        element: AuthUpdatePassword,
        name: "Cập nhật mật khẩu",
    },
    // -----------------------------------------------------------
    
    // === PHẦN PROFILE (Cần 2 routes) ===
    {
        path: "/profile",
        element: UserProfile,
        private: true,
        name: "Trang cá nhân",
    },
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
        element: DocsPage, 
        name: "Tài liệu",
    },
    // -----------------------------------------------------------
    {
        path: "/chatbot-ai",
        element: ChatbotAIPage, 
        private: true, // Thêm bảo vệ đăng nhập
        name: "Chatbot AI",
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
        path: "/post/:id",  
        element: PostDetail,
        private: true,      
        name: "Chi tiết bài viết",
    },
    {
        path: "/support",   
        element: HelpAndSupport,
        private: true,      
        name: "Hỗ trợ",
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