import { Package, Plus, Search, Tag } from 'lucide-react';
import React from 'react'
import { Link } from 'react-router-dom';

const ProductList = ({ handleSearchSubmit, search, isLoading, products, formatCurrency, setSearch }) => {
    return (
        <main className="flex-1 flex flex-col h-full relative bg-[#0f172a] rounded-r-xl overflow-hidden">
            <div className="p-6 md:px-10 md:py-6 pb-10 flex-shrink-0 bg-[#0f172a] z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Products</h1>
                        <p className="text-slate-400 text-sm">Manage and view your inventory.</p>
                    </div>
                    <Link to={'new-product'}>
                        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                            <Plus size={18} />
                            <span>New Product</span>
                        </button>
                    </Link>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative max-w-2xl group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={20} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search products by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 
                                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                    />
                    <button type="submit" className="absolute right-2 top-2 bottom-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 rounded-lg text-sm font-medium transition-colors">
                        Search
                    </button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:px-10 pt-0">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                                {products.map((item) => {
                                    let displayTags = item.tag && Array.isArray(item.tag) ? [...item.tag] : [];


                                    return (
                                        <div key={item.id} className="group bg-[#1e293b] border border-slate-700/50 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col">
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
