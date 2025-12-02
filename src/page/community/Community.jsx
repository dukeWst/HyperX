import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { User, Clock, X, Mail, Heart, MessageCircle, Send, Search } from "lucide-react"; // Đã thêm icon Search
import { Link } from "react-router-dom";

// Helper: Format Time
const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
};

// --- COMPONENT: USER AVATAR ---
const UserAvatar = ({ user, size = "md" }) => {
    const metadata = user?.raw_user_meta_data || user?.user_metadata || {};
    const avatarUrl = metadata.avatar_url;
    const fullName = metadata.full_name || user?.email || "?";
    const dims = size === "sm" ? "w-8 h-8" : "w-10 h-10";

    if (avatarUrl) {
        return <img src={avatarUrl} alt="Avatar" className={`${dims} rounded-full object-cover border border-gray-600`} />;
    }
    return (
        <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff`}
            alt="Avatar"
            className={`${dims} rounded-full object-cover border border-gray-600`}
        />
    );
};

// --- MODAL COMPONENT ---
const PostFormModal = ({ show, onClose, onSubmit, form, setForm, loading, currentUser }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
            <div className="bg-gray-800 border border-indigo-500/50 w-full max-w-lg mx-auto rounded-xl shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition"><X size={24} /></button>
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">Create New Post</h2>
                {!currentUser ? (
                    <p className="text-gray-300 text-center py-6">Please <Link to="/signin" className="text-indigo-400 font-medium">Log in</Link> to create a new post.</p>
                ) : (
                    <>
                        <input type="text" placeholder="Post Title..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-indigo-500" />
                        <textarea placeholder="Post Content..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} className="w-full mb-4 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-indigo-500 resize-none"></textarea>
                        <div className="flex justify-end gap-3">
                            <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition">Cancel</button>
                            <button onClick={onSubmit} disabled={loading || !form.title.trim() || !form.content.trim()} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition disabled:bg-gray-600">{loading ? "Posting..." : "Submit Post"}</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// --- POST ITEM COMPONENT ---
const PostItem = ({ post, currentUser }) => {
    const [likes, setLikes] = useState(post.like_count || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentCount, setCommentCount] = useState(post.comment_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        const checkLikeStatus = async () => {
            const { data } = await supabase
                .from("post_likes")
                .select("user_id")
                .eq("post_id", post.id)
                .eq("user_id", currentUser.id)
                .maybeSingle(); // Fix lỗi 406
            if (data) setIsLiked(true);
        };
        checkLikeStatus();
    }, [currentUser, post.id]);

    const handleLike = async () => {
        if (!currentUser) return alert("Please log in to like posts.");
        if (isLiked) {
            setLikes(prev => prev - 1);
            setIsLiked(false);
            await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUser.id);
        } else {
            setLikes(prev => prev + 1);
            setIsLiked(true);
            await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUser.id });
        }
    };

    const toggleComments = async () => {
        if (!showComments && comments.length === 0) {
            setLoadingComments(true);
            const { data, error } = await supabase
                .from("comments_view") // Select từ view để fix lỗi 400
                .select("*")
                .eq("post_id", post.id)
                .order("created_at", { ascending: true });

            if (error) console.error("Lỗi load comment:", error);
            else setComments(data || []);
            setLoadingComments(false);
        }
        setShowComments(!showComments);
    };

    const handleSendComment = async () => {
        if (!currentUser) return alert("Please log in to comment.");
        if (!newComment.trim()) return;

        const { data, error } = await supabase
            .from("post_comments")
            .insert({ post_id: post.id, user_id: currentUser.id, content: newComment })
            .select("*")
            .single();

        if (!error && data) {
            const optimisticComment = {
                ...data,
                email: currentUser.email,
                raw_user_meta_data: currentUser.user_metadata || currentUser.raw_user_meta_data
            };
            setComments([...comments, optimisticComment]);
            setNewComment("");
            setCommentCount(prev => prev + 1);
        }
    };

    return (
        <div className="bg-gray-800/60 border border-gray-700/50 p-6 rounded-xl shadow-md hover:shadow-indigo-500/10 transition duration-300">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                    <UserAvatar user={{ raw_user_meta_data: post.raw_user_meta_data, email: post.email }} size="md" />
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-indigo-400 mb-1 leading-tight">{post.title}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
                        <span className="font-medium text-gray-300">{post.raw_user_meta_data?.full_name || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{formatTime(post.created_at)}</span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">{post.content}</p>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-4 ml-14">
                <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${isLiked ? "text-pink-500 bg-pink-500/10" : "text-gray-400 hover:bg-gray-700"}`}>
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                    <span>{likes}</span>
                </button>
                <button onClick={toggleComments} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${showComments ? "text-indigo-400 bg-indigo-500/10" : "text-gray-400 hover:bg-gray-700"}`}>
                    <MessageCircle size={20} />
                    <span>{commentCount} Comments</span>
                </button>
            </div>

            {showComments && (
                <div className="mt-4 bg-gray-900/40 rounded-lg p-4 ml-2 sm:ml-14 border border-gray-700/50">
                    <div className="space-y-4 mb-5 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                        {loadingComments ? (
                            <p className="text-sm text-gray-500 italic">Loading conversation...</p>
                        ) : comments.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No comments yet. Be the first!</p>
                        ) : (
                            comments.map((cmt) => (
                                <div key={cmt.id} className="flex gap-3 group">
                                    <div className="flex-shrink-0 pt-1">
                                        <UserAvatar user={{ raw_user_meta_data: cmt.raw_user_meta_data, email: cmt.email }} size="sm" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-700 inline-block min-w-[200px]">
                                            <div className="flex justify-between items-baseline mb-1 gap-4">
                                                <span className="text-sm font-bold text-indigo-300">
                                                    {cmt.raw_user_meta_data?.full_name || cmt.email?.split('@')[0] || "Anonymous"}
                                                </span>
                                                <span className="text-[10px] text-gray-500">{formatTime(cmt.created_at)}</span>
                                            </div>
                                            <p className="text-sm text-gray-200 leading-normal">{cmt.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {currentUser ? (
                        <div className="flex gap-3 items-start pt-2 border-t border-gray-700/50">
                            <div className="flex-shrink-0">
                                <UserAvatar user={currentUser} size="sm" />
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="w-full bg-gray-800 border border-gray-600 rounded-full pl-4 pr-12 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                />
                                <button onClick={handleSendComment} disabled={!newComment.trim()} className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:bg-transparent disabled:text-gray-500 transition">
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center"><Link to="/signin" className="text-indigo-400 hover:underline">Log in</Link> to join the discussion.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// --- MAIN COMMUNITY COMPONENT ---
export default function Community({ user }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: "", content: "" });
    const [currentUser, setCurrentUser] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // 1. State cho thanh tìm kiếm
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const load = async () => {
            let u = user;
            if (!u) {
                const { data } = await supabase.auth.getUser();
                u = data.user;
            }
            setCurrentUser(u);
        };
        load();
    }, [user]);

    const loadPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("posts_view")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) console.error("Lỗi tải bài viết:", error);
        else setPosts(data || []);
        setLoading(false);
    };

    useEffect(() => { loadPosts(); }, []);

    const submitPost = async () => {
        if (!currentUser || !form.title.trim() || !form.content.trim()) return;
        setLoading(true);
        setShowModal(false);
        await supabase.from("community_posts").insert({
            user_id: currentUser.id,
            title: form.title,
            content: form.content,
        });
        setForm({ title: "", content: "" });
        loadPosts();
    };

    // 2. Logic lọc bài viết dựa trên từ khóa tìm kiếm
    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative isolate bg-gray-900 h-screen flex flex-col overflow-hidden pt-12">
            {/* Background Blur */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none">
                <div style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }} className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[1155px] -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30" />
            </div>

            <div className="w-full max-w-5xl mx-auto flex flex-col h-full relative z-10">
                {/* PHẦN CỐ ĐỊNH: Header & Thanh Search */}
                <div className="pt-10 px-6 sm:px-12 pb-4 flex-shrink-0">
                    <div className="pb-4 border-b border-gray-700">
                        {/* Dòng 1: Tiêu đề Latest Post */}
                        <h2 className="text-3xl font-bold text-white mb-4">Latest Posts</h2>

                        {/* Dòng 2: Thanh search + Nút Create */}
                        <div className="flex gap-4">
                            {/* Thanh tìm kiếm */}
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search topics..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-1/2 bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-indigo-500 focus:border-indigo-500 transition placeholder-gray-400"
                                />
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            </div>

                            {/* Nút Create Post */}
                            {currentUser ? (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex-shrink-0 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition whitespace-nowrap"
                                >
                                    Create Post
                                </button>
                            ) : (
                                <Link
                                    to="/signin"
                                    className="flex-shrink-0 px-6 py-2.5 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500 transition whitespace-nowrap"
                                >
                                    Log in to Post
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* PHẦN CUỘN: Danh sách bài viết */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-12 pb-10 custom-scrollbar">
                    {loading && posts.length === 0 ? (
                        <p className="text-gray-400 text-center py-10">Loading posts...</p>
                    ) : filteredPosts.length === 0 ? (
                        <p className="text-gray-400 text-center py-10">
                            {searchQuery ? "No posts found matching your search." : "No posts yet."}
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {filteredPosts.map((post) => (
                                <PostItem key={post.id} post={post} currentUser={currentUser} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <PostFormModal show={showModal} onClose={() => setShowModal(false)} onSubmit={submitPost} form={form} setForm={setForm} loading={loading} currentUser={currentUser} />
        </div>
    );
}