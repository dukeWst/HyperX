# HyperX - Cộng Đồng Công Nghệ & Kho Ứng Dụng Đa Nền Tảng

**HyperX** là nền tảng "All-in-One" dành cho những người yêu công nghệ. Chúng tôi kết hợp sức mạnh của một **Mạng xã hội công nghệ** sôi động với một **Kho ứng dụng & Game** đa nền tảng, nơi các nhà phát triển có thể chia sẻ sản phẩm của mình tới hàng triệu người dùng trên Windows, macOS và Linux.

Dự án được xây dựng với trải nghiệm người dùng tối ưu, giao diện Dark Mode hiện đại và hiệu năng vượt trội nhờ các công nghệ mới nhất: **React 19**, **Vite**, **TailwindCSS v4** và **Supabase**.

---

## 🌟 Tính Năng Cốt Lõi

### 1. � Cộng Đồng Công Nghệ (Tech Community)

Nơi kết nối đam mê, chia sẻ kiến thức và thảo luận về mọi xu hướng công nghệ mới nhất.

- **Bảng tin (Newsfeed)**: Cập nhật bài viết, thủ thuật, tin tức công nghệ từ cộng đồng.
- **Thảo luận & Tương tác**: Hệ thống bình luận, like và chia sẻ kiến thức chuyên sâu.
- **Kết nối chuyên gia**: Giao lưu với các lập trình viên và người đam mê công nghệ khác.

### 2. 🎮 Kho Ứng Dụng & Game (App Store)

Hệ thống phân phối phần mềm chuyên nghiệp, hỗ trợ đầy đủ các hệ điều hành phổ biến.

- **Đa Nền Tảng**: Tìm kiếm và tải xuống ứng dụng tương thích chính xác với OS của bạn:
  - 🪟 **Windows**: `.exe`, `.msi`, `.zip`
  - 🍎 **macOS**: `.dmg`, `.pkg`, `.app`
  - 🐧 **Linux**: `.deb`, `.rpm`, `.AppImage`
- **Dành Cho Nhà Phát Triển**:
  - Upload và quản lý phiên bản phần mềm dễ dàng (`/create-product`).
  - Hỗ trợ file binary trực tiếp qua hệ thống lưu trữ đám mây.
  - Cài đặt giá bán hoặc phát hành miễn phí.
- **Bộ Lọc Thông Minh**: Tìm kiếm nhanh theo loại (Software/Game) hoặc Hệ điều hành.

### 3. 🤖 Trợ Lý AI Thông Minh

- Tích hợp Chatbot AI hỗ trợ giải đáp thắc mắc về cài đặt phần mềm, lỗi kỹ thuật hoặc tìm kiếm nội dung trên nền tảng 24/7.

### 4. 🔐 Hệ Thống Tài Khoản Bảo Mật

- Xác thực an toàn qua Email/Password.
- Trang cá nhân (`Profile`) hiển thị các ứng dụng đã đăng tải và bài viết đã chia sẻ.

---

## 🛠️ Công Nghệ Sử Dụng

HyperX sử dụng tech stack hiện đại nhất để đảm bảo hiệu năng và khả năng mở rộng:

| Hạng Mục     | Công Nghệ                                   | Mô Tả                                                          |
| :----------- | :------------------------------------------ | :------------------------------------------------------------- |
| **Frontend** | [React 19](https://react.dev/)              | Library giao diện người dùng mới nhất.                         |
| **Tooling**  | [Vite](https://vitejs.dev/)                 | Build tool siêu tốc.                                           |
| **Styling**  | [TailwindCSS v4](https://tailwindcss.com/)  | Styling engine mạnh mẽ, chưa chính thức nhưng đã được áp dụng. |
| **UI Kit**   | [Headless UI](https://headlessui.com/)      | Component logic không style, tùy biến tối đa.                  |
| **Backend**  | [Supabase](https://supabase.com/)           | BaaS cung cấp Auth, Database PostgreSQL và Storage.            |
| **Routing**  | [React Router v7](https://reactrouter.com/) | Quản lý luồng trang ứng dụng.                                  |

---

## 🚀 Hướng Dẫn Cài Đặt (Local Development)

Để tham gia phát triển hoặc chạy thử HyperX trên máy của bạn:

### 1. Clone Source Code

```bash
git clone https://github.com/username/hyperx.git
cd hyperx
```

### 2. Cài Đặt Thư Viện

```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường

Tạo file `.env` ở thư mục gốc và điền thông tin Supabase của bạn (cần thiết để tính năng Upload File hoạt động):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Khởi Chạy

```bash
npm run dev
```

Truy cập `http://localhost:5173` và trải nghiệm!

---

## 📂 Cấu Trúc Dự Án

```plaintext
src/
├── page/
│   ├── community/   # Giao diện Mạng xã hội & Bài viết
│   ├── product/     # Giao diện Store, Upload & Download
│   │   ├── page/Product.jsx      # Danh sách ứng dụng
│   │   └── page/NewProduct.jsx   # Form upload file đa nền tảng
│   ├── chatbotAI/   # Trợ lý ảo
│   └── auth/        # Các trang đăng nhập/đăng ký
├── components/      # (Các component nhỏ lẻ nếu có)
└── routes/          # Cấu hình đường dẫn
```

---

## 📞 Liên Hệ & Hỗ Trợ

Nếu bạn là nhà phát triển muốn hợp tác hoặc người dùng cần hỗ trợ:

- **Email**: duke.nd.wst@gmail.com
- **Support Page**: `/support`

---

_© 2025 HyperX Platform. Kiến tạo tương lai kết nối số._
