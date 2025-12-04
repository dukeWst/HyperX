import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {Search,} from "lucide-react";
import { Link } from "react-router-dom";
import PostFormModal from "./PostFormModal";
import PostItem from "./PostItem";

export default function Community({ user }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: "", content: "" });
    const [currentUser, setCurrentUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
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

const loadPosts = useCallback(async () => {
    const { data, error } = await supabase
        .from("posts_view")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) console.error("Lỗi tải bài viết:", error);
    else setPosts(data || []);
}, []);


useEffect(() => {
    const fetch = async () => {
        setLoading(true);     // Chỉ đặt loading trong effect
        await loadPosts();    // Chỉ fetch, KHÔNG setLoading ở trong runtime của useCallback
        setLoading(false);
    };
    fetch();
}, []);


    const submitPost = async () => {
        if (!currentUser || !currentUser.id) return alert("Lỗi: Không tìm thấy thông tin người dùng!");
        setLoading(true);
        const { error } = await supabase.from("community_posts").insert({ title: form.title, content: form.content, user_id: currentUser.id });
        if (error) alert("Lỗi khi đăng bài: " + error.message);
        else {
            setShowModal(false);
            setForm({ title: "", content: "" });
            setTimeout(() => loadPosts(), 500);
        }
        setLoading(false);
    };

    // Callback function để cập nhật danh sách post khi có bài bị xóa
    const handlePostDeleted = (deletedPostId) => {
        setPosts(posts.filter(post => post.id !== deletedPostId));
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative isolate bg-gray-900  pt-12 overflow-hidden ">
            <div className="h-screen flex flex-col  mb-24">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none">
                    <div style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }} className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[1155px] -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30" />
                </div>

                <div className="w-full max-w-5xl mx-auto flex flex-col h-full relative z-10">
                    <div className="pt-10 px-6 sm:px-12 pb-4 flex-shrink-0">
                        <div className="pb-4 border-b border-gray-700">
                            <h2 className="text-3xl font-bold text-white mb-4">Latest Posts</h2>
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <input type="text" placeholder="Search topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-1/2 bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-indigo-500 focus:border-indigo-500 transition placeholder-gray-400" />
                                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                </div>
                                {currentUser ? (
                                    <button onClick={() => setShowModal(true)} className="flex-shrink-0 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition whitespace-nowrap">Create Post</button>
                                ) : (
                                    <Link to="/signin" className="flex-shrink-0 px-6 py-2.5 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500 transition whitespace-nowrap">Log in to Post</Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 sm:px-12 pb-10 custom-scrollbar">
                        {loading && posts.length === 0 ? <p className="text-gray-400 text-center py-10">Loading posts...</p> : filteredPosts.length === 0 ? <p className="text-gray-400 text-center py-10">{searchQuery ? "No posts found matching your search." : "No posts yet."}</p> : (
                            <div className="space-y-6">
                                {filteredPosts.map((post) => (
                                    <PostItem key={post.id} post={post} currentUser={currentUser} onPostDeleted={handlePostDeleted} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <PostFormModal show={showModal} onClose={() => setShowModal(false)} onSubmit={submitPost} form={form} setForm={setForm} loading={loading} currentUser={currentUser} />
            </div>
        </div>
    );
}