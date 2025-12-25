import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../routes/supabaseClient';

import {
    ArrowLeft, Package, Edit, Trash2,
    DollarSign, Clock, CheckCircle2,
    ArrowRight, ChevronLeft, ChevronRight,
    X, Download, AlertTriangle, MoreVertical, Monitor
} from 'lucide-react';

import UserAvatar from '../../../components/UserAvatar';

const ProductDetail = () => {

    const { id } = useParams();
    const navigate = useNavigate();

    const scrollRef = useRef(null);
    const relatedListRef = useRef(null); // Ref cho danh sách liên quan
    const menuRef = useRef(null);

    const [product, setProduct] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showMenu, setShowMenu] = useState(false);

    const KNOWN_OS = ["Windows", "macOS", "Linux"];

    const formatCurrency = (amount) => {
        if (amount === 0 || amount === undefined) return "Free";
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    // Hàm cuộn danh sách
    const scroll = (direction) => {
        if (!relatedListRef.current) return;
        const offset = 320; // Khoảng cách cuộn (tương đương chiều rộng card + gap)
        relatedListRef.current.scrollBy({
            left: direction === "left" ? -offset : offset,
            behavior: "smooth"
        });
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase.from("products").delete().eq("id", id);
            if (error) throw error;
            navigate("/product");
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
        setIsDeleting(false);
    };

    const handleDownloadAction = (osName) => {
        const url = product?.download_links?.[osName];
        if (!url) {
            alert(`No installer found for ${osName}`);
            return;
        }
        const a = document.createElement("a");
        a.href = url;
        a.download = `${product.name.replace(/\s+/g, "_")}_${osName}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setShowModal(false);
    };

    useEffect(() => {
        const handler = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            const { data: productData, error } = await supabase.from("products").select("*").eq("id", id).single();

            if (error || !productData) {
                setProduct(null);
                setIsLoading(false);
                return;
            }

            let profile = {};
            if (productData.email_upload) {
                const { data: p } = await supabase.from("profiles").select("*").eq("email", productData.email_upload).maybeSingle();
                if (p) profile = p;
            }

            const enrichedProduct = { ...productData, profiles: profile };
            setProduct(enrichedProduct);

            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) setCurrentUser(userData.user);

            // Fetch related products (Limit 5)
            let query = supabase.from("products")
                .select("*")
                .neq("id", id)
                .limit(5) // --- GIỚI HẠN 5 SẢN PHẨM ---
                .order("created_at", { ascending: false });
                
            if (productData.tag?.[0]) {
                query = query.contains("tag", JSON.stringify([productData.tag[0]]));
            }
            const { data: related } = await query;
            setRelatedProducts(related || []);

            setIsLoading(false);
        })();
    }, [id]);

    const getOSTags = () => {
        if (!product || !product.tag) return [];
        return product.tag.filter(t => KNOWN_OS.includes(t));
    };

    if (isLoading) return (
        <main className="min-h-screen bg-[#05050A] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </main>
    );

    if (!product) return (
        <main className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="p-6 bg-white/5 rounded-full border border-white/10">
                <Package size={48} className="opacity-50" />
            </div>
            <h2 className="text-xl font-bold text-white">Product not found</h2>
            <button onClick={() => navigate("/product")} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all">
                Back to Marketplace
            </button>
        </main>
    );

    const availableOS = getOSTags();
    const userName = product?.profiles?.full_name || product?.name_upload || "Unknown";
    const userEmail = product?.profiles?.email || product?.email_upload || "Unknown";
    const uploaderForAvatar = {
        id: product?.profiles?.id || product?.user_id,
        full_name: userName,
        email: userEmail,
        avatar_url: product?.profiles?.avatar_url || null
    };
    const isOwner = currentUser?.email === product.email_upload;

    return (
        <main ref={scrollRef} className="bg-[#05050A] min-h-screen pt-20 pb-12 relative isolate overflow-hidden">
            
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
            <div className="fixed top-0 right-0 -z-10 w-[40rem] h-[40rem] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 -z-10 w-[40rem] h-[40rem] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="p-4 md:px-8 max-w-7xl mx-auto relative z-10">

                {/* NAV BUTTON */}
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => navigate("/product")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Products
                    </button>

                    {isOwner && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition">
                                <MoreVertical size={20} />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 mt-2 bg-[#0B0D14] border border-white/10 rounded-xl shadow-2xl w-48 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                                    <Link to={`/product/edit/${product.id}`} onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-gray-300 transition-colors">
                                        <Edit size={16} /> Edit Product
                                    </Link>
                                    <button onClick={() => { setShowMenu(false); setShowDeleteModal(true); }} className="flex items-center gap-2 w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors">
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">

                    {/* LEFT SIDE: Image & Actions */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#0B0D14] p-2 rounded-2xl border border-white/10 shadow-2xl">
                            <div className="aspect-square bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center relative group">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <Package size={80} className="text-gray-700" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                        </div>

                        <div className="bg-[#0B0D14]/60 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <UserAvatar user={uploaderForAvatar} size="md" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Creator</p>
                                    <p className="text-white font-medium text-sm">{userName}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 p-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <Download size={20} />
                            Download Now 
                            <span className="bg-black/20 px-2 py-0.5 rounded text-sm ml-1 font-medium border border-white/10">
                                {formatCurrency(product.price)}
                            </span>
                        </button>
                    </div>

                    {/* RIGHT SIDE: Details */}
                    <div className="lg:col-span-7 space-y-8">
                        <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {availableOS.map(os => (
                                    <span key={os} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-medium flex items-center gap-1.5">
                                        <Monitor size={12} /> {os}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">{product.name}</h1>
                            <p className="text-xl text-gray-400 font-light leading-relaxed">{product.description || "No description provided."}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#0B0D14]/40 p-5 rounded-2xl border border-white/5">
                                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Release Date</p>
                                <p className="text-white font-mono">{new Date(product.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-[#0B0D14]/40 p-5 rounded-2xl border border-white/5">
                                <p className="text-gray-500 text-xs uppercase font-bold mb-1">License Type</p>
                                <p className="text-white font-mono">{product.price === 0 ? "Open Source (Free)" : "Commercial License"}</p>
                            </div>
                        </div>

                        {product.instructions && (
                            <div className="bg-[#0B0D14]/60 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-green-500" /> Installation Instructions
                                </h3>
                                <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-line font-mono bg-black/30 p-4 rounded-lg border border-white/5">
                                    {product.instructions}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RELATED PRODUCTS (SLIDER) --- */}
                {relatedProducts.length > 0 && (
                    <div className="border-t border-white/10 pt-10">
                        {/* Header: Title + Navigation */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-white">Related Products</h2>
                            
                            <div className="flex items-center gap-4">
                                <Link to="/product" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                                    View All
                                </Link>
                                <div className="flex gap-2">
                                    <button onClick={() => scroll("left")} className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button onClick={() => scroll("right")} className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Slider Content */}
                        <div 
                            ref={relatedListRef}
                            className="flex gap-6 overflow-x-auto pb-6 snap-x scroll-smooth custom-scrollbar"
                        >
                            {relatedProducts.map((item) => (
                                <Link 
                                    to={`/product/${item.id}`} 
                                    key={item.id} 
                                    className="min-w-[280px] md:min-w-[320px] snap-start group block bg-[#0B0D14] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="aspect-video bg-gray-900 overflow-hidden relative">
                                        {item.image_url ? (
                                            <img src={item.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={item.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-700"><Package size={24} /></div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/60 px-2.5 py-1 rounded-lg text-xs font-bold text-green-400 border border-white/10 backdrop-blur-sm">
                                            {formatCurrency(item.price)}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors text-lg mb-1">{item.name}</h3>
                                        <p className="text-sm text-gray-500 truncate">{item.description}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* DOWNLOAD MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={() => setShowModal(false)}><X size={20} /></button>
                        <h3 className="text-xl font-bold text-white mb-2">Select Platform</h3>
                        <p className="text-gray-400 text-sm mb-6">Choose the installer for your operating system.</p>
                        <div className="space-y-3">
                            {availableOS.map(os => (
                                <button
                                    key={os}
                                    onClick={() => handleDownloadAction(os)}
                                    className="w-full px-4 py-3.5 rounded-xl bg-[#0B0D14] hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/50 text-white flex justify-between items-center transition-all group"
                                >
                                    <span className="font-medium">{os}</span>
                                    <Download size={18} className="text-gray-500 group-hover:text-indigo-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => !isDeleting && setShowDeleteModal(false)} />
                    <div className="relative bg-[#0B0D14] border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><AlertTriangle size={24} /></div>
                        <h3 className="text-lg font-bold text-white mb-2">Delete Product?</h3>
                        <p className="text-gray-400 text-sm mb-6">This action cannot be undone. This will permanently delete your product and all associated files.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors">Cancel</button>
                            <button onClick={handleConfirmDelete} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-900/20">
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ProductDetail;