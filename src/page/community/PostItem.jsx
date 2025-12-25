import React, { useEffect, useState, memo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import UserAvatar from "../../components/UserAvatar";
import formatTime from "./formatTime";
import { Edit, EditIcon, Heart, MessageCircle, MoreVertical, Send, Trash2 } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { supabase } from "../../routes/supabaseClient";
import PostFormModal from "./PostFormModal";

// --- SUB-COMPONENT: CommentItem ---
const CommentItem = memo(({ comment, allComments, currentUser, onDelete, onReplySuccess, depth = 0, highlightId }) => {
    const [likes, setLikes] = useState(0); 
    const [isLiked, setIsLiked] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const commentRef = React.useRef(null);
    const [isHighlighted, setIsHighlighted] = useState(false);

    const indentLevel = depth > 2 ? 2 : depth;
    const paddingLeftValue = indentLevel * 24; // Giảm padding chút cho mobile
    const childComments = allComments.filter(c => c.parent_id === comment.id);

    useEffect(() => {
        if (highlightId && String(comment.id) === String(highlightId)) {
            setTimeout(() => {
                commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            setIsHighlighted(true);
            const timer = setTimeout(() => setIsHighlighted(false), 1000); 
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
        }
    };

    const handleToggleReply = () => {
        if (!currentUser) return alert("Please log in.");
        if (!showReplyInput) {
            const name = comment.raw_user_meta_data?.full_name || comment.email?.split('@')[0] || "User";
            setReplyContent(`@${name} `);
        }
        setShowReplyInput(!showReplyInput);
    };

    const handleSendReply = async () => {
        if (!replyContent.trim()) return;
        setIsSendingReply(true);
        const { data, error } = await supabase.from("post_comments").insert({ 
            post_id: comment.post_id, user_id: currentUser.id, content: replyContent, parent_id: comment.id 
        }).select("*").single();

        if (!error && data) {
            const newReply = { ...data, email: currentUser.email, raw_user_meta_data: currentUser.user_metadata || currentUser.raw_user_meta_data };
            onReplySuccess(newReply);
            setReplyContent("");
            setShowReplyInput(false);
        } else { alert("Error replying: " + error?.message); }
        setIsSendingReply(false);
    };

    return (
        <div className="flex flex-col" ref={commentRef}>
            <div 
                className={`flex gap-3 group relative p-3 rounded-xl transition-all duration-500 ease-in-out border border-transparent
                    ${isHighlighted ? 'bg-indigo-500/10 border-indigo-500/30' : 'hover:bg-white/5'} 
                `}
                style={{ marginLeft: `${paddingLeftValue}px` }}
            >
                {depth > 0 && <div className="absolute -left-3 top-0 w-3 h-4 border-l border-b border-gray-700 rounded-bl-lg"></div>}
                
                <div className="flex-shrink-0 pt-1 relative z-10">
                    <UserAvatar user={{ id: comment.user_id, raw_user_meta_data: comment.raw_user_meta_data, email: comment.email }} size="sm" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold text-indigo-300">{comment.raw_user_meta_data?.full_name || "Anonymous"}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">{formatTime(comment.created_at)}</span>
                            {currentUser && currentUser.id === comment.user_id && (
                                <div className="relative">
                                    <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500 hover:text-white p-1 rounded transition"><MoreVertical size={14} /></button>
                                    {showMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                            <div className="absolute right-0 top-6 z-20 w-24 bg-[#1e293b] border border-gray-700 rounded-lg shadow-xl py-1">
                                                <button onClick={() => onDelete(comment.id)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-white/5 text-left"><Trash2 size={12} /> Delete</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 leading-relaxed break-words">{comment.content}</p>
                    
                    <div className="flex items-center gap-4 mt-2">
                        <button onClick={handleLikeComment} className={`text-xs font-semibold flex items-center gap-1 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'}`}><Heart size={12} fill={isLiked ? "currentColor" : "none"} /> {likes > 0 && likes}</button>
                        <button onClick={handleToggleReply} className="text-xs font-semibold text-gray-500 hover:text-indigo-400 flex items-center gap-1 transition-colors">Reply</button>
                    </div>
                    
                    {showReplyInput && currentUser && (
                        <div className="mt-3 flex gap-2 items-center animate-in fade-in slide-in-from-top-1">
                            <input 
                                type="text" 
                                autoFocus 
                                value={replyContent} 
                                onChange={(e) => setReplyContent(e.target.value)} 
                                placeholder={`Reply...`}
                                className="flex-1 bg-[#05050A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors" 
                                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                disabled={isSendingReply}
                            />
                            <button onClick={handleSendReply} disabled={!replyContent.trim() || isSendingReply} className="p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50">
                                <Send size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {childComments.map(child => (
                 <CommentItem key={child.id} comment={child} allComments={allComments} currentUser={currentUser} onDelete={onDelete} onReplySuccess={onReplySuccess} depth={depth + 1} highlightId={highlightId} />
            ))}
        </div>
    );
});

// --- MAIN COMPONENT ---
const PostItem = ({ post: initialPost, currentUser, onPostDeleted, onPostUpdated }) => {
    const [postData, setPostData] = useState(initialPost); 
    const [likes, setLikes] = useState(initialPost.like_count || 0); 
    const [isLiked, setIsLiked] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentCount, setCommentCount] = useState(initialPost.comment_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [isSendingComment, setIsSendingComment] = useState(false);

    // Modal & Menu States
    const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [showPostMenu, setShowPostMenu] = useState(false);
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [isDeletingComment, setIsDeletingComment] = useState(false);

    const [isEditing, setIsEditing] = useState(false); 
    const [editForm, setEditForm] = useState({ title: postData.title, content: postData.content }); 
    const [isUpdatingPost, setIsUpdatingPost] = useState(false); 

    const [searchParams] = useSearchParams();
    const highlightCommentId = searchParams.get('commentId');

    useEffect(() => {
        if (!currentUser) return;
        const checkLikeStatus = async () => {
            const { data } = await supabase.from("post_likes").select("user_id").eq("post_id", postData.id).eq("user_id", currentUser.id).maybeSingle();
            if (data) setIsLiked(true);
        };
        checkLikeStatus();
    }, [currentUser?.id, postData.id]);

    const fetchCommentsData = useCallback(async () => {
        setLoadingComments(true);
        const { data, error } = await supabase.from("comments_view").select("*").eq("post_id", postData.id).order("created_at", { ascending: true });
        if (!error) setComments(data || []);
        setLoadingComments(false);
        return data || [];
    }, [postData.id]);

    useEffect(() => {
        if (highlightCommentId) {
            setShowComments(true);
            const isCommentLoaded = comments.some(c => String(c.id) === String(highlightCommentId));
            if (!isCommentLoaded) {
                fetchCommentsData();
            }
        }
    }, [highlightCommentId, postData.id, comments, fetchCommentsData]);

    const handleLike = useCallback(async () => {
        if (!currentUser) return alert("Please log in.");
        if (isLiked) {
            setLikes(p => p - 1); setIsLiked(false);
            await supabase.from("post_likes").delete().eq("post_id", postData.id).eq("user_id", currentUser.id); 
        } else {
            setLikes(p => p + 1); setIsLiked(true);
            await supabase.from("post_likes").insert({ post_id: postData.id, user_id: currentUser.id }); 
        }
    }, [isLiked, currentUser, postData.id]); 

    const toggleComments = useCallback(async () => {
        if (!showComments && comments.length === 0) {
            await fetchCommentsData();
        }
        setShowComments(prev => !prev);
    }, [showComments, comments.length, fetchCommentsData]);

    const handleSendComment = useCallback(async () => {
        if (!currentUser) return alert("Please log in.");
        if (!newComment.trim()) return;
        
        setIsSendingComment(true); 

        const { data, error } = await supabase.from("post_comments").insert({ 
            post_id: postData.id, user_id: currentUser.id, content: newComment, parent_id: null 
        }).select("*").single();

        if (!error && data) {
            const optimistic = { ...data, email: currentUser.email, raw_user_meta_data: currentUser.user_metadata || currentUser.raw_user_meta_data };
            setComments(prev => [...prev, optimistic]);
            setNewComment("");
            setCommentCount(p => p + 1);
        } else {
             alert("Error sending comment: " + error?.message);
        }
        
        setIsSendingComment(false); 
    }, [currentUser, newComment, postData.id]); 

    const handleReplySuccess = useCallback((newReply) => {
        setComments(prev => [...prev, newReply]);
        setCommentCount(p => p + 1);
    }, []);

    const requestDeleteComment = useCallback((id) => {
        setCommentToDelete(id);
        setDeleteCommentModalOpen(true);
    }, []);

    const executeDeleteComment = useCallback(async () => {
        if (!commentToDelete) return;
        setIsDeletingComment(true);
        const { error } = await supabase.from("post_comments").delete().eq("id", commentToDelete);
        if (!error) {
            setComments(prev => prev.filter(c => c.id !== commentToDelete && c.parent_id !== commentToDelete));
            setCommentCount(p => Math.max(0, p - 1));
            setDeleteCommentModalOpen(false);
        }
        setIsDeletingComment(false);
    }, [commentToDelete]);

    const executeDeletePost = async () => {
        setIsDeletingPost(true);
        const { error } = await supabase.from("community_posts").delete().eq("id", postData.id); 
        if (!error) {
            setDeletePostModalOpen(false);
            if (onPostDeleted) onPostDeleted(postData.id); 
        } else {
            alert("Error deleting post: " + error.message);
        }
        setIsDeletingPost(false);
    };

    const executeEditPost = async () => {
        if (!editForm.title.trim() || !editForm.content.trim()) return;
        setIsUpdatingPost(true);

        const { data, error } = await supabase.from("community_posts")
            .update({ title: editForm.title, content: editForm.content })
            .eq("id", postData.id) 
            .select("*"); 

        setIsUpdatingPost(false);

        if (!error && data && data.length > 0) {
            const updatedPostData = data[0]; 
            setPostData(prev => ({ 
                ...prev, 
                title: updatedPostData.title, 
                content: updatedPostData.content, 
                updated_at: updatedPostData.updated_at || prev.updated_at,
            }));
            if (onPostUpdated) onPostUpdated(updatedPostData);
            setIsEditing(false);
        } else {
            alert("Error updating post.");
        }
    };
    
    const rootComments = comments.filter(c => !c.parent_id);

    return (
        // CARD STYLE MỚI: Glassmorphism trên nền đen
        <div className="bg-[#0B0D14] border border-white/10 p-6 rounded-2xl shadow-lg hover:border-indigo-500/30 transition-all duration-300">
            {/* Header Post */}
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1"><UserAvatar user={{ id: postData.user_id, raw_user_meta_data: postData.raw_user_meta_data, email: postData.email }} size="md" /></div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white mb-1 leading-tight hover:text-indigo-400 transition-colors break-words">
                                <Link to={`/community/post/${postData.id}`}>{postData.title}</Link>
                            </h3>
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                <span className="text-indigo-300 font-medium">{postData.raw_user_meta_data?.full_name || 'Anonymous'}</span>
                                <span>•</span>
                                <span>{formatTime(postData.created_at)}</span>
                                {postData.updated_at && postData.updated_at !== postData.created_at && (
                                    <span> • Edited</span>
                                )}
                            </div>
                        </div>
                        {currentUser && currentUser.id === postData.user_id && (
                            <div className="relative ml-2">
                                <button onClick={() => setShowPostMenu(!showPostMenu)} className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-white/10 transition">
                                    <MoreVertical size={20} />
                                </button>
                                {showPostMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowPostMenu(false)}></div>
                                        <div className="absolute right-0 top-10 z-20 w-32 bg-[#1e293b] border border-gray-700 rounded-lg shadow-2xl py-1">
                                            <button 
                                                onClick={() => {
                                                    setEditForm({ title: postData.title, content: postData.content });
                                                    setIsEditing(true); 
                                                    setShowPostMenu(false); 
                                                }} 
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-indigo-400 hover:bg-white/5 text-left">
                                                <span className="h-4 w-4"><EditIcon size={14} /></span> Edit Post
                                            </button>
                                            <button 
                                                onClick={() => setDeletePostModalOpen(true)} 
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-white/5 text-left">
                                                <Trash2 size={14} /> Delete Post
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-gray-300 mt-3 whitespace-pre-line leading-relaxed break-words">{postData.content}</p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-4 mt-5 pl-[3.5rem]">
                <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${isLiked ? "text-red-500 bg-red-500/10" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}><Heart size={18} fill={isLiked ? "currentColor" : "none"} /><span>{likes}</span></button>
                <button onClick={toggleComments} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${showComments ? "text-indigo-400 bg-indigo-500/10" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}><MessageCircle size={18} /><span>{commentCount}</span></button>
            </div>

            {/* Comment Section */}
            {showComments && (
                <div className="mt-5 bg-[#05050A] rounded-xl p-4 ml-0 sm:ml-[3.5rem] border border-white/5">
                    {currentUser ? (
                        <div className="flex gap-3 items-start mb-5">
                            <UserAvatar user={{ ...currentUser, id: currentUser.id }} size="sm" />
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={newComment} 
                                    onChange={(e) => setNewComment(e.target.value)} 
                                    placeholder="Write a comment..." 
                                    className="w-full bg-[#0B0D14] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-[#0B0D14] transition-all" 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()} 
                                    disabled={isSendingComment}
                                />
                                <button 
                                    onClick={handleSendComment} 
                                    disabled={!newComment.trim() || isSendingComment} 
                                    className="absolute right-2 top-2 p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center mb-4"><Link to="/signin" className="text-indigo-400 hover:underline">Log in</Link> to join the discussion.</p>
                    )}

                    <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {loadingComments ? <p className="text-sm text-gray-500 italic text-center py-4">Loading comments...</p> : rootComments.length === 0 ? <p className="text-sm text-gray-500 italic text-center py-4">No comments yet. Be the first!</p> : (
                            rootComments.map((cmt) => (
                                <CommentItem key={cmt.id} comment={cmt} allComments={comments} currentUser={currentUser} onDelete={requestDeleteComment} onReplySuccess={handleReplySuccess} depth={0} highlightId={highlightCommentId} />
                            ))
                        )}
                    </div>
                </div>
            )}

            <DeleteConfirmModal isOpen={deleteCommentModalOpen} onClose={() => setDeleteCommentModalOpen(false)} onConfirm={executeDeleteComment} isDeleting={isDeletingComment} title="Delete Comment?" message="Are you sure?" />
            <DeleteConfirmModal isOpen={deletePostModalOpen} onClose={() => setDeletePostModalOpen(false)} onConfirm={executeDeletePost} isDeleting={isDeletingPost} title="Delete Post?" message="Are you sure?" />
            <PostFormModal show={isEditing} onClose={() => setIsEditing(false)} onSubmit={executeEditPost} form={editForm} setForm={setEditForm} loading={isUpdatingPost} currentUser={currentUser} isEdit={true} />
        </div>
    );
};

export default memo(PostItem, (prev, next) => {
    return (
        prev.post.id === next.post.id &&
        prev.post.like_count === next.post.like_count &&
        prev.post.comment_count === next.post.comment_count &&
        prev.currentUser?.id === next.currentUser?.id &&
        prev.post.title === next.post.title && 
        prev.post.content === next.post.content 
    );
});