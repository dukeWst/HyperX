import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../routes/supabaseClient";
import UserAvatar from "../../components/UserAvatar";
import PostItem from "../community/PostItem";
import { 
    Calendar, Mail, Edit3, LogOut, 
    Grid, Activity, UserX, Package, ChevronRight, Tag, ArrowLeft, UserPlus, UserCheck 
} from "lucide-react";

const UserProfile = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [products, setProducts] = useState([]); 
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- STATE CHO FOLLOW ---
    const [isFollowing, setIsFollowing] = useState(false);
    const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

    // State Tab
    const [activeTab, setActiveTab] = useState('all'); 
    const [selectedPostId, setSelectedPostId] = useState(null);

    const [stats, setStats] = useState({ 
        postCount: 0, 
        likeCount: 0, 
        productCount: 0,
        followerCount: 0, 
        followingCount: 0 
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
                const profilePromise = supabase.from('profiles').select('*').eq('id', targetUserId).single();
                const postsPromise = supabase.from('community_posts').select('*, profiles(*)').eq('user_id', targetUserId).order('created_at', { ascending: false });
                const followerCountPromise = supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId);
                const followingCountPromise = supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId);
                
                const [
                    { data: profileData, error: profileError }, 
                    { data: postsData, error: postsError }, 
                    { count: followerCount }, 
                    { count: followingCount }
                ] = await Promise.all([
                    profilePromise,
                    postsPromise,
                    followerCountPromise,
                    followingCountPromise,
                ]);

                if (profileError) throw profileError;
                if (postsError) throw postsError;

                setProfile(profileData);

                let productsData = [];
                let productCount = 0;
                if (profileData?.email) {
                    const { data: prodData, error: prodError } = await supabase.from('products').select('*').eq('email_upload', profileData.email).order('created_at', { ascending: false });
                    if (prodError) throw prodError;
                    productsData = prodData || [];
                    productCount = productsData.length;
                }
                setProducts(productsData);

                const formattedPosts = postsData.map(post => ({
                    ...post,
                    raw_user_meta_data: { full_name: post.profiles?.full_name, avatar_url: post.profiles?.avatar_url },
                    email: post.profiles?.email
                }));
                setPosts(formattedPosts);

                setStats({
                    postCount: postsData.length,
                    likeCount: formattedPosts.reduce((acc, curr) => acc + (curr.like_count || 0), 0),
                    productCount: productCount,
                    followerCount: followerCount || 0,
                    followingCount: followingCount || 0
                });

                if (user && user.id !== targetUserId) {
                    const { data: followData } = await supabase
                        .from('follows')
                        .select('follower_id')
                        .eq('follower_id', user.id)
                        .eq('following_id', targetUserId)
                        .maybeSingle();
                    
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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/signin');
    };

    const handlePostUpdated = (updatedPost) => {
        setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    };

    const handlePostDeleted = (deletedPostId) => {
        setPosts(posts.filter(p => p.id !== deletedPostId));
        setStats(prev => ({ ...prev, postCount: prev.postCount - 1 }));
        if (selectedPostId === deletedPostId) setSelectedPostId(null);
    };

    const handleFollowToggle = async () => {
        if (!currentUser) return alert("Please log in to follow.");
        if (isUpdatingFollow) return;

        setIsUpdatingFollow(true);
        const previousIsFollowing = isFollowing;
        const previousCount = stats.followerCount;

        if (isFollowing) {
            setIsFollowing(false);
            setStats(prev => ({ ...prev, followerCount: prev.followerCount - 1 }));
        } else {
            setIsFollowing(true);
            setStats(prev => ({ ...prev, followerCount: prev.followerCount + 1 }));
        }

        try {
            if (previousIsFollowing) {
                const { error } = await supabase.from('follows').delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', profile.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('follows').insert({
                    follower_id: currentUser.id,
                    following_id: profile.id
                });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Follow error:", error);
            setIsFollowing(previousIsFollowing);
            setStats(prev => ({ ...prev, followerCount: previousCount }));
            alert("Unable to update follow status.");
        } finally {
            setIsUpdatingFollow(false);
        }
    };

    const handleTabChange = (tabName) => {
        if (activeTab === tabName) {
            setActiveTab('all');
        } else {
            setActiveTab(tabName);
        }
    };

    // --- LOADING STATE ---
    if (isLoading) return (
        <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="text-indigo-400 font-medium animate-pulse">Loading Profile...</p>
            </div>
        </div>
    );

    // --- NOT FOUND STATE ---
    if (!profile) return (
        <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="p-6 bg-white/5 rounded-full border border-white/10">
                <UserX size={48} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-white">User Not Found</h2>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all">Go Home</button>
        </div>
    );

    const isOwnProfile = currentUser && currentUser.id === profile.id;

    // --- SINGLE POST VIEW ---
    if (selectedPostId) {
        const selectedPost = posts.find(p => p.id === selectedPostId);
        return (
            <div className="min-h-screen bg-[#05050A] text-gray-100 p-4 md:p-8 pt-20">
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => setSelectedPostId(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group">
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

    // --- MAIN PROFILE VIEW ---
    return (
        <div className="min-h-screen bg-[#05050A] text-gray-100 md:p-22 relative isolate overflow-hidden">
            
            {/* BACKGROUND EFFECTS */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
            <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 w-[60rem] h-[30rem] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                
                {/* --- HEADER PROFILE CARD --- */}
                <div className="relative overflow-hidden rounded-3xl bg-[#0B0D14]/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                    
                    {/* Cover Photo Gradient */}
                    <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20"></div>
                    
                    <div className="relative px-8 pb-8 pt-20">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                            
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="p-1.5 bg-[#05050A] rounded-full ring-4 ring-white/5 shadow-2xl">
                                    <UserAvatar user={{ raw_user_meta_data: { avatar_url: profile.avatar_url, full_name: profile.full_name }, email: profile.email }} size="xl" className="w-32 h-32 md:w-40 md:h-40 text-5xl" />
                                </div>
                                {isOwnProfile && (
                                    <button 
                                        onClick={() => navigate('/setting')} 
                                        className="absolute bottom-2 right-2 p-2.5 bg-indigo-600 text-white rounded-full shadow-lg border-[3px] border-[#05050A] hover:bg-indigo-500 hover:scale-105 transition-all"
                                        title="Edit Profile"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left space-y-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{profile.full_name || "Unknown User"}</h1>
                                
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-medium text-gray-400">
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <Mail size={14} className="text-indigo-400" />
                                        <span>{profile.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <Calendar size={14} className="text-purple-400" />
                                        <span>Joined {new Date(profile.created_at || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex flex-col gap-3 min-w-[160px] w-full md:w-auto mt-4 md:mt-0">
                                {isOwnProfile ? (
                                    <>
                                        <button onClick={() => navigate('/setting')} className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                                            <Edit3 size={18} /> Edit Profile
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={handleFollowToggle}
                                        disabled={isUpdatingFollow}
                                        className={`w-full py-3 px-6 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
                                        ${isFollowing 
                                            ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-red-500/30 hover:text-red-400 group' // Unfollow style
                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5' // Follow style
                                        }`}
                                    >
                                        {isFollowing ? (
                                            <>
                                                <UserCheck size={20} className="group-hover:hidden" /> 
                                                <UserX size={20} className="hidden group-hover:block" />
                                                <span className="group-hover:hidden">Following</span>
                                                <span className="hidden group-hover:block">Unfollow</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={20} /> Follow
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* --- STATS BAR --- */}
                        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-8">
                            {/* PRODUCTS */}
                            <button 
                                onClick={() => handleTabChange('products')} 
                                className={`text-center p-4 rounded-2xl transition-all duration-300 border backdrop-blur-sm group
                                ${activeTab === 'products' 
                                    ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}`}
                            >
                                <span className={`block text-2xl font-black ${activeTab === 'products' ? 'text-green-400' : 'text-white group-hover:text-green-300'}`}>{stats.productCount}</span>
                                <span className="text-xs uppercase tracking-widest font-bold text-gray-500 group-hover:text-green-400/70 transition-colors">Products</span>
                            </button>

                            {/* POSTS */}
                            <button 
                                onClick={() => handleTabChange('posts')} 
                                className={`text-center p-4 rounded-2xl transition-all duration-300 border backdrop-blur-sm group
                                ${activeTab === 'posts' 
                                    ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}`}
                            >
                                <span className={`block text-2xl font-black ${activeTab === 'posts' ? 'text-indigo-400' : 'text-white group-hover:text-indigo-300'}`}>{stats.postCount}</span>
                                <span className="text-xs uppercase tracking-widest font-bold text-gray-500 group-hover:text-indigo-400/70 transition-colors">Posts</span>
                            </button>

                            {/* FOLLOWERS */}
                            <div className="text-center p-4 bg-white/5 rounded-2xl border border-transparent cursor-default">
                                <span className="block text-2xl font-black text-white">{stats.followerCount}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Followers</span>
                            </div>

                            {/* FOLLOWING */}
                            <div className="text-center p-4 bg-white/5 rounded-2xl border border-transparent cursor-default">
                                <span className="block text-2xl font-black text-white">{stats.followingCount}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Following</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CONTENT SECTION --- */}
                <div className="space-y-10 min-h-[400px]">

                    {/* 1. PRODUCTS TAB */}
                    {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><Package size={24} /></div>
                                    <h2 className="text-2xl font-bold text-white">Products</h2>
                                </div>
                                {activeTab === 'all' && products.length > 4 && (
                                    <Link to="/product" className="text-sm font-semibold text-indigo-400 hover:text-white flex items-center gap-1 transition-colors">
                                        View all <ChevronRight size={16} />
                                    </Link>
                                )}
                            </div>
                            
                            {activeTab === 'all' ? (
                                <div className="flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 snap-x scroll-smooth custom-scrollbar">
                                    {products.map((item) => <ProductCard key={item.id} item={item} formatCurrency={formatCurrency} />)}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {products.map((item) => <ProductCard key={item.id} item={item} formatCurrency={formatCurrency} />)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. POSTS TAB */}
                    {(activeTab === 'all' || activeTab === 'posts') && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Grid size={24} /></div>
                                <h2 className="text-2xl font-bold text-white">Community Posts</h2>
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
                                <div className="text-center py-24 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                    <Activity className="mx-auto h-16 w-16 text-gray-700 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">This user hasn't shared anything with the community yet. Check back later!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Product Card (Style mới) ---
const ProductCard = ({ item, formatCurrency }) => (
    <Link to={`/product/${item.id}`} className="group relative flex-shrink-0 block w-[280px] snap-start h-full">
        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-b from-green-500 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-40 blur transition duration-500"></div>
        
        <div className="relative bg-[#0B0D14] border border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 h-full flex flex-col">
            <div className="aspect-video bg-gray-900 relative overflow-hidden">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700"><Package size={40} /></div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-green-400 border border-white/10 shadow-lg">
                    {formatCurrency(item.price)}
                </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-green-400 transition-colors mb-2">{item.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1 font-light leading-relaxed">{item.description || "No description provided."}</p>
                
                {item.tag && item.tag.length > 0 && (
                    <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
                        <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/10 uppercase tracking-wider font-medium flex items-center gap-1 group-hover:border-green-500/30 group-hover:text-green-200 transition-colors">
                            <Tag size={10} /> {item.tag[0]}
                        </span>
                        {item.tag.length > 1 && (
                            <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-gray-500 border border-white/10">+{item.tag.length - 1}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    </Link>
);

export default UserProfile;