import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'; // 👈 Import Transition và TransitionChild
import { 
    Bars3Icon, XMarkIcon, UserIcon, QuestionMarkCircleIcon, 
    Cog6ToothIcon, ArrowRightOnRectangleIcon, BellIcon, CheckCircleIcon,
    TrashIcon // 👈 Import TrashIcon
} from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // 👈 Import icon cho Modal
import { HeartIcon, ChatBubbleLeftIcon, UserPlusIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LazyLoading from '../LazyLoading';
import UserAvatar from '../page/community/UserAvatar';
import {AtSymbolIcon } from '@heroicons/react/24/outline';

const navigation = [
    { name: 'Product', href: 'product' },
    { name: 'Community', href: 'community' },
    { name: 'Docs', href: 'docs' },
    { name: 'Chatbot AI', href: 'chatbot-ai' },
];

const Header = ({ user }) => {
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    // --- State Dropdown ---
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    // --- State Modal ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); 

    // --- State Thông báo ---
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const dropdownRef = useRef(null);
    const notiRef = useRef(null);

    // Bổ sung hàm để đóng modal
    const closeDeleteModal = () => setIsDeleteModalOpen(false);
    const openDeleteModal = () => setIsDeleteModalOpen(true);


    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // HÀM FETCH CHÍNH (Đã gói trong useCallback để dùng trong Realtime)
    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        // Lấy 20 thông báo mới nhất
        const { data } = await supabase
            .from('notifications')
            .select('*, actor:actor_id(id, full_name, avatar_url)') 
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (data) setNotifications(data);

        // Đếm số chưa đọc
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
        
        setUnreadCount(count || 0);
    }, [user]);

    // Lắng nghe Fetch & Realtime Notifications
    useEffect(() => {
        if (!user) return;

        // 1. Fetch dữ liệu lần đầu
        fetchNotifications();

        // 2. Lắng nghe thay đổi Realtime: Lắng nghe MỌI event ('*')
        const channel = supabase
            .channel('realtime-notifications')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, // ⬅️ Lắng nghe MỌI event
                (payload) => {
                    // Gọi fetch để đồng bộ lại data sau INSERT, UPDATE, hoặc DELETE
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchNotifications]);


    // --- 2. XỬ LÝ ĐỌC 1 THÔNG BÁO --- (Giữ nguyên)
    const handleReadNotification = async (noti) => {
        if (!noti.is_read) {
            setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            await supabase.from('notifications').update({ is_read: true }).eq('id', noti.id);
        }
        
        setNotiOpen(false);

        if (noti.type === 'follow') {
            navigate(`/profile/${noti.actor_id}`);
        } 
        else if (['like_post', 'comment', 'mention'].includes(noti.type)) {
            navigate(`/post/${noti.resource_id}?commentId=${noti.comment_id || ''}`);
        }

        else if (noti.type === 'comment') {
            navigate(`/post/${noti.resource_id}?commentId=${noti.comment_id}`);
        }
    };

    // --- 3. ĐỌC TẤT CẢ --- (Giữ nguyên)
    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    };

    // --- HÀM XÓA TẤT CẢ (Đã tối ưu logic) ---
    const confirmDeleteAllNotifications = async () => {
        closeDeleteModal(); 
        setLoggingOut(true); 

        if (!user) {
            setLoggingOut(false);
            return;
        }

        // Xóa tất cả thông báo của người dùng hiện tại
        const { error, count } = await supabase
            .from('notifications')
            .delete({ count: 'exact' }) // Để biết số lượng bị xóa
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting notifications:', error);
            alert("Failed to delete notifications. Please check RLS policies.");
        } else {
            // Cập nhật state local ngay lập tức (giải quyết vấn đề reload)
            setNotifications([]);
            setUnreadCount(0);
            setNotiOpen(false); 
        }

        setLoggingOut(false);
    };
    // ------------------------------------

    const handleLogout = async () => {
        setDropdownOpen(false);
        setLoggingOut(true);
        await supabase.auth.signOut();
        setTimeout(() => setLoggingOut(false), 800);
    };

    // Click outside handler (Giữ nguyên)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
            if (notiRef.current && !notiRef.current.contains(event.target)) setNotiOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getNotiIcon = (type) => {
        switch (type) {
            case 'like_post': return <HeartIcon className="w-4 h-4 text-pink-500" />;
            case 'comment': return <ChatBubbleLeftIcon className="w-4 h-4 text-blue-500" />;
            case 'follow': return <UserPlusIcon className="w-4 h-4 text-green-500" />;
            case 'mention': return <AtSymbolIcon className="w-4 h-4 text-orange-500" />; 
            default: return <BellIcon className="w-4 h-4 text-gray-400" />;
        }
    };

    const getNotiContent = (noti) => {
        const name = noti.actor?.full_name || 'Someone';
        switch (noti.type) {
            case 'like_post': return <span><span className="font-bold text-white">{name}</span> liked your post.</span>;
            case 'comment': return <span><span className="font-bold text-white">{name}</span> commented: "{noti.content}"</span>;
            case 'follow': return <span><span className="font-bold text-white">{name}</span> started following you.</span>;
            case 'mention': return <span><span className="font-bold text-white">{name}</span> mentioned you in a comment: "{noti.content}"</span>;
            default: return <span>New notification.</span>;
        }
    };

    const headerClasses = `fixed inset-x-0 top-0 z-50 transition-all duration-300 backdrop-blur-md ${scrolled ? 'bg-gray-900/90 shadow-lg' : 'bg-transparent'}`;

    return (
        <header className={headerClasses}>
            {loggingOut && <LazyLoading status={'Processing...'} />}
            
            {/* -------------------- 1. HEADER NAV BAR -------------------- */}
            <nav className="flex items-center justify-between p-6 lg:px-8">
                {/* ... (Giữ nguyên phần Logo, Navigation Links, Mobile Menu Button) ... */}

                <div className="flex lg:flex-1">
                    <Link to="/" className="-m-1.5 p-1.5">
                        <span className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-500 bg-clip-text text-transparent">HyperX</span>
                    </Link>
                </div>

                <div className="flex lg:hidden">
                    <button type="button" onClick={() => setMobileMenuOpen(true)} className="-m-2.5 rounded-md p-2.5 text-gray-200">
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon className="w-6 h-6" aria-hidden="true" />
                    </button>
                </div>

                <div className="hidden lg:flex lg:gap-x-12 relative">
                    {navigation.map((item) => (
                        <NavLink key={item.name} to={item.href} className="relative group py-2">
                            {({ isActive }) => (
                                <>
                                    <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-indigo-400' : 'text-white group-hover:text-indigo-400'}`}>{item.name}</span>
                                    <span className={`absolute left-0 bottom-0 h-0.5 w-full bg-gradient-to-r from-indigo-400 to-pink-500 transition-transform duration-300 origin-bottom-left ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

                <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4 relative">
                    {user ? (
                        <>
                            {/* --- BELL NOTIFICATION --- */}
                            <div className="relative" ref={notiRef}>
                                <button 
                                    onClick={() => setNotiOpen(!notiOpen)}
                                    className={`relative p-2 transition-colors rounded-full hover:bg-gray-800 ${notiOpen ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white'}`}
                                >
                                    <BellIcon className="w-6 h-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse border-2 border-gray-900">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notiOpen && (
                                    <div className="absolute right-0 mt-3 w-96 rounded-xl bg-[#1e293b] border border-gray-700 shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in duration-200">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
                                            <h3 className="text-sm font-bold text-white">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                                    <CheckCircleIcon className="w-3 h-3" /> Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {notifications.length > 0 ? (
                                                notifications.map((noti) => (
                                                    <div 
                                                        key={noti.id}
                                                        onClick={() => handleReadNotification(noti)}
                                                        className={`flex gap-3 px-4 py-4 hover:bg-gray-700/50 cursor-pointer transition-colors border-b border-gray-700/50 last:border-0 relative
                                                            ${!noti.is_read ? 'bg-indigo-500/5' : ''}`}
                                                    >
                                                        {!noti.is_read && (
                                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                                                        )}

                                                        <div className={`flex-shrink-0 mt-0.5 ${!noti.is_read ? 'pl-2' : ''}`}>
                                                            <div className="relative">
                                                                <UserAvatar user={noti.actor} size="sm" />
                                                                <div className="absolute -bottom-1 -right-1 bg-[#1e293b] rounded-full p-0.5 border border-gray-700 shadow-sm">
                                                                    {getNotiIcon(noti.type)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-300 line-clamp-2 leading-snug">
                                                                {getNotiContent(noti)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1.5 font-medium">
                                                                {new Date(noti.created_at).toLocaleDateString()} at {new Date(noti.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
                                                    <BellIcon className="w-10 h-10 opacity-20" />
                                                    <p className="text-sm">No notifications yet.</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* THAY THẾ: Nút View all history thành Open Delete Modal */}
                                        {notifications.length > 0 && (
                                            <div className="bg-gray-800/50 px-4 py-2 text-center border-t border-gray-700">
                                                <button onClick={() => { setNotiOpen(false); openDeleteModal(); }} className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-1 w-full">
                                                    <TrashIcon className="w-3 h-3" /> Delete All Notifications
                                                </button>
                                            </div>
                                        )}
                                        {/* Kết thúc khối thay thế */}
                                    </div>
                                )}
                            </div>

                            {/* --- USER AVATAR --- (Giữ nguyên) */}
                            {/* ... */}
                            <div className="relative" ref={dropdownRef}>
                                <img
                                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`}
                                    alt="User Avatar"
                                    className="w-9 h-9 rounded-full border-2 border-indigo-500 cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20"
                                    onClick={() => setDropdownOpen((prev) => !prev)}
                                />
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1e293b] shadow-2xl ring-1 ring-black ring-opacity-5 py-1 z-50 animate-in fade-in zoom-in duration-150 border border-gray-700">
                                        <div className="px-4 py-3 border-b border-gray-700 mb-1 bg-gray-800/50 rounded-t-xl">
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Signed in as</p>
                                            <div className='flex flex-rơ justify-center items-center gap-2 my-2'>
                                                   <img
                                                   src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`}
                                                   alt="User Avatar"
                                                   className="w-9 h-9 rounded-full border-2 border-indigo-500 cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20"
                                                />
                                                
                                                <p className="text-sm font-bold text-white truncate mt-0.5">{user.email}</p>
                                                </div>
                                        </div>
                                        <Link to="/profile" className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white gap-3 transition-colors" onClick={() => setDropdownOpen(false)}>
                                            <UserIcon className="w-5 h-5 text-gray-400" /> Profile
                                        </Link>
                                        <Link to="/help" className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white gap-3 transition-colors" onClick={() => setDropdownOpen(false)}>
                                            <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400" /> Help & Support
                                        </Link>
                                        <Link to="/setting" className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white gap-3 transition-colors" onClick={() => setDropdownOpen(false)}>
                                            <Cog6ToothIcon className="w-5 h-5 text-gray-400" /> Settings
                                        </Link>
                                        <div className="border-t border-gray-700 mt-1 pt-1">
                                            <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 gap-3 transition-colors">
                                                <ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/signup" className="text-sm font-semibold text-white border-r border-gray-600 mr-6 pr-6 hover:text-indigo-400 transition-colors">Sign up</Link>
                            <Link to="/signin" className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">Sign in</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Mobile menu (Giữ nguyên) */}
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 p-6 sm:max-w-sm border-l border-gray-700 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                            <span className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-500 bg-clip-text text-transparent">HyperX</span>
                        </Link>
                        <button type="button" onClick={() => setMobileMenuOpen(false)} className="-m-2.5 rounded-md p-2.5 text-gray-200 hover:text-white">
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-700">
                            <div className="space-y-2 py-6">
                                {navigation.map((item) => (
                                    <a key={item.name} href={item.href} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-white hover:bg-gray-800" onClick={() => setMobileMenuOpen(false)}>{item.name}</a>
                                ))}
                            </div>
                            <div className="py-6 border-t border-gray-700">
                                {user ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3 px-3">
                                            <img src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} alt="" className="w-10 h-10 rounded-full border border-indigo-500" />
                                            <div className="text-sm text-gray-300 truncate">{user.email}</div>
                                        </div>
                                        <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-white hover:bg-gray-800">Your Profile</Link>
                                        <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 flex items-center justify-center gap-2"><ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout</button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Link to="/signin" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold text-white hover:bg-gray-800" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                                        <Link to="/signup" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 text-center" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>

            {/* -------------------- 2. DELETE ALL CONFIRMATION MODAL -------------------- */}
            <Transition show={isDeleteModalOpen}>
                <Dialog as="div" className="relative z-[100]" onClose={closeDeleteModal}>
                    <TransitionChild
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" />
                    </TransitionChild>

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <TransitionChild
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-[#1e293b] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-700">
                                    <div className="bg-gray-800/50 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                        <div className="sm:flex sm:items-start">
                                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                                            </div>
                                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                                <h3 className="text-lg font-semibold leading-6 text-white" id="modal-title">
                                                    Delete All Notifications
                                                </h3>
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-400">
                                                        Are you absolutely sure you want to delete all your notifications? This action is permanent and cannot be undone.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-700">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto transition-colors active:scale-95"
                                            onClick={confirmDeleteAllNotifications}
                                        >
                                            Delete All
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600 sm:mt-0 sm:w-auto transition-colors active:scale-95"
                                            onClick={closeDeleteModal}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            {/* -------------------- END MODAL -------------------- */}

        </header>
    );
};

export default Header;