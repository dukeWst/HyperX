import { useState, useEffect, useRef } from "react"; 
import { supabase } from "../../routes/supabaseClient";
import { User, Shield, Camera, Save, Lock, Edit3 } from "lucide-react";

const Setting = ({ user }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        avatar_url: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [activeTab, setActiveTab] = useState("general");
    const [isEditingName, setIsEditingName] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    useEffect(() => {
        const loadUser = async () => {
            setCurrentUser(user);
            if (user) {
                setFormData({
                    name: user.user_metadata?.full_name || "",
                    email: user.email || "",
                    avatar_url: user.user_metadata?.avatar_url || "",
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            }
        };
        loadUser();
    }, [user]);

    useEffect(() => {
        const handleClickOutside = () => {
            if (successMessage || passwordError) {
                setSuccessMessage("");
                setPasswordError("");
            }
        };
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, [successMessage, passwordError]);

    const handleUploadAvatar = async (event) => {
        try {
            setUploading(true);
            setSuccessMessage("");

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            console.log("1. Starting upload to storage...");
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            if (uploadError) {
                console.error("Storage upload failed:", uploadError);
                throw uploadError;
            }

            console.log("2. Fetching public URL...");
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            console.log("3. Updating Auth Metadata...");
            const { error: authError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl },
            });
            if (authError) {
                console.error("Auth update failed:", authError);
                throw authError;
            }
            
            console.log("4. Syncing to Public Profiles table...");
            // --- QUAN TRỌNG: DÙNG UPSERT ĐỂ ĐẢM BẢO ROW TỒN TẠI ---
            const { error: syncError } = await supabase.from('profiles').upsert({ 
                id: currentUser.id,
                avatar_url: publicUrl
            });

            if (syncError) {
                console.error("Profile sync failed:", syncError);
                // Không throw ở đây để user metadata vẫn được cập nhật local
            }

            console.log("5. Refreshing session...");
            await supabase.auth.refreshSession();

            setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
            setCurrentUser((prev) => ({
                ...prev,
                user_metadata: { ...prev.user_metadata, avatar_url: publicUrl },
            }));
            
            setSuccessMessage("Avatar uploaded successfully!");

        } catch (error) {
            console.error('Final upload error:', error);
            alert(`Upload failed: ${error.message || 'Network error'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveName = async (e) => {
        e.stopPropagation();
        if (!currentUser) return;
        if (formData.name === currentUser.user_metadata?.full_name) {
            setIsEditingName(false);
            setSuccessMessage("");
            return;
        }

        const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: formData.name },
        });

        if (!authError) {
            // --- QUAN TRỌNG: DÙNG UPSERT ĐỂ ĐẢM BẢO ROW TỒN TẠI ---
            await supabase.from('profiles').upsert({ 
                id: currentUser.id,
                full_name: formData.name
            });

            setIsEditingName(false);
            setSuccessMessage("Name updated successfully.");
            await supabase.auth.refreshSession();
            setCurrentUser((prev) => ({
                ...prev,
                user_metadata: { ...prev.user_metadata, full_name: formData.name },
            }));
        } else {
            console.error("Name update failed:", authError.message);
            alert("Error updating name: " + authError.message);
        }
    };

    // --- NAVIGATION TABS ---
    const tabs = [
        { id: "general", label: "Personal Info", icon: <User size={18} /> },
        { id: "avatar", label: "Avatar", icon: <Camera size={18} /> },
        { id: "security", label: "Security", icon: <Shield size={18} /> },
    ];

    return (
        <div className="bg-[#020205] min-h-screen text-gray-300 font-sans pt-24 px-4 pb-12 relative isolate overflow-hidden">
            
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.05]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
            <div className="fixed top-20 right-0 -z-10 w-[40rem] h-[40rem] bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 -z-10 w-[40rem] h-[40rem] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row bg-[#0B0D14]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] min-h-[700px]">
                    
                    {/* SIDEBAR */}
                    <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/5 bg-white/[0.02] p-8">
                        <div className="mb-12 px-2">
                            <h2 className="text-3xl font-black text-white tracking-tight uppercase bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                                Settings
                            </h2>
                            <p className="text-xs text-cyan-500/60 font-mono mt-1 tracking-widest uppercase font-bold">Account Preference</p>
                        </div>

                        <nav className="space-y-3">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setIsEditingName(false);
                                        setIsEditingPassword(false);
                                        setPasswordError("");
                                        setSuccessMessage("");
                                        if (currentUser) {
                                            setFormData((prev) => ({
                                                ...prev,
                                                name: currentUser.user_metadata?.full_name || prev.name,
                                            }));
                                        }
                                    }}
                                    className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl font-semibold transition-all duration-300 group
                                        ${activeTab === tab.id 
                                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                                            : "text-gray-500 hover:bg-white/[0.03] hover:text-gray-300 border border-transparent"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`transition-transform duration-300 ${activeTab === tab.id ? "scale-110" : "group-hover:scale-110"}`}>
                                            {tab.icon}
                                        </span>
                                        {tab.label}
                                    </div>
                                    {activeTab === tab.id && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-auto pt-10 hidden lg:block">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-transparent border border-cyan-500/10">
                                <p className="text-xs text-gray-500 leading-relaxed italic">
                                    "Personalize your experience to make HyperX truly yours."
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="flex-1 p-8 lg:p-16 overflow-y-auto custom-scrollbar bg-gradient-to-br from-white/[0.01] to-transparent">
                        
                        {/* 1. GENERAL TAB */}
                        {activeTab === "general" && currentUser && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="mb-12">
                                    <h3 className="text-3xl font-bold text-white mb-2">Personal Identity</h3>
                                    <p className="text-gray-500">Your profile information is visible to other members of the community.</p>
                                </div>
                                
                                <div className="space-y-10 max-w-2xl">
                                    <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-md">
                                        <label className="block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-6 font-mono">Profile Name</label>
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="relative flex-1 group">
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    disabled={!isEditingName}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className={`w-full bg-black/40 border rounded-2xl px-6 py-4 text-white transition-all duration-300 outline-none
                                                        ${isEditingName 
                                                            ? "border-cyan-500/50 focus:border-cyan-400 ring-4 ring-cyan-500/5" 
                                                            : "border-white/5 text-gray-400 opacity-80 cursor-not-allowed"}`}
                                                    placeholder="Your full name"
                                                />
                                            </div>
                                            {!isEditingName ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
                                                    className="px-6 py-4 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-2xl text-white transition-all flex items-center justify-center gap-2 font-bold group"
                                                >
                                                    <Edit3 size={18} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
                                                    <span>Change</span>
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setIsEditingName(false)}
                                                        className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveName}
                                                        className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-md opacity-70">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 font-mono">Email Address</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.email || ""}
                                                disabled
                                                className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-gray-500 cursor-not-allowed italic font-mono"
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                                <Lock size={16} className="text-gray-700" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-tighter">Verified email cannot be modified for security reasons.</p>
                                    </section>
                                </div>
                            </div>
                        )}

                        {/* 2. AVATAR TAB */}
                        {activeTab === "avatar" && currentUser && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="mb-12">
                                    <h3 className="text-3xl font-bold text-white mb-2">Display Avatar</h3>
                                    <p className="text-gray-500">Pick an image that represents you across the HyperX ecosystem.</p>
                                </div>

                                <div className="flex flex-col items-center justify-center p-12 border border-white/5 rounded-[3rem] bg-gradient-to-b from-white/[0.03] to-transparent relative overflow-hidden group">
                                    {/* Decoration Circles */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>

                                    <div className="relative z-10">
                                        <div className={`relative w-64 h-64 rounded-full p-2 border-2 transition-all duration-500 ${uploading ? 'border-cyan-500 animate-pulse' : 'border-white/5 group-hover:border-cyan-500/30'}`}>
                                            <div className="w-full h-full rounded-full overflow-hidden shadow-2xl relative">
                                                <img
                                                    src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.email}&background=06b6d4&color=fff`}
                                                    alt="avatar"
                                                    className="w-full h-full object-cover bg-[#05050A] transition-transform duration-700 group-hover:scale-110"
                                                />
                                                {uploading && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                                                        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                                                        <span className="text-[10px] font-mono text-cyan-400 tracking-[0.2em] uppercase">Processing</span>
                                                    </div>
                                                )}
                                                
                                                {/* Overlay on hover */}
                                                {!uploading && (
                                                    <button 
                                                        onClick={() => fileInputRef.current.click()}
                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]"
                                                    >
                                                        <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center text-black scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                                                            <Camera size={20} />
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleUploadAvatar}
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploading}
                                    />

                                    <div className="mt-12 text-center relative z-10">
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            disabled={uploading}
                                            className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-cyan-50 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:scale-[1.05] active:scale-95 disabled:opacity-50 disabled:scale-100"
                                        >
                                            {uploading ? "Updating System..." : "Change Appearance"}
                                        </button>
                                        <p className="mt-6 text-xs text-gray-500 font-medium">JPG, PNG or WEBP. Max 2MB recommended.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. SECURITY TAB */}
                        {activeTab === "security" && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="mb-12">
                                    <h3 className="text-3xl font-bold text-white mb-2">Security Vault</h3>
                                    <p className="text-gray-500">Protect your account by regularly updating your credentials.</p>
                                </div>

                                <div className="space-y-8 max-w-2xl bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-md">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 font-mono">Current Password</label>
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-hover:text-cyan-500/50">
                                                    <Lock size={18} />
                                                </div>
                                                <input
                                                    type="password"
                                                    placeholder="Verification required"
                                                    value={formData.currentPassword || ""}
                                                    disabled={!isEditingPassword}
                                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                                    className={`w-full bg-black/40 border rounded-2xl pl-16 pr-6 py-4 text-white outline-none transition-all duration-300
                                                        ${isEditingPassword ? "border-cyan-500/50 focus:border-cyan-400 ring-4 ring-cyan-500/5" : "border-white/5 text-gray-500 italic font-mono"}`}
                                                />
                                            </div>
                                        </div>

                                        {isEditingPassword && (
                                            <div className="space-y-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <div>
                                                    <label className="block text-xs font-bold text-cyan-500/70 uppercase tracking-widest mb-3 font-mono">New Password</label>
                                                    <div className="relative">
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-500/40">
                                                            <Shield size={18} />
                                                        </div>
                                                        <input
                                                            type="password"
                                                            placeholder="Enter new strong password"
                                                            value={formData.newPassword || ""}
                                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-6 py-4 text-white focus:border-cyan-400 ring-4 ring-cyan-500/5 outline-none transition-all duration-300"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-cyan-500/70 uppercase tracking-widest mb-3 font-mono">Confirm Secret</label>
                                                    <div className="relative">
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-500/40">
                                                            <Save size={18} />
                                                        </div>
                                                        <input
                                                            type="password"
                                                            placeholder="Repeat new password"
                                                            value={formData.confirmPassword || ""}
                                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-6 py-4 text-white focus:border-cyan-400 ring-4 ring-cyan-500/5 outline-none transition-all duration-300"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 flex flex-col md:flex-row gap-4">
                                        {!isEditingPassword ? (
                                            <button
                                                onClick={() => { setIsEditingPassword(true); setPasswordError(""); setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" }); }}
                                                className="px-10 py-4 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-2xl text-white font-black tracking-wide transition-all active:scale-95"
                                            >
                                                Initiate Password Reset
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setIsEditingPassword(false)}
                                                    className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                                                >
                                                    Cancel Change
                                                </button>
                                                <button
                                                    className="flex-1 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(6,182,212,0.2)] hover:scale-[1.02] active:scale-95"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (formData.newPassword !== formData.confirmPassword) {
                                                            setPasswordError("Secret match failed. Passwords do not correlate.");
                                                            return;
                                                        }
                                                        try {
                                                            const { error: signInError } = await supabase.auth.signInWithPassword({
                                                                email: currentUser.email,
                                                                password: formData.currentPassword,
                                                            });
                                                            if (signInError) { setPasswordError("Verification failed. Current password incorrect."); return; }
 
                                                            const { error: updateError } = await supabase.auth.updateUser({ password: formData.newPassword });
                                                            if (updateError) { setPasswordError("Vault update failed."); } else {
                                                                setSuccessMessage("Vault credentials updated successfully!");
                                                                setIsEditingPassword(false);
                                                                setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
                                                                setPasswordError("");
                                                            }
                                                        } catch (err) { console.error(err); }
                                                    }}
                                                >
                                                    Securely Update Password
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications */}
                        <div className="fixed bottom-12 right-12 z-[100] flex flex-col gap-4 pointer-events-none">
                            {successMessage && (
                                <div className="p-5 bg-cyan-500 text-black font-black rounded-2xl flex items-center gap-4 shadow-[0_20px_50px_rgba(6,182,212,0.3)] animate-in slide-in-from-right-full transition-all duration-500 pointer-events-auto">
                                    <div className="bg-black/10 p-2 rounded-lg">
                                        <Save size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest leading-none mb-1 opacity-70 font-mono">System Notice</p>
                                        <p className="text-sm">{successMessage}</p>
                                    </div>
                                    <button onClick={() => setSuccessMessage("")} className="ml-4 hover:opacity-50 transition-opacity">✕</button>
                                </div>
                            )}
                            {passwordError && (
                                <div className="p-5 bg-red-500 text-white font-black rounded-2xl flex items-center gap-4 shadow-[0_20px_50px_rgba(239,68,68,0.3)] animate-in slide-in-from-right-full transition-all duration-500 pointer-events-auto">
                                    <div className="bg-black/10 p-2 rounded-lg">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest leading-none mb-1 opacity-70 font-mono">Security Alert</p>
                                        <p className="text-sm">{passwordError}</p>
                                    </div>
                                    <button onClick={() => setPasswordError("")} className="ml-4 hover:opacity-50 transition-opacity">✕</button>
                                </div>
                            )}
                        </div>
                    
                    </main>
                </div>
            </div>
        </div>
    );

};

export default Setting;