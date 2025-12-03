import { Package, Upload, User, CheckCircle, ArrowRight, ArrowLeft, BookOpen, FileCode, Monitor } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Link, useNavigate, useParams } from 'react-router-dom';

const NewProduct = () => {
    
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const { id } = useParams();

    const isEditMode = Boolean(id);

    // ✅ UPDATE 1: Biến xác định đích đến khi back
    const backLink = isEditMode ? `/product/${id}` : "/product";
    const backText = isEditMode ? "Back to Detail" : "Back to Products";

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    // ... (Giữ nguyên các State productData, tags, filesByOS...) ...
    const [productData, setProductData] = useState({
        productName: "", description: "", instructions: "", price: "",
    });
    const [tags, setTags] = useState({ application: "", os: [] });
    const [filesByOS, setFilesByOS] = useState({}); 
    const [selectedImages, setSelectedImages] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState(null);

    // ... (Giữ nguyên useEffect Fetch Data) ...
    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) setUser(user);

                if (isEditMode) {
                    const { data: product, error } = await supabase
                        .from('products')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (error) throw error;
                    if (product) {
                        setProductData({
                            productName: product.name,
                            description: product.description || "",
                            instructions: product.instructions || "",
                            price: product.price
                        });
                        const appTag = product.tag.find(t => ["Software", "Game"].includes(t)) || "";
                        const osTags = product.tag.filter(t => ["Windows", "macOS", "Linux", "Android", "iOS"].includes(t));
                        setTags({ application: appTag, os: osTags });
                        setExistingImageUrl(product.image_url);
                    }
                }
            } catch (error) {
                console.error("Error:", error);
                setMessage("Failed to load product data.");
            } finally { setLoading(false); }
        };
        initData();
    }, [id, isEditMode]);

    // ... (Giữ nguyên các Handlers: handleChange, handleNext, uploadMainImage...) ...
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProductData(prev => ({ ...prev, [name]: value }));
    };
    const handleApplicationSelect = (value) => setTags(prev => ({ ...prev, application: value }));
    const handleOSSelect = (value) => { /* ... Logic cũ ... */ 
        setTags(prev => {
            const exists = prev.os.includes(value);
            let newOSList = exists ? prev.os.filter(os => os !== value) : [...prev.os, value];
            if(exists) { const newFiles = { ...filesByOS }; delete newFiles[value]; setFilesByOS(newFiles); }
            return { ...prev, os: newOSList };
        });
    };
    const handleFileChangeForOS = (e, osName) => { /* ... Logic cũ ... */ 
        if (e.target.files && e.target.files.length > 0) setFilesByOS(prev => ({ ...prev, [osName]: e.target.files }));
    };
    const handleImageChange = (e) => { /* ... Logic cũ ... */ 
         if (e.target.files && e.target.files.length > 0) setSelectedImages(e.target.files);
    };

    const handleNext = () => { /* ... Logic cũ ... */ 
        setMessage("");
        if (currentStep === 1) {
            if (!productData.productName || !tags.application || tags.os.length === 0) {
                setMessage("Please fill in Product Name, Application, and select at least one OS.");
                return;
            }
            if (!productData.price && productData.price !== 0) setProductData(prev => ({ ...prev, price: "0" }));
            setCurrentStep(2);
        } else if (currentStep === 2) setCurrentStep(3);
    };
    const handlePrevious = () => { if (currentStep > 1) { setCurrentStep(prev => prev - 1); setMessage(""); } };

    const uploadMainImage = async (file) => { /* ... Logic cũ ... */
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error } = await supabase.storage.from('product-images').upload(filePath, file);
        if (error) throw error;
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleFinalSubmit = async () => { /* ... Logic cũ ... */ 
        setLoading(true); setMessage(""); setIsSuccess(false);
        if (!user) { setMessage("Error: You must be logged in."); setLoading(false); return; }
        try {
            let finalImageUrl = existingImageUrl;
            if (selectedImages && selectedImages.length > 0) finalImageUrl = await uploadMainImage(selectedImages[0]);
            
            const combinedTags = [tags.application, ...tags.os];
            const payload = {
                name: productData.productName,
                description: productData.description,
                instructions: productData.instructions, 
                price: parseFloat(productData.price) || 0,
                tag: combinedTags, 
                image_url: finalImageUrl,
                ...(isEditMode ? {} : { user_id: user.id, name_upload: user.user_metadata?.full_name || 'Unknown', email_upload: user.email })
            };

            const { error } = isEditMode 
                ? await supabase.from('products').update(payload).eq('id', id)
                : await supabase.from('products').insert([payload]);

            if (error) throw error;
            setMessage(isEditMode ? "Product updated successfully!" : "Product added successfully!");
            setIsSuccess(true);
        } catch (error) { setMessage("Failed: " + error.message); setIsSuccess(false); } 
        finally { setLoading(false); }
    };

    const steps = [
        { id: 1, label: "Product Info", icon: Package },
        { id: 2, label: "Upload Files", icon: Upload },
        { id: 3, label: "Review & Submit", icon: CheckCircle },
    ];

    return (
        <div className="relative isolate px-36 pt-24 bg-gray-900 overflow-hidden text-gray-100 ">
            {/* ... Background Gradient cũ ... */}
            <div className='h-screen mb-24 flex'>
                 <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                    <div style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }} className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[1155px] -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[2300px]" />
                </div>

                <div className="relative w-full max-w-7xl bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 flex overflow-hidden">

                    {/* --- SIDEBAR --- */}
                    <aside className="w-72 border-r border-gray-700 p-8 flex flex-col">
                        <h2 className="text-2xl font-bold mb-8 text-white">
                            {isEditMode ? "Edit Product" : "Create Product"}
                        </h2>
                        {/* ... Steps loop cũ ... */}
                        <div className="space-y-4 flex-1">
                            {steps.map((step) => {
                                const Icon = step.icon;
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                return (
                                    <div key={step.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : isCompleted ? "text-green-400 bg-green-900/20" : "text-gray-500"}`}>
                                        <Icon className={`w-5 h-5 ${isCompleted ? "text-green-400" : ""}`} />
                                        <span className="font-medium">{step.label}</span>
                                        {isCompleted && <CheckCircle className="w-4 h-4 ml-auto" />}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ✅ UPDATE 2: Cancel Link dynamic */}
                        <Link 
                            to={backLink} 
                            className="mt-auto text-center py-3 text-indigo-400 text-sm hover:text-indigo-300 transition"
                        >
                            Cancel & {isEditMode ? "Back to Detail" : "Back to List"}
                        </Link>
                    </aside>

                    {/* --- MAIN CONTENT (Giữ nguyên phần form) --- */}
                    <main className="flex-1 px-10 py-8 overflow-y-auto">
                        {/* ... (STEP 1, 2, 3 content giữ nguyên) ... */}
                        {currentStep === 1 && (
                             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* ... Form Step 1 ... */}
                                <div className="flex items-center mb-8 text-indigo-400"><Package className="w-8 h-8 mr-3" /><h2 className="text-3xl font-bold text-white">Product Information</h2></div>
                                <div className="grid grid-cols-2 gap-12">
                                     <div className="space-y-6">
                                        {/* Inputs... (rút gọn để dễ nhìn) */}
                                        <div><label className="block text-sm font-medium mb-2">Product Name *</label><input type="text" name="productName" value={productData.productName} onChange={handleChange} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white focus:border-indigo-500 outline-none" /></div>
                                        <div><label className="block text-sm font-medium mb-2">Description</label><textarea name="description" rows="4" value={productData.description} onChange={handleChange} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white focus:border-indigo-500 outline-none" /></div>
                                        <div><label className="block text-sm font-medium mb-2">Usage Instructions</label><textarea name="instructions" rows="4" value={productData.instructions} onChange={handleChange} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white focus:border-indigo-500 outline-none" /></div>
                                        <div><label className="block text-sm font-medium mb-2">Price ($)</label><input type="number" name="price" value={productData.price} onChange={handleChange} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white focus:border-indigo-500 outline-none" /></div>
                                     </div>
                                     <div className="space-y-8 border-l border-gray-700 pl-12">
                                        {/* Tags... */}
                                        <div><label className="block text-sm font-medium mb-3 text-indigo-300">Application Type *</label><div className="space-y-3">{["Software", "Game"].map(app => (<label key={app} className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${tags.application === app ? "border-indigo-500 bg-indigo-500/10" : "border-gray-700 hover:border-gray-500"}`}><input type="radio" name="application" checked={tags.application === app} onChange={() => handleApplicationSelect(app)} className="w-4 h-4 accent-indigo-500" /><span className="ml-3 font-medium">{app}</span></label>))}</div></div>
                                        <div><label className="block text-sm font-medium mb-3 text-indigo-300">Supported OS *</label><div className="space-y-3">{["Windows", "macOS", "Linux", "Android", "iOS"].map(os => (<label key={os} className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${tags.os.includes(os) ? "border-indigo-500 bg-indigo-500/10" : "border-gray-700 hover:border-gray-500"}`}><input type="checkbox" checked={tags.os.includes(os)} onChange={() => handleOSSelect(os)} className="w-4 h-4 accent-indigo-500 rounded" /><span className="ml-3 font-medium">{os}</span></label>))}</div></div>
                                     </div>
                                </div>
                             </div>
                        )}
                        {currentStep === 2 && (
                             <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
                                {/* ... Form Step 2 ... */}
                                <div className="flex items-center mb-6 text-indigo-400"><Upload className="w-8 h-8 mr-3" /><h2 className="text-3xl font-bold text-white">Upload Assets</h2></div>
                                {/* Upload Logic ... (Rút gọn) */}
                                <div className="grid grid-cols-1 gap-6"><h3 className="text-lg font-semibold text-indigo-200">Main Product Files</h3>
                                {tags.os.length === 0 ? <div className="p-4 bg-yellow-900/20 text-yellow-400 border border-yellow-700/50 rounded-lg">No OS selected.</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{tags.os.map(osName => (<div key={osName} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700"><div className="flex items-center gap-2 mb-3 text-indigo-300"><Monitor size={18} /><span className="font-semibold">{osName} Package</span></div><div className="relative border-2 border-dashed border-gray-600 hover:border-indigo-500 transition rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer bg-gray-900/50 group"><input type="file" onChange={(e) => handleFileChangeForOS(e, osName)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><FileCode className="w-8 h-8 text-gray-500 group-hover:text-indigo-400 mb-2 transition" /><p className="text-sm text-gray-400 group-hover:text-indigo-300 text-center px-2">{filesByOS[osName] ? <span className="text-green-400 font-medium">{filesByOS[osName][0].name}</span> : (isEditMode ? "Change File (Optional)" : `Upload for ${osName}`)}</p></div></div>))}</div>}
                                <div className="border-t border-gray-700 my-2"></div>
                                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700"><h3 className="text-lg font-semibold mb-2 text-indigo-200">Screenshots & Cover</h3>{isEditMode && existingImageUrl && !selectedImages && (<div className="mb-4"><p className="text-xs text-gray-500 mb-2">Current Cover:</p><img src={existingImageUrl} alt="Current Cover" className="h-32 rounded-lg border border-gray-600 object-cover" /></div>)}<div className="relative border-2 border-dashed border-gray-600 hover:border-indigo-500 transition rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer bg-gray-900/50 group"><input type="file" accept="image/*" multiple onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><Upload className="w-8 h-8 text-gray-500 group-hover:text-indigo-400 mb-2 transition" /><p className="text-sm text-gray-400 group-hover:text-indigo-300">{selectedImages ? `${selectedImages.length} image(s) selected` : "Click or Drag to Change Image"}</p></div></div></div>
                             </div>
                        )}
                        {currentStep === 3 && (
                             <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl">
                                {/* ... Review ... */}
                                <div className="flex items-center mb-8 text-indigo-400"><CheckCircle className="w-8 h-8 mr-3" /><h2 className="text-3xl font-bold text-white">Review & {isEditMode ? "Save" : "Submit"}</h2></div>
                                <div className="space-y-6 bg-gray-800/30 p-8 rounded-2xl border border-white/5">
                                    <div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-gray-400">Product Name</p><p className="font-semibold text-lg">{productData.productName}</p></div><div><p className="text-gray-400">Price</p><p className="font-semibold text-lg text-green-400">${productData.price || 0}</p></div>{/* ... review details ... */}</div>
                                </div>
                             </div>
                        )}

                        {/* --- FOOTER --- */}
                        <div className="mt-8 pt-6 border-t border-gray-700/50">
                            {message && <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold flex items-center ${isSuccess ? "bg-green-900/30 text-green-400 border border-green-800" : "bg-red-900/30 text-red-400 border border-red-800"}`}>{message}</div>}

                            <div className="flex justify-between items-center">
                                {currentStep > 1 && !isSuccess ? (<button onClick={handlePrevious} className="flex items-center px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>) : (<div></div>)}

                                {currentStep < 3 ? (
                                    <button onClick={handleNext} className="flex items-center px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition">Next Step <ArrowRight className="w-4 h-4 ml-2" /></button>
                                ) : (
                                    <>
                                        {isSuccess ? (
                                            /* ✅ UPDATE 3: Back Button dynamic */
                                            <Link
                                                to={backLink} 
                                                className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition"
                                            >
                                                <ArrowLeft className="w-4 h-4 mr-2" /> {backText}
                                            </Link>
                                        ) : (
                                            <button onClick={handleFinalSubmit} disabled={loading} className={`flex items-center px-8 py-3 rounded-xl font-bold text-white shadow-lg transition ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-green-600 hover:bg-green-500 shadow-green-600/20"}`}>{loading ? 'Processing...' : (isEditMode ? 'Save Changes' : 'Submit Product')}</button>
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