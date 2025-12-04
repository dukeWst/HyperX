import React, { useEffect, useState, memo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import formatTime from "./formatTime";
import { Heart, MessageCircle, MoreVertical, Send, Trash2 } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { supabase } from "../../supabaseClient";
import PostFormModal from "./PostFormModal";

// --- SUB-COMPONENT: CommentItem ---
const CommentItem = memo(({ comment, allComments, currentUser, onDelete, onReplySuccess, depth = 0, highlightId }) => {
    const [likes, setLikes] = useState(0); 
    const [isLiked, setIsLiked] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // --- LOGIC HIGHLIGHT ---
    const commentRef = React.useRef(null);
    const [isHighlighted, setIsHighlighted] = useState(false);

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

    const indentLevel = depth > 2 ? 2 : depth;
    const paddingLeftValue = indentLevel * 36;
    const childComments = allComments.filter(c => c.parent_id === comment.id);

    // Load Likes
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

    // --- Logic Reply ---
    const handleToggleReply = () => {
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
                className={`flex gap-3 group relative mt-3 p-2 rounded-xl transition-all duration-1000 ease-in-out
                    ${isHighlighted ? 'bg-indigo-500/20 ring-1 ring-indigo-500' : ''} 
                `}
                style={{ marginLeft: `${paddingLeftValue}px` }}
            >
                {depth > 0 && <div className="absolute -left-4 top-0 w-4 h-4 border-l-2 border-b-2 border-gray-700 rounded-bl-lg"></div>}
                <div className="flex-shrink-0 pt-1 relative z-10">
                    <UserAvatar user={{ id: comment.user_id, raw_user_meta_data: comment.raw_user_meta_data, email: comment.email }} size="sm" />
                </div>
                <div className="flex-1">
                    <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-700 inline-block min-w-[200px] relative">
                        <div className="flex justify-between items-baseline mb-1 gap-4">
                            <span className="text-sm font-bold text-indigo-300">{comment.raw_user_meta_data?.full_name || "Anonymous"}</span>
                            {currentUser && currentUser.id === comment.user_id && (
                                <div className="relative">
                                    <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"><MoreVertical size={14} /></button>
                                    {showMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                            <div className="absolute right-0 top-6 z-20 w-24 bg-gray-800 border border-gray-600 rounded shadow-lg py-1">
                                                <button onClick={() => onDelete(comment.id)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-gray-700 text-left"><Trash2 size={12} /> Delete</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-200 leading-normal">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 ml-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500"><span>{formatTime(comment.created_at)}</span></div>
                        <button onClick={handleLikeComment} className={`text-xs font-semibold flex items-center gap-1 ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-white'}`}><Heart size={12} fill={isLiked ? "currentColor" : "none"} /> {likes > 0 && likes} Like</button>
                        <button onClick={handleToggleReply} className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1">Reply</button>
                    </div>
                    {showReplyInput && (
                        <div className="mt-2 flex gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-200">
                            <input type="text" autoFocus value={replyContent} onChange={(e) => setReplyContent(e.target.value)} className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-white" onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}/>
                            <button onClick={handleSendReply} className="p-1.5 bg-indigo-600 rounded-md text-white"><Send size={12} /></button>
                        </div>
                    )}
                </div>
            </div>
            {childComments.map(child => (
                 <CommentItem 
                    key={child.id} 
                    comment={child} 
                    allComments={allComments} 
                    currentUser={currentUser} 
                    onDelete={onDelete} 
                    onReplySuccess={onReplySuccess} 
                    depth={depth + 1} 
                    highlightId={highlightId}
                />
            ))}
        </div>
    );
});

// --- MAIN COMPONENT ---
// Đã thay thế prop 'post' bằng 'initialPost' và sử dụng state 'postData' để re-render nội bộ.
const PostItem = ({ post: initialPost, currentUser, onPostDeleted, onPostUpdated }) => {
    const [postData, setPostData] = useState(initialPost); // State chứa data bài viết

    // Cần đảm bảo các state liên quan đến post đều dùng postData
    const [likes, setLikes] = useState(initialPost.like_count || 0); 
    const [isLiked, setIsLiked] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentCount, setCommentCount] = useState(initialPost.comment_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);

    // Modal & Menu States
    const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [showPostMenu, setShowPostMenu] = useState(false);
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [isDeletingComment, setIsDeletingComment] = useState(false);

    const [isEditing, setIsEditing] = useState(false); 
    // Khởi tạo editForm với data từ postData
    const [editForm, setEditForm] = useState({ title: postData.title, content: postData.content }); 
    const [isUpdatingPost, setIsUpdatingPost] = useState(false); 

    // URL Params
    const [searchParams] = useSearchParams();
    const highlightCommentId = searchParams.get('commentId');

    // Effect kiểm tra trạng thái Like
    useEffect(() => {
        if (!currentUser) return;
        const checkLikeStatus = async () => {
            const { data } = await supabase.from("post_likes").select("user_id").eq("post_id", postData.id).eq("user_id", currentUser.id).maybeSingle();
            if (data) setIsLiked(true);
        };
        checkLikeStatus();
    }, [currentUser?.id, postData.id]);

    // HÀM FETCH RIÊNG BIỆT
    const fetchCommentsData = useCallback(async () => {
        setLoadingComments(true);
        const { data, error } = await supabase.from("comments_view").select("*").eq("post_id", postData.id).order("created_at", { ascending: true });
        if (!error) setComments(data || []);
        setLoadingComments(false);
        return data || [];
    }, [postData.id]);

    // LOGIC CHECK HIGHLIGHT & AUTO FETCH
    useEffect(() => {
        if (highlightCommentId) {
            setShowComments(true);
            const isCommentLoaded = comments.some(c => String(c.id) === String(highlightCommentId));
            if (!isCommentLoaded) {
                fetchCommentsData();
            }
        }
    }, [highlightCommentId, postData.id]); // Đã sửa: post.id -> postData.id

    const handleLike = useCallback(async () => {
        if (!currentUser) return alert("Please log in.");
        if (isLiked) {
            setLikes(p => p - 1); setIsLiked(false);
            await supabase.from("post_likes").delete().eq("post_id", postData.id).eq("user_id", currentUser.id); // Đã sửa
        } else {
            setLikes(p => p + 1); setIsLiked(true);
            await supabase.from("post_likes").insert({ post_id: postData.id, user_id: currentUser.id }); // Đã sửa
        }
    }, [isLiked, currentUser, postData.id]); // Đã sửa

    const toggleComments = useCallback(async () => {
        if (!showComments && comments.length === 0) {
            await fetchCommentsData();
        }
        setShowComments(prev => !prev);
    }, [showComments, comments.length, fetchCommentsData]);

    const handleSendComment = useCallback(async () => {
        if (!currentUser) return alert("Please log in.");
        if (!newComment.trim()) return;

        const { data, error } = await supabase.from("post_comments").insert({ 
            post_id: postData.id, user_id: currentUser.id, content: newComment, parent_id: null // Đã sửa
        }).select("*").single();

        if (!error && data) {
            const optimistic = { ...data, email: currentUser.email, raw_user_meta_data: currentUser.user_metadata || currentUser.raw_user_meta_data };
            setComments(prev => [...prev, optimistic]);
            setNewComment("");
            setCommentCount(p => p + 1);
        }
    }, [currentUser, newComment, postData.id]); // Đã sửa

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
        const { error } = await supabase.from("community_posts").delete().eq("id", postData.id); // Đã sửa
        if (!error) {
            setDeletePostModalOpen(false);
            if (onPostDeleted) onPostDeleted(postData.id); // Đã sửa
        } else {
            alert("Error deleting post: " + error.message);
        }
        setIsDeletingPost(false);
    };

    // HÀM CHỈNH SỬA BÀI VIẾT (Update)
    const executeEditPost = async () => {
        if (!editForm.title.trim() || !editForm.content.trim()) return;
        setIsUpdatingPost(true);

        const { data, error } = await supabase.from("community_posts")
            .update({ 
                title: editForm.title, 
                content: editForm.content,
            })
            .eq("id", postData.id) // Đã sửa
            .select("*"); 

        setIsUpdatingPost(false);

        // Kiểm tra data có tồn tại và có ít nhất 1 phần tử hay không
        if (!error && data && data.length > 0) {
            const updatedPostData = data[0]; 
            
            // CẬP NHẬT STATE postData để tự động re-render component này
            setPostData(prev => ({ 
                ...prev, 
                title: updatedPostData.title, 
                content: updatedPostData.content, 
                // updated_at được tự động cập nhật nếu có trigger trong DB
                updated_at: updatedPostData.updated_at || prev.updated_at,
            }));
            
            // Gọi prop onPostUpdated (nếu component cha có dùng)
            if (onPostUpdated) onPostUpdated(updatedPostData);

            setIsEditing(false);
        } else {
            console.error("Supabase Update Error:", error); 
            alert("Error updating post: " + (error?.message || "Post not found or update failed. Please check RLS policies."));
        }
    };
    
    const rootComments = comments.filter(c => !c.parent_id);

    return (
        <div className="bg-gray-800/60 border border-gray-700/50 p-6 rounded-xl shadow-md hover:shadow-indigo-500/10 transition duration-300">
            {/* Header Post (Sử dụng postData) */}
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1"><UserAvatar user={{ id: postData.user_id, raw_user_meta_data: postData.raw_user_meta_data, email: postData.email }} size="md" /></div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold text-indigo-400 mb-1">{postData.title}</h3>
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                                <span>{postData.raw_user_meta_data?.full_name || 'Anonymous'}</span>
                                <span>•</span>
                                <span>{formatTime(postData.created_at)}</span>
                                {postData.updated_at && postData.updated_at !== postData.created_at && (
                                    <span> • Edited {formatTime(postData.updated_at)}</span>
                                )}
                            </div>
                        </div>
                        {currentUser && currentUser.id === postData.user_id && (
                            <div className="relative ml-2">
                                <button onClick={() => setShowPostMenu(!showPostMenu)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700">
                                    <MoreVertical size={20} />
                                </button>
                                {showPostMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowPostMenu(false)}></div>
                                        <div className="absolute right-0 top-10 z-20 w-32 bg-gray-800 border border-gray-600 rounded shadow-lg py-1">
                                            {/* Nút Edit */}
                                            <button 
                                                onClick={() => {
                                                    setEditForm({ title: postData.title, content: postData.content }); // Load nội dung hiện tại
                                                    setIsEditing(true); 
                                                    setShowPostMenu(false); 
                                                }} 
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-indigo-400 hover:bg-gray-700 text-left">
                                                <span className="h-4 w-4">✏️</span> Edit Post
                                            </button>
                                            
                                            {/* Nút Delete */}
                                            <button 
                                                onClick={() => setDeletePostModalOpen(true)} 
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 text-left">
                                                <Trash2 size={14} /> Delete Post
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">{postData.content}</p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 mt-4 ml-14">
                <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${isLiked ? "text-pink-500 bg-pink-500/10" : "text-gray-400 hover:bg-gray-700"}`}><Heart size={20} fill={isLiked ? "currentColor" : "none"} /><span>{likes}</span></button>
                <button onClick={toggleComments} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${showComments ? "text-indigo-400 bg-indigo-500/10" : "text-gray-400 hover:bg-gray-700"}`}><MessageCircle size={20} /><span>{commentCount} Comments</span></button>
            </div>

            {/* Comment Section (Sử dụng postData cho comment) */}
            {showComments && (
                <div className="mt-4 bg-gray-900/40 rounded-lg p-4 ml-2 sm:ml-14 border border-gray-700/50">
                    {currentUser ? (
                        <div className="flex gap-3 items-start mb-4">
                            <UserAvatar user={{ ...currentUser, id: currentUser.id }} size="sm" />
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={newComment} 
                                    onChange={(e) => setNewComment(e.target.value)} 
                                    placeholder="Write a comment..." 
                                    className="w-full bg-gray-800 border border-gray-600 rounded-full pl-4 pr-12 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()} 
                                />
                                <button onClick={handleSendComment} disabled={!newComment.trim()} className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:opacity-50"><Send size={16} /></button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center mb-4"><Link to="/signin" className="text-indigo-400 hover:underline">Log in</Link> to join the discussion.</p>
                    )}

                    <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {loadingComments ? <p className="text-sm text-gray-500 italic">Loading conversation...</p> : rootComments.length === 0 ? <p className="text-sm text-gray-500 italic text-center py-4">No comments yet.</p> : (
                            rootComments.map((cmt) => (
                                <CommentItem 
                                    key={cmt.id} 
                                    comment={cmt} 
                                    allComments={comments} 
                                    currentUser={currentUser} 
                                    onDelete={requestDeleteComment} 
                                    onReplySuccess={handleReplySuccess} 
                                    depth={0} 
                                    highlightId={highlightCommentId} 
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            <DeleteConfirmModal isOpen={deleteCommentModalOpen} onClose={() => setDeleteCommentModalOpen(false)} onConfirm={executeDeleteComment} isDeleting={isDeletingComment} title="Delete Comment?" message="Are you sure?" />
            <DeleteConfirmModal isOpen={deletePostModalOpen} onClose={() => setDeletePostModalOpen(false)} onConfirm={executeDeletePost} isDeleting={isDeletingPost} title="Delete Post?" message="Are you sure?" />
            
            {/* PostFormModal cho Chỉnh sửa */}
            <PostFormModal
                show={isEditing}
                onClose={() => setIsEditing(false)}
                onSubmit={executeEditPost}
                form={editForm}
                setForm={setEditForm}
                loading={isUpdatingPost}
                currentUser={currentUser}
                isEdit={true} 
            />
        </div>
    );
};

// Cập nhật memo để lắng nghe thay đổi trên postData (nếu nó là prop thay đổi)
export default memo(PostItem, (prev, next) => {
    // Chỉ render lại nếu initialPost thay đổi (tức là component cha gửi data mới)
    return (
        prev.post.id === next.post.id &&
        prev.post.like_count === next.post.like_count &&
        prev.post.comment_count === next.post.comment_count &&
        prev.currentUser?.id === next.currentUser?.id
    );
});