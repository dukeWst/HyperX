import { Dialog, DialogPanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserIcon, QuestionMarkCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LazyLoading from '../LazyLoading';

const navigation = [
    { name: 'Product', href: 'product' },
    { name: 'Community', href: 'community' },
    { name: 'Docs', href: 'docs' },
    { name: 'Q&A', href: 'q&a' },
];

// 1. Nhận user từ props
const Header = ({ user }) => {
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // 2. Xóa bỏ state 'user' nội bộ và useEffect fetch data thừa thãi
    // const [user, setUser] = useState(null); <--- XÓA DÒNG NÀY

    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Xóa useEffect fetch supabase ở đây vì App.js đã làm rồi

    const handleLogout = async () => {
        setDropdownOpen(false); // <-- Đóng dropdown ngay
        setLoggingOut(true);
        await supabase.auth.signOut();
        setTimeout(() => {
            setLoggingOut(false);
        }, 800);
    };


    const dropdownRef = useRef(null); // gắn ref cho div chứa dropdown

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const headerClasses = `fixed inset-x-0 top-0 z-50 transition-all duration-300 backdrop-blur-md ${scrolled ? 'bg-gray-900/90 shadow-lg' : 'bg-transparent'}`;

    return (
        <header className={headerClasses}>
            {loggingOut && <LazyLoading status={'Logging out...'} />}
            <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                {/* Logo */}
                <div className="flex lg:flex-1">
                    <Link to="/" className="-m-1.5 p-1.5">
                        <span className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-500 bg-clip-text text-transparent">
                            HyperX
                        </span>
                    </Link>
                </div>

                {/* Mobile menu button */}
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-200"
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon className="w-6 h-6" aria-hidden="true" />
                    </button>
                </div>

                {/* Desktop navigation */}
                {/* Desktop navigation */}
                <div className="hidden lg:flex lg:gap-x-12 relative">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className="relative group py-2" // Class chung cho thẻ a
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-indigo-400' : 'text-white group-hover:text-indigo-400'
                                        }`}>
                                        {item.name}
                                    </span>

                                    {/* Thanh gạch chân animation */}
                                    <span className={`absolute left-0 bottom-0 h-0.5 w-full bg-gradient-to-r from-indigo-400 to-pink-500 transition-transform duration-300 origin-bottom-left ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                        }`} />
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>


                {/* Desktop right menu / avatar */}
                <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center relative">
                    {/* 3. Logic hiển thị: Nếu user tồn tại (được truyền từ App) thì hiện Avatar, ngược lại hiện Sign In */}
                    {user ? (
                        <div className="relative" ref={dropdownRef}> {/* <-- Gắn ref ở đây */}
                            <img
                                src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`}
                                alt="User Avatar"
                                className="w-10 h-10 rounded-full border-2 border-indigo-500 cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setDropdownOpen((prev) => !prev)}
                            />
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
                                    <Link
                                        to="/profile"
                                        className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 gap-2"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <UserIcon className="w-5 h-5" /> Profile
                                    </Link>
                                    <Link
                                        to="/help"
                                        className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 gap-2"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <QuestionMarkCircleIcon className="w-5 h-5" /> Help
                                    </Link>
                                    <Link
                                        to="/setting"
                                        className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 gap-2"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <Cog6ToothIcon className="w-5 h-5" /> Setting
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 gap-2 border-t border-gray-700 mt-1"
                                    >
                                        <ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                to="/signup"
                                className="text-sm/6 font-semibold text-white border-r border-gray-600 mr-6 pr-6 hover:text-indigo-400"
                            >
                                Sign up
                            </Link>
                            <Link to="/signin" className="text-sm/6 font-semibold text-white hover:text-indigo-400">
                                Sign in <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Mobile menu */}
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 p-6 sm:max-w-sm sm:ring-1 sm:ring-white/10 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                            <span className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-500 bg-clip-text text-transparent">
                                HyperX
                            </span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-gray-200 hover:text-white"
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-500/10">
                            <div className="space-y-2 py-6">
                                {navigation.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-gray-800"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                            <div className="py-6 border-t border-gray-700">
                                {user ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3 px-3">
                                            <img
                                                src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`}
                                                alt=""
                                                className="w-10 h-10 rounded-full border border-indigo-500"
                                            />
                                            <div className="text-sm text-gray-300 truncate">{user.email}</div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 flex items-center justify-center gap-2"
                                        >
                                            <ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Link
                                            to="/signin"
                                            className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-white hover:bg-gray-800"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Sign in
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 text-center"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Sign up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    );
};

export default Header;