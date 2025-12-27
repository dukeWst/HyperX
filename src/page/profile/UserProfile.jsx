import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../routes/supabaseClient";
import UserAvatar from "../../components/UserAvatar";
import PostItem from "../community/PostItem";
import { 
    Calendar, Mail, Edit3, 
    Grid, Activity, UserX, Package, ChevronRight, ArrowLeft, UserPlus, UserCheck,
    ShieldAlert, XCircle, Loader2, MessageSquare,
    MessageCircle
} from "lucide-react";

const UserProfile = ({ user: propUser }) => {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [products, setProducts] = useState([]); 
    const [isLoading, setIsLoading] = useState(true); 
    
    // ... rest of state stays same ...
    const [isFollowing, setIsFollowing] = useState(false);
    const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); 
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
    const followActionInProgress = useRef(false);

    const [stats, setStats] = useState({ 
        postCount: 0, likeCount: 0, productCount: 0, followerCount: 0, followingCount: 0 
    });

    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);

    const formatCurrency = (amount) => {
        if (amount === 0 || amount === undefined) return "Free";
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const effectiveId = id || propUser?.id;
    const lastIdRef = useRef(null);

    // --- State & Handlers ---
    const fetchData = useCallback(async (silent = false) => {
        // Chỉ hiện skeleton nếu KHÔNG PHẢI silent fetch và CHƯA CÓ data
        if (!silent) setIsLoading(true);
        
        if (!effectiveId) {
            setIsLoading(false);
            return;
        }

        try {
            // 2. Tải TẤT CẢ dữ liệu nền tảng cùng lúc
            const [
                { data: profileData, error: profileError },
                { data: postsData }, 
                { data: followersData, count: followerCount }, 
                { data: followingData, count: followingCount },
                { data: productsData },
                followStatusResult
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', effectiveId).single(),
                supabase.from('community_posts')
                    .select('*, profiles(*)')
                    .eq('user_id', effectiveId)
                    .order('created_at', { ascending: false }),
                supabase.from('follows').select('follower_id', { count: 'exact' }).eq('following_id', effectiveId),
                supabase.from('follows').select('following_id', { count: 'exact' }).eq('follower_id', effectiveId),
                supabase.from('products').select('*').eq('user_id', effectiveId).order('created_at', { ascending: false }),
                // Check follow status in parallel
                (propUser && propUser.id !== effectiveId) 
                    ? supabase.from('follows').select('follower_id').eq('follower_id', propUser.id).eq('following_id', effectiveId).maybeSingle()
                    : Promise.resolve({ data: null })
            ]);

            if (profileError) throw profileError;
            
            // 3. Tiếp tục tải chi tiết (Secondary fetch) - Vẫn giữ local biến, không set state vội
            const fetchProfileDetails = async (idList, idField) => {
                if (!idList || idList.length === 0) return [];
                const ids = idList.map(item => item[idField]).filter(Boolean);
                if (ids.length === 0) return [];
                const { data } = await supabase.from('profiles').select('*').in('id', ids);
                return ids.map(id => data?.find(p => p.id === id) || { id, full_name: "Private User" });
            };

            const [followerProfiles, followingProfiles] = await Promise.all([
                fetchProfileDetails(followersData, 'follower_id'),
                fetchProfileDetails(followingData, 'following_id')
            ]);

            const formattedPosts = (postsData || []).map(post => {
                const profileInfo = post.profiles || {};
                const metadata = post.raw_user_meta_data || {};
                return {
                    ...post,
                    raw_user_meta_data: { 
                        ...metadata,
                        full_name: post.full_name || profileInfo.full_name || metadata.full_name || profileInfo.name || metadata.name, 
                        avatar_url: post.avatar_url || profileInfo.avatar_url || profileInfo.picture || metadata.avatar_url || metadata.picture
                    },
                    email: post.email || profileInfo.email
                };
            });

            // 4. CHỈ CẬP NHẬT STATE KHI TẤT CẢ ĐÃ SẴN SÀNG (ATOMIC UPDATE)
            // React 19 sẽ batch toàn bộ các setter này vào 1 lần render duy nhất.
            setProfile(profileData);
            setProducts(productsData || []);
            setPosts(formattedPosts);
            setFollowers(followerProfiles);
            setFollowing(followingProfiles);
            setIsFollowing(!!followStatusResult.data);
            setStats({
                postCount: postsData?.length || 0,
                likeCount: formattedPosts.reduce((acc, curr) => acc + (curr.like_count || 0), 0),
                productCount: productsData?.length || 0,
                followerCount: followerCount || 0,
                followingCount: followingCount || 0
            });

        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [effectiveId, propUser]); // profile removed to prevent recreation loop

    // Effect để fetch data mỗi khi ID đổi HOẶC User session đổi
    useEffect(() => {
        if (!effectiveId) return;

        // Reset dữ liệu nếu ta đang chuyển sang một ID người dùng mới hoàn toàn
        if (lastIdRef.current && lastIdRef.current !== effectiveId) {
            setProfile(null);
            setPosts([]);
            setProducts([]);
        }
        
        lastIdRef.current = effectiveId;
        fetchData();
    }, [effectiveId, fetchData]); 

    const handlePostUpdated = (updatedPost) => setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    const handlePostDeleted = (deletedPostId) => {
        setPosts(prev => prev.filter(p => p.id !== deletedPostId));
        setStats(prev => ({ ...prev, postCount: prev.postCount - 1 }));
        if (selectedPostId === deletedPostId) setSelectedPostId(null);
    };

    const handleFollowToggle = async () => {
        if (!propUser) return alert("Please log in to follow.");
        if (followActionInProgress.current) return;

        // If already following, open management modal instead of immediate unfollow
        if (isFollowing) {
            setIsFollowModalOpen(true);
            return;
        }

        await executeFollowAction(false); // Perform follow
    };

    const executeFollowAction = async (isUnfollow) => {
        if (followActionInProgress.current) return;
        followActionInProgress.current = true;
        
        setIsUpdatingFollow(true);
        if (isFollowModalOpen) setIsFollowModalOpen(false);

        const prevFollow = isFollowing;
        const newFollowState = !prevFollow;
        
        setIsFollowing(newFollowState);
        setStats(prev => ({ ...prev, followerCount: prevFollow ? prev.followerCount - 1 : prev.followerCount + 1 }));

        try {
            if (isUnfollow) {
                await supabase.from('follows').delete().eq('follower_id', propUser.id).eq('following_id', profile.id);
            } else {
                await supabase.from('follows').insert({ follower_id: propUser.id, following_id: profile.id });
            }
            fetchData(true);
        } catch (error) {
            console.error("Follow error:", error);
            setIsFollowing(prevFollow);
            setStats(prev => ({ ...prev, followerCount: prevFollow ? prev.followerCount + 1 : prev.followerCount - 1 }));
        } finally {
            // Force disable for 1.5s to prevent rapid spam and ensure sync
            setTimeout(() => {
                setIsUpdatingFollow(false);
                followActionInProgress.current = false;
            }, 1500);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(prev => prev === tab ? 'all' : tab);
    };

    // --- RENDER ---
    const isOwnProfile = propUser && profile && propUser.id === profile.id;

    // Chỉ chặn render nếu KHÔNG ĐANG LOADING mà vẫn KHÔNG CÓ PROFILE (Lỗi 404)
    if (!profile && !isLoading) {
        return (
            <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center text-center gap-6">
                <div className="p-6 bg-white/5 rounded-full"><UserX size={48} className="text-gray-500" /></div>
                <h2 className="text-2xl font-bold text-white">User Not Found</h2>
                <button onClick={() => navigate('/')} className="px-6 py-2 bg-cyan-600 text-black font-bold rounded-lg hover:bg-cyan-500 transition-colors">Go Home</button>
            </div>
        );
    }

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
                             <PostItem post={selectedPost} currentUser={propUser} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} />
                        </div>
                    ) : <div className="text-center text-gray-500">Post not found</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05050A] text-gray-100 py-6 relative isolate overflow-x-hidden ">
            
            {/* Background Noise */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 pt-20">
                
                {/* --- HEADER CARD --- */}
                {!profile ? (
                    <HeaderSkeleton />
                ) : (
                    <div className="relative rounded-b-3xl bg-[#0B0D14] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in duration-300">
                        {/* Banner Image */}
                        <div className="h-48 md:h-64 w-full relative bg-gradient-to-r from-cyan-900 via-blue-900 to-purple-900 z-5">
                             <div className="absolute inset-0 bg-black/10"></div>
                        </div>

                        <div className="px-6 md:px-10 pb-8">
                            <div className="flex flex-col md:flex-row items-start md:items-end -mt-20 gap-6">
                                {/* Avatar */}
                                <div className="relative group z-10">
                                    <div className="p-1 bg-[#0B0D14] rounded-full ring-1 ring-white/10 shadow-2xl">
                                        <UserAvatar 
                                            user={{ 
                                                ...profile,
                                                raw_user_meta_data: { 
                                                    ...profile,
                                                    avatar_url: profile.avatar_url, 
                                                    full_name: profile.full_name 
                                                }
                                            }} 
                                            size="xl" 
                                            className="w-32 h-32 md:w-44 md:h-44 text-5xl object-cover" 
                                        />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-2 pt-2 text-center md:text-left z-10">
                                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight ">{profile.full_name || "Unknown User"}</h1>
                                    
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-medium text-gray-400">
                                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Mail size={14} className="text-cyan-400" />
                                            <span>{profile.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Calendar size={14} className="text-blue-400" />
                                            <span>Joined {new Date(profile.created_at || Date.now()).toLocaleDateString('en-US')}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Buttons */}
                                <div className="w-full md:w-auto flex justify-center gap-3 mb-2 md:mb-0">
                                    {isOwnProfile ? (
                                        <button onClick={() => navigate('/setting')} className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-semibold text-white transition-all hover:scale-105 active:scale-95">
                                            <Edit3 size={18} /> Edit Profile
                                        </button>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => window.dispatchEvent(new CustomEvent('hyperx-open-chat', { detail: profile }))}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-xl font-semibold text-gray-300 transition-all active:scale-95"
                                            >
                                                <MessageCircle size={18} className="text-cyan-400" />
                                                <span className="hidden sm:inline">Message</span>
                                            </button>
                                            <button 
                                                onClick={handleFollowToggle}
                                                disabled={isUpdatingFollow}
                                                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed
                                                ${isFollowing 
                                                    ? 'bg-white/5 border border-white/10 text-gray-300 hover:text-red-400 hover:border-red-500/30' 
                                                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:brightness-110 shadow-cyan-500/20'}`}
                                            >
                                                {isUpdatingFollow ? (
                                                    <><Loader2 size={18} className="animate-spin" /> Waiting...</>
                                                ) : (
                                                    isFollowing ? <><UserCheck size={18} /> Following</> : <><UserPlus size={18} /> Follow</>
                                                )}
                                            </button>
                                        </div>
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
                                    label="Posts" value={stats.postCount} icon={<Grid />} color="text-blue-400" 
                                    onClick={() => handleTabChange('posts')} active={activeTab === 'posts'} 
                                />
                                <StatCard 
                                    label="Followers" value={stats.followerCount} icon={<UserPlus />} color="text-pink-400" 
                                    onClick={() => handleTabChange('followers')} active={activeTab === 'followers'} 
                                />
                                <StatCard 
                                    label="Following" value={stats.followingCount} icon={<UserCheck />} color="text-cyan-400" 
                                    onClick={() => handleTabChange('following')} active={activeTab === 'following'} 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CONTENT SECTION --- */}
                <div className="mt-12 min-h-[500px]">

                    {/* 0. FOLLOWERS/FOLLOWING LIST VIEW */}
                    {(activeTab === 'followers' || activeTab === 'following') && (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-1">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${activeTab === 'followers' ? 'bg-pink-500/10 text-pink-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                        {activeTab === 'followers' ? <UserPlus size={22} /> : <UserCheck size={22} />}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white capitalize">{activeTab}</h2>
                                    <span className="text-sm font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                        {activeTab === 'followers' ? followers.length : following.length}
                                    </span>
                                </div>

                                <button 
                                    onClick={() => setActiveTab('all')}
                                    className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors group bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-white/20"
                                >
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    Back to Overview
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(activeTab === 'followers' ? followers : following).length > 0 ? (
                                    (activeTab === 'followers' ? followers : following).map(u => (
                                        <Link 
                                            key={u.id} 
                                            to={`/profile/${u.id}`}
                                            className="group flex items-center gap-4 p-4 bg-[#0B0D14] border border-white/5 rounded-2xl hover:border-cyan-500/30 hover:bg-white/[0.02] transition-all"
                                        >
                                            <UserAvatar 
                                                user={{ 
                                                    ...u, 
                                                    raw_user_meta_data: { 
                                                        avatar_url: u.avatar_url, 
                                                        full_name: u.full_name 
                                                    } 
                                                }} 
                                                size="md" 
                                                className="w-12 h-12" 
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-bold truncate group-hover:text-cyan-400 transition-colors uppercase text-sm tracking-tighter">
                                                    {u.full_name || "Unknown"}
                                                </h3>
                                                <p className="text-gray-500 text-xs truncate">Joined {new Date(u.created_at).toLocaleDateString('en-US')}</p>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-700 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                        </Link>
                                    ))
                                ) : (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                                        <UserX size={40} className="text-gray-600 mb-4" />
                                        <p className="text-gray-500">No users found in this list.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                                {isLoading && products.length === 0 ? (
                                    [...Array(activeTab === 'all' ? 4 : 6)].map((_, i) => (
                                        <div key={i} className={`${activeTab === 'all' ? 'w-[280px]' : 'w-full'} aspect-[4/3] skeleton rounded-2xl`} />
                                    ))
                                ) : (
                                    products.map(item => (
                                        <ProductCard 
                                            key={item.id} 
                                            item={item} 
                                            formatCurrency={formatCurrency} 
                                            isSlider={activeTab === 'all'} 
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* 2. POSTS TAB */}
                    {(activeTab === 'all' || activeTab === 'posts') && (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
                            <div className="flex items-center gap-3 mb-6 px-1">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Grid size={22} /></div>
                                <h2 className="text-2xl font-bold text-white">Community Activity</h2>
                            </div>
                            
                            {posts.length > 0 ? (
                                <div className="grid gap-6">
                                    {posts.map(post => (
                                        <div key={post.id} className="bg-[#0B0D14] border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-colors">
                                            <PostItem post={post} currentUser={propUser} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} />
                                        </div>
                                    ))}
                                </div>
                            ) : isLoading ? (
                                <div className="grid gap-6">
                                    <PostSkeleton />
                                    <PostSkeleton />
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

            {/* --- FOLLOW MANAGEMENT MODAL --- */}
            {isFollowModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsFollowModalOpen(false)} />
                    
                    <div className="relative w-full max-w-sm bg-[#0A0C12] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="p-6 text-center border-b border-white/5">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden ring-2 ring-cyan-500/20">
                                <UserAvatar user={{ ...profile, raw_user_meta_data: { avatar_url: profile.avatar_url, full_name: profile.full_name } }} size="lg" className="w-full h-full" />
                            </div>
                            <h3 className="text-white font-bold text-lg">{profile.full_name}</h3>
                            <p className="text-gray-500 text-sm">@{profile.full_name?.toLowerCase().replace(/\s+/g, '')}</p>
                        </div>

                        {/* Actions */}
                        <div className="p-2">
                            <button 
                                onClick={() => {
                                    alert("Restrict functionality coming soon!");
                                    setIsFollowModalOpen(false);
                                }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                                        <ShieldAlert size={20} />
                                    </div>
                                    <span className="text-white font-semibold">Restrict</span>
                                </div>
                                <ChevronRight size={16} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button 
                                onClick={() => executeFollowAction(true)}
                                disabled={isUpdatingFollow}
                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-500/10 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-500/20 text-red-500">
                                        {isUpdatingFollow ? <Loader2 size={20} className="animate-spin" /> : <XCircle size={20} />}
                                    </div>
                                    <span className="text-red-500 font-semibold">{isUpdatingFollow ? "Unfollowing..." : "Unfollow"}</span>
                                </div>
                                {!isUpdatingFollow && <ChevronRight size={16} className="text-gray-600 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>

                        {/* Footer / Cancel */}
                        <button 
                            onClick={() => setIsFollowModalOpen(false)}
                            className="w-full p-4 text-gray-500 hover:text-white font-bold text-sm border-t border-white/5 transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
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

// --- PRODUCT CARD ---
const ProductCard = ({ item, formatCurrency, isSlider }) => (
    <Link 
        to={`/product/${item.id}`} 
        className={`group relative flex-shrink-0 block h-full ${isSlider ? 'w-[280px]' : 'w-full'}`}
    >
        <div className="relative h-full bg-[#0B0D14] border border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 flex flex-col hover:shadow-xl hover:shadow-cyan-900/10">
            
            {/* Khung ảnh tỷ lệ 4:3 */}
            <div className="aspect-[4/3] w-full relative bg-gray-900 overflow-hidden">
                {item.image_url ? (
                    <img 
                        src={item.image_url} 
                        alt={item.name} 
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

// --- SKELETON COMPONENTS ---
const HeaderSkeleton = () => (
    <div className="relative rounded-b-3xl bg-[#0B0D14] border border-white/10 shadow-2xl overflow-hidden">
        <div className="h-48 md:h-64 w-full skeleton-cyan"></div>
        <div className="px-6 md:px-10 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end -mt-20 gap-6">
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-full skeleton-cyan border-4 border-[#0B0D14]"></div>
                <div className="flex-1 space-y-3 pt-2">
                    <div className="h-8 w-48 skeleton rounded-lg"></div>
                    <div className="flex gap-4">
                        <div className="h-6 w-32 skeleton rounded-md opacity-60"></div>
                        <div className="h-6 w-40 skeleton rounded-md opacity-40"></div>
                    </div>
                </div>
                <div className="h-10 w-32 skeleton rounded-xl"></div>
            </div>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/5">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 skeleton rounded-2xl opacity-50"></div>
                ))}
            </div>
        </div>
    </div>
);

const PostSkeleton = () => (
    <div className="bg-[#0B0D14] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full skeleton"></div>
            <div className="space-y-2">
                <div className="h-4 w-24 skeleton rounded"></div>
                <div className="h-3 w-16 skeleton rounded opacity-50"></div>
            </div>
        </div>
        <div className="space-y-2">
            <div className="h-4 w-full skeleton rounded opacity-60"></div>
            <div className="h-4 w-5/6 skeleton rounded opacity-40"></div>
        </div>
        <div className="h-48 w-full skeleton rounded-xl opacity-30"></div>
    </div>
);

export default UserProfile;