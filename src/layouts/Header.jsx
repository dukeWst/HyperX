import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { 
    Bars3Icon, XMarkIcon, UserIcon, QuestionMarkCircleIcon, 
    Cog6ToothIcon, ArrowRightOnRectangleIcon, BellIcon, CheckCircleIcon,
    TrashIcon, AtSymbolIcon, MagnifyingGlassIcon // <--- 1. IMPORT THÊM ICON KÍNH LÚP
} from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { HeartIcon, ChatBubbleLeftIcon, UserPlusIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../routes/supabaseClient'; // Đảm bảo đường dẫn đúng
import LazyLoading from '../page/enhancements/LazyLoading'; // Đảm bảo đường dẫn đúng
import UserAvatar from '../components/UserAvatar'; // Đảm bảo đường dẫn đúng

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

    const closeDeleteModal = () => setIsDeleteModalOpen(false);
    const openDeleteModal = () => setIsDeleteModalOpen(true);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // HÀM FETCH CHÍNH
    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const { data } = await supabase
                .from('notifications')
                .select('*, actor:actor_id(id, full_name, avatar_url)') 
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (data) setNotifications(data);

            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            
            setUnreadCount(count || 0);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }, [user]);

    // Lắng nghe Fetch & Realtime Notifications
    useEffect(() => {
        if (!user?.id) return;
        
        fetchNotifications();

        const channel = supabase
            .channel('realtime-notifications')
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'notifications', 
                    filter: `user_id=eq.${user.id}` 
                }, 
                () => { fetchNotifications(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, fetchNotifications]);


    // --- ACTIONS ---
    const handleReadNotification = async (noti) => {
        if (!noti.is_read) {
            setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            await supabase.from('notifications').update({ is_read: true }).eq('id', noti.id);
        }
        setNotiOpen(false);

        if (noti.type === 'follow') navigate(`/profile/${noti.actor_id}`);
        else if (['like_post', 'comment', 'mention'].includes(noti.type)) navigate(`/post/${noti.resource_id}?commentId=${noti.comment_id || ''}`);
    };

    const handleMarkAllRead = async () => {
        if (!user?.id) return;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    };

    const confirmDeleteAllNotifications = async () => {
        closeDeleteModal(); 
        setLoggingOut(true); 
        if (!user?.id) { setLoggingOut(false); return; }

        const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);

        if (error) {
            console.error('Error deleting notifications:', error);
            alert("Failed to delete notifications.");
        } else {
            setNotifications([]);
            setUnreadCount(0);
            setNotiOpen(false); 
        }
        setLoggingOut(false);
    };

    const handleLogout = async () => {
        setDropdownOpen(false);
        setLoggingOut(true);
        await supabase.auth.signOut();
        setTimeout(() => setLoggingOut(false), 800);
    };

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
            case 'like_post': return <HeartIcon className="w-3.5 h-3.5 text-pink-500" />;
            case 'comment': return <ChatBubbleLeftIcon className="w-3.5 h-3.5 text-blue-500" />;
            case 'follow': return <UserPlusIcon className="w-3.5 h-3.5 text-green-500" />;
            case 'mention': return <AtSymbolIcon className="w-3.5 h-3.5 text-orange-500" />; 
            default: return <BellIcon className="w-3.5 h-3.5 text-gray-400" />;
        }
    };

    const getNotiContent = (noti) => {
        const name = noti.actor?.full_name || 'Someone';
        switch (noti.type) {
            case 'like_post': return <span><span className="font-bold text-indigo-200">{name}</span> liked your post.</span>;
            case 'comment': return <span><span className="font-bold text-indigo-200">{name}</span> commented: "{noti.content}"</span>;
            case 'follow': return <span><span className="font-bold text-indigo-200">{name}</span> started following you.</span>;
            case 'mention': return <span><span className="font-bold text-indigo-200">{name}</span> mentioned you: "{noti.content}"</span>;
            default: return <span>New notification.</span>;
        }
    };

    // --- STYLE HEADER ---
    const headerClasses = `fixed inset-x-0 top-0 z-50 transition-all duration-300 border-b ${
        scrolled 
        ? 'bg-[#050505]/80 backdrop-blur-xl border-white/5 shadow-lg shadow-cyan-500/5' 
        : 'bg-transparent border-transparent'
    }`;

    // Helper an toàn để lấy Avatar/Email
    const safeUserEmail = user?.email || "";
    const safeUserAvatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${safeUserEmail}`;
    const safeUserName = user?.user_metadata?.full_name || "User";

    return (
        <header className={headerClasses}>
            {loggingOut && <LazyLoading status={'Processing...'} />}
            
            <nav className="flex items-center justify-between p-5 lg:px-8 max-w-[90rem] mx-auto" aria-label="Global">
                
                {/* Logo Area */}
                <div className="flex lg:flex-1">
                    <Link to="/" className="-m-1.5 p-1.5 group flex items-center gap-2">
                        {/* Logo Style giống Dashboard */}
                        <span className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 group-hover:to-white transition-all duration-300">
                            HYPER<span className="text-cyan-400">X</span>
                        </span>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex lg:hidden">
                    <button type="button" onClick={() => setMobileMenuOpen(true)} className="-m-2.5 rounded-md p-2.5 text-gray-300 hover:text-white transition-colors">
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon className="w-7 h-7" aria-hidden="true" />
                    </button>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex lg:gap-x-10 relative">
                    {navigation.map((item) => (
                        <NavLink key={item.name} to={item.href} className="relative group py-2">
                            {({ isActive }) => (
                                <>
                                    <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-cyan-400'}`}>
                                        {item.name}
                                    </span>
                                    {/* Glow Line Effect */}
                                    <span className={`absolute -bottom-1 left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-300 ${isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-50 group-hover:scale-x-50'}`}></span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

                {/* Right Side Actions */}
                <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-5 relative">
                    {user ? (
                        <>
                            {/* --- 2. THANH INPUT SEARCH (Chỉ hiện khi có User) --- */}
                            <div className="relative group hidden xl:block">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="bg-white/5 border border-white/10 text-gray-300 text-sm rounded-full focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-9 p-2.5 placeholder-gray-500 hover:bg-white/10 transition-all outline-none w-[200px] focus:w-[280px]"
                                />
                            </div>
                            {/* ---------------------------------------------------- */}

                            {/* --- NOTIFICATION --- */}
                            <div className="relative" ref={notiRef}>
                                <button 
                                    onClick={() => setNotiOpen(!notiOpen)}
                                    className={`relative p-2.5 rounded-full transition-all duration-200 group ${notiOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <BellIcon className="w-6 h-6 group-hover:text-cyan-400 transition-colors" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#05050A] animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notiOpen && (
                                    <div className="absolute right-0 mt-4 w-96 rounded-2xl bg-[#0B0D14] border border-white/10 shadow-2xl z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in duration-200 ring-1 ring-white/5">
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/5 backdrop-blur-sm">
                                            <h3 className="text-sm font-bold text-white">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={handleMarkAllRead} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                                                    <CheckCircleIcon className="w-3.5 h-3.5" /> Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-[#0B0D14]">
                                            {notifications.length > 0 ? (
                                                notifications.map((noti) => (
                                                    <div 
                                                        key={noti.id}
                                                        onClick={() => handleReadNotification(noti)}
                                                        className={`flex gap-4 px-5 py-4 cursor-pointer transition-colors border-b border-white/5 last:border-0 relative hover:bg-white/5
                                                            ${!noti.is_read ? 'bg-cyan-500/5' : ''}`}
                                                    >
                                                        {!noti.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>}

                                                        <div className="flex-shrink-0 mt-1">
                                                            <div className="relative">
                                                                <UserAvatar user={noti.actor} size="sm" />
                                                                <div className="absolute -bottom-1 -right-1 bg-[#0B0D14] rounded-full p-0.5 border border-gray-800">
                                                                    {getNotiIcon(noti.type)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-400 leading-snug">
                                                                {getNotiContent(noti)}
                                                            </p>
                                                            <p className="text-xs text-gray-600 mt-1.5 font-medium">
                                                                {new Date(noti.created_at).toLocaleDateString()} • {new Date(noti.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                                                    <BellIcon className="w-12 h-12 opacity-10" />
                                                    <p className="text-sm font-medium">No notifications yet</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {notifications.length > 0 && (
                                            <div className="bg-[#0B0D14] p-2 border-t border-white/5">
                                                <button onClick={() => { setNotiOpen(false); openDeleteModal(); }} className="w-full py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
                                                    <TrashIcon className="w-3.5 h-3.5" /> Clear All History
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* --- USER PROFILE --- */}
                            <div className="relative" ref={dropdownRef}>
                                <div 
                                    className="flex items-center gap-3 cursor-pointer group"
                                    onClick={() => setDropdownOpen((prev) => !prev)}
                                >
                                    <div className="relative">
                                        <img
                                            src={safeUserAvatar}
                                            alt="User"
                                            className="w-9 h-9 rounded-full border border-white/20 group-hover:border-cyan-500 transition-colors object-cover ring-2 ring-transparent group-hover:ring-cyan-500/20"
                                        />
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#05050A] rounded-full"></div>
                                    </div>
                                </div>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-4 w-64 rounded-2xl bg-[#0B0D14] border border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150 ring-1 ring-white/5">
                                        <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                                            <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2">Account</p>
                                            <div className='flex items-center gap-3'>
                                                <img src={safeUserAvatar} alt="" className="w-10 h-10 rounded-full border border-cyan-500/50" />
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-bold text-white truncate">{safeUserName}</p>
                                                    <p className="text-xs text-gray-400 truncate">{safeUserEmail}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-2 space-y-1">
                                            <Link 
    to={`/profile/${user?.id}`} 
    className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg gap-3 transition-colors" 
    onClick={() => setDropdownOpen(false)}
>
    <UserIcon className="w-4.5 h-4.5 text-gray-500" /> Profile
</Link>
                                            {/* Link tới Dashboard */}
                                            <Link to="/dashboard" className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg gap-3 transition-colors" onClick={() => setDropdownOpen(false)}>
                                                <ArrowRightOnRectangleIcon className="w-4.5 h-4.5 text-gray-500 -rotate-90" /> Dashboard
                                            </Link>
                                            <Link to="/support" className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg gap-3 transition-colors" onClick={() => setDropdownOpen(false)}>
                                                <QuestionMarkCircleIcon className="w-4.5 h-4.5 text-gray-500" /> Help & Support
                                            </Link>
                                            <Link to="/setting" className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg gap-3 transition-colors" onClick={() => setDropdownOpen(false)}>
                                                <Cog6ToothIcon className="w-4.5 h-4.5 text-gray-500" /> Settings
                                            </Link>
                                        </div>

                                        <div className="p-2 border-t border-white/5 bg-white/[0.02]">
                                            <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg gap-3 transition-colors">
                                                <ArrowRightOnRectangleIcon className="w-4.5 h-4.5" /> Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/signin" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Sign in</Link>
                            <Link to="/signup" className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-cyan-400 hover:text-white hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all active:scale-95">
                                Sign up
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Mobile menu - Giữ nguyên không thay đổi */}
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-[#050505] p-6 sm:max-w-sm border-l border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                            <span className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-500">
                                HYPER<span className="text-cyan-400">X</span>
                            </span>
                        </Link>
                        <button type="button" onClick={() => setMobileMenuOpen(false)} className="-m-2.5 rounded-md p-2.5 text-gray-400 hover:text-white">
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="mt-8 flow-root">
                        <div className="-my-6 divide-y divide-white/10">
                            <div className="space-y-2 py-6">
                                {navigation.map((item) => (
                                    <Link key={item.name} to={item.href} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>{item.name}</Link>
                                ))}
                            </div>
                            <div className="py-6">
                                {user ? (
                                    <div className="flex flex-col gap-4">
                                        <Link 
    to={`/profile/${user?.id}`} 
    onClick={() => setMobileMenuOpen(false)} 
    className="flex items-center gap-3 -mx-3 px-3 py-2 rounded-lg hover:bg-white/10"
>
    <img src={safeUserAvatar} alt="" className="w-8 h-8 rounded-full border border-cyan-500" />
    <div>
        <div className="text-white font-medium">Profile</div>
        <div className="text-xs text-gray-500">{safeUserEmail}</div>
    </div>
</Link>
                                        <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 -mx-3 px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300">
                                             Dashboard
                                        </Link>
                                        <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-red-600/20 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600/30 flex items-center justify-center gap-2"><ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <Link to="/signin" className="w-full text-center rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-white/10 border border-white/10" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                                        <Link to="/signup" className="w-full text-center rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-black bg-white hover:bg-cyan-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>

            {/* CONFIRMATION MODAL - Giữ nguyên */}
            <Transition show={isDeleteModalOpen}>
                <Dialog as="div" className="relative z-[100]" onClose={closeDeleteModal}>
                    <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
                    </TransitionChild>

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                            <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                                <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-[#0B0D14] text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-white/10 ring-1 ring-white/5">
                                    <div className="bg-[#0B0D14] px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                        <div className="sm:flex sm:items-start">
                                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10 sm:mx-0 sm:h-10 sm:w-10">
                                                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" aria-hidden="true" />
                                            </div>
                                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                                <h3 className="text-lg font-bold leading-6 text-white">Delete Notifications</h3>
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-400">Are you sure you want to clear all notifications? This action cannot be undone.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[#0B0D14]/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-white/5">
                                        <button type="button" className="inline-flex w-full justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto transition-colors" onClick={confirmDeleteAllNotifications}>Delete All</button>
                                        <button type="button" className="mt-3 inline-flex w-full justify-center rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/10 sm:mt-0 sm:w-auto transition-colors" onClick={closeDeleteModal}>Cancel</button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </header>
    );
};

export default Header;