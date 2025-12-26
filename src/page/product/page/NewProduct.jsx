import React, { useEffect, useState } from "react";
import { Package, Upload, CheckCircle, ArrowRight, ArrowLeft, X, Monitor, Image as ImageIcon } from "lucide-react";
import { supabase } from "../../../routes/supabaseClient";
import { Link, useNavigate, useParams } from "react-router-dom";

const NotificationModal = ({ message, isVisible, onClose }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[#1e293b] border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 flex-shrink-0">
            <X size={24} />
          </div>
          <div>
            <h3 className="text-lg text-white font-bold">Invalid File</h3>
            <p className="text-gray-400 mt-1 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="text-right mt-6">
          <button onClick={onClose} className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-xl text-white font-medium transition-colors shadow-lg shadow-red-900/20">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ProcessingModal = ({ isVisible, imageProgress, uploadProgress, osTags, filesByOS, selectedImage }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md"></div>
      <div className="relative bg-[#0B0D14] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-4 animate-pulse">
            <Upload size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white">Processing Product</h3>
          <p className="text-gray-400 mt-2">Please wait while we upload your assets and save data.</p>
        </div>

        <div className="space-y-6">
          {selectedImage && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300 flex items-center gap-2">
                  <ImageIcon size={16} className="text-cyan-400" /> Cover Image
                </span>
                <span className="text-cyan-400 font-medium">{imageProgress}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 h-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                  style={{ width: `${imageProgress}%` }} 
                />
              </div>
            </div>
          )}

          {osTags.map((os) => {
            if (!filesByOS[os]) return null;
            const progress = uploadProgress[os] || 0;
            return (
              <div key={os} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Package size={16} className="text-cyan-400" /> {os} Installer
                  </span>
                  <span className="text-cyan-400 font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 h-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-3 py-3 px-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-[0.2em]">Secure Upload in Progress</span>
        </div>
      </div>
    </div>
  );
};

const KNOWN_OS = ["Windows", "macOS", "Linux"];

const VALID_EXT = {
  Windows: ["exe", "msi", "zip", "rar"],
  macOS: ["dmg", "pkg", "zip", "app", "tar"],
  Linux: ["deb", "rpm", "appimage", "tar.gz", "sh"]
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB default limit

const ACCEPT_ATTR = {
  Windows: ".exe, .msi, .zip, .rar",
  macOS: ".dmg, .pkg, .zip, .app, .tar",
  Linux: ".deb, .rpm, .AppImage, .tar.gz, .sh"
};

const NewProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [price, setPrice] = useState("");
  const [applicationType, setApplicationType] = useState("");
  const [osTags, setOsTags] = useState([]);

  const [filesByOS, setFilesByOS] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [existingDownloadLinks, setExistingDownloadLinks] = useState({});

  const [uploadProgress, setUploadProgress] = useState({});
  const [imageProgress, setImageProgress] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);

      if (isEditMode) {
        const { data: product } = await supabase.from("products").select("*").eq("id", id).single();
        if (product) {
          setProductName(product.name || "");
          setDescription(product.description || "");
          setInstructions(product.instructions || "");
          setPrice(product.price ?? "");
          const app = Array.isArray(product.tag) ? product.tag.find((t) => ["Software", "Game"].includes(t)) || "" : "";
          const os = Array.isArray(product.tag) ? product.tag.filter((t) => KNOWN_OS.includes(t)) : [];
          setApplicationType(app);
          setOsTags(os);
          setExistingImageUrl(product.image_url || null);
          setExistingDownloadLinks(product.download_links || {});
        }
      }
    })();
  }, [id, isEditMode]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const getExtension = (fileName) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".tar.gz")) return "tar.gz";
    const parts = lower.split(".");
    return parts.length > 1 ? parts.pop() : "";
  };

  const isFileAllowed = (fileName, osName) => {
    const ext = getExtension(fileName);
    return VALID_EXT[osName]?.includes(ext);
  };

  const handleOSToggle = (os) => {
    setOsTags((prev) => {
      const exists = prev.includes(os);
      if (exists) {
        const copy = prev.filter((x) => x !== os);
        setFilesByOS((f) => {
          const copyF = { ...f };
          delete copyF[os];
          return copyF;
        });
        return copy;
      } else {
        return [...prev, os];
      }
    });
  };

  const handleFileChange = (e, os) => {
    setModalMessage("");
    setIsModalVisible(false);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isFileAllowed(file.name, os)) {
      setModalMessage(`File type does not match ${os}. Accepted: ${ACCEPT_ATTR[os]}`);
      setIsModalVisible(true);
      e.target.value = null;
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setModalMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Please contact administrator or increase the limit.`);
      setIsModalVisible(true);
      e.target.value = null;
      return;
    }

    setFilesByOS((prev) => ({ ...prev, [os]: file }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadViaSignedUrl = async (bucket, filePath, file, onProgress) => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(filePath);
    if (error) throw error;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.signedUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      if (onProgress) {
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
          resolve(publicData.publicUrl);
        } else {
          reject(`Upload failed: ${xhr.status} - ${xhr.responseText || xhr.statusText}`);
        }
      };
      xhr.onerror = () => reject("Network error during upload.");
      xhr.send(file);
    });
  };

  const uploadInstaller = async (file, os) => {
    const ext = getExtension(file.name);
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${os}.${ext}`;
    return await uploadViaSignedUrl("product-installers", safeName, file, (p) => setUploadProgress((prev) => ({ ...prev, [os]: p })));
  };

  const uploadImage = async (file) => {
    const ext = getExtension(file.name);
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    return await uploadViaSignedUrl("product-images", safeName, file, (p) => setImageProgress(p));
  };

  const handleNext = () => {
    setMessage("");
    if (currentStep === 1) {
      if (!productName.trim() || !applicationType || osTags.length === 0) {
        setMessage("Please fill Product Name, Application Type and select at least one OS.");
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      const missing = osTags.filter((os) => !filesByOS[os] && !existingDownloadLinks[os]);
      if (!isEditMode && missing.length > 0) {
        setMessage(`Please upload installers for: ${missing.join(", ")}`);
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((c) => c - 1);
      setMessage("");
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      let finalImage = existingImageUrl;
      if (selectedImage) {
        finalImage = await uploadImage(selectedImage);
      }

      let downloadLinks = { ...existingDownloadLinks };
      for (const os of osTags) {
        if (filesByOS[os]) {
          const url = await uploadInstaller(filesByOS[os], os);
          downloadLinks[os] = url;
        }
      }

      const payload = {
        name: productName,
        description,
        instructions,
        price: Number(price) || 0,
        tag: [applicationType, ...osTags],
        image_url: finalImage,
        download_links: downloadLinks,
        ...(isEditMode ? {} : {
              user_id: user?.id || null,
              name_upload: user?.user_metadata?.full_name || null,
              email_upload: user?.email || null
            })
      };

      const result = isEditMode
        ? await supabase.from("products").update(payload).eq("id", id)
        : await supabase.from("products").insert([payload]);

      if (result.error) throw result.error;

      setMessage(isEditMode ? "Product updated successfully!" : "Product created successfully!");
      setIsSuccess(true);

      setTimeout(() => navigate("/product"), 900);
    } catch (err) {
      const errorMsg = err.message || String(err);
      if (errorMsg.includes("413") || errorMsg.toLowerCase().includes("payload too large") || errorMsg.toLowerCase().includes("exceeded the maximum allowed size")) {
        setMessage("Upload failed: File size exceeds the server's maximum limit. Please increase the limit in Supabase Storage or upload a smaller file.");
      } else {
        setMessage("Error: " + errorMsg);
      }
    }
    setLoading(false);
  };

  return (
    <div className="relative isolate min-h-screen bg-[#05050A] text-gray-300 font-sans pb-12 pt-24 overflow-hidden">
      
      {/* UPDATED: Background Effects (Cyan/Blue) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
      <div className="fixed top-20 right-0 -z-10 w-[40rem] h-[40rem] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-[40rem] h-[40rem] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row bg-[#0B0D14]/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[600px]">

          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-white/10 bg-white/5 lg:bg-transparent p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-8 px-2 tracking-tight">{isEditMode ? "Edit Product" : "New Product"}</h2>

              <div className="space-y-2">
                {[
                  { step: 1, icon: Package, label: "Information" },
                  { step: 2, icon: Upload, label: "Assets" },
                  { step: 3, icon: CheckCircle, label: "Review" },
                ].map((item) => (
                  <div 
                    key={item.step}
                    // UPDATED: Active state to Cyan
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300
                      ${currentStep === item.step 
                        ? "bg-cyan-600/10 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
                        : currentStep > item.step 
                          ? "text-green-400 hover:bg-white/5" 
                          : "text-gray-500"
                      }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                    {currentStep > item.step && <CheckCircle size={16} className="ml-auto" />}
                  </div>
                ))}
              </div>
            </div>

            <Link to="/product" className="mt-8 block text-center px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors border border-white/5 hover:border-white/10 rounded-lg">
              Cancel & Exit
            </Link>
          </aside>

          {/* MAIN FORM CONTENT */}
          <main className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar">

            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">Product Information</h1>
                  <p className="text-gray-500">Fill in the basic details about your product.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Product Name <span className="text-red-500">*</span></label>
                      <input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        // UPDATED: Focus Cyan
                        className="w-full bg-[#05050A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        placeholder="e.g. Super App v1.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        // UPDATED: Focus Cyan
                        className="w-full bg-[#05050A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"
                        placeholder="What does your product do?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Usage Instructions</label>
                      <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        rows={4}
                        // UPDATED: Focus Cyan
                        className="w-full bg-[#05050A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"
                        placeholder="How to install or use..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Price ($)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500">$</span>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          // UPDATED: Focus Cyan
                          className="w-full bg-[#05050A] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                          placeholder="0 for free"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 lg:border-l lg:border-white/10 lg:pl-10">
                    <div>
                      <label className="block text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">Application Type</label>
                      <div className="space-y-3">
                        {["Software", "Game"].map((app) => (
                          <label
                            key={app}
                            // UPDATED: Selected state to Cyan
                            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200
                              ${applicationType === app 
                                ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.15)]" 
                                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                              }`}
                          >
                            <input
                              type="radio"
                              checked={applicationType === app}
                              onChange={() => setApplicationType(app)}
                              className="w-5 h-5 accent-cyan-500"
                            />
                            <span className={`ml-3 font-medium ${applicationType === app ? "text-white" : "text-gray-400"}`}>{app}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">Supported Platforms</label>
                      <div className="space-y-3">
                        {KNOWN_OS.map((os) => (
                          <label
                            key={os}
                            // UPDATED: Selected state to Cyan
                            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200
                              ${osTags.includes(os) 
                                ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.15)]" 
                                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={osTags.includes(os)}
                              onChange={() => handleOSToggle(os)}
                              className="w-5 h-5 accent-cyan-500"
                            />
                            <span className={`ml-3 font-medium ${osTags.includes(os) ? "text-white" : "text-gray-400"}`}>{os}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">Upload Assets</h1>
                  <p className="text-gray-500">Upload installation files and cover image.</p>
                </div>

                <div className="grid gap-8">
                  <div className="bg-[#05050A] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-semibold mb-6 text-cyan-300 flex items-center gap-2">
                      <Monitor size={20} /> Installer Packages
                    </h3>

                    {osTags.length === 0 ? (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl text-center">
                        Please go back and select at least one OS in Step 1.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {osTags.map((os) => (
                          <div key={os} className="bg-[#1e1e1e]/50 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-white font-bold text-sm bg-white/10 px-2 py-1 rounded">{os}</span>
                              <label className="cursor-pointer bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 rounded-lg text-xs font-bold text-black transition-colors shadow-lg shadow-cyan-500/20">
                                Select File
                                <input
                                  type="file"
                                  accept={ACCEPT_ATTR[os]}
                                  onChange={(e) => handleFileChange(e, os)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-black/30 rounded-lg">
                                <Package size={20} className={filesByOS[os] ? "text-green-400" : "text-gray-600"} />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs text-gray-400 truncate">
                                  {filesByOS[os]?.name || existingDownloadLinks[os]?.split("/").pop() || "No file selected"}
                                </p>
                              </div>
                            </div>

                            {uploadProgress[os] > 0 && uploadProgress[os] < 100 && (
                              <div className="mt-4">
                                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                  <span>Uploading...</span>
                                  <span>{uploadProgress[os]}%</span>
                                </div>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                  {/* UPDATED: Progress bar Cyan */}
                                  <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${uploadProgress[os]}%` }} />
                                </div>
                              </div>
                            )}
                            {uploadProgress[os] === 100 && (
                              <div className="mt-3 text-xs text-green-400 flex items-center gap-1 font-medium bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                                <CheckCircle size={12} /> Ready to submit
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#05050A] p-6 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                        <ImageIcon size={20} /> Cover Image
                      </h3>
                      {!previewUrl && !existingImageUrl && (
                        <label className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-xl cursor-pointer transition-colors text-sm font-medium">
                          Browse
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                      )}
                    </div>

                    {(previewUrl || existingImageUrl) ? (
                      <div className="space-y-4">
                        <div className="relative w-full max-w-lg aspect-video bg-black/50 rounded-2xl overflow-hidden border border-white/10 group shadow-2xl">
                          <img src={previewUrl || existingImageUrl} alt="Cover" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl border border-white/20 backdrop-blur-md font-medium flex items-center gap-2">
                              <Upload size={18} /> Change Image
                              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                          </div>
                        </div>
                        {imageProgress > 0 && imageProgress < 100 && (
                          <div className="w-full max-w-lg">
                             <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                               <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${imageProgress}%` }} />
                             </div>
                             <p className="text-right text-[10px] text-gray-400 mt-1">{imageProgress}%</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="w-full max-w-lg aspect-video border-2 border-dashed border-white/10 hover:border-cyan-500/50 bg-[#1e1e1e]/30 hover:bg-[#1e1e1e]/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group">
                        <div className="p-4 bg-white/5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            {/* UPDATED: Hover text color */}
                            <ImageIcon size={32} className="text-gray-500 group-hover:text-cyan-400" />
                        </div>
                        <span className="text-gray-400 font-medium group-hover:text-white">Click to upload cover image</span>
                        <span className="text-xs text-gray-600 mt-1">16:9 ratio recommended</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">Review & Submit</h1>
                  <p className="text-gray-500">Double check your product details.</p>
                </div>

                <div className="space-y-8">
                  <div className="bg-[#05050A] p-8 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Product Name</p>
                        <p className="text-2xl font-bold text-white">{productName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Price</p>
                        <p className="text-2xl font-bold text-green-400">${price || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Type</p>
                        {/* UPDATED: Badge color */}
                        <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-cyan-300 font-medium">{applicationType}</span>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">OS Support</p>
                        <div className="flex gap-2">
                          {osTags.map((os) => (
                            <span key={os} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                              {os}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-4">Uploaded Files</p>
                        <div className="space-y-3">
                        {osTags.map((os) => (
                            <div key={os} className="flex justify-between items-center bg-[#1e1e1e]/50 p-3 rounded-xl border border-white/5">
                            <span className="text-white font-medium text-sm flex items-center gap-2">
                                <Monitor size={16} className="text-gray-500" /> {os}
                            </span>
                            <span className={`text-sm ${filesByOS[os] || existingDownloadLinks[os] ? "text-green-400 flex items-center gap-1" : "text-yellow-500 italic"}`}>
                                {filesByOS[os] || existingDownloadLinks[os] ? <><CheckCircle size={14} /> Ready</> : "Missing"}
                            </span>
                            </div>
                        ))}
                        </div>
                    </div>
                  </div>

                  <div className="bg-[#05050A] p-6 rounded-3xl border border-white/10">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-4">Cover Preview</p>
                    {(previewUrl || existingImageUrl) ? (
                      <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg max-w-sm">
                        <img src={previewUrl || existingImageUrl} alt="Preview" className="w-full h-auto" />
                      </div>
                    ) : <p className="text-gray-600 italic">No image uploaded</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-white/10">
              {message && (
                <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium border flex items-center gap-2 ${isSuccess ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                  {isSuccess ? <CheckCircle size={18} /> : <X size={18} />} {message}
                </div>
              )}

              <div className="flex justify-between items-center">
                {currentStep > 1 && !isSuccess ? (
                  <button onClick={handlePrevious} className="flex items-center px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </button>
                ) : <div></div>}

                {currentStep < 3 ? (
                  // UPDATED: Button Cyan
                  <button onClick={handleNext} className="flex items-center px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
                    Next Step <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <>
                    {isSuccess ? (
                      // UPDATED: Button Cyan
                      <Link to="/product" className="flex items-center px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
                      </Link>
                    ) : (
                      <button 
                        onClick={handleFinalSubmit} 
                        disabled={loading}
                        className={`flex items-center px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95
                          ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/20"}`}
                      >
                        {loading ? "Processing..." : isEditMode ? "Save Changes" : "Submit Product"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

          </main>
        </div>
      </div>

      <NotificationModal message={modalMessage} isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} />
      <ProcessingModal 
        isVisible={loading && !isSuccess} 
        imageProgress={imageProgress}
        uploadProgress={uploadProgress}
        osTags={osTags}
        filesByOS={filesByOS}
        selectedImage={selectedImage}
      />
    </div>
  );
};

export default NewProduct;