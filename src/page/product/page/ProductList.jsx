import { Package, Plus, Search, Tag, Monitor, Gamepad2, Box } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductList = ({ handleSearchSubmit, search, isLoading, products, formatCurrency, setSearch }) => {
    
    const getTagIcon = (tag) => {
        if (tag === "Game") return <Gamepad2 size={12} />;
        if (tag === "Software") return <Box size={12} />;
        if (["Windows", "macOS", "Linux"].includes(tag)) return <Monitor size={12} />;
        return <Tag size={12} />;
    };

    return (
        <main className="flex flex-col h-full relative overflow-hidden bg-transparent">
            
            {/* --- HEADER --- */}
            <div className="flex-shrink-0 px-6 py-6 md:px-8 md:py-8 z-20 bg-[#05050A]/95 backdrop-blur-xl border-b border-white/5 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Marketplace</h1>
                        <p className="text-gray-400 text-sm mt-1">Discover tools, games, and resources.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search Bar */}
                        <form onSubmit={handleSearchSubmit} className="relative group flex-1 md:w-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {/* Đổi màu icon khi focus sang Cyan */}
                                <Search size={16} className="text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                // Đổi viền focus sang Cyan
                                className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-l-xl leading-5 bg-white/5 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm transition-all shadow-lg"
                            />
                        </form>

                        {/* Nút New Product - Thêm shadow Cyan */}
                        <Link to="/create-product">
                            <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2.5 font-bold transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] active:scale-95 text-sm whitespace-nowrap">
                                <Plus size={18} strokeWidth={2.5} />
                                <span className="hidden sm:inline">New Product</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- GRID LIST --- */}
            <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 custom-scrollbar scroll-smooth">
                
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse h-[340px] border border-white/5">
                                <div className="w-full h-40 bg-white/5 rounded-xl mb-4"></div>
                                <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-white/5 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500 border border-dashed border-white/10 rounded-3xl bg-white/5 mx-auto max-w-2xl">
                        <div className="bg-white/5 p-4 rounded-full mb-4">
                            <Package size={48} className="opacity-50" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
                        {products.map((item) => (
                            <Link to={`/product/${item.id}`} key={item.id} className="group relative block h-full">
                                {/* Glow Effect: Đổi sang Cyan-Blue */}
                                <div className="absolute -inset-0.5 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-40 blur transition duration-500"></div>
                                
                                <div className="relative h-full bg-[#0B0D14] border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 group-hover:-translate-y-1">
                                    
                                    {/* Image Section */}
                                    <div className="relative aspect-video overflow-hidden bg-gray-900">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-900/50"><Package size={40} strokeWidth={1.5} /></div>
                                        )}
                                        
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-xl">
                                            <p className={`font-bold text-xs ${item.price === 0 ? "text-cyan-400" : "text-white"}`}>
                                                {formatCurrency(item.price)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-5 flex flex-col flex-1">
                                        {/* Title Hover: Cyan */}
                                        <h3 className="text-lg font-bold text-gray-100 group-hover:text-cyan-400 transition-colors line-clamp-1 mb-2">{item.name}</h3>
                                        <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1 font-light leading-relaxed">{item.description || "No description available."}</p>
                                        
                                        {item.tag && item.tag.length > 0 && (
                                            <div className="flex items-center gap-2 pt-4 border-t border-white/5 flex-wrap">
                                                {item.tag.slice(0, 3).map((t, index) => (
                                                    <span key={index} className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border font-medium bg-white/5 text-gray-400 border-white/10 group-hover:border-cyan-500/30 group-hover:text-cyan-200 transition-colors">
                                                        {getTagIcon(t)} {t}
                                                    </span>
                                                ))}
                                                {item.tag.length > 3 && <span className="text-[10px] text-gray-500 group-hover:text-cyan-500/70 transition-colors">+{item.tag.length - 3}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}

export default ProductList;