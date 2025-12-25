import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../routes/supabaseClient";
import UserAvatar from "../../components/UserAvatar";
import PostItem from "../community/PostItem";
import { 
    Calendar, Mail, Edit3, 
    Grid, Activity, UserX, Package, ChevronRight, ArrowLeft, UserPlus, UserCheck 
} from "lucide-react";

const UserProfile = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [products, setProducts] = useState([]); // State này sẽ chứa danh sách Projects
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- STATE CHO FOLLOW ---
    const [isFollowing, setIsFollowing] = useState(false);
    const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

    // State Tab
    const [activeTab, setActiveTab] = useState('all'); 
    const [selectedPostId, setSelectedPostId] = useState(null);

    const [stats, setStats] = useState({ 
        postCount: 0, likeCount: 0, productCount: 0, followerCount: 0, followingCount: 0 
    });

    const formatCurrency = (amount) => {
        if (amount === 0 || amount === undefined) return "Free";
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            const targetUserId = id || user?.id;

            if (!targetUserId) {
                setIsLoading(false);
                return;
            }

            try {
                // 1. Fetch Profile trước để đảm bảo user tồn tại
                const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
                if (profileError) throw profileError;

                // 2. Fetch song song các dữ liệu còn lại (bao gồm projects)
                const [
                    { data: postsData, error: postsError }, 
                    { count: followerCount }, 
                    { count: followingCount },
                    { data: projectsData, error: projectsError } // <-- Lấy dữ liệu PROJECTS
                ] = await Promise.all([
                    supabase.from('community_posts').select('*, profiles(*)').eq('user_id', targetUserId).order('created_at', { ascending: false }),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId),
                    supabase.from('projects').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }) // <-- Query bảng projects
                ]);

                if (postsError) throw postsError;
                if (projectsError) console.error("Error fetching projects:", projectsError);

                setProfile(profileData);

                // Cập nhật State cho Projects (vào biến products để tái sử dụng UI)
                setProducts(projectsData || []);

                // Format Posts (Xử lý thông tin user cho bài viết)
                const formattedPosts = postsData.map(post => ({
                    ...post,
                    raw_user_meta_data: { full_name: post.profiles?.full_name, avatar_url: post.profiles?.avatar_url },
                    email: post.profiles?.email
                }));
                setPosts(formattedPosts);

                // Cập nhật Stats
                setStats({
                    postCount: postsData.length,
                    likeCount: formattedPosts.reduce((acc, curr) => acc + (curr.like_count || 0), 0),
                    productCount: projectsData?.length || 0, // Đếm số lượng project
                    followerCount: followerCount || 0,
                    followingCount: followingCount || 0
                });

                // Check Follow Status
                if (user && user.id !== targetUserId) {
                    const { data: followData } = await supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', targetUserId).maybeSingle();
                    setIsFollowing(!!followData);
                }

            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handlePostUpdated = (updatedPost) => setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    const handlePostDeleted = (deletedPostId) => {
        setPosts(prev => prev.filter(p => p.id !== deletedPostId));
        setStats(prev => ({ ...prev, postCount: prev.postCount - 1 }));
        if (selectedPostId === deletedPostId) setSelectedPostId(null);
    };

    const handleFollowToggle = async () => {
        if (!currentUser) return alert("Please log in to follow.");
        if (isUpdatingFollow) return;
        setIsUpdatingFollow(true);
        const prevFollow = isFollowing;
        const prevStats = { ...stats };

        setIsFollowing(!prevFollow);
        setStats(prev => ({ ...prev, followerCount: prevFollow ? prev.followerCount - 1 : prev.followerCount + 1 }));

        try {
            if (prevFollow) {
                await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profile.id);
            } else {
                await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: profile.id });
            }
        } catch (error) {
            console.error("Follow error:", error);
            setIsFollowing(prevFollow);
            setStats(prevStats);
        } finally {
            setIsUpdatingFollow(false);
        }
    };

    const handleTabChange = (tab) => setActiveTab(prev => prev === tab ? 'all' : tab);

    // --- LOADING ---
    if (isLoading) return (
        <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
            <p className="text-indigo-400 font-mono text-sm animate-pulse">LOADING PROFILE...</p>
        </div>
    );

    // --- NOT FOUND ---
    if (!profile) return (
        <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center text-center gap-6">
            <div className="p-6 bg-white/5 rounded-full"><UserX size={48} className="text-gray-500" /></div>
            <h2 className="text-2xl font-bold text-white">User Not Found</h2>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">Go Home</button>
        </div>
    );

    const isOwnProfile = currentUser && currentUser.id === profile.id;

    // --- SINGLE POST VIEW ---
    if (selectedPostId) {
        const selectedPost = posts.find(p => p.id === selectedPostId);
        return (
            <div className="min-h-screen bg-[#05050A] p-4 pt-24">
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => setSelectedPostId(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group px-4 py-2 rounded-lg hover:bg-white/5 w-fit">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Profile
                    </button>
                    {selectedPost ? (
                        <div className="bg-[#0B0D14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                             <PostItem post={selectedPost} currentUser={currentUser} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} />
                        </div>
                    ) : <div className="text-center text-gray-500">Post not found</div>}
                </div>
            </div>
        );
    }

    // --- MAIN VIEW ---
    return (
        <div className="min-h-screen bg-[#05050A] text-gray-100 pb-20 relative isolate overflow-x-hidden">
            
            {/* Background Noise */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 pt-20">
                
                {/* --- HEADER CARD --- */}
                <div className="relative rounded-b-3xl bg-[#0B0D14] border border-white/10 shadow-2xl overflow-hidden">
                    
                    {/* Banner Image */}
                    <div className="h-48 md:h-64 w-full relative bg-gradient-to-r from-violet-900 via-indigo-900 to-cyan-900 z-5">
                         <div className="absolute inset-0 bg-black/10"></div>
                    </div>

                    <div className="px-6 md:px-10 pb-8">
                        <div className="flex flex-col md:flex-row items-start md:items-end -mt-20 gap-6">
                            
                            {/* Avatar */}
                            <div className="relative group z-10">
                                <div className="p-0.5 bg-[#0B0D14] rounded-full ring-[#0B0D14] shadow-2xl ">
                                    <UserAvatar 
                                        user={{ raw_user_meta_data: { avatar_url: profile.avatar_url, full_name: profile.full_name }, email: profile.email }} 
                                        size="xl" 
                                        className="w-32 h-32 md:w-44 md:h-44 text-5xl object-cover z-" 
                                    />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-2 pt-2 text-center md:text-left z-10">
                                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight ">{profile.full_name || "Unknown User"}</h1>
                                
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-medium text-gray-400">
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                        <Mail size={14} className="text-indigo-400" />
                                        <span>{profile.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                        <Calendar size={14} className="text-purple-400" />
                                        <span>Joined {new Date(profile.created_at || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Buttons */}
                            <div className="w-full md:w-auto flex justify-center gap-3 mb-2 md:mb-0">
                                {isOwnProfile ? (
                                    <button onClick={() => navigate('/setting')} className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-semibold text-white transition-all">
                                        <Edit3 size={18} /> Edit Profile
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleFollowToggle}
                                        disabled={isUpdatingFollow}
                                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95
                                        ${isFollowing 
                                            ? 'bg-white/5 border border-white/10 text-gray-300 hover:text-red-400 hover:border-red-500/30' 
                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'}`}
                                    >
                                        {isFollowing ? <><UserCheck size={18} /> Following</> : <><UserPlus size={18} /> Follow</>}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* --- STATS GRID --- */}
                        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/5">
                            <StatCard 
                                label="Projects" value={stats.productCount} icon={<Package />} color="text-green-400" 
                                onClick={() => handleTabChange('products')} active={activeTab === 'products'} 
                            />
                            <StatCard 
                                label="Posts" value={stats.postCount} icon={<Grid />} color="text-indigo-400" 
                                onClick={() => handleTabChange('posts')} active={activeTab === 'posts'} 
                            />
                            <StatCard label="Followers" value={stats.followerCount} icon={<UserPlus />} color="text-pink-400" />
                            <StatCard label="Following" value={stats.followingCount} icon={<UserCheck />} color="text-cyan-400" />
                        </div>
                    </div>
                </div>

                {/* --- CONTENT SECTION --- */}
                <div className="mt-12 min-h-[500px]">

                    {/* 1. PROJECTS TAB (Hiển thị list Project) */}
                    {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
                        <div className="mb-16 animate-in fade-in slide-in-from-bottom-6 duration-500">
                            <div className="flex items-center justify-between mb-6 px-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><Package size={22} /></div>
                                    <h2 className="text-2xl font-bold text-white">Projects</h2>
                                </div>
                                {activeTab === 'all' && products.length > 4 && (
                                    <Link to="/project" className="text-sm font-semibold text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                                        View all <ChevronRight size={16} />
                                    </Link>
                                )}
                            </div>
                            
                            <div className={activeTab === 'all' ? "flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 custom-scrollbar" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"}>
                                {products.map(item => <ProductCard key={item.id} item={item} formatCurrency={formatCurrency} />)}
                            </div>
                        </div>
                    )}

                    {/* 2. POSTS TAB */}
                    {(activeTab === 'all' || activeTab === 'posts') && (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
                            <div className="flex items-center gap-3 mb-6 px-1">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Grid size={22} /></div>
                                <h2 className="text-2xl font-bold text-white">Community Activity</h2>
                            </div>
                            
                            {posts.length > 0 ? (
                                <div className="grid gap-6">
                                    {posts.map(post => (
                                        <div key={post.id} className="bg-[#0B0D14] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-colors">
                                            <PostItem post={post} currentUser={currentUser} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl text-center">
                                    <Activity className="h-12 w-12 text-gray-600 mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-1">No activity yet</h3>
                                    <p className="text-gray-500 text-sm">This user hasn't posted anything to the community.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const StatCard = ({ label, value, icon, color, active, onClick }) => (
    <div 
        onClick={onClick}
        className={`p-4 rounded-2xl border transition-all cursor-pointer group
        ${active 
            ? 'bg-white/10 border-white/20' 
            : 'bg-[#0B0D14]/50 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
    >
        <div className="flex items-center gap-3 mb-2">
            <span className={`text-2xl font-black ${active ? 'text-white' : 'text-gray-200'} group-hover:text-white transition-colors`}>{value}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-400">
            <span className={color}>{React.cloneElement(icon, { size: 14 })}</span> {label}
        </div>
    </div>
);

// --- PRODUCT CARD (Fix hiển thị ảnh full khung) ---
const ProductCard = ({ item, formatCurrency }) => (
    <Link to={`/product/${item.id}`} className="group relative flex-shrink-0 block w-[280px] sm:w-full h-full">
        <div className="relative h-full bg-[#0B0D14] border border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 flex flex-col hover:shadow-xl hover:shadow-cyan-900/10">
            
            {/* Khung ảnh tỷ lệ 4:3 */}
            <div className="aspect-[4/3] w-full relative bg-gray-900 overflow-hidden">
                {item.image_url ? (
                    <img 
                        src={item.image_url} 
                        alt={item.name} 
                        // CSS giúp ảnh lấp đầy khung mà không bị méo (object-cover)
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-700 bg-white/5">
                        <Package size={40} opacity={0.5} />
                    </div>
                )}
                
                {/* Price Tag Overlay */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-green-400 border border-white/10 shadow-lg z-10">
                    {formatCurrency(item.price)}
                </div>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-white font-bold line-clamp-1 group-hover:text-cyan-400 transition-colors mb-2 text-base">{item.name}</h3>
                <p className="text-gray-400 text-xs line-clamp-2 mb-4 flex-1 font-light leading-relaxed">{item.description || "No description provided."}</p>
                
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                    {item.tag && item.tag[0] ? (
                        <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/10 uppercase font-bold tracking-wide">
                            {item.tag[0]}
                        </span>
                    ) : <span></span>}
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                </div>
            </div>
        </div>
    </Link>
);

export default UserProfile;