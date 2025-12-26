import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Menu, X, ChevronRight, Hash, Code, Zap, Shield, Rocket, Bot, Database } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// --- EXPANDED DOCUMENTATION CONTENT (English & Markdown Support) ---
const mockDocsContent = {
    // --- CATEGORY: OVERVIEW ---
    "intro": {
        title: "Ecosystem Introduction",
        content: `HyperX is a high-performance **All-in-One** platform designed to empower the modern tech community. We seamlessly combine a **social engagement hub** with a **comprehensive software delivery system**.
        \n\n### Our Mission
        \nTo provide developers and enthusiasts with a unified, high-octane environment for sharing knowledge and distributing next-gen applications across Windows, macOS, and Linux.
        \n\n### Key Ecosystem Features:
        \n*   **Global Newsfeed:** Share insights and technical breakthroughs in real-time.
        \n*   **Multi-OS App Store:** Distributed high-bandwidth installer management.
        \n*   **AI Integration:** Deep-learning assistance powered by the latest Gemini models.
        \n*   **Secure Infrastructure:** Role-based access and data isolation via Supabase.`,
        next: "auth-security"
    },
    "auth-security": {
        title: "Security & Authentication",
        content: `At HyperX, security is baked into the architecture, not added as a layer. We leverage **Supabase Auth** for identity management and **Postgres RLS** for data protection.
        \n\n### Identity & Access
        \n*   **Session Management:** Secure JWT-based sessions with automatic persistence.
        \n*   **Email Verification:** Mandatory verification for sensitive account actions.
        \n*   **Protected Routes:** A custom \`PrivateRoute\` logic shields sensitive pages, prompting an authentication modal when necessary.
        \n\n### Row Level Security (RLS)
        \nEvery database transaction is governed by strict RLS policies. For example:
        \n\`\`\`sql
        -- Ensure users can only edit their own products
        CREATE POLICY "Owner update access" 
        ON products FOR UPDATE 
        USING (auth.uid() = user_id);
        \`\`\``,
        next: "chatbot-ai"
    },

    // --- CATEGORY: INTELLIGENCE ---
    "chatbot-ai": {
        title: "HyperX AI Intelligence",
        content: `The HyperX AI assistant is a specialized technical entity designed to assist with codebase analysis and development workflows.
        \n\n### Integrated Features
        \n*   **Gemini 1.5 Flash:** High-speed inference with a large context window for complex reasoning.
        \n*   **Contextual Memory:** Maintains a local history of conversations for coherent multi-step problem solving.
        \n*   **Multimodal Reasoning:** Directly analyze uploaded code snippets, error logs, and architectural diagrams.
        \n\n### File Analysis Limitation
        \nWhile powerful, the AI works best with files under **2MB** in text or image format to ensure optimal processing speed.`,
        next: "ai-prompting"
    },
    "ai-prompting": {
        title: "Advanced Al Prompt Engineering",
        content: `To get the most out of HyperX AI, we recommend using structured technical prompts.
        \n\n### Effective Prompting Tips:
        \n1.  **Be Explicit:** Instead of "fix this code", use "refactor this function to be O(n) complexity".
        \n2.  **Provide Context:** Mention the specific framework (e.g., "In React 19...") to get more accurate syntax.
        \n3.  **Step-by-Step:** Ask the AI to explain its reasoning before providing the solution.
        \n\n[Example: Refactoring Prompt]`,
        code: `// Prompt: Refactor this for better readability and add error handling\nconst fetchData = async () => {\n  const res = await fetch('/api/data');\n  return res.json();\n};`,
        next: "product-distribution"
    },

    // --- CATEGORY: APP STORE ---
    "product-distribution": {
        title: "Software Distribution Engine",
        content: `HyperX provides a sophisticated engine for distributing software binaries across multiple operating systems.
        \n\n### Supported Platforms
        \n*   **Windows:** Supports \`.exe\` and \`.msi\` installers.
        \n*   **macOS:** Full support for \`.dmg\` and \`.pkg\` packages.
        \n*   **Linux:** Handling for \`.deb\`, \`.rpm\`, and \`.AppImage\` releases.
        \n\n### Versioning Controls
        \nDevelopers can manage multiple releases, ensuring users always have access to the latest stable versions while maintaining archives for legacy compatibility.`,
        next: "storage-limits"
    },
    "storage-limits": {
        title: "Storage & Asset Management",
        content: `HyperX uses a partitioned storage hierarchy to manage massive binary files and community assets.
        \n\n### Bucket Hierarchy
        \n*   **product-images:** Optimized for public access with global CDN caching.
        \n*   **product-installers:** High-security bucket for protected download links.
        \n*   **user-avatars:** Low-latency storage for community profiles.
        \n\n### File Limits
        \nTo ensure a fair experience for all developers, we enforce a **500MB** limit per installer file. Individual images are capped at **5MB**.`,
        next: "community-newsfeed"
    },

    // --- CATEGORY: COMMUNITY ---
    "community-newsfeed": {
        title: "Global Newsfeed & Engagement",
        content: `The HyperX Newsfeed is the heartbeat of the ecosystem. It is a real-time stream of technical discussions and project showcases.
        \n\n### Engagement Tools
        \n*   **Rich Text Posts:** Create detailed articles using our markdown-ready post editor.
        \n*   **Interactive Comments:** Threaded discussions for deep dives into technical topics.
        \n*   **Follow System:** Build your professional network by following top developers and creators.
        \n*   **Real-time Updates:** Stay notified the moment a peer engages with your work.`,
        next: "profile-customization"
    },
    "profile-customization": {
        title: "Professional Profiles & Identity",
        content: `Your HyperX Profile serves as your digital resume within the ecosystem.
        \n\n### Profile Features
        \n*   **Developer Stats:** Showcasing your follower count, post frequency, and product portfolio.
        \n*   **Asset Portfolio:** Automatically displays all products you've published to the App Store.
        \n*   **Customization:** Personalize your biography and avatar to reflect your professional brand.`,
        next: "ux-performance"
    },

    // --- CATEGORY: EXCELLENCE ---
    "ux-performance": {
        title: "Next-Gen UX & Performance",
        content: `We believe performance is the ultimate feature. HyperX is optimized for sub-second perceived load times.
        \n\n### Performance Stack
        \n*   **Suspense-Driven Navigation:** Using React Suspense for granular control over async data states.
        \n*   **Skeleton Architecture:** Custom glowing skeletons that mimic the actual UI layout, reducing cognitive load during transit.
        \n*   **Image Optimization:** Dynamic resizing of thumbnails to save user bandwidth.
        \n\n### Premium Feel
        \nWe apply a **500ms Minimum Load Delay** for ultra-fast queries. Why? Because a 10ms flash of content is jarring. A smooth, rhythmic transition feels "premium."`,
        next: "responsive-design"
    },
    "responsive-design": {
        title: "Responsive Multi-Device Layout",
        content: `HyperX is built from the ground up for a seamless experience on Desktop, Tablet, and Mobile.
        \n\n### Adaptive UI
        \n*   **Fluid Grids:** Our layout uses a dynamic 12-column grid that snaps between horizontal and vertical stacks.
        \n*   **Mobile-First Sidebar:** In mobile views, our sidebar documentation collapses into a slide-out overlay.
        \n*   **Touch Optimization:** Large, accessible tap targets for all interactive controls (buttons, inputs, sliders).`,
        next: "api-guide"
    },
    "api-guide": {
        title: "Developer API Guide",
        content: `HyperX exposes a clean API for developers to fetch their data and integrate with external build tools.
        \n\n### Example: Fetching User Profile Data`,
        code: `const fetchProfile = async (userId) => {\n  const { data, error } = await supabase\n    .from('profiles')\n    .select('*, follows!follower_id(count)')\n    .eq('id', userId)\n    .single();\n  \n  if (error) throw error;\n  return data;\n};`,
        next: "platform-settings"
    },
    "platform-settings": {
        title: "System Settings & Preferences",
        content: `Tailor your HyperX experience through our comprehensive system settings.
        \n\n### Configuration Options
        \n*   **Security Settings:** Change your password or update your authentication methods.
        \n*   **Profile Metadata:** Edit your display name, username, and professional bio.
        \n*   **App Preferences:** Manage your notification settings and display preferences.`,
        next: null
    }
};

const navigationStructure = [
    { 
        id: 'overview', 
        title: 'Platform Overview', 
        children: [
            { id: 'intro', title: '1. Ecosystem Intro', icon: Rocket },
            { id: 'auth-security', title: '2. Security & Auth', icon: Shield },
        ]
    },
    { 
        id: 'intelligence', 
        title: 'AI Intelligence', 
        children: [
            { id: 'chatbot-ai', title: '3. HyperX AI', icon: Bot },
            { id: 'ai-prompting', title: '4. Prompt Engineering', icon: Hash },
        ]
    },
    { 
        id: 'distribution', 
        title: 'Software Distribution', 
        children: [
            { id: 'product-distribution', title: '5. App Store Guide', icon: Zap },
            { id: 'storage-limits', title: '6. Assets & Limits', icon: Database },
        ]
    },
    { 
        id: 'social', 
        title: 'Community & Social', 
        children: [
            { id: 'community-newsfeed', title: '7. Newsfeed usage', icon: BookOpen },
            { id: 'profile-customization', title: '8. Professional Identity', icon: Hash },
        ]
    },
    { 
        id: 'excellence', 
        title: 'Technical Excellence', 
        children: [
            { id: 'ux-performance', title: '9. UX & Performance', icon: Zap },
            { id: 'responsive-design', title: '10. Responsive UI', icon: Code },
            { id: 'api-guide', title: '11. Developer API', icon: Code },
            { id: 'platform-settings', title: '12. System Settings', icon: Shield },
        ]
    },
];

// --- COMPONENT: DocsSidebar (Refined with Icons) ---
const DocsSidebar = ({ activeDoc, setActiveDoc, setCustomContent, isMobileOpen, setIsMobileOpen }) => {
    return (
        <aside className={`
            fixed inset-y-0 pt-16 top-6 lg:pt-0 left-0 z-40 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
            w-72 border-r border-white/10 bg-[#05050A]/95 backdrop-blur-xl lg:bg-transparent flex-shrink-0 
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            overflow-y-auto custom-scrollbar h-screen
        `}>
            <div className="p-6">
                <div className="flex items-center justify-between lg:hidden mb-6 text-white">
                    <span className="font-bold text-lg">Documentation</span>
                    <button onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} /></button>
                </div>

                <div className="space-y-10">
                    {navigationStructure.map((section) => (
                        <div key={section.id}>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 px-3 flex items-center justify-between">
                                {section.title}
                                <div className="h-px bg-white/5 flex-1 ml-4" />
                            </h3>
                            <ul className="space-y-1.5">
                                {section.children.map((item) => {
                                    const Icon = item.icon || ChevronRight;
                                    return (
                                        <li key={item.id}>
                                            <button 
                                                onClick={() => {
                                                    setActiveDoc(item.id);
                                                    if (setCustomContent) setCustomContent(null);
                                                    setIsMobileOpen(false);
                                                }}
                                                className={`
                                                    w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 text-sm font-medium flex items-center gap-3 group
                                                    ${activeDoc === item.id 
                                                        ? "bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-2 border-cyan-500" 
                                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                                    }
                                                `}
                                            >
                                                <Icon size={16} className={`${activeDoc === item.id ? "text-cyan-400" : "text-gray-600 group-hover:text-gray-400"} transition-colors`} />
                                                {item.title}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};


// --- MAIN COMPONENT: DocsPage ---
const DocsPage = () => {
    const [activeDoc, setActiveDoc] = useState('intro');
    const [searchTerm, setSearchTerm] = useState('');
    const [customContent, setCustomContent] = useState(null); // Used for search errors
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeDoc]);

    const handleSearch = (e) => {
        e.preventDefault();
        const query = searchTerm.trim().toLowerCase();
        if (query === '') return;
        
        const keys = Object.keys(mockDocsContent);
        const searchResults = keys.filter(key => mockDocsContent[key].title.toLowerCase().includes(query));

        if (searchResults.length > 0) {
            setActiveDoc(searchResults[0]);
            setCustomContent(null);
            setSearchTerm('');
        } else {
            setCustomContent({
                title: "Không tìm thấy kết quả",
                content: `Chúng tôi không tìm thấy tài liệu nào khớp với từ khóa "${searchTerm}".`,
                isNotFound: true
            });
        }
    };

    // Derived content
    const displayedContent = customContent || mockDocsContent[activeDoc] || mockDocsContent['intro'];

    return (
        <div className="min-h-screen bg-[#05050A] text-gray-300 font-sans pt-16 relative isolate overflow-hidden">
            
            {/* --- AMBIENT LIGHTING (Cyan/Blue) --- */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
            <div className="fixed bottom-0 right-0 -z-10 w-[40rem] h-[40rem] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed top-20 left-0 -z-10 w-[30rem] h-[30rem] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex max-w-[90rem] mx-auto">
                
                {/* --- SIDEBAR --- */}
                <DocsSidebar 
                    activeDoc={activeDoc} 
                    setActiveDoc={setActiveDoc} 
                    setCustomContent={setCustomContent}
                    isMobileOpen={isMobileSidebarOpen}
                    setIsMobileOpen={setIsMobileSidebarOpen}
                />

                {/* --- MAIN CONTENT AREA --- */}
                <main className="flex-1 min-w-0 py-10 px-4 sm:px-6 lg:px-12 lg:py-12 relative">
                    
                    <div className="max-w-5xl mx-auto">
                        {/* Mobile Menu Trigger & Search */}
                        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
                            <button 
                                onClick={() => setIsMobileSidebarOpen(true)} 
                                className="lg:hidden flex items-center gap-2 text-white bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl hover:bg-white/10 w-full md:w-auto transition-all backdrop-blur-md"
                            >
                                <Menu size={20} /> <span className="text-sm font-semibold tracking-wide">Documentation Menu</span>
                            </button>
                            
                            {/* Search Bar - Premium Cyan Focus */}
                            <form onSubmit={handleSearch} className="relative w-full md:w-[450px] group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Jump to a specific topic..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-3 border border-white/10 rounded-2xl leading-5 bg-white/[0.03] text-gray-200 placeholder-gray-500 focus:outline-none focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 sm:text-sm transition-all shadow-2xl backdrop-blur-xl"
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <span className="text-gray-600 text-[10px] font-bold border border-white/10 rounded-lg px-2 py-0.5 bg-white/5">SEARCH</span>
                                </div>
                            </form>
                        </div>

                        {/* DOCUMENT CONTENT */}
                        {displayedContent.isNotFound ? (
                            <div className="text-center py-32 bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10 backdrop-blur-3xl">
                                <div className="relative inline-block mb-6">
                                    <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
                                    <Search className="relative h-16 w-16 text-gray-600 opacity-50" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">{displayedContent.title}</h3>
                                <p className="text-gray-500 max-w-md mx-auto">{displayedContent.content}</p>
                            </div>
                        ) : (
                            <section className="relative group/doc animate-fade-in">
                                {/* Ambient Glow behind the card */}
                                <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/5 blur-3xl opacity-50 pointer-events-none" />
                                
                                <article className="relative border border-white/10 bg-white/[0.02] backdrop-blur-[100px] rounded-[2.5rem] p-8 md:p-14 lg:p-16 shadow-2xl overflow-hidden">
                                    {/* Decorative radial gradients */}
                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="flex -space-x-1">
                                                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/80">HyperX Build v1.0.4</span>
                                        </div>
                                        
                                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-10 leading-[1.1]">
                                            {displayedContent.title}
                                        </h1>

                                        {/* DOCUMENT CONTENT - Custom Markdown Components */}
                                        <div className="doc-content-premium">
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]} 
                                                rehypePlugins={[rehypeRaw]}
                                                components={{
                                                    h2: ({...props}) => <h2 className="text-xl md:text-2xl font-bold text-white mt-12 mb-6 flex items-center gap-3" {...props} />,
                                                    h3: ({...props}) => <h3 className="text-lg font-bold text-cyan-400 mt-8 mb-4" {...props} />,
                                                    p: ({...props}) => <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-6 opacity-90" {...props} />,
                                                    ul: ({...props}) => <ul className="space-y-4 mb-8 pl-2" {...props} />,
                                                    li: ({...props}) => (
                                                        <li className="flex items-start gap-4 group/li">
                                                            <div className="mt-2.5 w-1.5 h-1.5 rounded-full border border-cyan-500/50 bg-cyan-500/10 group-hover/li:bg-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0)] group-hover/li:shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                                                            <span className="text-gray-400 group-hover/li:text-gray-100 transition-colors text-base md:text-lg italic font-medium">{props.children}</span>
                                                        </li>
                                                    ),
                                                    strong: ({...props}) => <strong className="text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20" {...props} />,
                                                    a: ({...props}) => <a className="text-cyan-400 font-bold underline underline-offset-8 decoration-2 decoration-cyan-500/30 hover:decoration-cyan-400 transition-all" {...props} />,
                                                    code: ({inline, ...props}) => (
                                                        inline 
                                                            ? <code className="bg-white/5 text-cyan-200 px-2 py-0.5 rounded text-sm font-mono border border-white/10" {...props} />
                                                            : <code {...props} />
                                                    )
                                                }}
                                            >
                                                {displayedContent.content}
                                            </ReactMarkdown>
                                        </div>
                                        
                                        {/* Code Block UI - Professional IDE Style */}
                                        {displayedContent.code && (
                                            <div className="mt-12 group/code">
                                                <div className="relative rounded-[1.5rem] overflow-hidden bg-[#05060B] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                                    <div className="flex items-center justify-between px-6 py-4 bg-white/[0.03] border-b border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-[#FF5F56] opacity-40 group-hover/code:opacity-100 transition-opacity" />
                                                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-40 group-hover/code:opacity-100 transition-opacity shadow-[0_0_10px_rgba(255,189,46,0)] group-hover/code:shadow-[0_0_10px_rgba(255,189,46,0.3)]" />
                                                            <div className="w-3 h-3 rounded-full bg-[#27C93F] opacity-40 group-hover/code:opacity-100 transition-opacity" />
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-bold text-gray-500 font-mono tracking-[0.2em] flex items-center gap-2">
                                                                <Code size={14} className="text-cyan-500" /> SOURCE_MANIFEST.JSON
                                                            </span>
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(displayedContent.code);
                                                                    // alert("Code copied to clipboard!"); // Basic feedback removed for cleaner UI as per usual premium standards
                                                                }}
                                                                className="text-[10px] font-bold text-cyan-500/60 hover:text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-1 rounded-md border border-cyan-500/20 transition-all"
                                                            >
                                                                COPY
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="p-8 md:p-10 overflow-x-auto custom-scrollbar">
                                                        <pre className="text-sm font-mono leading-relaxed text-cyan-50/80 selection:bg-cyan-500/30 selection:text-white">
                                                            <code>{displayedContent.code}</code>
                                                        </pre>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Navigation Footer */}
                                        {displayedContent.next && (
                                            <div className="mt-24 pt-12 border-t border-white/5">
                                                <button 
                                                    onClick={() => {
                                                        setActiveDoc(displayedContent.next);
                                                        if (setCustomContent) setCustomContent(null);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="group w-full flex items-center justify-between p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all duration-500"
                                                >
                                                    <div className="text-left">
                                                        <span className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Continue Reading</span>
                                                        <span className="text-xl md:text-2xl font-extrabold text-white group-hover:text-cyan-400 transition-colors">
                                                            {mockDocsContent[displayedContent.next]?.title || "Nest Section"}
                                                        </span>
                                                    </div>
                                                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-500">
                                                        <ArrowRight size={28} className="text-cyan-500 group-hover:text-black transition-all group-hover:translate-x-1" />
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            </section>
                        )}
                    </div>
                </main>
            </div>
            
            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" 
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default DocsPage;