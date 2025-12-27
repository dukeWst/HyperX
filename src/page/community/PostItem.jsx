import React, { useEffect, useState, memo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import UserAvatar from "../../components/UserAvatar"; 
import formatTime from "./formatTime"; 
import { EditIcon, Heart, MessageCircle, MoreHorizontal, Send, Trash2, Share2, CornerDownRight, X, Link as LinkIcon, Check, Copy, ExternalLink } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal"; 
import { supabase } from "../../routes/supabaseClient";
import PostFormModal from "./PostFormModal";

// --- HELPER: Render content with clickable hashtags ---
const renderContentWithHashtags = (content, onTagClick) => {
    if (!content) return null;
    
    // Tách nội dung bằng khoảng trắng để tìm hashtag
    const parts = content.split(/(\s+)/);
    
    return parts.map((part, index) => {
        if (part.startsWith('#') && part.length > 1) {
            return (
                <span 
                    key={index} 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onTagClick) onTagClick(part);
                    }}
                    className="text-cyan-400 font-medium hover:text-cyan-300 cursor-pointer transition-colors"
                >
                    {part}
                </span>
            );
        }
        return part;
    });
};

// --- SUB-COMPONENT: CommentItem (Cập nhật onTagClick) ---
const CommentItem = memo(({ comment, allComments, currentUser, onDelete, onReplySuccess, depth = 0, highlightId, onTagClick }) => {
    const [likes, setLikes] = useState(0); 
    const [isLiked, setIsLiked] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const commentRef = React.useRef(null);
    const [isHighlighted, setIsHighlighted] = useState(false);
    
    const indentLevel = depth > 2 ? 2 : depth;
    const paddingLeftValue = indentLevel * 24; 
    const childComments = allComments.filter(c => c.parent_id === comment.id);

    // Xử lý thông tin profile linh hoạt (cho cả dữ liệu từ view flat hoặc join nested)
    const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : (comment.profiles || {});
    const metadata = comment.raw_user_meta_data || {};
    const authorName = comment.full_name || profile?.full_name || profile?.name || metadata.full_name || metadata.name || "Anonymous";
    const avatarUrl = comment.avatar_url || profile?.avatar_url || profile?.picture || profile?.avatar || metadata.avatar_url || metadata.picture || metadata.avatar;

    useEffect(() => {
        if (highlightId && String(comment.id) === String(highlightId)) {
            setTimeout(() => { commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 500);
            setIsHighlighted(true);
            const timer = setTimeout(() => setIsHighlighted(false), 2500); 
            return () => clearTimeout(timer);
        }
    }, [highlightId, comment.id]);

    useEffect(() => {
        if (!currentUser) return;
        const checkLike = async () => {
            const { data } = await supabase.from("comment_likes").select("id").eq("comment_id", comment.id).eq("user_id", currentUser.id).maybeSingle();
            if (data) setIsLiked(true);
            const { count } = await supabase.from("comment_likes").select("id", { count: 'exact', head: true }).eq("comment_id", comment.id);
            setLikes(count || 0);
        };
        checkLike();
    }, [comment.id, currentUser]);

    const handleLikeComment = async () => {
        if (!currentUser) return alert("Please log in.");
        if (isLiked) {
            setLikes(p => Math.max(0, p - 1)); setIsLiked(false);
            await supabase.from("comment_likes").delete().eq("comment_id", comment.id).eq("user_id", currentUser.id);
        } else {
            setLikes(p => p + 1); setIsLiked(true);
            await supabase.from("comment_likes").insert({ comment_id: comment.id, user_id: currentUser.id });
            
            // --- NEW: SEND NOTIFICATION ---
            if (currentUser.id !== comment.user_id) {
                await supabase.from('notifications').insert({
                    user_id: comment.user_id,
                    actor_id: currentUser.id,
                    type: 'like_comment',
                    content: comment.content.substring(0, 30) + (comment.content.length > 30 ? '...' : ''),
                    resource_id: comment.post_id,
                    comment_id: comment.id,
                    is_read: false
                });
            }
        }
    };

    const handleToggleReply = () => {
        if (!currentUser) return alert("Please log in.");
        if (!showReplyInput) {
            setReplyContent(`@${authorName} `);
        }
        setShowReplyInput(!showReplyInput);
    };

    const handleSendReply = async () => {
        if (!replyContent.trim()) return;
        setIsSendingReply(true);
        const { data, error } = await supabase.from("post_comments").insert({ 
            post_id: comment.post_id, user_id: currentUser.id, content: replyContent, parent_id: comment.id 
        }).select("*, profiles(*)").single();
        if (!error && data) {
            const newReply = { 
                ...data, 
                email: currentUser.email, 
                raw_user_meta_data: currentUser.user_metadata || currentUser.raw_user_meta_data, 
                profiles: data.profiles || { full_name: currentUser.user_metadata?.full_name, avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture }
            };
            onReplySuccess(newReply); setReplyContent(""); setShowReplyInput(false);
            
            // --- NEW: SEND NOTIFICATION ---
            if (currentUser.id !== comment.user_id) {
                await supabase.from('notifications').insert({
                    user_id: comment.user_id,
                    actor_id: currentUser.id,
                    type: 'comment',
                    content: replyContent.substring(0, 50) + (replyContent.length > 50 ? '...' : ''),
                    resource_id: comment.post_id,
                    comment_id: data.id,
                    is_read: false
                });
            }
        } else { alert("Error replying: " + error?.message); }
        setIsSendingReply(false);
    };

    return (
        <div className="flex flex-col relative" ref={commentRef}>
            <div className={`flex gap-3 group relative p-3 rounded-xl transition-all duration-500 ease-in-out border border-transparent ${isHighlighted ? 'bg-cyan-500/10 border-cyan-500/30' : 'hover:bg-white/[0.03]'}`} style={{ marginLeft: `${paddingLeftValue}px` }}>
                {depth > 0 && <div className="absolute -left-[14px] top-4 w-3 h-px bg-white/10"></div>}
                <div className="flex-shrink-0 pt-1 relative z-10">
                    <UserAvatar 
                        user={{ 
                            ...comment,
                            id: comment.user_id, 
                            profiles: profile,
                            raw_user_meta_data: metadata, 
                            avatar_url: avatarUrl,
                            full_name: authorName
                        }} 
                        size="sm" 
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold text-cyan-200">{authorName}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 font-mono">{formatTime(comment.created_at)}</span>
                            {currentUser && currentUser.id === comment.user_id && (
                                <div className="relative">
                                    <button onClick={() => setShowMenu(!showMenu)} className="text-gray-600 hover:text-white transition opacity-0 group-hover:opacity-100">
                                        <MoreHorizontal size={14} />
                                    </button>
                                    {showMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                            <div className="absolute right-0 top-5 z-20 w-24 bg-[#1A1D26] border border-white/10 rounded-lg shadow-xl py-1">
                                                <button onClick={() => onDelete(comment.id)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-white/5 text-left">
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed break-words font-light">
                        {renderContentWithHashtags(comment.content, onTagClick)}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                        <button onClick={handleLikeComment} className={`text-xs font-medium flex items-center gap-1 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}>
                            <Heart size={12} fill={isLiked ? "currentColor" : "none"} /> {likes > 0 && likes}
                        </button>
                        <button onClick={handleToggleReply} className="text-xs font-medium text-gray-500 hover:text-cyan-400 flex items-center gap-1 transition-colors">Reply</button>
                    </div>
                    {showReplyInput && currentUser && (
                        <div className="mt-3 flex gap-3 items-center animate-in fade-in slide-in-from-top-1">
                            <UserAvatar 
                                user={{ 
                                    ...currentUser, 
                                    id: currentUser.id, 
                                    avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture 
                                }} 
                                size="sm" 
                                disableLink={true}
                            />
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    autoFocus 
                                    value={replyContent} 
                                    onChange={(e) => setReplyContent(e.target.value)} 
                                    placeholder="Write a reply..." 
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-gray-600" 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()} 
                                    disabled={isSendingReply} 
                                />
                                <button 
                                    onClick={handleSendReply} 
                                    disabled={!replyContent.trim() || isSendingReply} 
                                    className="absolute right-1 top-1 bottom-1 px-3 bg-cyan-600/20 text-cyan-400 rounded-lg hover:bg-cyan-600 hover:text-black disabled:opacity-30 transition-all"
                                >
                                    <CornerDownRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {childComments.map(child => (<CommentItem key={child.id} comment={child} allComments={allComments} currentUser={currentUser} onDelete={onDelete} onReplySuccess={onReplySuccess} depth={depth + 1} highlightId={highlightId} onTagClick={onTagClick} />))}
        </div>
    );
});


// --- SUB-COMPONENT: CommentModal ---
const CommentModal = memo(({ 
    isOpen, 
    onClose, 
    postData, 
    currentUser, 
    comments, 
    rootComments, 
    loadingComments, 
    newComment, 
    setNewComment, 
    onSendComment, 
    isSendingComment, 
    onDeleteComment, 
    onReplySuccess, 
    highlightId, 
    onTagClick,
    getAuthorName,
    renderContentWithHashtags,
    isAuthor,
    onEditPost,
    onDeletePost
}) => {
    const [showPostMenu, setShowPostMenu] = useState(false);
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with intense blur covering everything */}
            <div 
                className="absolute inset-0 bg-[#05050A]/60 backdrop-blur-xl animate-in fade-in duration-500" 
                onClick={onClose}
            ></div>
            
            {/* Centered Modal Content */}
            <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0B0D14] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#0B0D14]/50 backdrop-blur-md z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
                            <MessageCircle size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Community Talk</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Post Content Preview */}
                    <div className="p-6 md:p-8 bg-gradient-to-b from-white/[0.03] to-transparent border-b border-white/5">
                        <div className="flex items-start gap-4 md:gap-5">
                            <UserAvatar user={postData.profiles} size="lg" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-cyan-400 font-bold hover:underline cursor-pointer">{getAuthorName()}</span>
                                        <div className="flex items-center gap-2 text-gray-500 text-[10px] mt-0.5 font-medium uppercase tracking-wider">
                                            <span>{formatTime(postData.created_at)}</span>
                                            {postData.updated_at && <span className="flex items-center gap-1">• edited</span>}
                                        </div>
                                    </div>

                                    {isAuthor && (
                                        <div className="relative">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setShowPostMenu(!showPostMenu); }}
                                                className={`p-2 rounded-xl transition-all ${showPostMenu ? "bg-white/10 text-white" : "text-gray-500 hover:bg-white/5 hover:text-white"}`}
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>
                                            
                                            {showPostMenu && (
                                                <>
                                                    <div className="fixed inset-0 z-30" onClick={() => setShowPostMenu(false)}></div>
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#0B0D14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40 animate-in zoom-in-95 fade-in duration-200">
                                                        <div className="p-1.5">
                                                            <button 
                                                                onClick={() => { onEditPost(); setShowPostMenu(false); }}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                                            >
                                                                <EditIcon size={16} className="text-cyan-400" />
                                                                <span className="font-bold">Edit Post</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => { onDeletePost(); setShowPostMenu(false); }}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-xl transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                                <span className="font-bold">Delete Post</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 break-words leading-tight">{postData.title}</h2>
                                
                                <div className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line break-words opacity-90">
                                    {renderContentWithHashtags(postData.content, onTagClick)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Discussions Section */}
                    <div className="p-6 md:p-8 space-y-8">
                        <div className="flex items-center gap-4">
                            <span className="h-px flex-1 bg-white/5"></span>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                <MessageCircle size={14} /> Discussions
                            </span>
                            <span className="h-px flex-1 bg-white/5"></span>
                        </div>

                        {loadingComments ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black">Syncing talks...</p>
                            </div>
                        ) : rootComments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 ring-1 ring-white/10 group">
                                    <MessageCircle size={28} className="text-gray-700 group-hover:text-cyan-500 transition-colors" />
                                </div>
                                <p className="text-gray-500 text-sm italic">Be the first to share your thoughts!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {rootComments.map((cmt) => (
                                    <CommentItem 
                                        key={cmt.id} 
                                        comment={cmt} 
                                        allComments={comments} 
                                        currentUser={currentUser} 
                                        onDelete={onDeleteComment} 
                                        onReplySuccess={onReplySuccess} 
                                        depth={0} 
                                        highlightId={highlightId} 
                                        onTagClick={onTagClick}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Input */}
                <div className="p-6 bg-black/40 border-t border-white/5 z-20">
                    {currentUser ? (
                        <div className="flex gap-4 items-start">
                            <div className="hidden sm:block">
                                <UserAvatar user={{ ...currentUser, id: currentUser.id, avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture }} size="md" />
                            </div>
                            <div className="flex-1 relative group">
                                <textarea 
                                    value={newComment} 
                                    onChange={(e) => setNewComment(e.target.value)} 
                                    placeholder="Add your thought..." 
                                    className="w-full bg-[#05050A] border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-black/60 transition-all placeholder-gray-600 resize-none min-h-[56px] max-h-[150px]"
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSendComment())}
                                    disabled={isSendingComment}
                                />
                                <button 
                                    onClick={onSendComment} 
                                    disabled={!newComment.trim() || isSendingComment} 
                                    className="absolute right-3 bottom-3 p-2 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl text-white hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-white/5 rounded-2xl text-center border border-dashed border-white/10 hover:border-cyan-500/30 transition-colors">
                            <p className="text-xs text-gray-500 italic">Want to join? <Link to="/signin" className="text-cyan-400 font-bold hover:underline not-italic">Sign in</Link> to share your insights.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
});


// --- MAIN POST COMPONENT ---
const PostItem = ({ post: initialPost, currentUser, onPostDeleted, onPostUpdated, onTagClick }) => {
    // HOOKS MUST BE AT TOP (BEFORE ANY RETURNS)
    const [postData, setPostData] = useState(initialPost || {}); 
    const [likes, setLikes] = useState(initialPost?.like_count || 0); 
    const [isLiked, setIsLiked] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentCount, setCommentCount] = useState(initialPost?.comment_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [showPostMenu, setShowPostMenu] = useState(false);
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [isDeletingComment, setIsDeletingComment] = useState(false);
    const [isEditing, setIsEditing] = useState(false); 
    const [editForm, setEditForm] = useState({ title: initialPost?.title || "", content: initialPost?.content || "" }); 
    const [isUpdatingPost, setIsUpdatingPost] = useState(false); 
    const [copied, setCopied] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [searchParams] = useSearchParams();

    // Key derived values
    const isAuthor = currentUser?.id === postData?.user_id;

    // Move all hooks here
    const fetchCommentsData = useCallback(async () => {
        if (!postData?.id) return;
        setLoadingComments(true);
        const { data, error } = await supabase.from("comments_view").select("*, profiles(*)").eq("post_id", postData.id).order("created_at", { ascending: true });
        if (!error && data) {
            const formattedComments = data.map(cmt => {
                const profile = Array.isArray(cmt.profiles) ? cmt.profiles[0] : (cmt.profiles || {});
                const metadata = cmt.raw_user_meta_data || {};
                const authorName = cmt.full_name || profile?.full_name || profile?.name || metadata.full_name || metadata.name || "Anonymous";
                const avatarUrl = cmt.avatar_url || profile?.avatar_url || profile?.picture || profile?.avatar || metadata.avatar_url || metadata.picture || metadata.avatar;
                
                return { 
                    ...cmt, 
                    profiles: profile, // Giữ profile đầy đủ cho UserAvatar
                    raw_user_meta_data: {
                        ...metadata,
                        ...profile, // Trộn profile vào metadata để UserAvatar dễ fallback
                        full_name: authorName,
                        avatar_url: avatarUrl
                    },
                    avatar_url: avatarUrl, 
                    full_name: authorName
                };
            });
            setComments(formattedComments);
        }
        setLoadingComments(false);
    }, [postData?.id]);

    useEffect(() => {
        const ensureProfileData = async () => {
            if (!postData?.id || !postData?.user_id) return;
            const hasProfile = postData.profiles && (Array.isArray(postData.profiles) ? postData.profiles.length > 0 : !!postData.profiles.id);
            if (!hasProfile) {
                const { data, error } = await supabase.from('profiles').select('*').eq('id', postData.user_id).single();
                if (data && !error) setPostData(prev => ({ ...prev, profiles: data }));
            }
        };
        ensureProfileData();
    }, [postData?.user_id, postData?.profiles, postData?.id]);

    useEffect(() => {
        if (!currentUser || !postData?.id) return;
        const checkLikeStatus = async () => {
            const { data } = await supabase.from("post_likes").select("user_id").eq("post_id", postData.id).eq("user_id", currentUser.id).maybeSingle();
            if (data) setIsLiked(true);
        };
        checkLikeStatus();
    }, [currentUser, postData?.id]);

    const highlightCommentId = searchParams.get('commentId');
    useEffect(() => {
        if (highlightCommentId && postData?.id) {
            setShowComments(true);
            const isCommentLoaded = comments.some(c => String(c.id) === String(highlightCommentId));
            if (!isCommentLoaded) fetchCommentsData();
        }
    }, [highlightCommentId, postData?.id, comments, fetchCommentsData]);

    const handleLike = useCallback(async () => {
        if (!currentUser || !postData?.id) return alert("Please log in.");
        if (isLiked) {
            setLikes(p => Math.max(0, p - 1)); setIsLiked(false);
            await supabase.from("post_likes").delete().eq("post_id", postData.id).eq("user_id", currentUser.id); 
        } else {
            setLikes(p => p + 1); setIsLiked(true);
            await supabase.from("post_likes").insert({ post_id: postData.id, user_id: currentUser.id }); 
            
            // --- NEW: SEND NOTIFICATION ---
            if (currentUser.id !== postData.user_id) {
                await supabase.from('notifications').insert({
                    user_id: postData.user_id,
                    actor_id: currentUser.id,
                    type: 'like_post',
                    resource_id: postData.id,
                    is_read: false
                });
            }
        }
    }, [isLiked, currentUser, postData?.id, postData?.user_id]); 

    const toggleComments = useCallback(async () => {
        if (!showComments && comments.length === 0) await fetchCommentsData();
        setShowComments(prev => !prev);
    }, [showComments, comments.length, fetchCommentsData]);

    const handleSendComment = useCallback(async () => {
        if (!currentUser || !postData?.id) return alert("Please log in.");
        if (!newComment.trim()) return;
        setIsSendingComment(true); 
        const { data, error } = await supabase.from("post_comments").insert({ post_id: postData.id, user_id: currentUser.id, content: newComment, parent_id: null }).select("*, profiles(*)").single();
        if (!error && data) {
            const userMeta = currentUser.user_metadata || currentUser.raw_user_meta_data || {};
            const optimistic = { 
                ...data, 
                email: currentUser.email, 
                raw_user_meta_data: userMeta, 
                profiles: data.profiles || { 
                    full_name: userMeta.full_name, 
                    avatar_url: userMeta.avatar_url || userMeta.picture 
                },
                avatar_url: userMeta.avatar_url || userMeta.picture,
                full_name: userMeta.full_name
            };
            setComments(prev => [...prev, optimistic]); setNewComment(""); setCommentCount(p => p + 1);
            
            // --- NEW: SEND NOTIFICATION ---
            if (currentUser.id !== postData.user_id) {
                await supabase.from('notifications').insert({
                    user_id: postData.user_id,
                    actor_id: currentUser.id,
                    type: 'comment',
                    content: newComment.substring(0, 50) + (newComment.length > 50 ? '...' : ''),
                    resource_id: postData.id,
                    comment_id: data.id,
                    is_read: false
                });
            }
        } else { alert("Error sending comment: " + error?.message); }
        setIsSendingComment(false); 
    }, [currentUser, newComment, postData?.id, postData?.user_id]); 

    const handleReplySuccess = useCallback((newReply) => { setComments(prev => [...prev, newReply]); setCommentCount(p => p + 1); }, []);
    const requestDeleteComment = useCallback((id) => { setCommentToDelete(id); setDeleteCommentModalOpen(true); }, []);
    const requestDeletePost = useCallback(() => setDeletePostModalOpen(true), []);
    const executeDeleteComment = useCallback(async () => {
        if (!commentToDelete) return;
        setIsDeletingComment(true);
        const { error } = await supabase.from("post_comments").delete().eq("id", commentToDelete);
        if (!error) { setComments(prev => prev.filter(c => c.id !== commentToDelete && c.parent_id !== commentToDelete)); setCommentCount(p => Math.max(0, p - 1)); setDeleteCommentModalOpen(false); }
        setIsDeletingComment(false);
    }, [commentToDelete]);

    // --- EARLY RETURN ---
    if (!initialPost) return null;

    // --- HELPERS AND RENDER LOGIC ---
    const getProfile = () => {
        return Array.isArray(postData.profiles) ? postData.profiles[0] : postData.profiles;
    };

    const getAvatarUrl = () => {
        const profile = getProfile();
        const metadata = postData.raw_user_meta_data || {};
        return postData.avatar_url || profile?.avatar_url || metadata.avatar_url || metadata.picture;
    };

    const getAuthorName = () => {
        const profile = getProfile();
        const metadata = postData.raw_user_meta_data || {};
        return postData.full_name || profile?.full_name || metadata.full_name || 'Anonymous';
    };

    const executeDeletePost = async () => {
        setIsDeletingPost(true);
        const { error } = await supabase.from("community_posts").delete().eq("id", postData.id); 
        if (!error) { setDeletePostModalOpen(false); if (onPostDeleted) onPostDeleted(postData.id); } else { alert("Error deleting post: " + error.message); }
        setIsDeletingPost(false);
    };
    const executeEditPost = async () => {
        if (!editForm.title.trim() || !editForm.content.trim()) return;
        setIsUpdatingPost(true);
        const { data, error } = await supabase.from("community_posts").update({ title: editForm.title, content: editForm.content }).eq("id", postData.id).select("*, profiles(*)"); 
        setIsUpdatingPost(false);
        if (!error && data && data.length > 0) {
            const updatedPostData = data[0]; 
            setPostData(prev => ({ ...prev, title: updatedPostData.title, content: updatedPostData.content, updated_at: updatedPostData.updated_at || prev.updated_at, profiles: updatedPostData.profiles || prev.profiles }));
            if (onPostUpdated) onPostUpdated(updatedPostData); setIsEditing(false);
        } else { alert("Error updating post."); }
    };

    const handleCopyLink = () => {
        const postUrl = `${window.location.origin}/post/${postData.id}`;
        navigator.clipboard.writeText(postUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const rootComments = comments.filter(c => !c.parent_id);

    return (
        <div className="bg-[#0B0D14] border border-white/10 p-6 md:p-8 rounded-3xl shadow-lg hover:border-cyan-500/20 hover:shadow-[0_0_30px_-10px_rgba(6,182,212,0.1)] transition-all duration-300 relative group overflow-hidden">
            {/* Header Post */}
            <div className="flex items-start gap-4 z-10 relative">
                <div className="flex-shrink-0 mt-1">
                    {/* --- FIX QUAN TRỌNG: TRUYỀN PROPS CHÍNH XÁC --- */}
                    <UserAvatar 
            user={{ 
                id: postData.user_id, 
                // Sử dụng hàm getAvatarUrl() bạn đã viết sẵn ở trên để xử lý logic lấy ảnh
                avatar_url: getAvatarUrl(),
                // Fallback metadata nếu cần
                raw_user_meta_data: postData.raw_user_meta_data,
                full_name: getAuthorName()
            }} 
            size="lg" 
        />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-1 leading-snug ">
                                {postData.title}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                <span className="text-cyan-300 font-medium hover:underline cursor-pointer">{getAuthorName()}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                <span className="font-mono">{formatTime(postData.created_at)}</span>
                                {postData.updated_at && postData.updated_at !== postData.created_at && (<span className="italic opacity-60 ml-1">(edited)</span>)}
                            </div>
                        </div>
                        {currentUser && currentUser.id === postData.user_id && (<div className="relative ml-2"><button onClick={() => setShowPostMenu(!showPostMenu)} className="text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"><MoreHorizontal size={20} /></button>{showPostMenu && (<><div className="fixed inset-0 z-10" onClick={() => setShowPostMenu(false)}></div><div className="absolute right-0 top-10 z-20 w-40 bg-[#1A1D26] border border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in duration-100"><button onClick={() => { setEditForm({ title: postData.title, content: postData.content }); setIsEditing(true); setShowPostMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-cyan-400 hover:bg-white/5 text-left font-medium"><EditIcon size={14} /> Edit Post</button><button onClick={() => setDeletePostModalOpen(true)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 text-left font-medium"><Trash2 size={14} /> Delete Post</button></div></>)}</div>)}
                    </div>
                    <p className="text-gray-300 mt-4 whitespace-pre-line leading-relaxed break-words font-light text-base md:text-lg">
                        {renderContentWithHashtags(postData.content, onTagClick)}
                    </p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between mt-6 pl-[4rem] md:pl-[5.5rem] relative z-10">
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-2">
                        <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all font-bold text-sm border ${isLiked ? "text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "text-gray-400 border-white/5 hover:bg-white/5 hover:text-white hover:border-white/10"}`}>
                            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                            <span className="tabular-nums">{likes}</span>
                        </button>
                        
                        <button onClick={toggleComments} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all font-bold text-sm border ${showComments ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "text-gray-400 border-white/5 hover:bg-white/5 hover:text-white hover:border-white/10"}`}>
                            <MessageCircle size={20} />
                            <span className="tabular-nums">{commentCount}</span>
                        </button>
                    </div>

                    {/* Share Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                            className={`flex items-center gap-2 p-2.5 rounded-2xl transition-all border ${showShareMenu ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "text-gray-400 border-white/5 hover:bg-white/5 hover:text-white hover:border-white/10"}`}
                        >
                            <Share2 size={20} className={showShareMenu ? "scale-110" : ""} />
                        </button>

                        {showShareMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)}></div>
                                <div className="absolute left-0 bottom-full mb-3 w-56 bg-[#0B0D14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                    <div className="p-2 space-y-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleCopyLink(); setShowShareMenu(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                                        >
                                            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">
                                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <span className="block font-bold leading-none">{copied ? "Copied!" : "Copy Link"}</span>
                                                <span className="text-[10px] text-gray-500 mt-1 block">Share via direct URL</span>
                                            </div>
                                        </button>
                                        
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); window.open(`${window.location.origin}/post/${postData.id}`, '_blank'); setShowShareMenu(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                                        >
                                            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                                                <ExternalLink size={16} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <span className="block font-bold leading-none">Open in New Tab</span>
                                                <span className="text-[10px] text-gray-500 mt-1 block">View full page</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal & Overlays */}
            <CommentModal 
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                postData={postData}
                currentUser={currentUser}
                comments={comments}
                rootComments={rootComments}
                loadingComments={loadingComments}
                newComment={newComment}
                setNewComment={setNewComment}
                onSendComment={handleSendComment}
                isSendingComment={isSendingComment}
                onDeleteComment={requestDeleteComment}
                onReplySuccess={handleReplySuccess}
                highlightId={highlightCommentId}
                onTagClick={onTagClick}
                getAuthorName={getAuthorName}
                renderContentWithHashtags={renderContentWithHashtags}
                isAuthor={isAuthor}
                onEditPost={() => setIsEditing(true)}
                onDeletePost={requestDeletePost}
            />
            <DeleteConfirmModal isOpen={deleteCommentModalOpen} onClose={() => setDeleteCommentModalOpen(false)} onConfirm={executeDeleteComment} isDeleting={isDeletingComment} title="Delete Comment?" message="Are you sure?" />
            <DeleteConfirmModal isOpen={deletePostModalOpen} onClose={() => setDeletePostModalOpen(false)} onConfirm={executeDeletePost} isDeleting={isDeletingPost} title="Delete Post?" message="Are you sure?" />
            <PostFormModal show={isEditing} onClose={() => setIsEditing(false)} onSubmit={executeEditPost} form={editForm} setForm={setEditForm} loading={isUpdatingPost} currentUser={currentUser} isEdit={true} />
        </div>
    );
};

export default memo(PostItem, (prev, next) => {
    return (
        prev.post?.id === next.post?.id &&
        prev.post?.like_count === next.post?.like_count &&
        prev.post?.comment_count === next.post?.comment_count &&
        prev.currentUser?.id === next.currentUser?.id &&
        prev.post?.title === next.post?.title && 
        prev.post?.content === next.post?.content 
    );
});