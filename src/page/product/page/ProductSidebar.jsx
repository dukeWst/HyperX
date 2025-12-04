import { ArrowUpDown, Tag, X } from 'lucide-react';
import React from 'react'

const ProductSidebar = ({ sortList, sortOption, tagListApplication, selectedTags, tagListOS, handleSortClick, clearAllFilters, handleTagClick }) => {
    return (
        <aside className="w-64 border-r border-slate-800 bg-[#1e293b]/50 hidden md:block flex-shrink-0 overflow-y-auto rounded-l-xl">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6 text-indigo-400">
                    <Tag size={20} />
                    <h2 className="font-bold text-lg">Filters</h2>
                </div>

                <div className="space-y-6">
                    {/* === MỤC MỚI: SORT === */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <ArrowUpDown size={14} className="text-slate-400" />
                            <h3 className="text-slate-400 text-xs font-semibold uppercase">Sort By Price</h3>
                        </div>
                        <div className="space-y-2">
                            {sortList.map((item) => {
                                const isActive = sortOption === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSortClick(item.id)}
                                        className={`
                                                group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
                                                ${isActive
                                                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                                : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"}
                                            `}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Dùng hình tròn (Radio style) cho Sort vì chỉ chọn 1 */}
                                            <div className={`
                                                    w-4 h-4 rounded-full border flex items-center justify-center transition-colors
                                                    ${isActive ? "bg-indigo-500 border-indigo-500" : "border-slate-600 group-hover:border-slate-400"}
                                                `}>
                                                {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-800 my-4" /> {/* Đường kẻ ngăn cách */}

                    {/* Application Tags */}
                    <div>
                        <h3 className="text-slate-400 text-xs font-semibold uppercase mb-3">Application</h3>
                        <div className="space-y-2">
                            {tagListApplication.map((tag) => {
                                const isActive = selectedTags.includes(tag);
                                return (
                                    <div key={tag} onClick={() => handleTagClick(tag)} className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${isActive ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? "bg-indigo-500 border-indigo-500" : "border-slate-600 group-hover:border-slate-400"}`}>
                                                {isActive && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <span className="text-sm font-medium">{tag}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* OS Tags */}
                    <div>
                        <h3 className="text-slate-400 text-xs font-semibold uppercase mb-3">Operating System</h3>
                        <div className="space-y-2">
                            {tagListOS.map((tag) => {
                                const isActive = selectedTags.includes(tag);
                                return (
                                    <div key={tag} onClick={() => handleTagClick(tag)} className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${isActive ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? "bg-indigo-500 border-indigo-500" : "border-slate-600 group-hover:border-slate-400"}`}>
                                                {isActive && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <span className="text-sm font-medium">{tag}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {(selectedTags.length > 0 || sortOption !== "newest") && (
                        <button
                            onClick={clearAllFilters}
                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors w-full justify-center pt-4 border-t border-slate-800"
                        >
                            <X size={14} /> Clear all filters
                        </button>
                    )}
                </div>
            </div>
        </aside>
    )
}

export default ProductSidebar
