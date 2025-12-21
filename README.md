# GoTrans - Nền Tảng Vận Tải & Cộng Đồng Thông Minh

![Banner Dự Án](https://via.placeholder.com/1200x400?text=GoTrans+Platform+Banner)

**GoTrans** là một nền tảng web hiện đại được xây dựng để kết nối cộng đồng vận tải, cung cấp các công cụ hỗ trợ thông minh và trải nghiệm người dùng tối ưu. Dự án sử dụng các công nghệ mới nhất như React 19, Vite, TailwindCSS v4 và Supabase.

---

## 🌟 Tính Năng Nổi Bật

### 1. 🔐 Hệ Thống Xác Thực & Người Dùng

- **Đăng ký / Đăng nhập**: Tích hợp bảo mật với Supabase Auth.
- **Xác thực Email**: Quy trình verify tài khoản chặt chẽ.
- **Hồ sơ cá nhân**: Trang Profile cho phép người dùng cập nhật thông tin và quản lý hoạt động.

### 2. 🤖 Trợ Lý Ảo AI (Chatbot)

- Tích hợp Chatbot thông minh hỗ trợ giải đáp thắc mắc người dùng 24/7.
- Giao diện chat thân thiện, phản hồi nhanh chóng.

### 3. 👥 Cộng Đồng & Mạng Xã Hội

- **Bảng tin (Community Feed)**: Nơi chia sẻ kiến thức, kinh nghiệm và câu chuyện nghề nghiệp.
- **Tương tác**: Tính năng xem chi tiết bài viết, bình luận và thảo luận.

### 4. 📦 Hệ Sinh Thái Sản Phẩm

- **Listing Sản phẩm**: Hiển thị danh sách sản phẩm/dịch vụ trực quan.
- **Quản lý**: Chức năng thêm mới (`/create-product`), chỉnh sửa (`/product/edit`) và xem chi tiết sản phẩm.

### 5. ✨ Trải Nghiệm Người Dùng (UX/UI)

- **Giao diện Dark Mode**: Thiết kế hiện đại, dịu mắt, mang phong cách "Cinematic" với background tối.
- **Hiệu ứng mượt mà**:
  - `LazyLoading` thông minh với độ trễ tối thiểu giúp trải nghiệm tải trang tự nhiên.
  - `FadeInOnScroll`: Hiệu ứng xuất hiện khi cuộn trang.
  - `ScrollToTop`: Điều hướng dễ dàng.

---

## 🛠️ Công Nghệ Sử Dụng

Dự án được xây dựng trên nền tảng các công nghệ tiên tiến nhất hiện nay:

| Lĩnh Vực          | Công Nghệ                                | Phiên Bản |
| :---------------- | :--------------------------------------- | :-------- |
| **Core**          | [React](https://react.dev/)              | ^19.2.0   |
| **Build Tool**    | [Vite](https://vitejs.dev/)              | ^6.0.0    |
| **Styling**       | [TailwindCSS](https://tailwindcss.com/)  | v4.1.17   |
| **Icons**         | [Lucide React](https://lucide.dev/)      | ^0.555.0  |
| **UI Components** | [Headless UI](https://headlessui.com/)   | ^2.2.9    |
| **Routing**       | [React Router](https://reactrouter.com/) | v7.9.6    |
| **Backend / DB**  | [Supabase](https://supabase.com/)        | ^2.84.0   |

---

## 🚀 Cài Đặt & Hướng Dẫn Chạy

Để chạy dự án trên máy cục bộ, hãy làm theo các bước sau:

### 1. Clone dự án

```bash
git clone https://github.com/username/project-name.git
cd project-name
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` tại thư mục gốc và thêm các khóa API của Supabase:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Chạy dự án (Development)

```bash
npm run dev
```

Truy cập `http://localhost:5173` để xem kết quả.

### 5. Build cho Production

```bash
npm run build
```

---

## 📂 Cấu Trúc Thư Mục

```plaintext
src/
├── assets/          # Tài nguyên tĩnh (ảnh, icons)
├── enhancements/    # Các component hiệu ứng (LazyLoading, ScrollToTop...)
├── layouts/         # Layout chung (Header, Footer)
├── page/            # Các trang chính của ứng dụng
│   ├── auth/        # Authentication (SignIn, SignUp...)
│   ├── chatbotAI/   # Trang Chatbot
│   ├── community/   # Trang Cộng đồng
│   ├── Home/        # Trang chủ & các section
│   ├── product/     # Trang Sản phẩm
│   ├── profile/     # Trang Cá nhân
│   └── ...
├── routes/          # Cấu hình routing & Supabase Client
├── App.jsx          # Component gốc
└── main.jsx         # Entry point
```

---

## 📸 Hình Ảnh Minh Họa

### Trang Chủ

![Home Page Screenshot](https://via.placeholder.com/800x400?text=Home+Page+Preview)

### Giao Diện Chatbot

![Chatbot Screenshot](https://via.placeholder.com/800x400?text=Chatbot+Interface)

### Trang Cộng Đồng

![Community Screenshot](https://via.placeholder.com/800x400?text=Community+Feed)

---

## 📞 Hỗ Trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng truy cập trang `/support` hoặc liên hệ qua email support@gotrans.com.

---

_© 2025 GoTrans Platform. All rights reserved._
