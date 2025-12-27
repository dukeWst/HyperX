import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../routes/supabaseClient';

const UserAvatar = ({ user, size = "md", disableLink = false, className = "" }) => {
    if (!user) return null; 

    // 1. Lấy metadata và profile từ nhiều nguồn có thể
    const metadata = user.raw_user_meta_data || user.user_metadata || {};
    // Một số trường hợp social metadata lại nằm lồng trong metadata.user_metadata
    const nestedMetadata = metadata.user_metadata || {};
    const profile = Array.isArray(user.profiles) ? user.profiles[0] : (user.profiles || {});
    
    // 2. Ưu tiên: user.avatar_url trực tiếp -> profile.avatar_url -> profile.picture -> metadata.avatar_url -> metadata.picture -> nestedMetadata.picture
    let rawAvatarUrl = user.avatar_url || 
                       profile.avatar_url || 
                       profile.picture ||
                       profile.avatar ||
                       metadata.avatar_url || 
                       metadata.picture || 
                       metadata.avatar ||
                       nestedMetadata.avatar_url || 
                       nestedMetadata.picture ||
                       nestedMetadata.avatar;
    
    const fullName = user.full_name || 
                     profile.full_name || 
                     profile.name ||
                     metadata.full_name || 
                     metadata.name ||
                     nestedMetadata.full_name || 
                     nestedMetadata.name ||
                     user.email || 
                     "U";
    const userId = user.id || user.user_id; 

    const dims = size === "xs" ? "w-6 h-6" : size === "sm" ? "w-8 h-8" : size === "xl" ? "w-32 h-32" : size === "md" ? "w-10 h-10" : "w-12 h-12"; 

    // --- HÀM XỬ LÝ URL ẢNH ---
    const getEffectiveAvatarUrl = (path) => {
        if (!path) {
            console.log("UserAvatar: Path bị null hoặc undefined");
            return null;
        }
        
        if (path.startsWith("http") || path.startsWith("https")) {
            return path;
        }

        const cleanPath = path.replace(/^avatars\//, '');
        
        // --- LOG ĐỂ KIỂM TRA ---
        console.log("1. Path gốc từ DB:", path);
        console.log("2. Clean path:", cleanPath);
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(cleanPath);
        
        console.log("3. Link Public cuối cùng:", data.publicUrl);
        // -----------------------

        return data.publicUrl;
    };

    const finalAvatarUrl = getEffectiveAvatarUrl(rawAvatarUrl);

    const AvatarImg = (
        <>
            {finalAvatarUrl ? (
                <img 
                    src={finalAvatarUrl} 
                    alt={fullName} 
                    className={`${dims} rounded-full object-cover border border-white/10 hover:opacity-80 transition-opacity bg-gray-800 ${className}`} 
                    onError={(e) => {
                        e.target.onerror = null; 
                        // Fallback về UI Avatars nếu ảnh lỗi
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0891b2&color=fff&bold=true`;
                    }}
                />
            ) : (
                <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0891b2&color=fff&bold=true`}
                    alt={fullName}
                    className={`${dims} rounded-full object-cover border border-white/10 hover:opacity-80 transition-opacity ${className}`}
                />
            )}
        </>
    );

    if (userId && !disableLink) {
        return (
            <Link 
                to={`/profile/${userId}`} 
                onClick={(e) => e.stopPropagation()} 
                className="inline-block relative shrink-0" 
            >
                {AvatarImg}
            </Link>
        );
    }

    return <div className="inline-block shrink-0">{AvatarImg}</div>;
};

export default UserAvatar;