import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../routes/supabaseClient";
import PostItem from "./PostItem"; 
import { ArrowLeft } from "lucide-react";

const PostDetail = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    const [post, setPost] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPostDetail = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const { data, error } = await supabase
                .from('community_posts')
                .select('*, profiles(*)') 
                .eq('id', id)
                .single(); 

            if (!error && data) {
                const profile = Array.isArray(data.profiles) ? data.profiles[0] : (data.profiles || {});
                const metadata = data.raw_user_meta_data || {};
                const fullName = data.full_name || profile?.full_name || profile?.name || metadata.full_name || metadata.name || "Anonymous";
                const avatarUrl = data.avatar_url || profile?.avatar_url || profile?.picture || profile?.avatar || metadata.avatar_url || metadata.picture || metadata.avatar;

                const formattedPost = {
                    ...data,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    profiles: profile, // Giữ profile đầy đủ
                    raw_user_meta_data: {
                        ...metadata,
                        ...profile, // Trộn profile vào metadata
                        full_name: fullName,
                        avatar_url: avatarUrl
                    },
                    email: data.email || profile?.email || metadata.email
                };
                setPost(formattedPost);
            } else if (error) {
                console.error("Error loading post:", error);
            }
            setIsLoading(false);
        };

        if (id) fetchPostDetail();
    }, [id]);

    const handlePostDeleted = () => {
        navigate('/community'); 
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
                {/* UPDATED: Cyan Spinner */}
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center text-gray-400 gap-4">
                <h2 className="text-xl font-semibold">Post not found</h2>
                <button onClick={() => navigate('/community')} className="text-cyan-400 hover:underline">
                    Back to Community
                </button>
            </div>
        );
    }

    return (
        // BACKGROUND MATCHING NEW THEME
        <div className="min-h-screen bg-[#05050A] text-gray-300 pt-24 px-4 pb-10 relative isolate overflow-hidden">
             
             {/* Background Effects (Cyan/Blue) */}
             <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
             <div className="fixed top-20 left-1/2 -translate-x-1/2 -z-10 w-[50rem] h-[50rem] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>
             <div className="fixed bottom-0 right-0 -z-10 w-[40rem] h-[40rem] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-3xl mx-auto relative z-10">

                <PostItem 
                    post={post} 
                    currentUser={currentUser} 
                    onPostDeleted={handlePostDeleted} 
                    onTagClick={(tag) => navigate(`/community?search=${encodeURIComponent(tag)}`)}
                />
            </div>
        </div>
    );
};

export default PostDetail;