import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { 
    Bars3Icon, XMarkIcon, UserIcon, QuestionMarkCircleIcon, 
    Cog6ToothIcon, ArrowRightOnRectangleIcon, BellIcon, CheckCircleIcon,
    TrashIcon, AtSymbolIcon, MagnifyingGlassIcon, ChatBubbleLeftEllipsisIcon,
    EllipsisHorizontalIcon, ArrowsPointingOutIcon, PencilSquareIcon // <--- Added Icons
} from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { HeartIcon, ChatBubbleLeftIcon, UserPlusIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../routes/supabaseClient'; // Đảm bảo đường dẫn đúng
import LazyLoading from '../page/enhancements/LazyLoading'; // Đảm bảo đường dẫn đúng
import UserAvatar from '../components/UserAvatar'; // Đảm bảo đường dẫn đúng
import NeedAuthModal from '../components/NeedAuthModal';
import { MessageCircle } from 'lucide-react';

const navigation = [
    { name: 'Product', href: 'product', private: true },
    { name: 'Community', href: 'community', private: true },
    { name: 'Docs', href: 'docs', private: false },
    { name: 'Chatbot AI', href: 'chatbot-ai', private: true },
];

const Header = ({ user }) => {
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    // --- State Dropdown ---
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    const [msgOpen, setMsgOpen] = useState(false); // <--- State Message Dropdown
    const [msgSearchQuery, setMsgSearchQuery] = useState(""); // <--- Search Query for Messages
    const [conversations, setConversations] = useState([]);
    
    // --- State Delete Conversation ---
    const [showOptionsId, setShowOptionsId] = useState(null); 
    const [optionsPos, setOptionsPos] = useState({ top: 0, right: 0 }); // Pos for fixed menu
    const [deleteConvModalOpen, setDeleteConvModalOpen] = useState(false);
    const [convToDelete, setConvToDelete] = useState(null);
    
    // --- State Modal ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); 

    // --- State Thông báo ---
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasSeenNoti, setHasSeenNoti] = useState(false);
    const prevUnreadCount = useRef(0);
    const [isAuthModalOpen, setIsAuthModalOpen ] = useState(false);

    // --- State Tìm kiếm người dùng ---
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const [searchExpanded, setSearchExpanded] = useState(false); // <--- State Expand Search

    const dropdownRef = useRef(null);
    const notiRef = useRef(null);
    const msgRef = useRef(null); // <--- Ref Messages
    const searchRef = useRef(null);
    const optionsMenuRef = useRef(null); // <--- Ref for Fixed Options Menu

    const closeDeleteModal = () => setIsDeleteModalOpen(false);
    const openDeleteModal = () => setIsDeleteModalOpen(true);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // --- Logic Tìm kiếm người dùng (Debounced) ---
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setSearchOpen(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            setSearchOpen(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, email')
                    .ilike('email', `${searchQuery}%`)
                    .limit(5);

                if (error) throw error;
                setSearchResults(data || []);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

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

    // --- Logic Fetch Conversations (Message History) ---
    useEffect(() => {
        if (!msgOpen || !user?.id) return;

        const fetchConversations = async () => {
            try {
                // 1. Fetch conversations (tạm thời sort theo created_at để lấy recent ones)
                // Lấy nhiều hơn 1 chút để sort lại theo message
                const { data: convs, error } = await supabase
                    .from('conversations')
                    .select('*')
                    .or(`user_1.eq.${user.id},user_2.eq.${user.id}`)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) {
                    console.error("Error fetching conversations table:", error);
                    return;
                }
                
                if (!convs || convs.length === 0) {
                    setConversations([]);
                    return;
                }

                // 2. Enrich + Fetch Last Message
                const enriched = await Promise.all(convs.map(async (c) => {
                    const partnerId = c.user_1 === user.id ? c.user_2 : c.user_1;
                    
                    // Fetch Partner Profile
                    const { data: partner } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, email')
                        .eq('id', partnerId)
                        .single();
                    
                    // Fetch Last Message
                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('content, created_at, sender_id')
                        .eq('conversation_id', c.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    return {
                        ...c,
                        partner,
                        lastMessage: lastMsg
                    };
                }));

                // 3. Filter empty conversations & Sort by Last Message Time
                const activeConvs = enriched.filter(c => c.lastMessage);
                
                const sorted = activeConvs.sort((a, b) => {
                    const timeA = new Date(a.lastMessage.created_at);
                    const timeB = new Date(b.lastMessage.created_at);
                    return timeB - timeA;
                });

                setConversations(sorted);
            } catch (err) {
                console.error("Error fetching conversations:", err);
            }
        };

        fetchConversations();
    }, [msgOpen, user]);

    const handleOpenChat = (partner) => {
        if (!partner) return;
        setMsgOpen(false);
        // Dispatch event để ChatBox mở
        window.dispatchEvent(new CustomEvent('hyperx-open-chat', { detail: partner }));
    };

    // Tracking unread count for badge visibility
    useEffect(() => {
        if (unreadCount > prevUnreadCount.current) {
            setHasSeenNoti(false);
        }
        prevUnreadCount.current = unreadCount;
    }, [unreadCount]);

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
        else if (['like_post', 'like_comment', 'comment', 'mention'].includes(noti.type)) navigate(`/post/${noti.resource_id}?commentId=${noti.comment_id || ''}`);
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
        navigate('/'); // Điều hướng về Home trước để tránh PrivateRoute hiện modal
        await supabase.auth.signOut();
        setTimeout(() => setLoggingOut(false), 800);
    };

    // --- XÓA HỘI THOẠI (Soft Delete) ---
    const handleDeleteClick = (e, conv) => {
        e.stopPropagation();
        setConvToDelete(conv);
        setDeleteConvModalOpen(true);
        setShowOptionsId(null);
    };

    const confirmDeleteConv = async () => {
        if (!convToDelete || !user?.id) return;
        
        try {
            const now = new Date().toISOString();
            const field = user.id === convToDelete.user_1 ? 'user_1_cleared_at' : 'user_2_cleared_at';
            
            const { error } = await supabase
                .from('conversations')
                .update({ [field]: now })
                .eq('id', convToDelete.id);

            if (error) throw error;

            // Remove from local state
            setConversations(prev => prev.filter(c => c.id !== convToDelete.id));
            setDeleteConvModalOpen(false);
            setConvToDelete(null);
        } catch (err) {
            console.error("Error deleting conversation:", err);
            alert("Failed to delete conversation");
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Ignore if delete modal is open (let modal handle its own closing/backdrop)
            if (deleteConvModalOpen) return;

            // Check if click is inside the fixed options menu (using ID for stability)
            if (event.target.closest('#fixed-conv-options-menu')) {
                return; // Do nothing if clicking inside options menu
            }

            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);

            if (notiRef.current && !notiRef.current.contains(event.target)) setNotiOpen(false);
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchOpen(false);
                if (!searchQuery) setSearchExpanded(false); // Collapse if empty and clicked outside
            }
            
            // Logic cho Message Dropdown & Options
            if (msgRef.current && !msgRef.current.contains(event.target)) {
                setMsgOpen(false);
                setShowOptionsId(null);
            }

            // Hide options menu if clicked outside (and not in the button itself)
            if (!event.target.closest('.conv-options-btn')) {
                setShowOptionsId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [deleteConvModalOpen, searchQuery]); // Add dependency for deleteConvModalOpen

    const getNotiIcon = (type) => {
        switch (type) {
            case 'like_post': return <HeartIcon className="w-3.5 h-3.5 text-red-500" />;
            case 'like_comment': return <HeartIcon className="w-3.5 h-3.5 text-red-500" />;
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
            case 'like_comment': return <span><span className="font-bold text-indigo-200">{name}</span> liked your comment: "{noti.content}"</span>;
            case 'comment': return <span><span className="font-bold text-indigo-200">{name}</span> commented: "{noti.content}"</span>;
            case 'follow': return <span><span className="font-bold text-indigo-200">{name}</span> started following you.</span>;
            case 'mention': return <span><span className="font-bold text-indigo-200">{name}</span> mentioned you: "{noti.content}"</span>;
            default: return <span>New notification.</span>;
        }
    };

    // --- STYLE HEADER ---
    const headerClasses = `fixed inset-x-0 top-0 z-[10000] transition-all duration-300 border-b ${
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
                <div className="flex lg:flex-1 items-center gap-4">
                    <Link 
                        to={user ? "/community" : "/"} 
                        onClick={() => {
                            if (location.pathname === '/community') {
                                window.dispatchEvent(new CustomEvent('hyperx-refresh-community'));
                            }
                        }}
                        className="-m-1.5 p-1.5 group flex items-center gap-2"
                    >
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
                <div className="hidden lg:flex lg:gap-x-2 relative items-center">
                    {navigation.map((item) => (
                        <div key={item.name} className="relative group">
                            <NavLink 
                                to={item.href} 
                                onClick={(e) => {
                                    if (!user && item.private) {
                                        e.preventDefault();
                                        setIsAuthModalOpen(true);
                                    } else if (location.pathname === '/community' && item.href === 'community') {
                                        window.dispatchEvent(new CustomEvent('hyperx-refresh-community'));
                                    }
                                }}
                                className="relative px-6 py-5 flex items-center transition-all duration-300"
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={`text-[15px] font-bold tracking-tight transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-cyan-400'}`}>
                                            {item.name}
                                        </span>
                                        {/* Glow Line Effect */}
                                        <span className={`absolute bottom-3 left-6 right-6 h-[2px] bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,1)] transition-all duration-500 ${isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-70 group-hover:scale-x-100'}`}></span>
                                    </>
                                )}
                            </NavLink>
                        </div>
                    ))}
                </div>

                {/* Right Side Actions */}
                <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-5 relative">
                    {user ? (
                        <>
                            {/* --- THANH TÌM KIẾM NGƯỜI DÙNG (Moved here) --- */}
                            <div className={`relative group hidden xl:flex items-center transition-all duration-300 ${searchExpanded ? 'w-[300px]' : 'w-10'}`} ref={searchRef}>
                                
                                {/* Search Button (Visible when collapsed) */}
                                <button 
                                    onClick={() => {
                                        setSearchExpanded(true);
                                        setTimeout(() => document.getElementById('search-input-header')?.focus(), 100);
                                    }}
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10 ${searchExpanded ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
                                >
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                </button>

                                {/* Expanded Input Area */}
                                <div className={`flex items-center w-full transition-all duration-300 ${searchExpanded ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                                        <MagnifyingGlassIcon className="h-4 w-4 text-cyan-400" />
                                    </div>
                                    <input 
                                        id="search-input-header"
                                        type="text" 
                                        placeholder="Search users..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => searchQuery && setSearchOpen(true)}
                                        className="w-full bg-[#1A1D24] border border-cyan-500/30 text-gray-200 text-sm rounded-full focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 pl-9 p-2.5 placeholder-gray-500 hover:bg-[#1A1D24]/80 transition-all outline-none shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                    />
                                </div>

                                {/* Kết quả tìm kiếm Dropdown */}
                                {searchOpen && (
                                    <div className="absolute top-full left-0 mt-3 w-full min-w-[340px] bg-[#0B0D14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Results</span>
                                            {isSearching && <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>}
                                        </div>
                                        
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {searchResults.length > 0 ? (
                                                searchResults.map((result) => (
                                                    <Link 
                                                        key={result.id}
                                                        to={`/profile/${result.id}`}
                                                        onClick={() => {
                                                            setSearchOpen(false);
                                                            setSearchQuery("");
                                                            setSearchExpanded(false);
                                                        }}
                                                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        <UserAvatar 
                                                            user={{
                                                                id: result.id,
                                                                raw_user_meta_data: {
                                                                    avatar_url: result.avatar_url,
                                                                    full_name: result.full_name
                                                                }
                                                            }}
                                                            size="md"
                                                            disableLink={true}
                                                            className="w-10 h-10 ring-1 ring-white/10"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="text-sm font-bold text-white truncate">{result.full_name || "Unknown User"}</h4>
                                                            <p className="text-xs text-gray-500 truncate">{result.email}</p>
                                                        </div>
                                                        <AtSymbolIcon className="w-4 h-4 text-gray-700" />
                                                    </Link>
                                                ))
                                            ) : !isSearching ? (
                                                <div className="p-10 text-center flex flex-col items-center gap-3">
                                                    <div className="p-3 bg-white/5 rounded-full">
                                                        <MagnifyingGlassIcon className="w-6 h-6 text-gray-700" />
                                                    </div>
                                                    <p className="text-sm text-gray-500">No members found.</p>
                                                </div>
                                            ) : (
                                                <div className="p-10 space-y-4">
                                                    {[...Array(3)].map((_, i) => (
                                                        <div key={i} className="flex items-center gap-3 opacity-50">
                                                            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
                                                            <div className="flex-1 space-y-2">
                                                                <div className="h-3 w-1/2 bg-white/10 rounded animate-pulse"></div>
                                                                <div className="h-2 w-1/3 bg-white/10 rounded animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>


                            {/* --- MESSAGING --- */}
                            <div className="relative" ref={msgRef}>
                                <button 
                                    onClick={() => setMsgOpen(!msgOpen)}
                                    className={`relative p-2.5 rounded-full transition-all duration-200 group ${msgOpen ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <MessageCircle className="w-6 h-6 transition-colors" />
                                    {/* Badge mockup if needed */}
                                    {/* <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0B0D14]"></span> */}
                                </button>

                                {msgOpen && (
                                    <div className="absolute right-0 mt-4 w-[360px] rounded-2xl bg-[#1e1e1e] border border-white/10 shadow-2xl z-[110] overflow-hidden origin-top-right animate-in fade-in zoom-in duration-200 ring-1 ring-white/5 font-sans">
                                        {/* HEADER */}
                                        <div className="p-4 pb-2">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-xl font-bold text-white">Chats</h3>
                                            </div>

                                            {/* SEARCH */}
                                            <div className="relative mb-3">
                                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Search Messenger" 
                                                    value={msgSearchQuery}
                                                    onChange={(e) => setMsgSearchQuery(e.target.value)}
                                                    className="w-full bg-[#2a2b2e] text-gray-200 text-sm rounded-full py-2 pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-gray-500"
                                                />
                                            </div>

                                            {/* TABS (Mockup) */}
                                            <div className="flex gap-2">
                                                <button className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/30 transition-colors">All</button>
                                                <button className="px-3 py-1.5 rounded-full bg-transparent text-gray-400 text-sm font-medium hover:bg-white/5 transition-colors">Unread</button>
                                                <button className="px-3 py-1.5 rounded-full bg-transparent text-gray-400 text-sm font-medium hover:bg-white/5 transition-colors">Groups</button>
                                            </div>
                                        </div>

                                        {/* LIST */}
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                                            {conversations.filter(c => {
                                                if (!msgSearchQuery.trim()) return true;
                                                const name = c.partner?.full_name?.toLowerCase() || '';
                                                const email = c.partner?.email?.toLowerCase() || '';
                                                const q = msgSearchQuery.toLowerCase();
                                                return name.includes(q) || email.includes(q);
                                            }).length > 0 ? (
                                                conversations.filter(c => {
                                                    if (!msgSearchQuery.trim()) return true;
                                                    const name = c.partner?.full_name?.toLowerCase() || '';
                                                    const email = c.partner?.email?.toLowerCase() || '';
                                                    const q = msgSearchQuery.toLowerCase();
                                                    return name.includes(q) || email.includes(q);
                                                }).map((conv) => (
                                                    <div 
                                                        key={conv.id}
                                                        onClick={() => handleOpenChat(conv.partner)}
                                                        className="flex gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group items-center relative"
                                                    >
                                                        <div className="relative flex-shrink-0">
                                                            <UserAvatar user={conv.partner} size="md" className="w-14 h-14" />
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <h4 className="text-[15px] font-semibold text-white truncate leading-tight mb-0.5">
                                                                {conv.partner?.full_name || 'Instagram User'}
                                                            </h4>
                                                            <div className="flex items-center gap-1 text-[13px] text-gray-400">
                                                                <p className="truncate max-w-[160px]">
                                                                    {conv.lastMessage?.sender_id === user?.id ? 'You: ' : ''}
                                                                    {conv.lastMessage?.content || 'Sent an attachment'}
                                                                </p>
                                                                <span>·</span>
                                                                <span className="whitespace-nowrap">
                                                                    {conv.lastMessage 
                                                                        ? (() => {
                                                                            const diff = (new Date() - new Date(conv.lastMessage.created_at)) / 1000 / 60; // minutes
                                                                            if (diff < 60) return `${Math.floor(diff)}m`;
                                                                            if (diff < 1440) return `${Math.floor(diff/60)}h`;
                                                                            return new Date(conv.lastMessage.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                                                                        })()
                                                                        : 'Now'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* --- OPTIONS BUTTON (Hover) --- */}
                                                        <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${showOptionsId === conv.id ? 'block' : 'hidden group-hover:block'}`}>
                                                            <button 
                                                                className="conv-options-btn p-2 rounded-full bg-[#2a2b2e] hover:bg-[#3e4045] text-white shadow-lg border border-white/10 transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    // Tính toán vị trí fixed
                                                                    setOptionsPos({ 
                                                                        top: rect.bottom + 5, 
                                                                        right: window.innerWidth - rect.right 
                                                                    });
                                                                    setShowOptionsId(showOptionsId === conv.id ? null : conv.id);
                                                                }}
                                                            >
                                                                <EllipsisHorizontalIcon className="w-5 h-5" />
                                                            </button>
                                                            {/* Menu removed from here */}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                                                    <ChatBubbleLeftEllipsisIcon className="w-12 h-12 opacity-10" />
                                                    <p className="text-sm font-medium">
                                                        {msgSearchQuery.trim() ? "No results found" : "No recent messages"}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* --- DELETE CONVERSATION MODAL --- */}
                            {deleteConvModalOpen && (
                                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                                    <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-[#0B0D14] border border-white/10 p-6 shadow-2xl ring-1 ring-white/5 animate-in zoom-in-95 duration-200 relative">
                                        <button 
                                            onClick={() => setDeleteConvModalOpen(false)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>

                                        <h3 className="text-lg font-bold text-white uppercase mb-4 text-center">Delete Conversation?</h3>
                                        <p className="text-gray-400 text-sm mb-4 text-center py-6 font-semibold border-t border-white/10">Delete the entire conversation? This can’t be undone.</p>
                                        
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setDeleteConvModalOpen(false)}
                                                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-gray-400 text-xs font-bold uppercase hover:bg-white/10 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={confirmDeleteConv}
                                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                                            >
                                                Delete All
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- FIXED OPTIONS MENU (Z-INDEX CAO HƠN) --- */}
                            {showOptionsId && (
                                <div 
                                    id="fixed-conv-options-menu"
                                    ref={optionsMenuRef}
                                    className="fixed w-32 bg-[#2a2b2e] border border-white/10 rounded-lg shadow-xl z-[200] overflow-hidden py-1 animate-in fade-in zoom-in duration-100"
                                    style={{ top: optionsPos.top, right: optionsPos.right }}
                                >
                                    <button 
                                        onClick={(e) => {
                                            const c = conversations.find(x => x.id === showOptionsId);
                                            if(c) handleDeleteClick(e, c);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            )}

                            {/* --- NOTIFICATION --- */}
                            <div className="relative" ref={notiRef}>
                                <button 
                                    onClick={() => {
                                        setNotiOpen(!notiOpen);
                                        setHasSeenNoti(true);
                                    }}
                                    className={`relative p-2.5 rounded-full transition-all duration-200 group ${notiOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <BellIcon className="w-6 h-6 group-hover:text-cyan-400 transition-colors" />
                                    {unreadCount > 0 && !hasSeenNoti && (
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
                                                                {new Date(noti.created_at).toLocaleDateString('en-US')} • {new Date(noti.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                            <Link 
                                to="/signin" 
                                className="group px-4 py-5 flex items-center gap-2 text-[15px] font-bold text-gray-400 hover:text-cyan-400 transition-all duration-300"
                            >
                                <span>Sign In</span>
                            </Link>

                            <Link 
                                to="/signup" 
                                className="relative group px-8 py-3.5 flex items-center gap-2 overflow-hidden rounded-full bg-cyan-500 text-black text-sm font-black uppercase tracking-tighter hover:bg-white hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all duration-500"
                            >
                                <span>Sign Up</span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
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
                                    <Link 
                                        key={item.name} 
                                        to={item.href} 
                                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white/10" 
                                        onClick={(e) => {
                                            if (!user && item.private) {
                                                e.preventDefault();
                                                setMobileMenuOpen(false);
                                                setIsAuthModalOpen(true);
                                            } else {
                                                setMobileMenuOpen(false);
                                            }
                                        }}
                                    >
                                        {item.name}
                                    </Link>
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
                                        <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-red-600/20 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600/30 flex items-center justify-center gap-2"><ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <Link 
                                            to="/signin" 
                                            className="w-full flex items-center justify-center gap-3 rounded-2xl px-3 py-3.5 text-base font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:text-cyan-400" 
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <ArrowRightOnRectangleIcon className="w-5 h-5" /> Sign In
                                        </Link>
                                        <Link 
                                            to="/signup" 
                                            className="w-full flex items-center justify-center gap-3 rounded-2xl px-3 py-3.5 text-base font-black text-black bg-cyan-500 hover:bg-white shadow-[0_10px_30px_rgba(6,182,212,0.3)] transition-all" 
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <UserPlusIcon className="w-5 h-5" /> Sign Up
                                        </Link>
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
            {/* AUTH MODAL */}
            <NeedAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </header>
    );
};

export default Header;