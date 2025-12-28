import { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "../../routes/supabaseClient";
import { Search, Plus, MessageSquare, TrendingUp, Users, Bot, Sparkles, ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import PostFormModal from "./PostFormModal";
import PostItem from "./PostItem";
import UserAvatar from "../../components/UserAvatar";

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
    const [trendingTags, setTrendingTags] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loadingFollowing, setLoadingFollowing] = useState(false);
    const scrollContainerRef = useRef(null);

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
            setCurrentUser(user);
            
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
                const userInfo = Array.isArray(post.profiles) ? post.profiles[0] : (post.profiles || {}); 
                const metadata = post.raw_user_meta_data || {};
                
                const fullName = post.full_name || userInfo.full_name || userInfo.name || metadata.full_name || metadata.name || "Anonymous";
                const avatarUrl = post.avatar_url || userInfo.avatar_url || userInfo.picture || userInfo.avatar || metadata.avatar_url || metadata.picture || metadata.avatar;
                const email = post.email || userInfo.email;

                return {
                    ...post,
                    profiles: userInfo,
                    raw_user_meta_data: {
                        ...metadata,
                        ...userInfo, 
                        full_name: fullName,
                        avatar_url: avatarUrl
                    },
                    email: email,
                    avatar_url: avatarUrl 
                };
            });
            setPosts(formattedPosts);

            // --- TRÍCH XUẤT HASHTAGS ---
            const tagMap = new Map();
            const tagRegex = /#[\w\u00C0-\u024F]+/gu;

            formattedPosts.forEach(post => {
                const text = `${post.title} ${post.content}`;
                const tags = text.match(tagRegex);
                if (tags) {
                    // Sử dụng Set để loại bỏ các hashtag trùng lặp trong cùng một bài đăng
                    const uniqueTagsInPost = new Set(tags.map(t => t.toLowerCase()));
                    uniqueTagsInPost.forEach(tag => {
                        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
                    });
                }
            });

            const sortedTags = [...tagMap.entries()]
                .sort((a, b) => b[1] - a[1]) // Sắp xếp theo số lượng giảm dần
                .slice(0, 8) // Lấy top 8
                .map(entry => entry[0]);

            setTrendingTags(sortedTags);

        } else {
            console.error("Error loading posts:", error);
            setPosts([]);
        }
    }, []);

    useEffect(() => {
        const handleRefresh = async () => {
            // 1. Scroll instant lên trên
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
            }
            // 2. Chỉnh state xám (skeletons)
            setLoading(true);
            setPosts([]);
            setTrendingTags([]);
            // 3. Re-fetch data
            await loadPosts();
            setLoading(false);
        };

        window.addEventListener('hyperx-refresh-community', handleRefresh);
        return () => window.removeEventListener('hyperx-refresh-community', handleRefresh);
    }, [loadPosts]);

    const loadFollowing = useCallback(async () => {
        if (!currentUser) return;
        setLoadingFollowing(true);
        try {
            const { data: followIds } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', currentUser.id);

            if (followIds && followIds.length > 0) {
                const ids = followIds.map(f => f.following_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', ids);
                setFollowing(profiles || []);
            } else {
                setFollowing([]);
            }
        } catch (error) {
            console.error("Error loading following:", error);
        } finally {
            setLoadingFollowing(false);
        }
    }, [currentUser]);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true); 
            await Promise.all([loadPosts(), loadFollowing()]);
            setLoading(false);
        };
        fetch();
    }, [loadPosts, loadFollowing]);

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
                            {loading && trendingTags.length === 0 ? (
                                <TrendingSkeleton />
                            ) : trendingTags.length > 0 ? (
                                trendingTags.map(tag => (
                                    <li 
                                        key={tag} 
                                        onClick={() => handleSearchChange(tag)}
                                        className="text-sm text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors block px-2 py-1 rounded hover:bg-white/5 truncate"
                                    >
                                        {tag}
                                    </li>
                                ))
                            ) : (
                                <p className="text-xs text-gray-600 italic px-2">No hashtags yet</p>
                            )}
                        </ul>
                    </div>
                    <Link 
                        to="/chatbot-ai"
                        className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/20 via-cyan-600/10 to-transparent border border-white/5 shadow-lg relative overflow-hidden group transition-all hover:border-cyan-500/30 hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)]"
                    >
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Bot size={48} />
                        </div>
                        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400">
                                    <Sparkles size={16} />
                                </div>
                                <h3 className="text-white font-bold text-sm">HyperX AI Assistant</h3>
                            </div>
                            <p className="text-[11px] text-gray-400 mb-4 leading-relaxed line-clamp-2">
                                Get instant help and tech insights with our advanced AI companion.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold group-hover:gap-3 transition-all">
                                Ask AI Now <ArrowRight size={14} />
                            </div>
                        </div>
                    </Link>
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
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth px-4 md:px-6 pb-20"
                    >
                        {loading && posts.length === 0 ? (
                            <div className="space-y-6 pt-2">
                                {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
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

                    {/* FOLLOWING LIST */}
                    <div className="p-5 rounded-2xl bg-[#0B0D14] border border-white/10 shadow-lg flex-1 flex flex-col overflow-hidden min-h-0">
                        <h2 className="text-white font-bold mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Sparkles size={18} className="text-yellow-400"/> Following</span>
                            <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-full">{following.length}</span>
                        </h2>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                            {loadingFollowing ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="w-9 h-9 rounded-xl bg-white/5"></div>
                                        <div className="h-3 w-20 bg-white/5 rounded-md"></div>
                                    </div>
                                ))
                            ) : following.length === 0 ? (
                                <div className="text-center py-6 px-2">
                                    <p className="text-[11px] text-gray-500 leading-relaxed">Follow creators to chat with them instantly.</p>
                                </div>
                            ) : (
                                following.map(user => (
                                    <button 
                                        key={user.id} 
                                        onClick={() => window.dispatchEvent(new CustomEvent('hyperx-open-chat', { detail: user }))}
                                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group text-left"
                                    >
                                        <UserAvatar user={{ raw_user_meta_data: user }} size="xs" className="w-9 h-9 group-hover:scale-105 transition-transform" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-300 group-hover:text-white truncate transition-colors uppercase tracking-tighter">
                                                {user.full_name || "Unknown"}
                                            </p>
                                            <span className="text-[9px] text-gray-600 flex items-center gap-1 group-hover:text-cyan-500/50 transition-colors">
                                                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span> Active
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <PostFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                form={form}
                setForm={setForm}
                onSubmit={submitPost}
                loading={loading}
                currentUser={currentUser}
            />
        </div>
    );
}

// --- SKELETON COMPONENTS ---
const TrendingSkeleton = () => (
    <div className="space-y-3 px-2">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-full skeleton-cyan rounded-md opacity-50"></div>
        ))}
    </div>
);

const PostSkeleton = () => (
    <div className="bg-[#0B0D14] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl skeleton-cyan"></div>
                <div className="space-y-2">
                    <div className="h-4 w-32 skeleton-cyan"></div>
                    <div className="h-3 w-20 skeleton-cyan opacity-50"></div>
                </div>
            </div>
            <div className="h-8 w-8 rounded-xl skeleton-cyan opacity-30"></div>
        </div>
        
        <div className="space-y-3 mb-6 ml-16">
            <div className="h-6 w-3/4 skeleton-cyan"></div>
            <div className="h-4 w-full skeleton-cyan opacity-40"></div>
            <div className="h-4 w-5/6 skeleton-cyan opacity-40"></div>
        </div>

        <div className="flex items-center gap-4 ml-16 pt-6 border-t border-white/5">
            <div className="h-10 w-24 rounded-2xl skeleton-cyan opacity-30"></div>
            <div className="h-10 w-24 rounded-2xl skeleton-cyan opacity-30"></div>
            <div className="h-10 w-12 rounded-2xl skeleton-cyan opacity-30"></div>
        </div>
    </div>
);