import { X } from "lucide-react";
import { Link } from "react-router-dom";

const PostFormModal = ({ show, onClose, onSubmit, form, setForm, loading, currentUser, isEdit = false }) => {
    if (!show) return null;
    
    // 👇 Thêm biến Title và Button Text
    const modalTitle = isEdit ? "Edit Post" : "Create New Post";
    const buttonText = isEdit ? (loading ? "Updating..." : "Update Post") : (loading ? "Posting..." : "Submit Post");
    return (
        // 👇 SỬA Ở ĐÂY: Thay 'bg-black bg-opacity-70' thành 'bg-black/30' (hoặc thấp hơn)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">

            {/* Phần nội dung Modal (Giữ nguyên hiệu ứng kính mờ đã làm lúc nãy) */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-indigo-500/50 w-full max-w-lg mx-auto rounded-xl shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition"><X size={24} /></button>
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">Create New Post</h2>
                {!currentUser ? (
                    <p className="text-gray-300 text-center py-6">Please <Link to="/signin" className="text-indigo-400 font-medium">Log in</Link> to create a new post.</p>
                ) : (
                    <>
                        <input
                            type="text"
                            placeholder="Post Title..."
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full mb-3 p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        />
                        <textarea
                            placeholder="Post Content..."
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            rows={6}
                            className="w-full mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition"
                        ></textarea>
                        <div className="flex justify-end gap-3">
                            <button onClick={onClose} className="px-6 py-2 bg-gray-700/50 hover:bg-gray-600 text-white font-semibold rounded-lg transition">Cancel</button>
                           <button onClick={onSubmit} disabled={loading || !form.title.trim() || !form.content.trim()} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition disabled:bg-gray-600/50">{buttonText}</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PostFormModal;