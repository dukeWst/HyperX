import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import {
    ArrowLeft, Package, Edit, Trash2,
    DollarSign, Clock, CheckCircle2, ArrowRight,
    ChevronLeft, ChevronRight, X, Download, AlertTriangle,
    MoreVertical // Import icon 3 chấm dọc (hoặc dùng Menu cho 3 gạch)
} from 'lucide-react';
import UserAvatar from '../../community/UserAvatar';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const relatedListRef = useRef(null);
    
    // 1. Thêm Ref cho menu để xử lý click outside
    const menuRef = useRef(null);

    const [product, setProduct] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // 2. Thêm state để đóng mở menu
    const [showMenu, setShowMenu] = useState(false);

    const KNOWN_OS = ['Windows', 'macOS', 'Linux'];

    // ... (Giữ nguyên các hàm formatCurrency, scroll, handleConfirmDelete)
    const formatCurrency = (amount) => {
        if (amount === 0 || amount === undefined) return "Free";
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const scroll = (direction) => {
        if (relatedListRef.current) {
            const scrollAmount = 340;
            relatedListRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setShowDeleteModal(false);
            navigate('/product'); 
            
        } catch (err) {
            console.error("Error deleting:", err);
            alert("Error deleting product: " + err.message);
            setIsDeleting(false);
        }
    };

    // 3. Xử lý sự kiện click ra ngoài để đóng menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // ... (Giữ nguyên useEffect fetchData)
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (scrollRef.current) scrollRef.current.scrollTop = 0;
                if (id === 'new-product') return;

                const { data: currentProduct, error: productError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (productError) throw productError;

                let authorProfile = {};
                
                if (currentProduct.email_upload) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('email', currentProduct.email_upload)
                        .maybeSingle();
                    
                    if (profileData) {
                        authorProfile = profileData;
                    }
                }

                const productWithProfile = {
                    ...currentProduct,
                    profiles: authorProfile 
                };

                setProduct(productWithProfile);

                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user) setCurrentUser(userData.user);

                let query = supabase
                    .from('products')
                    .select('*')
                    .neq('id', id)
                    .limit(8)
                    .order('created_at', { ascending: false });

                if (currentProduct.tag && Array.isArray(currentProduct.tag) && currentProduct.tag.length > 0) {
                    const firstTag = currentProduct.tag[0];
                    query = query.contains('tag', JSON.stringify([firstTag]));
                }

                const { data: relatedData } = await query;
                setRelatedProducts(relatedData || []);

            } catch (error) {
                console.error("Error loading data:", error);
                setProduct(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const getProductOSTags = () => {
        if (!product || !product.tag) return [];
        return product.tag.filter(t => KNOWN_OS.includes(t));
    };

    const handleDownloadAction = (osName) => {
        alert(`Starting download for ${osName}...`);
        setShowModal(false);
    };

    if (isLoading) return (
        <main className="flex-1 flex-col gap-4 h-screen bg-[#0f172a] p-6 md:px-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
            <div className="text-indigo-500 animate-pulse font-medium">Loading details...</div>
        </main>
    );

    if (!product) return (
        <main className="flex-1 h-screen flex flex-col items-center justify-center bg-[#0f172a] text-slate-400">
            <Package size={64} className="mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-white">Product not found</h2>
            <button onClick={() => navigate('/product')} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-white">
                Back to Products
            </button>
        </main>
    );

    const displayTags = product.tag && Array.isArray(product.tag) ? [...product.tag] : [];
    const userName = product?.profiles?.full_name || product?.name_upload || 'Unknown User';
    const userEmail = product?.profiles?.email || product?.email_upload || 'No Email';

    const uploaderForAvatar = {
        id: product?.profiles?.id || product?.user_id,
        full_name: userName,
        email: userEmail,
        avatar_url: product?.profiles?.avatar_url || null,
    };

    const availableOS = getProductOSTags();
    const isOwner = currentUser && product && (currentUser.email === product.email_upload);

    return (
        <main ref={scrollRef} className="flex-1 flex flex-col h-full relative bg-[#0f172a] overflow-y-auto custom-scrollbar pt-18">

            <div className="p-6 md:px-10 pb-20 max-w-7xl mx-auto w-full">

                {/* 4. Cấu trúc lại Header: Flex justify-between để chia trái phải */}
                <div className="flex justify-between items-center mb-6">
                    {/* Nút Back nằm bên Trái */}
                    <button onClick={() => navigate('/product')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                        <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors"><ArrowLeft size={20} /></div>
                    </button>

                    {/* Menu Options nằm bên Phải (chỉ hiện nếu là Owner) */}
                    {isOwner && (
                        <div className="relative" ref={menuRef}>
                            {/* Nút kích hoạt menu (3 gạch/3 chấm) */}
                            <button 
                                onClick={() => setShowMenu(!showMenu)}
                                className={`p-2 rounded-lg transition-colors ${showMenu ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                            >
                                <MoreVertical size={20} />
                            </button>

                            {/* Dropdown Menu */}
                            {showMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl shadow-black/50 z-20 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                                    <div className="p-1">
                                        <Link 
                                            to={`/product/edit/${product.id}`}
                                            className="flex items-center gap-2 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors w-full text-left"
                                            onClick={() => setShowMenu(false)}
                                        >
                                            <Edit size={16} />
                                            <span>Edit Product</span>
                                        </Link>
                                        
                                        <button 
                                            onClick={() => {
                                                setShowMenu(false);
                                                setShowDeleteModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left"
                                        >
                                            <Trash2 size={16} />
                                            <span>Delete Product</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Phần Grid hiển thị nội dung bên dưới giữ nguyên */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                     {/* ... (Giữ nguyên nội dung bên trong grid) ... */}
                     <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-2 shadow-xl shadow-black/20">
                            <div className="aspect-square w-full bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center group">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <Package size={80} className="text-slate-600 opacity-50" />
                                )}
                            </div>
                        </div>

                        <div className="grid w-full gap-4">
                            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50">
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">Created by</p>
                                <div className='flex items-center gap-3'>
                                    <UserAvatar user={uploaderForAvatar} size="md" />
                                    <div className="overflow-hidden">
                                        <span className='block text-white font-medium truncate'>{userName}</span>
                                        <span className='block text-slate-400 text-xs truncate'>{userEmail}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowModal(true)}
                            className="w-full bg-green-600 p-4 rounded-xl border border-green-700 cursor-pointer hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20 active:scale-95"
                        >
                            <div className="flex items-center justify-center gap-2 text-white">
                                <span className="font-medium">Download Now</span>
                                <span className="text-white font-medium flex items-center bg-green-700/50 px-2 py-0.5 rounded text-sm">
                                    <DollarSign size={14} className="text-white mr-0.5" />
                                    {product.price}
                                </span>
                            </div>
                        </button>
                    </div>

                    <div className="lg:col-span-7 space-y-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{product.name}</h1>
                        </div>

                        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 md:p-8">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">Description</h3>
                            <div className="prose prose-invert max-w-none text-slate-400 leading-relaxed">
                                {product.description ? <p className="whitespace-pre-line">{product.description}</p> : <p className="italic opacity-50">No description provided.</p>}
                            </div>
                        </div>

<div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between py-3 border-b border-slate-700/50">
                                    <span className="text-slate-400">Language</span>
                                    <span className="text-white font-mono text-sm">EN</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-slate-700/50">
                                    <span className="text-slate-400">Created</span>
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Clock size={18} />
                                        <span className="font-medium">{new Date(product.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between py-3 border-b border-slate-700/50">
                                    <span className="text-slate-400">Status</span>
                                    <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle2 size={18} />
                                        <span className="font-medium">Active</span>
                                    </div>
                                </div>
                                <div className="flex justify-between py-3">
                                    <span className="text-slate-400">Tags</span>
                                    {displayTags.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2 justify-end">
                                            {displayTags.map((t, index) => (
                                                <span key={index} className={`text-sm px-3 rounded-full border ${t === "Free" ? "bg-green-500/20 text-green-300 border-green-500/30 font-semibold" : "bg-slate-800 text-slate-300 border-slate-700"}`}>
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {product.instructions && (
                            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 md:p-8">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    Usage Instructions
                                </h3>
                                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                    <p className="whitespace-pre-line">{product.instructions}</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* (Giữ nguyên phần relatedProducts và các Modal bên dưới) */}
                {relatedProducts.length > 0 && (
                    <div className="border-t border-slate-800 pt-10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">More Products</h2>
                            <Link to="/product" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
                                View all <ArrowRight size={16} />
                            </Link>
                        </div>
                        {/* ... (Phần hiển thị list related products giữ nguyên) ... */}
                        <div className="flex items-center gap-2">
                            <button onClick={() => scroll('left')} className="hidden md:flex p-2 text-slate-500 hover:text-white transition-colors bg-transparent border-none outline-none">
                                <ChevronLeft size={40} strokeWidth={1.5} />
                            </button>

                            <div ref={relatedListRef} className="flex-1 flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                                <style>{`.flex-1::-webkit-scrollbar { display: none; }`}</style>
                                {relatedProducts.map((item) => (
                                    <Link to={`/product/${item.id}`} key={item.id} className="group block flex-shrink-0 w-[280px] md:w-[320px] snap-start">
                                        <div className="bg-[#1e293b] rounded-xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 h-full flex flex-col">
                                            <div className="aspect-video bg-slate-800 overflow-hidden relative">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                        <Package size={24} />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-indigo-300 border border-white/10">
                                                    {formatCurrency(item.price)}
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col">
                                                <h3 className="text-white font-semibold line-clamp-1 group-hover:text-indigo-400 transition-colors">{item.name}</h3>
                                                <p className="text-slate-500 text-xs mt-1 line-clamp-2 flex-1">{item.description || "No description"}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <button onClick={() => scroll('right')} className="hidden md:flex p-2 text-slate-500 hover:text-white transition-colors bg-transparent border-none outline-none">
                                <ChevronRight size={40} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* (Giữ nguyên Modal Download và Modal Delete) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                     {/* ... Modal download content ... */}
                     <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowModal(false)}
                    ></div>
                    <div className="relative bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Download size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Select Platform</h3>
                            <p className="text-sm text-slate-400">Choose the version compatible with your device.</p>
                        </div>
                        <div className="space-y-3">
                            {availableOS.length > 0 ? (
                                availableOS.map((os) => (
                                    <button 
                                        key={os}
                                        onClick={() => handleDownloadAction(os)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                                Download for {os}
                                            </span>
                                        </div>
                                        <Download size={18} className="text-slate-500 group-hover:text-indigo-400" />
                                    </button>
                                ))
                            ) : (
                                <button 
                                    onClick={() => handleDownloadAction("Standard")}
                                    className="w-full flex items-center justify-center p-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold transition-colors"
                                >
                                    Download File
                                </button>
                            )}
                        </div>
                        <div className="mt-6 text-center">
                            <p className="text-xs text-slate-500">By downloading, you agree to our Terms of Service.</p>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={() => !isDeleting && setShowDeleteModal(false)}
                    ></div>

                    <div className="relative bg-[#1e293b] border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Delete Product?</h3>
                            <p className="text-sm text-slate-400">
                                Are you sure you want to delete <span className="text-white font-semibold">"{product.name}"</span>? 
                                <br/>This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ProductDetail;