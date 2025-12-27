import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../routes/supabaseClient";
import { Search, Plus, MessageSquare, TrendingUp, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import PostFormModal from "./PostFormModal";
import PostItem from "./PostItem";

export default function Community({ user }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: "", content: "" });
    const [currentUser, setCurrentUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [totalMembers, setTotalMembers] = useState(0);
    const [onlineCount, setOnlineCount] = useState(0);

    useEffect(() => {
        const query = searchParams.get("search");
        if (query !== null) {
            setSearchQuery(query);
        }
    }, [searchParams]);

    const handleSearchChange = (val) => {
        setSearchQuery(val);
        if (val) {
            setSearchParams({ search: val }, { replace: true });
        } else {
            setSearchParams({}, { replace: true });
        }
    };

    useEffect(() => {
        const load = async () => {
            let u = user;
            if (!u) {
                const { data } = await supabase.auth.getUser();
                u = data.user;
            }
            setCurrentUser(u);
            
            // Fecth Total Members
            const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            setTotalMembers(count || 0);
        };
        load();
    }, [user]);

    // Supabase Presence Tracking
    useEffect(() => {
        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: currentUser?.id || 'anonymous-' + Math.random().toString(36).substr(2, 9),
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                setOnlineCount(Object.keys(state).length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [currentUser]);

    const loadPosts = useCallback(async () => {
        // Ưu tiên lấy từ view
        let { data, error } = await supabase
            .from("posts_view")
            .select('*, profiles(*)')
            .order("created_at", { ascending: false });

        // Nếu view lỗi hoặc không tồn tại, fallback về bảng gốc join profiles
        if (error) {
            console.warn("posts_view error, using fallback join:", error);
            const res = await supabase
                .from("community_posts")
                .select("*, profiles!inner(*)") // Join bảng profiles đầy đủ
                .order("created_at", { ascending: false });
            data = res.data;
            error = res.error;
        }

        if (!error && data) {
            // --- QUAN TRỌNG: CHUẨN HÓA DỮ LIỆU (DATA NORMALIZATION) ---
            const formattedPosts = data.map(post => {
                // Xử lý logic để lấy info user dù là từ view (flat) hay join (nested)
                const userInfo = Array.isArray(post.profiles) ? post.profiles[0] : (post.profiles || {}); 
                const metadata = post.raw_user_meta_data || {};
                
                const fullName = post.full_name || userInfo.full_name || userInfo.name || metadata.full_name || metadata.name || "Anonymous";
                const avatarUrl = post.avatar_url || userInfo.avatar_url || userInfo.picture || userInfo.avatar || metadata.avatar_url || metadata.picture || metadata.avatar;
                const email = post.email || userInfo.email;

                return {
                    ...post,
                    // Giữ nguyên object profile để UserAvatar tự resolution
                    profiles: userInfo,
                    raw_user_meta_data: {
                        ...metadata,
                        ...userInfo, // Mix profiles vào metadata để fallback tốt hơn
                        full_name: fullName,
                        avatar_url: avatarUrl
                    },
                    email: email,
                    avatar_url: avatarUrl 
                };
            });
            setPosts(formattedPosts);
        } else {
            console.error("Error loading posts:", error);
            setPosts([]);
        }
    }, []);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true); 
            await loadPosts(); 
            setLoading(false);
        };
        fetch();
    }, [loadPosts]);

    const submitPost = async () => {
        if (!currentUser || !currentUser.id) return alert("Lỗi: Không tìm thấy thông tin người dùng!");
        setLoading(true);
        const { error } = await supabase.from("community_posts").insert({ 
            title: form.title, 
            content: form.content, 
            user_id: currentUser.id 
        });
        
        if (error) {
            alert("Lỗi khi đăng bài: " + error.message);
        } else {
            setShowModal(false);
            setForm({ title: "", content: "" });
            // Reload posts để thấy bài mới
            await loadPosts();
        }
        setLoading(false);
    };

    const handlePostDeleted = (deletedPostId) => {
        setPosts(posts.filter(post => post.id !== deletedPostId));
    };

    const filteredPosts = posts.filter(post =>
        (post?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post?.content || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-[#05050A] h-screen w-screen overflow-hidden text-gray-300 font-sans pt-16 relative isolate flex flex-col">
            
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
            <div className="fixed top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* MAIN LAYOUT */}
            <div className="flex flex-1 max-w-7xl mx-auto w-full h-full overflow-hidden relative z-10">
                
                {/* LEFT SIDEBAR */}
                <div className="hidden lg:flex flex-col w-64 p-6 gap-6 overflow-y-auto custom-scrollbar border-r border-white/5">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 shadow-lg">
                        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-cyan-400"/> Trending</h2>
                        <ul className="space-y-3">
                            {['#ArtificialIntelligence', '#WebDevelopment', '#OpenSource', '#ReactJS'].map(tag => (
                                <li 
                                    key={tag} 
                                    onClick={() => handleSearchChange(tag)}
                                    className="text-sm text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors block px-2 py-1 rounded hover:bg-white/5"
                                >
                                    {tag}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-white/5 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-white font-bold mb-2 relative z-10">Join the squad</h3>
                        <p className="text-xs text-gray-400 mb-4 relative z-10">Connect with thousands of developers building the future.</p>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition font-medium relative z-10 border border-white/10">Explore Groups</button>
                    </div>
                </div>

                {/* MIDDLE FEED */}
                <div className="flex-1 flex flex-col h-full relative">
                    
                    {/* FLOATING HEADER */}
                    <div className="flex-shrink-0 p-4 md:p-6 z-20">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0B0D14]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl ring-1 ring-white/5">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white tracking-tight">Community Feed</h1>
                                    <p className="text-xs text-gray-500 hidden md:block">Share knowledge & connect.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative group flex-1 md:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={16} className="text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search discussions..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-black/40 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 sm:text-sm transition-all"
                                    />
                                </div>

                                {currentUser ? (
                                    <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95 whitespace-nowrap">
                                        <Plus size={18} strokeWidth={3} />
                                        <span className="hidden sm:inline">New Post</span>
                                    </button>
                                ) : (
                                    <Link to="/signin" className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-cyan-400 border border-cyan-500/30 rounded-xl font-medium transition text-sm whitespace-nowrap">
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* POST LIST */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth px-4 md:px-6 pb-20">
                        {loading && posts.length === 0 ? (
                            <div className="flex justify-center py-20">
                                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.02] text-center">
                                <div className="p-4 bg-white/5 rounded-full mb-4 text-gray-600"><Search size={32} /></div>
                                <h3 className="text-white font-bold text-lg">No posts found</h3>
                                <p className="text-gray-500 text-sm">Try searching for something else.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-3xl mx-auto"> 
                                {filteredPosts.map((post) => (
                                    post ? <PostItem key={post.id} post={post} currentUser={currentUser} onPostDeleted={handlePostDeleted} onTagClick={handleSearchChange} /> : null
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="hidden xl:flex flex-col w-72 p-6 gap-6 border-l border-white/5">
                    <div className="p-5 rounded-2xl bg-[#0B0D14] border border-white/10 shadow-lg">
                        <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-cyan-400"/> Community Stats</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white/5 rounded-xl text-center border border-white/5 hover:border-white/10 transition-colors">
                                <div className="text-xl font-bold text-white">
                                    {totalMembers > 999 ? (totalMembers / 1000).toFixed(1) + 'k' : totalMembers}
                                </div>
                                <div className="text-xs text-gray-500 uppercase font-bold">Members</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl text-center border border-white/5 hover:border-cyan-500/20 transition-colors">
                                <div className="text-xl font-bold text-cyan-400">{onlineCount}</div>
                                <div className="text-xs text-gray-500 uppercase font-bold">Online</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PostFormModal show={showModal} onClose={() => setShowModal(false)} onSubmit={submitPost} form={form} setForm={setForm} loading={loading} currentUser={currentUser} />
        </div>
    );
}