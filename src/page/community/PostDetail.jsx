import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import PostItem from "./PostItem"; // Import component PostItem bạn đang có
import { ArrowLeft } from "lucide-react";

const PostDetail = () => {
    const { id } = useParams(); // Lấy ID bài viết từ URL
    const navigate = useNavigate();
    
    const [post, setPost] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPostDetail = async () => {
            setIsLoading(true);
            
            // 1. Lấy Current User
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // 2. Lấy chi tiết bài viết
            const { data, error } = await supabase
                .from('community_posts')
                .select('*, profiles(*)') // Join để lấy thông tin người đăng
                .eq('id', id)
                .single(); // Chỉ lấy 1 dòng

            if (error) {
                console.error("Error loading post:", error);
            } else {
                // Format lại data cho khớp với PostItem (nếu cần)
                const formattedPost = {
                    ...data,
                    raw_user_meta_data: {
                        full_name: data.profiles?.full_name,
                        avatar_url: data.profiles?.avatar_url
                    },
                    email: data.profiles?.email
                };
                setPost(formattedPost);
            }
            setIsLoading(false);
        };

        if (id) fetchPostDetail();
    }, [id]);

    const handlePostDeleted = () => {
        navigate('/community'); // Xóa xong thì quay về trang cộng đồng
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-gray-400 gap-4">
                <h2 className="text-xl font-semibold">Post not found</h2>
                <button onClick={() => navigate('/community')} className="text-indigo-400 hover:underline">
                    Back to Community
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] px-4 md:pt-24 ">
            <div className="max-w-2xl mx-auto">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>

                {/* Tái sử dụng PostItem */}
                <PostItem 
                    post={post} 
                    currentUser={currentUser} 
                    onPostDeleted={handlePostDeleted} 
                />
            </div>
        </div>
    );
};

export default PostDetail;