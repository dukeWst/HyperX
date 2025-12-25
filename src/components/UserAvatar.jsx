import React from 'react';
import { Link } from 'react-router-dom';

const UserAvatar = ({ user, size = "md" }) => {
    if (!user) return null; 

    const metadata = user?.raw_user_meta_data || user?.user_metadata || {};
    const avatarUrl = user.avatar_url || metadata.avatar_url;
    const fullName = user.full_name || metadata.full_name || user.email || "?";
    
    // Lấy ID để tạo link (Ưu tiên id ở ngoài, dự phòng user_id)
    const userId = user.id || user.user_id; 

    const dims = size === "sm" ? "w-8 h-8" : size === "xl" ? "w-32 h-32" : "w-10 h-10"; // Thêm size xl cho trang Profile

    const AvatarImg = (
        <>
            {avatarUrl ? (
                <img 
                    src={avatarUrl} 
                    alt={fullName} 
                    className={`${dims} rounded-full object-cover border border-gray-600 hover:opacity-80 transition-opacity`} 
                />
            ) : (
                <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff`}
                    alt={fullName}
                    className={`${dims} rounded-full object-cover border border-gray-600 hover:opacity-80 transition-opacity`}
                />
            )}
        </>
    );

    // Nếu có userId, bọc trong Link để chuyển trang
    if (userId) {
        return (
            <Link 
                to={`/profile/${userId}`} 
                onClick={(e) => e.stopPropagation()} // Ngăn chặn sự kiện click lan ra ngoài (ví dụ click vào post)
                className="inline-block" // Giữ layout không bị vỡ
            >
                {AvatarImg}
            </Link>
        );
    }

    return AvatarImg;
};

export default UserAvatar;