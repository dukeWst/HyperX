# HyperX - Tech Community & Multi-Platform App Store

> An all-in-one platform combining a Tech Community and Multi-Platform App Store, connecting developers and users to share knowledge and distribute software across Windows, macOS, and Linux.

**HyperX** is an "All-in-One" platform for tech enthusiasts. We combine the power of a vibrant **Tech Social Network** with a multi-platform **App & Game Store**, where developers can share their products with millions of users on Windows, macOS, and Linux.

The project is built for optimal user experience, featuring a modern Dark Mode interface and superior performance using the latest technologies: **React 19**, **Vite**, **TailwindCSS v4**, and **Supabase**.

---

## 🌟 Key Features

### 1. 💬 Tech Community

A place to connect passions, share knowledge, and discuss the latest tech trends.

- **Newsfeed**: Update articles, tips, and tech news from the community.
- **Discussion & Interaction**: Comment system, likes, and deep knowledge sharing.
- **Connect with Experts**: Network with developers and other tech enthusiasts.

### 2. 🎮 App & Game Store

A professional software distribution system supporting all popular operating systems.

- **Multi-Platform**: Search and download applications compatible exactly with your OS:
  - 🪟 **Windows**: `.exe`, `.msi`, `.zip`
  - 🍎 **macOS**: `.dmg`, `.pkg`, `.app`
  - 🐧 **Linux**: `.deb`, `.rpm`, `.AppImage`
- **For Developers**:
  - Easily upload and manage software versions (`/create-product`).
  - Direct binary file support via cloud storage.
  - Set pricing or release for free.
- **Smart Filters**: Quick search by type (Software/Game) or Operating System.

### 3. 🤖 Smart AI Assistant

- Integrated AI Chatbot to support queries about software installation, technical errors, or content search on the platform 24/7.

### 4. 🔐 Secure Account System

- Secure authentication via Email/Password.
- Personal Page (`Profile`) displaying uploaded apps and shared posts.

---

## 🛠️ Technology Stack

HyperX uses the most modern tech stack to ensure performance and scalability:

| Category     | Technology                                  | Description                                            |
| :----------- | :------------------------------------------ | :----------------------------------------------------- |
| **Frontend** | [React 19](https://react.dev/)              | The latest UI library.                                 |
| **Tooling**  | [Vite](https://vitejs.dev/)                 | Blazing fast build tool.                               |
| **Styling**  | [TailwindCSS v4](https://tailwindcss.com/)  | Powerful styling engine (v4 preview).                  |
| **UI Kit**   | [Headless UI](https://headlessui.com/)      | Unstyled, fully accessible UI components.              |
| **Backend**  | [Supabase](https://supabase.com/)           | BaaS providing Auth, PostgreSQL Database, and Storage. |
| **Routing**  | [React Router v7](https://reactrouter.com/) | Application routing management.                        |

---

## 🚀 Installation Guide (Local Development)

To contribute or run HyperX locally on your machine:

### 1. Clone Source Code

```bash
git clone https://github.com/username/hyperx.git
cd hyperx
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and fill in your Supabase credentials (required for File Upload features):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start the App

```bash
npm run dev
```

Visit `http://localhost:5173` and experience it!

---

## 📂 Project Structure

```plaintext
src/
├── page/
│   ├── community/   # Social Network & Post Interfaces
│   ├── product/     # Store, Upload & Download Interfaces
│   │   ├── page/Product.jsx      # App List
│   │   └── page/NewProduct.jsx   # Multi-OS Upload Form
│   ├── chatbotAI/   # AI Assistant
│   └── auth/        # Login/Register Pages
├── components/      # (Shared components)
└── routes/          # Route Configuration
```

---

## 📞 Contact & Support

If you are a developer looking to collaborate or a user needing support:

- **Email**: duke.nd.wst@gmail.com
- **Support Page**: `/support`

---

_© 2025 HyperX Platform. Architecting the future of digital connection._
