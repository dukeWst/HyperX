import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import ProductSidebar from "./ProductSidebar";
import ProductList from "./ProductList";
import { formatCurrency } from "./format";

const ProductPage = () => {
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [sortOption, setSortOption] = useState("newest"); // State mới cho Sort
    const [isLoading, setIsLoading] = useState(false);

    const tagListApplication = ["Software", "Game"];
    const tagListOS = ["Windows", "macOS", "Linux"];

    // Danh sách các lựa chọn Sort
    const sortList = [
        { id: "price_asc", label: "Low to High" },
        { id: "price_desc", label: "High to Low" },
        { id: "free", label: "Free" }
    ];

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            let query = supabase.from("products").select("*");

            // 1. Lọc theo Search
            if (search.trim() !== "") {
                query = query.ilike("name", `%${search}%`);
            }

            // 2. Lọc theo Tag
            if (selectedTags.length > 0) {
                const appTags = selectedTags.filter(tag => tagListApplication.includes(tag));
                const osTags = selectedTags.filter(tag => tagListOS.includes(tag));

                if (appTags.length > 0) {
                    const condition = appTags.map(t => `tag.cs.{${t}}`).join(',');
                    query = query.or(condition);
                }
                if (osTags.length > 0) {
                    const condition = osTags.map(t => `tag.cs.{${t}}`).join(',');
                    query = query.or(condition);
                }
            }

            // 3. Xử lý Sort & Filter đặc biệt (Free)
            switch (sortOption) {
                case "price_asc":
                    query = query.order("price", { ascending: true });
                    break;
                case "price_desc":
                    query = query.order("price", { ascending: false });
                    break;
                case "free":
                    query = query.eq("price", 0); // Lọc chỉ lấy giá = 0
                    query = query.order("created_at", { ascending: false }); // Vẫn sắp xếp theo mới nhất
                    break;
                default: // "newest"
                    query = query.order("created_at", { ascending: false });
                    break;
            }

            const { data, error } = await query;

            if (error) {
                console.error("Lỗi Supabase:", error);
                setProducts([]);
            } else {
                setProducts(data || []);
            }
        } catch (err) {
            console.error("Lỗi code:", err);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, selectedTags, sortOption]); // Thêm sortOption vào dependency

    // Logic handleTagClick (Giữ nguyên)
    const handleTagClick = (tag) => {
        const isAppTag = tagListApplication.includes(tag);
        setSelectedTags((prev) => {
            if (prev.includes(tag)) {
                return prev.filter((t) => t !== tag);
            }
            if (isAppTag) {
                const tagsOnlyOS = prev.filter(t => !tagListApplication.includes(t));
                return [...tagsOnlyOS, tag];
            } else {
                return [...prev, tag];
            }
        });
    };

    // Logic xử lý khi click vào mục Sort
    const handleSortClick = (id) => {
        // Nếu click lại vào mục đang chọn -> bỏ chọn (về mặc định newest)
        if (sortOption === id) {
            setSortOption("newest");
        } else {
            setSortOption(id);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchProducts();
    };

   

    // Hàm clear tất cả filter bao gồm cả sort
    const clearAllFilters = () => {
        setSelectedTags([]);
        setSortOption("newest");
    };

    return (
        <div className="bg-[#0f172a] text-slate-200 font-sans overflow-hidden pt-15 px-4 md:px-24 ">
            <div className="flex h-screen">
                {/* === SIDEBAR === */}
                <ProductSidebar sortList={sortList} sortOption={sortOption} tagListApplication={tagListApplication} selectedTags={selectedTags} tagListOS={tagListOS} handleSortClick={handleSortClick} clearAllFilters={clearAllFilters} handleTagClick={handleTagClick} />

                {/* === MAIN CONTENT (Giữ nguyên) === */}
                <ProductList handleSearchSubmit={handleSearchSubmit} search={search} isLoading={isLoading} products={products} formatCurrency={formatCurrency} setSearch={setSearch} />
            </div>
        </div>
    );
};

export default ProductPage;