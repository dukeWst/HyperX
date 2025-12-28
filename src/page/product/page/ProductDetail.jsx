import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../routes/supabaseClient';

import {
    ArrowLeft, Package, Edit, Trash2,
    DollarSign, Clock, CheckCircle2,
    ArrowRight, ChevronLeft, ChevronRight,
    X, Download, AlertTriangle, MoreVertical, Monitor,
    Mail
} from 'lucide-react';

import UserAvatar from '../../../components/UserAvatar';

const ProductDetail = ({ user }) => {

    const { id } = useParams();
    const navigate = useNavigate();

    const scrollRef = useRef(null);
    const relatedListRef = useRef(null);
    const menuRef = useRef(null);

    const [product, setProduct] = useState(null);

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

    const scroll = (direction) => {
        if (!relatedListRef.current) return;
        const offset = 320;
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

    const handleDownloadAction = async (osName) => {
        const url = product?.download_links?.[osName];
        if (!url) {
            alert(`No installer found for ${osName}`);
            return;
        }

        try {
            // Extract original name from storage path (remove timestamp prefix)
            const rawName = url.split('/').pop().split('?')[0];
            const originalName = rawName.includes('_') ? rawName.split('_').slice(1).join('_') : rawName;
            const finalDownloadName = originalName || `${product.name.replace(/\s+/g, "_")}_${osName}`;

            setShowModal(false);
            
            // Fetch file as blob to force custom filename (bypass cross-origin limitation)
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network response was not ok");
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = finalDownloadName;
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed:", err);
            // Fallback to direct link if fetch fails
            const a = document.createElement("a");
            a.href = url;
            a.target = "_blank";
            a.click();
        }
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

            let query = supabase.from("products")
                .select("*")
                .neq("id", id)
                .limit(5)
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

    if (isLoading) return <ProductDetailSkeleton />;

    if (!product) return (
        <main className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="p-6 bg-white/5 rounded-full border border-white/10">
                <Package size={48} className="opacity-50" />
            </div>
            <h2 className="text-xl font-bold text-white">Product not found</h2>
            {/* UPDATED: Cyan Button */}
            <button onClick={() => navigate("/product")} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)]">
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
    const isOwner = user?.id === product?.user_id || user?.email === product?.email_upload;

    return (
        <main ref={scrollRef} className="bg-[#05050A] min-h-screen pt-20 pb-12 relative isolate overflow-hidden">
            
            {/* UPDATED: Background Effects to Cyan/Blue */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
            <div className="fixed top-0 right-0 -z-10 w-[40rem] h-[40rem] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 -z-10 w-[40rem] h-[40rem] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

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
                        <div className="group relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative bg-[#0B0D14] p-2 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                                <div className="aspect-square bg-gray-900/50 rounded-xl overflow-hidden flex items-center justify-center relative">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <Package size={80} className="text-gray-700" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                                </div>
                            </div>
                        </div>

                        {/* ENHANCED CREATOR CARD */}
                        <div className="bg-[#0B0D14]/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Package size={80} className="rotate-12" />
                            </div>
                            <div className="relative flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-cyan-500/20 rounded-full blur group-hover:opacity-100 opacity-0 transition"></div>
                                    <UserAvatar user={uploaderForAvatar} size="lg" className="relative border-2 border-white/10" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-cyan-500 uppercase font-black tracking-[0.2em] mb-1">Published By</p>
                                    <h3 className="text-white font-bold text-lg truncate mb-0.5">{userName}</h3>
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <Mail size={12} className="text-gray-600" />
                                        <p className="text-xs truncate font-medium">{userEmail}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowModal(true)}
                                className="w-full relative group overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-4 text-white font-bold text-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(8,145,178,0.4)] hover:-translate-y-0.5 active:scale-[0.98]"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <div className="relative flex items-center justify-center gap-3">
                                    <Download size={22} className="group-hover:bounce" />
                                    <span>Get {product.name}</span>
                                    <span className="bg-black/20 px-3 py-1 rounded-lg text-sm font-mono border border-white/10">
                                        {formatCurrency(product.price)}
                                    </span>
                                </div>
                            </button>
                            
                            <p className="text-[10px] text-center text-gray-500 font-medium uppercase tracking-widest">
                                Safe & Secure Checkout with HyperX
                            </p>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Details */}
                    <div className="lg:col-span-7 space-y-10">
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {availableOS.map(os => (
                                    <span key={os} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-500/20 transition-all cursor-default">
                                        <Monitor size={12} /> {os}
                                    </span>
                                ))}
                                {product.tag?.map(t => !KNOWN_OS.includes(t) && (
                                    <span key={t} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                        {t}
                                    </span>
                                ))}
                            </div>
                            
                            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                                {product.name}
                            </h1>
                            
                            <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                            
                            <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed max-w-2xl">
                                {product.description || "No description provided."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="group bg-[#0B0D14]/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                        <Clock size={18} />
                                    </div>
                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Release Date</p>
                                </div>
                                <p className="text-white font-mono text-lg">{new Date(product.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            
                            <div className="group bg-[#0B0D14]/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">License Type</p>
                                </div>
                                <p className="text-white font-mono text-lg">{product.price === 0 ? "Open Source / Free" : "Pro Commercial License"}</p>
                            </div>
                        </div>

                        {product.instructions && (
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-2xl blur opacity-50"></div>
                                <div className="relative bg-[#0B0D14]/80 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-black">
                                            <Monitor size={18} />
                                        </div>
                                        Setup & Installation
                                    </h3>
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <div className="font-mono text-sm text-gray-300 leading-relaxed bg-black/40 p-6 rounded-xl border border-white/5 whitespace-pre-line selection:bg-cyan-500/30">
                                            {product.instructions}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RELATED PRODUCTS (SLIDER) --- */}
                {relatedProducts.length > 0 && (
                    <div className="border-t border-white/10 pt-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-white">Related Products</h2>
                            
                            <div className="flex items-center gap-4">
                                {/* UPDATED: View All Color */}
                                <Link to="/product" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
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
                                    className="w-[280px] md:w-[320px] flex-shrink-0 snap-start group block bg-[#0B0D14] border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1 relative"
                                >
                                    {/* UPDATED: Glow Effect */}
                                    <div className="absolute -inset-0.5 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-30 blur transition duration-500"></div>
                                    
                                    <div className="relative h-full bg-[#0B0D14] rounded-2xl overflow-hidden flex flex-col">
                                        <div className="aspect-video bg-gray-900 overflow-hidden relative">
                                            {item.image_url ? (
                                                <img src={item.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={item.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-700"><Package size={24} /></div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-black/60 px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-400 border border-white/10 backdrop-blur-sm">
                                                {formatCurrency(item.price)}
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            {/* UPDATED: Title Hover Color */}
                                            <h3 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors text-lg mb-1">{item.name}</h3>
                                            <p className="text-sm text-gray-500 truncate">{item.description}</p>
                                        </div>
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
                                    // UPDATED: Hover Colors for Modal Buttons
                                    className="w-full px-4 py-3.5 rounded-xl bg-[#0B0D14] hover:bg-cyan-600/10 border border-white/10 hover:border-cyan-500/50 text-white flex justify-between items-center transition-all group"
                                >
                                    <span className="font-medium">{os}</span>
                                    <Download size={18} className="text-gray-500 group-hover:text-cyan-400" />
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

// --- SKELETON COMPONENTS ---
const ProductDetailSkeleton = () => (
    <main className="bg-[#05050A] min-h-screen pt-20 pb-12 relative isolate overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
        <div className="p-4 md:px-8 max-w-7xl mx-auto relative z-10">
            <div className="flex justify-between items-center mb-8">
                <div className="h-6 w-32 skeleton rounded-md opacity-50"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
                {/* LEFT SIDE */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-[#0B0D14] p-2 rounded-2xl border border-white/10 shadow-2xl">
                        <div className="aspect-square skeleton-cyan rounded-xl"></div>
                    </div>
                    {/* ENHANCED CREATOR SKELETON */}
                    <div className="bg-[#0B0D14]/60 p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full skeleton opacity-50"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-20 skeleton rounded opacity-30"></div>
                            <div className="h-5 w-32 skeleton rounded opacity-50"></div>
                            <div className="h-3 w-40 skeleton rounded opacity-20"></div>
                        </div>
                    </div>
                    <div className="h-16 w-full skeleton-cyan rounded-xl"></div>
                </div>

                {/* RIGHT SIDE */}
                <div className="lg:col-span-7 space-y-10">
                    <div className="space-y-6">
                        <div className="flex gap-2">
                            <div className="h-7 w-24 skeleton rounded-lg opacity-30"></div>
                            <div className="h-7 w-24 skeleton rounded-lg opacity-20"></div>
                        </div>
                        <div className="h-16 w-3/4 skeleton rounded-xl"></div>
                        <div className="h-1 w-20 skeleton rounded-full opacity-40"></div>
                        <div className="space-y-3">
                            <div className="h-5 w-full skeleton rounded opacity-40"></div>
                            <div className="h-5 w-5/6 skeleton rounded opacity-30"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-24 skeleton rounded-2xl opacity-20"></div>
                        <div className="h-24 skeleton rounded-2xl opacity-20"></div>
                    </div>

                    <div className="h-64 skeleton rounded-2xl opacity-10"></div>
                </div>
            </div>

            {/* RELATED PRODUCTS SKELETON */}
            <div className="border-t border-white/10 pt-10">
                <div className="flex justify-between items-center mb-6">
                    <div className="h-10 w-56 skeleton rounded-xl"></div>
                    <div className="flex gap-2">
                        <div className="h-10 w-10 skeleton rounded-full opacity-30"></div>
                        <div className="h-10 w-10 skeleton rounded-full opacity-30"></div>
                    </div>
                </div>
                <div className="flex gap-6 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="min-w-[320px] aspect-video skeleton rounded-2xl opacity-20"></div>
                    ))}
                </div>
            </div>
        </div>
    </main>
);
