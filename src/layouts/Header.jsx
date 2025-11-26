import { Dialog, DialogPanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserIcon, QuestionMarkCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LazyLoading from '../LazyLoading';

const navigation = [
    { name: 'Product', href: '#' },
    { name: 'Features', href: '#' },
    { name: 'Docs', href: '#' },
    { name: 'Support', href: '#' },
];

const Header = () => {
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session?.user) setUser(data.session.user);
        });
        const { data: listener } = supabase.auth.onAuthStateChange(
            (event, session) => setUser(session?.user || null)
        );
        return () => listener.subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true); // hiện màn hình loading
        await supabase.auth.signOut();
        setTimeout(() => {
            setLoggingOut(false); // ẩn màn hình sau 1s
            navigate('/');
        }, 800);
    };

    const headerClasses = `fixed inset-x-0 top-0 z-50 transition-all duration-300 backdrop-blur-md ${scrolled ? 'bg-gray-900/90 shadow-lg' : 'bg-transparent'
        }`;

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
                <div className="hidden lg:flex lg:gap-x-12">
                    {navigation.map((item) => (
                        <a key={item.name} href={item.href} className="text-sm/6 font-semibold text-white">
                            {item.name}
                        </a>
                    ))}
                </div>

                {/* Desktop right menu / avatar */}
                <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center relative">
                    {user ? (
                        <div className="relative">
                            <img
                                src={
                                    user.user_metadata?.avatar_url ||
                                    `https://ui-avatars.com/api/?name=${user.email}`
                                }
                                alt="User Avatar"
                                className="w-10 h-10 rounded-full border-2 border-indigo-500 cursor-pointer"
                                onClick={() => setDropdownOpen((prev) => !prev)}
                            />
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
                                    <div className="py-1">
                                        <Link
                                            to="/profile"
                                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 gap-2"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <UserIcon className="w-5 h-5" /> Profile
                                        </Link>
                                        <Link
                                            to="/help"
                                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 gap-2"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <QuestionMarkCircleIcon className="w-5 h-5" /> Help
                                        </Link>
                                        <Link
                                            to="/setting"
                                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 gap-2"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <Cog6ToothIcon className="w-5 h-5" /> Setting
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 gap-2"
                                        >
                                            <ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                to="/signup"
                                className="text-sm/6 font-semibold text-white border-r mr-8 pr-8"
                            >
                                Sign up
                            </Link>
                            <Link to="/signin" className="text-sm/6 font-semibold text-white">
                                Sign in <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Mobile menu */}
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50" />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-100/10">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="-m-1.5 p-1.5">
                            <span className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-500 bg-clip-text text-transparent">
                                HyperX
                            </span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-gray-200"
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-white/10">
                            <div className="space-y-2 py-6">
                                {navigation.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/5"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                            <div className="py-6">
                                {user ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <img
                                            src={
                                                user.user_metadata?.avatar_url ||
                                                `https://ui-avatars.com/api/?name=${user.email}`
                                            }
                                            alt="User Avatar"
                                            className="w-10 h-10 rounded-full border-2 border-indigo-500"
                                        />
                                        <button
                                            onClick={handleLogout}
                                            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-500 flex items-center gap-2"
                                        >
                                            <ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Link
                                            to="/signin"
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/5"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Sign in
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/5"
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
