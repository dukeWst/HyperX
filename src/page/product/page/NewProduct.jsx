import { Package, Upload, User, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient'; // Đảm bảo đường dẫn đúng
import { Link } from 'react-router-dom';

const NewProduct = ({ user }) => {
    // Chỉ dùng 1 biến state duy nhất để quản lý các bước (Step 1, 2, 3)
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    // State cho dữ liệu text
    const [productData, setProductData] = useState({
        productName: "",
        description: "",
        price: "",
    });

    // State cho Tags
    const [tags, setTags] = useState({
        application: "",      // Software | Game
        os: []                // Windows | macOS | Linux
    });

    // State cho Files (Chuẩn bị cho việc Upload lên Storage sau này)
    const [selectedFiles, setSelectedFiles] = useState(null);
    const [selectedImages, setSelectedImages] = useState(null);

    // --- HANDLERS ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProductData(prev => ({ ...prev, [name]: value }));
    };

    const handleApplicationSelect = (value) => {
        setTags(prev => ({ ...prev, application: value }));
    };

    const handleOSSelect = (value) => {
        setTags(prev => {
            const exists = prev.os.includes(value);
            if (exists) {
                return { ...prev, os: prev.os.filter(os => os !== value) };
            } else {
                return { ...prev, os: [...prev.os, value] };
            }
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(e.target.files);
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedImages(e.target.files);
        }
    };

    // --- NAVIGATION LOGIC ---

    const handleNext = () => {
        setMessage("");
        if (currentStep === 1) {
            // Validate Step 1
            if (!productData.productName || !tags.application || tags.os.length === 0) {
                setMessage("Please fill in Product Name, Application, and select at least one OS.");
                return;
            }
            if (!productData.price) {
                // Nếu giá rỗng, set về 0 hoặc bắt nhập
                setProductData(prev => ({ ...prev, price: "0" }));
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            // Validate Step 2 (Optional: Bắt buộc phải có file mới cho qua?)
            // if (!selectedFiles) { setMessage("Please upload product files."); return; }
            setCurrentStep(3);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            setMessage("");
        }
    };

    // --- SUBMIT LOGIC (CHỈ GỌI Ở BƯỚC CUỐI) ---

    const handleFinalSubmit = async () => {
        setLoading(true);
        setMessage("");
        setIsSuccess(false);

        try {
            // 1. Chuẩn bị dữ liệu Tags cho cột JSONB
            const combinedTags = [tags.application, ...tags.os];

            // 2. Chuẩn bị object Insert
            const newProduct = {
                name: productData.productName,
                description: productData.description,
                price: parseFloat(productData.price) || 0,
                tag: combinedTags, // Supabase client tự convert mảng thành JSONB
                user_id: user?.id, // Rất quan trọng: cần user đã login
                // Thông tin người upload (như yêu cầu cũ của bạn)
                name_upload: user?.user_metadata?.full_name || user?.email || 'Unknown',
                email_upload: user?.email || '',
                // image_url: ... (Xử lý upload ảnh lên Storage lấy link điền vào đây sau)
            };

            // 3. Gọi Supabase Insert
            const { data, error } = await supabase.from('products').insert([newProduct]);

            if (error) throw error;

            setMessage("Product added successfully!");
            setIsSuccess(true);

            // Reset form hoặc chuyển hướng
            // setTimeout(() => window.location.href = '/product', 2000);

        } catch (error) {
            setMessage("Failed to add product: " + error.message);
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    // Danh sách các bước để render Sidebar
    const steps = [
        { id: 1, label: "Product Info", icon: Package },
        { id: 2, label: "Upload Files", icon: Upload },
        { id: 3, label: "Review & Submit", icon: CheckCircle },
    ];

    return (
        <div className="relative isolate px-36 pt-24 bg-gray-900 overflow-hidden text-gray-100 ">
            {/* Background Gradient */}
            <div className='h-screen mb-24 flex'>
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                    <div
                        style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}
                        className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[1155px] -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[2300px]"
                    />
                </div>

                <div className="relative w-full max-w-7xl bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 flex overflow-hidden">

                    {/* --- SIDEBAR --- */}
                    <aside className="w-72 border-r border-gray-700 p-8 flex flex-col">
                        <h2 className="text-2xl font-bold mb-8 text-white">Create Product</h2>

                        <div className="space-y-4 flex-1">
                            {steps.map((step) => {
                                const Icon = step.icon;
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;

                                return (
                                    <div
                                        key={step.id}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                            : isCompleted
                                                ? "text-green-400 bg-green-900/20"
                                                : "text-gray-500"
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isCompleted ? "text-green-400" : ""}`} />
                                        <span className="font-medium">{step.label}</span>
                                        {isCompleted && <CheckCircle className="w-4 h-4 ml-auto" />}
                                    </div>
                                );
                            })}
                        </div>

                        <Link to="/product" className="mt-auto text-center py-3 text-indigo-400 text-sm hover:text-indigo-300 transition">
                            Cancel & Back to Products
                        </Link>
                    </aside>

                    {/* --- MAIN CONTENT --- */}
                    <main className="flex-1 px-10 py-8 overflow-y-auto">

                        {/* STEP 1: PRODUCT INFO */}
                        {currentStep === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center mb-8 text-indigo-400">
                                    <Package className="w-8 h-8 mr-3" />
                                    <h2 className="text-3xl font-bold text-white">Product Information</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-12">
                                    {/* Left Column: Inputs */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Product Name *</label>
                                            <input
                                                type="text"
                                                name="productName"
                                                value={productData.productName}
                                                onChange={handleChange}
                                                placeholder="Ex: Cyber Drift 2077"
                                                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Description</label>
                                            <textarea
                                                name="description"
                                                rows="4"
                                                value={productData.description}
                                                onChange={handleChange}
                                                placeholder="What is this product about?"
                                                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Price ($)</label>
                                            <input
                                                type="number"
                                                name="price"
                                                value={productData.price}
                                                onChange={handleChange}
                                                min="0"
                                                placeholder="0"
                                                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column: Tags */}
                                    <div className="space-y-8 border-l border-gray-700 pl-12">
                                        <div>
                                            <label className="block text-sm font-medium mb-3 text-indigo-300">Application Type *</label>
                                            <div className="space-y-3">
                                                {["Software", "Game"].map(app => (
                                                    <label key={app} className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${tags.application === app ? "border-indigo-500 bg-indigo-500/10" : "border-gray-700 hover:border-gray-500"}`}>
                                                        <input
                                                            type="radio"
                                                            name="application"
                                                            checked={tags.application === app}
                                                            onChange={() => handleApplicationSelect(app)}
                                                            className="w-4 h-4 accent-indigo-500"
                                                        />
                                                        <span className="ml-3 font-medium">{app}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-3 text-indigo-300">Supported OS *</label>
                                            <div className="space-y-3">
                                                {["Windows", "macOS", "Linux"].map(os => (
                                                    <label key={os} className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${tags.os.includes(os) ? "border-indigo-500 bg-indigo-500/10" : "border-gray-700 hover:border-gray-500"}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={tags.os.includes(os)}
                                                            onChange={() => handleOSSelect(os)}
                                                            className="w-4 h-4 accent-indigo-500 rounded"
                                                        />
                                                        <span className="ml-3 font-medium">{os}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: UPLOAD FILES */}
                        {currentStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
                                <div className="flex items-center mb-6 text-indigo-400">
                                    <Upload className="w-8 h-8 mr-3" />
                                    <h2 className="text-3xl font-bold text-white">Upload Assets</h2>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {/* Product Files Area */}
                                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                        <h3 className="text-lg font-semibold mb-2 text-indigo-200">Main Product Files</h3>
                                        <p className="text-sm text-gray-400 mb-4">Upload the installer, zip file, or documentation.</p>

                                        <div className="relative border-2 border-dashed border-gray-600 hover:border-indigo-500 transition rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer bg-gray-900/50 group">
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <Upload className="w-8 h-8 text-gray-500 group-hover:text-indigo-400 mb-2 transition" />
                                            <p className="text-sm text-gray-400 group-hover:text-indigo-300">
                                                {selectedFiles ? `${selectedFiles.length} file(s) selected` : "Click or Drag files here"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Images Area */}
                                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                        <h3 className="text-lg font-semibold mb-2 text-indigo-200">Screenshots & Cover</h3>
                                        <p className="text-sm text-gray-400 mb-4">Visuals to display on the store page.</p>

                                        <div className="relative border-2 border-dashed border-gray-600 hover:border-indigo-500 transition rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer bg-gray-900/50 group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <Upload className="w-8 h-8 text-gray-500 group-hover:text-indigo-400 mb-2 transition" />
                                            <p className="text-sm text-gray-400 group-hover:text-indigo-300">
                                                {selectedImages ? `${selectedImages.length} image(s) selected` : "Click or Drag images here"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: REVIEW & SUBMIT */}
                        {currentStep === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl">
                                <div className="flex items-center mb-8 text-indigo-400">
                                    <CheckCircle className="w-8 h-8 mr-3" />
                                    <h2 className="text-3xl font-bold text-white">Review & Submit</h2>
                                </div>

                                <div className="space-y-6 bg-gray-800/30 p-8 rounded-2xl border border-white/5">
                                    {/* Summary */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-400">Product Name</p>
                                            <p className="font-semibold text-lg">{productData.productName}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Price</p>
                                            <p className="font-semibold text-lg text-green-400">${productData.price || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Type</p>
                                            <p className="font-medium">{tags.application}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">OS Support</p>
                                            <div className="flex gap-2 mt-1">
                                                {tags.os.map(os => (
                                                    <span key={os} className="bg-gray-700 px-2 py-1 rounded text-xs">{os}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-700 my-4"></div>

                                    {/* Uploader Info (Read Only) */}
                                    <div>
                                        <h3 className="text-indigo-300 font-semibold mb-4 flex items-center">
                                            <User className="w-4 h-4 mr-2" /> Uploader Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 uppercase">Full Name</label>
                                                <div className="bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-700 text-gray-300 mt-1">
                                                    {user?.user_metadata?.full_name || "Unknown"}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 uppercase">Email</label>
                                                <div className="bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-700 text-gray-300 mt-1">
                                                    {user?.email || "Unknown"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- FOOTER: MESSAGE & BUTTONS --- */}
                        {/* --- FOOTER: MESSAGE & BUTTONS --- */}
                        <div className="mt-8 pt-6 border-t border-gray-700/50">
                            {message && (
                                <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold flex items-center ${isSuccess ? "bg-green-900/30 text-green-400 border border-green-800" : "bg-red-900/30 text-red-400 border border-red-800"}`}>
                                    {message}
                                </div>
                            )}

                            <div className="flex justify-between items-center">

                                {/* BUTTON LEFT: BACK */}
                                {/* Chỉ hiện nút Back khi ở bước > 1 VÀ chưa submit thành công */}
                                {currentStep > 1 && !isSuccess ? (
                                    <button
                                        onClick={handlePrevious}
                                        className="flex items-center px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                    </button>
                                ) : (
                                    <div></div> /* Spacer giữ khoảng cách */
                                )}

                                {/* BUTTON RIGHT: NEXT / SUBMIT / BACK TO PRODUCT */}
                                {currentStep < 3 ? (
                                    <button
                                        onClick={handleNext}
                                        className="flex items-center px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition"
                                    >
                                        Next Step <ArrowRight className="w-4 h-4 ml-2" />
                                    </button>
                                ) : (
                                    // Đang ở Step 3 (Review & Submit)
                                    <>
                                        {isSuccess ? (
                                            // TRƯỜNG HỢP THÀNH CÔNG -> Hiện nút về trang chủ
                                            <Link
                                                to="/product"
                                                className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition"
                                            >
                                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
                                            </Link>
                                        ) : (
                                            // TRƯỜNG HỢP CHƯA SUBMIT -> Hiện nút Submit
                                            <button
                                                onClick={handleFinalSubmit}
                                                disabled={loading}
                                                className={`flex items-center px-8 py-3 rounded-xl font-bold text-white shadow-lg transition ${loading
                                                    ? "bg-gray-600 cursor-not-allowed"
                                                    : "bg-green-600 hover:bg-green-500 shadow-green-600/20"
                                                    }`}
                                            >
                                                {loading ? 'Processing...' : 'Submit Product'}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                    </main>
                </div>
            </div>
        </div>
    );
};

export default NewProduct;