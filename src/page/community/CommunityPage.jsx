import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {Search} from "lucide-react";
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
    const [showSearchInput, setShowSearchInput] = useState(false);

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
            setLoading(true); 
            await loadPosts(); 
            setLoading(false);
        };
        fetch();
    }, [loadPosts]);


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

    const handlePostDeleted = (deletedPostId) => {
        setPosts(posts.filter(post => post.id !== deletedPostId));
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative isolate pt-16 px-6 md:px-48 bg-gray-900 overflow-hidden min-h-screen">
            {/* Background Blur Effect - Giữ nguyên */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none">
                <div style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }} className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[1155px] -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[2300px]" />
            </div>

            {/* Khung chính Community (Tương tự Setting) */}
            <div className="h-[750px] flex mb-0 justify-center w-full"> 
                
                {/* Layout chính: Có viền, bo góc, background mờ */}
                <div className="relative w-full max-w-7xl bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 flex overflow-hidden">
                    
                    {/* Main Content (Vùng Posts) - Đặt flex-col để chia dọc header và list */}
                    <main className="flex-1 p-4 sm:p-6 text-white flex flex-col"> 
                        
                        {/* PHẦN 1: HEADER (CỐ ĐỊNH) - Tối giản */}
                        <div className="pb-2 flex-shrink-0">
                            <div className="pb-3 border-b border-gray-700">
                                
                                {/* Dòng chứa Tiêu đề/Icon Tìm kiếm/Nút Create Post */}
                                <div className="flex justify-between items-center mb-3">

                                    {/* Tiêu đề/Input Tìm kiếm */}
                                    <div className="flex-1 flex items-center min-w-0"> 
                                        {/* Tiêu đề Community Feed */}
                                        <h2 className={`text-2xl font-bold text-white mr-4 ${showSearchInput ? 'hidden sm:block' : 'block'}`}>Community Feed</h2>

                                        {/* Icon Kính lúp (Để hiển thị Input) */}
                                        {!showSearchInput && (
                                            <button 
                                                onClick={() => setShowSearchInput(true)} 
                                                className="p-2 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white transition block sm:hidden" // Chỉ hiển thị trên mobile
                                                title="Search posts"
                                            >
                                                <Search size={20} />
                                            </button>
                                        )}
                                        
                                        {/* Ô Input Tìm kiếm (Hiển thị khi click icon hoặc trên desktop) */}
                                        
                                    </div>
                                    
                                    {/* Nút Create Post / Login */}
                                    {(showSearchInput || window.innerWidth >= 640) && ( // Giả định 640px là sm breakpoint
                                            <div className={`relative ${showSearchInput ? 'w-full max-w-md' : 'hidden sm:block w-full max-w-xs mr-4'}`}>
                                                <input 
                                                    type="text" 
                                                    placeholder="Search topics..." 
                                                    value={searchQuery} 
                                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500 transition placeholder-gray-400 text-sm" 
                                                    autoFocus
                                                />
                                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} /> 
                                            </div>
                                        )}
                                    <div className="flex-shrink-0 relative">
                                        {currentUser ? (
                                            <button 
                                                onClick={() => setShowModal(true)} 
                                                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition whitespace-nowrap text-sm"
                                            >
                                                Create Post
                                            </button>
                                        ) : (
                                            <Link to="/signin" className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500 transition whitespace-nowrap text-sm">
                                                Log in to Post
                                            </Link>
                                        )}

                                        {/* GIẢ ĐỊNH: POPUP THAY THẾ MODAL - CHỈ LÀ HƯỚNG DẪN */}
                                        {/* Để modal không che phủ, bạn cần phải thay thế PostFormModal bằng một Popover component sử dụng position: absolute; */}
                                        
                                        {/* {showModal && (
                                            <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 p-4">
                                                // Đây là nơi PostFormModal sẽ được đặt nếu nó là một Popover
                                                <p className="text-sm text-yellow-300">Thay thế PostFormModal bằng component Popover/Dropdown tại đây!</p>
                                            </div>
                                        )} */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PHẦN 2: DANH SÁCH BÀI VIẾT (SCROLL) */}
                        <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar">
                            {loading && posts.length === 0 ? <p className="text-gray-400 text-center py-10">Loading posts...</p> : filteredPosts.length === 0 ? <p className="text-gray-400 text-center py-10">{searchQuery ? "No posts found matching your search." : "No posts yet."}</p> : (
                                <div className="space-y-4"> 
                                    {filteredPosts.map((post) => (
                                        <PostItem key={post.id} post={post} currentUser={currentUser} onPostDeleted={handlePostDeleted} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            {/* Giữ nguyên Modal cũ, nó sẽ vẫn là Overlay Full Screen */}
            <PostFormModal show={showModal} onClose={() => setShowModal(false)} onSubmit={submitPost} form={form} setForm={setForm} loading={loading} currentUser={currentUser} />
        </div>
    );
}