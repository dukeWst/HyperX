import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Menu, X, ChevronRight, Hash, Code } from 'lucide-react';

// --- MOCK DATA (Giữ nguyên nội dung, chỉ sửa UI) ---
const mockDocsContent = {
    "intro": {
        title: "Introduction to the HyperX Ecosystem",
        content: `Welcome to HyperX! This platform is built to connect the creative community and provide essential tools for product development and sharing.
        \n\nHere you can find Products to buy or sell, engage in the Community to share knowledge, or consult this Documentation (Docs) to gain a deeper understanding of our core APIs and features.`,
        next: "api-overview"
    },
    "api-overview": {
        title: "API Overview: Supabase Integration",
        content: `Most core functionalities of HyperX, including user management, community posts, and product details, are built on top of Supabase.
        \n\nWe utilize:
        \n* **Authentication:** Managing user sign-up/sign-in and retrieving the current user (\`currentUser\`).
        \n* **Postgres Database:** Storing posts, products, profiles, and relational data (e.g., follows).
        \n* **Realtime:** Providing instantaneous updates for notifications and comments.
        \n\n[Code Example: Fetching Products]`,
        code: `const fetchProducts = async () => {\n  // Fetching a list of products\n  const { data, error } = await supabase\n    .from('products')\n    .select('id, name, price, image_url')\n    .order('created_at', { ascending: false });\n  if (error) console.error(error);\n  return data;\n};`,
        next: "community-posts"
    },
    "community-posts": {
        title: "Community: Creating, Editing, and Deleting Posts",
        content: `Community posts are stored in the 'community_posts' table.
        \n\n**Creating a Post:** Use the \`insert\` function with the post's \`title\`, \`content\`, and the \`user_id\` of the current user.
        \n**Editing/Deleting:** Requires the user to be the owner of the post. This is enforced via Row Level Security (RLS) policies on the 'community_posts' table, typically checking if \`auth.uid() = user_id\`.`,
        next: "product-upload"
    },
    "product-upload": {
        title: "Product Upload & Asset Storage Management",
        content: `Your product metadata is stored in the 'products' table, while digital assets (like cover images) are stored in Supabase Storage.
        \n\n**Upload Process Summary:** \n1. Upload the main image file (Cover Image) to the dedicated Storage Bucket (e.g., 'product-images').
        \n2. Retrieve the Public URL for the uploaded image.
        \n3. Insert the product metadata (including the Public URL string) into the 'products' table.`,
        next: "profile-and-follows"
    },
    "profile-and-follows": {
        title: "Profile, Stats, and Follows Logic Optimization",
        content: `Detailed user information is maintained in the 'profiles' table.
        \n\nFollow/Unfollow functionality uses an intermediate 'follows' table (\`follower_id\`, \`following_id\`).
        \n\nTo optimize profile loading speed, multiple necessary API calls (post count, follower count, product list, and follow status check) are executed concurrently using JavaScript's \`Promise.all()\`. This ensures the total loading time is determined by the slowest query, not the sum of all queries.`,
        next: null 
    }
};

const navigationStructure = [
    { 
        id: 'getting-started', 
        title: 'Getting Started', 
        children: [
            { id: 'intro', title: '1. Introduction' },
            { id: 'api-overview', title: '2. API Overview' },
        ]
    },
    { 
        id: 'features', 
        title: 'Core Features', 
        children: [
            { id: 'community-posts', title: '3. Community Posts' },
            { id: 'product-upload', title: '4. Product Upload' },
            { id: 'profile-and-follows', title: '5. Profile & Follows' },
        ]
    },
];

// --- COMPONENT: DocsSidebar (UI đã nâng cấp - Cyan Theme) ---
const DocsSidebar = ({ activeDoc, setActiveDoc, isMobileOpen, setIsMobileOpen }) => {
    return (
        <aside className={`
            fixed inset-y-0 pt-20 lg:pt-24 left-0 z-40 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
            w-72 border-r border-white/10 bg-[#05050A]/95 backdrop-blur-xl lg:bg-transparent lg:border-r border-dashed border-gray-800 flex-shrink-0 
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            overflow-y-auto custom-scrollbar h-screen
        `}>
            <div className="p-6">
                <div className="flex items-center justify-between lg:hidden mb-6 text-white">
                    <span className="font-bold text-lg">Menu</span>
                    <button onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} /></button>
                </div>

                <div className="space-y-8">
                    {navigationStructure.map((section) => (
                        <div key={section.id}>
                            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 px-3">
                                <Hash size={12} className="text-cyan-500" /> {section.title}
                            </h3>
                            <ul className="space-y-1">
                                {section.children.map((item) => (
                                    <li key={item.id}>
                                        <button 
                                            onClick={() => {
                                                setActiveDoc(item.id);
                                                setIsMobileOpen(false);
                                            }}
                                            className={`
                                                w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium flex items-center justify-between group
                                                ${activeDoc === item.id 
                                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                                }
                                            `}
                                        >
                                            {item.title}
                                            {activeDoc === item.id && <ChevronRight size={14} className="opacity-100" />}
                                        </button>
                                    </li>
                                ))}
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
    const [filteredContent, setFilteredContent] = useState(mockDocsContent['intro']);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    useEffect(() => {
        const doc = mockDocsContent[activeDoc] || mockDocsContent['intro'];
        setFilteredContent(doc);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeDoc]);

     const handleSearch = (e) => {
        e.preventDefault();
        const query = searchTerm.trim().toLowerCase();
        if (query === '') {
            setActiveDoc('intro');
            return;
        }
        const keys = Object.keys(mockDocsContent);
        const searchResults = keys.filter(key => mockDocsContent[key].title.toLowerCase().includes(query));

        if (searchResults.length > 0) {
            setActiveDoc(searchResults[0]);
            setSearchTerm('');
        } else {
            setFilteredContent({
                title: "No Results Found",
                content: `We could not find any document matching "${searchTerm}".`,
                isNotFound: true
            });
        }
    };

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
                    isMobileOpen={isMobileSidebarOpen}
                    setIsMobileOpen={setIsMobileSidebarOpen}
                />

                {/* --- MAIN CONTENT AREA --- */}
                <main className="flex-1 min-w-0 py-10 px-4 sm:px-6 lg:px-12 lg:py-12">
                    
                    <div className="max-w-4xl mx-auto">
                        {/* Mobile Menu Trigger & Search */}
                        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between">
                            <button 
                                onClick={() => setIsMobileSidebarOpen(true)} 
                                className="lg:hidden flex items-center gap-2 text-white bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 w-full md:w-auto"
                            >
                                <Menu size={20} /> <span className="text-sm font-medium">Menu</span>
                            </button>
                            
                            {/* Search Bar - Cyan Focus */}
                            <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Search documentation..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-white/5 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm transition-all shadow-lg shadow-black/20"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-600 text-xs border border-gray-700 rounded px-1.5 py-0.5">/</span>
                                </div>
                            </form>
                        </div>

                        {/* DOCUMENT CONTENT */}
                        {filteredContent.isNotFound ? (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <Search className="mx-auto h-12 w-12 text-gray-600 mb-4 opacity-50" />
                                <h3 className="text-xl font-medium text-white mb-2">{filteredContent.title}</h3>
                                <p className="text-gray-400">{filteredContent.content}</p>
                            </div>
                        ) : (
                            <article className="animate-fade-in">
                                {/* Badge category */}
                                <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 mb-6">
                                    <BookOpen size={12} className="mr-1.5" /> Documentation
                                </div>
                                
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-8">
                                    {filteredContent.title}
                                </h1>

                                {/* Nội dung văn bản - Custom Prose for Dark Mode */}
                                <div className="prose prose-invert prose-lg max-w-none text-gray-400 prose-headings:text-gray-200 prose-strong:text-white prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-code:text-cyan-300 prose-code:bg-cyan-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                                    {filteredContent.content.split('\n').map((paragraph, idx) => (
                                        <p key={idx} className="mb-4 leading-relaxed">{paragraph}</p>
                                    ))}
                                </div>
                                
                                {/* Code Block UI - Style IDE */}
                                {filteredContent.code && (
                                    <div className="mt-8 rounded-2xl overflow-hidden bg-[#0B0D14] border border-white/10 shadow-2xl group">
                                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500/20 group-hover:bg-red-500/80 transition-colors"></div>
                                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/80 transition-colors"></div>
                                                <div className="w-3 h-3 rounded-full bg-green-500/20 group-hover:bg-green-500/80 transition-colors"></div>
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono flex items-center gap-1"><Code size={12}/> example.js</span>
                                        </div>
                                        <div className="p-6 overflow-x-auto custom-scrollbar bg-black/30">
                                            <pre className="text-sm font-mono leading-relaxed text-cyan-100">
                                                <code>{filteredContent.code}</code>
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Footer */}
                                {filteredContent.next && (
                                    <div className="mt-16 pt-8 border-t border-white/10 flex justify-end">
                                        <button 
                                            onClick={() => setActiveDoc(filteredContent.next)}
                                            className="group flex flex-col items-end text-right"
                                        >
                                            <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next Article</span>
                                            <span className="flex items-center gap-2 text-cyan-400 font-semibold group-hover:text-cyan-300 transition-colors text-lg">
                                                {mockDocsContent[filteredContent.next].title.split(':')[0]} 
                                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </article>
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