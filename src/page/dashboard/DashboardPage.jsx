import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, NavLink, Link } from "react-router-dom"; // Dùng NavLink cho Sidebar
import { supabase } from "../../routes/supabaseClient";
import LazyLoading from "../enhancements/LazyLoading";
import UserAvatar from "../../components/UserAvatar"; // Import component Avatar nếu có
import { 
    HomeIcon, UsersIcon, ChartBarIcon, CogIcon, ArrowLeftOnRectangleIcon, 
    BellIcon, MagnifyingGlassIcon, CheckCircleIcon, TrashIcon, 
    UserIcon, QuestionMarkCircleIcon, Cog6ToothIcon,
    CurrencyDollarIcon, ServerIcon, UserPlusIcon
} from "@heroicons/react/24/outline";
import { 
    HeartIcon, ChatBubbleLeftIcon, AtSymbolIcon 
} from "@heroicons/react/24/solid";

// --- SUB COMPONENTS ---

// 1. Sidebar Item (Sử dụng NavLink để tự động handle active state)
const NavItem = ({ to, icon, label }) => (
    <NavLink 
        to={to} 
        className={({ isActive }) => `
            flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group
            ${isActive 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }
        `}
    >
        <span className="w-5 h-5 group-hover:scale-110 transition-transform">{icon}</span>
        {label}
    </NavLink>
);

// 2. Stat Card (Đã tối ưu icon)
const StatCard = ({ title, value, trend, trendUp, icon }) => (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#09090b]/60 p-6 shadow-xl backdrop-blur-md group hover:border-cyan-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <div className="w-16 h-16 text-white">{icon}</div>
        </div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {trend}
            </span>
        </div>
        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-500 transition-all duration-500 group-hover:w-full"></div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loggingOut, setLoggingOut] = useState(false);

    // --- State cho Header interactions ---
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const dropdownRef = useRef(null);
    const notiRef = useRef(null);

    // 1. Auth Check
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/signin");
            } else {
                setUser(user);
            }
        };
        getUser();
    }, [navigate]);

    // 2. Fetch Notifications Logic (Full Implementation)
    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            // Lấy list thông báo
            const { data } = await supabase
                .from('notifications')
                .select('*, actor:actor_id(id, full_name, avatar_url)') 
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (data) setNotifications(data);

            // Đếm số lượng chưa đọc
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

    // 3. Realtime Subscription
    useEffect(() => {
        if (!user?.id) return;
        
        fetchNotifications();

        const channel = supabase
            .channel('dashboard-notifications')
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

    // 4. Click Outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
            if (notiRef.current && !notiRef.current.contains(event.target)) setNotiOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 5. Actions
    const handleLogout = async () => {
        setLoggingOut(true);
        await supabase.auth.signOut();
        setTimeout(() => navigate("/signin"), 500);
    };

    const handleMarkAllRead = async () => {
        if (!user?.id) return;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    };

    const handleReadNotification = async (noti) => {
        if (!noti.is_read) {
            setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            await supabase.from('notifications').update({ is_read: true }).eq('id', noti.id);
        }
        // Navigate logic here if needed
    };

    // Helper Helpers
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
            default: return <span>New notification.</span>;
        }
    };

    const safeUserAvatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}`;
    const safeUserName = user?.user_metadata?.full_name || "Admin User";
    const safeUserEmail = user?.email || "";

    return (
        <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30 overflow-hidden">
            {loggingOut && <LazyLoading status={'Signing out...'} />}

            {/* --- BACKGROUND AMBIENT --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]"></div>
            </div>

            {/* --- SIDEBAR --- */}
            <aside className="relative z-20 hidden w-64 flex-col border-r border-white/5 bg-[#09090b]/80 backdrop-blur-xl lg:flex">
               

                <nav className="flex-1 space-y-1 px-4 py-24">
                    <NavItem to="/dashboard" icon={<HomeIcon />} label="Overview" />
                    <NavItem to="/dashboard/users" icon={<UsersIcon />} label="Users" />
                    <NavItem to="/dashboard/analytics" icon={<ChartBarIcon />} label="Analytics" />
                    <NavItem to="/setting" icon={<CogIcon />} label="Settings" />
                </nav>

                <div className="border-t border-white/5 p-4">
                    <button 
                        onClick={handleLogout}
                        className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                    >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                        <span className="group-hover:translate-x-1 transition-transform">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="relative z-10 flex-1 overflow-y-auto h-screen">
                
                {/* --- DASHBOARD HEADER --- */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-[#050505]/80 px-8 backdrop-blur-md">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
                        <p className="text-xs text-gray-500">Welcome back, {safeUserName}</p>
                    </div>

                
                </header>

                {/* CONTENT BODY */}
                <div className="p-8 pb-20">
                    {/* STATS */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        <StatCard 
                            title="Total Revenue" value="$45,231" trend="+20.1%" trendUp={true} 
                            icon={<CurrencyDollarIcon />} 
                        />
                         <StatCard 
                            title="Active Users" value="2,338" trend="+15%" trendUp={true} 
                            icon={<UsersIcon />} 
                        />
                         <StatCard 
                            title="New Signups" value="120" trend="-5%" trendUp={false} 
                            icon={<UserPlusIcon />} 
                        />
                         <StatCard 
                            title="Server Uptime" value="99.9%" trend="+0.2%" trendUp={true} 
                            icon={<ServerIcon />} 
                        />
                    </div>
                    
                    {/* Chart / Main Content Placeholder */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Chart */}
                        <div className="lg:col-span-2 h-96 rounded-2xl border border-white/5 bg-[#09090b]/50 p-6 flex items-center justify-center text-gray-500 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <span className="relative z-10 flex flex-col items-center gap-2">
                                <ChartBarIcon className="w-10 h-10 opacity-20" />
                                Main Analytics Chart Area
                            </span>
                        </div>

                        {/* Side Panel / Recent Activity */}
                        <div className="h-96 rounded-2xl border border-white/5 bg-[#09090b]/50 p-6">
                            <h3 className="text-sm font-bold text-white mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {[1,2,3,4].map((i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-300 font-medium">New user registered</p>
                                            <p className="text-xs text-gray-500">2 minutes ago</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;