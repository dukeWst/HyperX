// ProductList.jsx

import { Package, Plus, Search, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductList = ({ handleSearchSubmit, search, isLoading, products, formatCurrency, setSearch }) => {
    return (
        <main className="flex-1 flex flex-col h-full relative bg-[#0f172a] rounded-r-xl overflow-hidden">
            
            {/* PHẦN HEADER CỐ ĐỊNH */}
            <div className="p-4 md:px-6 md:py-6 flex-shrink-0 bg-[#0f172a] z-10 border-b border-slate-800">
                
                {/* DÒNG HỢP NHẤT: Tiêu đề (LEFT) vs. Search + Button (RIGHT) */}
                <div className="flex justify-between items-center gap-4">
                    
                    {/* 1. Tiêu đề và Mô tả (LEFT) */}
                    <div className="flex-shrink-0">
                        <h1 className="text-2xl font-bold text-white">Products</h1>
                        <p className="text-slate-400 text-xs mt-1">Manage your inventory.</p>
                    </div>

                    {/* 2. KHU VỰC TÌM KIẾM VÀ NÚT (RIGHT) */}
                    <div className="flex items-center gap-3">

                        {/* THANH TÌM KIẾM (Đã áp dụng w-1/2) */}
                        <form onSubmit={handleSearchSubmit} className="relative group flex-shrink-0">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search products by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                // Áp dụng w-1/2 cho ô input, đảm bảo nó có kích thước cố định
                                className="w-64 bg-[#1e293b] border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 
                                        focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500 text-sm"
                            />
                            {/* Nút Search ẩn bên trong input */}
                            {/* Bỏ nút submit dạng text bên trong input để tiết kiệm không gian. */}
                        </form>

                        {/* Nút Create Product (RIGHT) */}
                        <Link to="/create-product" className="flex-shrink-0">
                            <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-lg font-medium transition-all shadow-md shadow-indigo-500/20 active:scale-95 text-sm">
                                <Plus size={16} />
                                <span>New Product</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
            {/* KẾT THÚC PHẦN HEADER ĐÃ HỢP NHẤT */}

            <div className="flex-1 overflow-y-auto p-4 md:px-6 pt-0 cursor-pointer custom-scrollbar">
                {isLoading ? (
                    /* === PHẦN LOADING === */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-[#1e293b] rounded-xl p-4 animate-pulse h-80 border border-slate-800">
                                <div className="w-full h-40 bg-slate-700 rounded-lg mb-4"></div>
                                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-[#1e293b]/30">
                                <Package size={64} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">No products found</p>
                                <p className="text-sm">Try adjusting your search or filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-40 pt-4"> 
                                {products.map((item) => {
                                    let displayTags = item.tag && Array.isArray(item.tag) ? [...item.tag] : [];

                                    return (
                                        /* === PHẦN SẢN PHẨM THẬT === */
                                        <Link to={`/product/${item.id}`} key={item.id} className="block group">
                                            <div className="bg-[#1e293b] h-full border border-slate-700/50 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col">
                                                <div className="relative aspect-video overflow-hidden bg-slate-800">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-600"><Package size={32} /></div>
                                                    )}
                                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                                        <p className="text-indigo-400 font-bold text-sm">
                                                            {formatCurrency(item.price)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="p-5 flex flex-col flex-1">
                                                    <div className="mb-2">
                                                        <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{item.name}</h3>
                                                    </div>
                                                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">{item.description || "No description available."}</p>
                                                    {displayTags.length > 0 && (
                                                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-700/50 flex-wrap">
                                                            <Tag size={14} className="text-slate-500 flex-shrink-0" />
                                                            {displayTags.map((t, index) => (
                                                                <span
                                                                    key={index}
                                                                    className={`text-xs px-2 py-1 rounded border ${t === "Free" ? "bg-green-500/20 text-green-300 border-green-500/30 font-semibold" : "bg-slate-800 text-slate-300 border-slate-700"}`}
                                                                >
                                                                    {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    )
}

export default ProductList