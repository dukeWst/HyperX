import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient"; // Supabase thật

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

    // Load user info
    useEffect(() => {
        const loadUser = async () => {
            let current = user;
            if (!current) {
                const { data: userData } = await supabase.auth.getUser();
                current = userData.user;
            }
            setCurrentUser(current);
            if (current) {
                setFormData({
                    name: current.user_metadata?.full_name || "",
                    email: current.email || "",
                    avatar_url: current.user_metadata?.avatar_url || "",
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            }
        };
        loadUser();
    }, [user]);

    // Hide messages on click outside
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

    const handleSaveName = async (e) => {
        e.stopPropagation();
        if (!currentUser) return;
        if (formData.name === currentUser.user_metadata?.full_name) {
            setIsEditingName(false);
            setSuccessMessage("");
            return;
        }

        const { error } = await supabase.auth.updateUser({
            data: { full_name: formData.name },
        });

        if (!error) {
            setIsEditingName(false);
            setSuccessMessage("Your name has been successfully updated.");
            setCurrentUser((prev) => ({
                ...prev,
                user_metadata: { ...prev.user_metadata, full_name: formData.name },
            }));
        } else {
            console.error(error.message);
        }
    };

    const handleSaveAvatar = async () => {
        if (!currentUser) return;
        const { error } = await supabase.auth.updateUser({
            data: { avatar_url: formData.avatar_url },
        });
        if (!error) setSuccessMessage("Avatar updated!");
        else console.error(error.message);
    };

    return (
        <div className="relative isolate px-6 pt-24 px-48 bg-gray-900 overflow-hidden">
            <div className="h-[550px] flex mb-16">
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                        }}
                        className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[1155px] -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[2300px]"
                    />
                </div>

                {/* Layout */}
                <div className="relative w-full max-w-7xl bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 flex overflow-hidden">
                    {/* Sidebar */}
                    <aside className="w-64 border-r border-gray-700 p-6">
                        <h2 className="text-white text-xl font-bold mb-6">Settings</h2>
                        <nav className="space-y-2">
                            {[
                                { id: "general", label: "Personal Details" },
                                { id: "avatar", label: "Avatar" },
                                { id: "security", label: "Privacy" },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsEditingName(false);
                                        setIsEditingPassword(false);
                                        setPasswordError("");
                                        setSuccessMessage("");
                                        if (currentUser) {
                                            setFormData((prev) => ({
                                                ...prev,
                                                name: currentUser.user_metadata?.full_name || prev.name,
                                                avatar_url: currentUser.user_metadata?.avatar_url || prev.avatar_url,
                                                currentPassword: "",
                                                newPassword: "",
                                                confirmPassword: "",
                                            }));
                                        }
                                    }}
                                    className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${activeTab === item.id
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                        : "text-gray-300 hover:bg-gray-700/40"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main */}
                    <main className="flex-1 p-10 text-white">
                        {activeTab === "general" && currentUser && (
                            <div>
                                <h3 className="text-2xl font-bold mb-6">Account details</h3>
                                <div className="space-y-6 max-w-3xl">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-200">Full name</label>
                                        <div className="flex justify-between items-center gap-4">
                                            <input
                                                type="text"
                                                value={formData.name}
                                                disabled={!isEditingName}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, name: e.target.value })
                                                }
                                                className={`mt-2 w-2/4 rounded-md px-3 py-2 ${isEditingName
                                                    ? "bg-white/20 text-white outline outline-1 outline-indigo-500"
                                                    : "bg-white/10 text-gray-400 outline outline-1 outline-white/20 cursor-not-allowed"
                                                    }`}
                                            />
                                            {!isEditingName ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsEditingName(true);
                                                        setSuccessMessage("");
                                                    }}
                                                    className="mt-2 bg-indigo-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-500 transition"
                                                >
                                                    Change name
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleSaveName}
                                                    className="mt-2 bg-indigo-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-500 transition"
                                                >
                                                    Save changes
                                                </button>
                                            )}
                                        </div>
                                        {successMessage && (
                                            <p className="mt-2 text-green-400 text-sm">{successMessage}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-200">Email</label>
                                        <input
                                            type="text"
                                            value={formData.email || ""}
                                            disabled
                                            className="mt-2 w-2/4 rounded-md bg-white/10 px-3 py-2 text-white outline outline-1 outline-white/20 focus:outline-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "avatar" && currentUser && (
                            <div>
                                <h3 className="text-2xl font-bold mb-6">Your avatar</h3>
                                <div className="flex flex-col items-center">
                                    <img
                                        src={formData.avatar_url || ""}
                                        alt="avatar"
                                        className="w-60 h-60 rounded-full border-2 border-indigo-500 shadow my-4"
                                    />

                                    <button
                                        onClick={handleSaveAvatar}
                                        className="mt-2 bg-indigo-600 w-1/4 px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-500 transition"
                                    >
                                        Upload new photo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Password */}
                        {activeTab === "security" && (
                            <div>
                                <h3 className="text-2xl font-bold mb-6">Password</h3>
                                <div className="flex flex-col space-y-3 max-w-3xl">
                                    {/* Current password */}
                                    <label className="block text-sm font-medium text-gray-200">
                                        Current password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="**************"
                                        value={formData.currentPassword || ""}
                                        disabled={!isEditingPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, currentPassword: e.target.value })
                                        }
                                        className="w-2/4 rounded-md bg-white/10 px-3 py-2 text-white outline outline-1 outline-white/20 focus:outline-indigo-500"
                                    />
                                    {passwordError && (
                                        <p className="text-red-400 text-sm">{passwordError}</p>
                                    )}

                                    {/* New password & confirm password */}
                                    {isEditingPassword && (
                                        <>
                                            <label className="block text-sm font-medium text-gray-200">
                                                New password
                                            </label>
                                            <input
                                                type="password"
                                                placeholder="**************"
                                                value={formData.newPassword || ""}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, newPassword: e.target.value })
                                                }
                                                className="w-2/4 rounded-md bg-white/10 px-3 py-2 text-white outline outline-1 outline-white/20 focus:outline-indigo-500"
                                            />

                                            <label className="block text-sm font-medium text-gray-200">
                                                Confirm new password
                                            </label>
                                            <input
                                                type="password"
                                                placeholder="**************"
                                                value={formData.confirmPassword || ""}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, confirmPassword: e.target.value })
                                                }
                                                className="w-2/4 rounded-md bg-white/10 px-3 py-2 text-white outline outline-1 outline-white/20 focus:outline-indigo-500"
                                            />
                                        </>
                                    )}

                                    <button
                                        className="mt-2 w-1/4 bg-indigo-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-500 transition"
                                        onClick={async (e) => {
                                            e.stopPropagation();

                                            if (!isEditingPassword) {
                                                setIsEditingPassword(true);
                                                setPasswordError("");
                                                setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
                                                return;
                                            }

                                            // Validate new passwords
                                            if (formData.newPassword !== formData.confirmPassword) {
                                                setPasswordError("New passwords do not match.");
                                                setFormData({ ...formData, newPassword: "", confirmPassword: "" });
                                                return;
                                            }

                                            try {
                                                // Update password
                                                const { error: signInError } = await supabase.auth.signInWithPassword({
                                                    email: currentUser.email,
                                                    password: formData.currentPassword,
                                                });

                                                if (signInError) {
                                                    setPasswordError("Current password is incorrect.");
                                                    setFormData({ ...formData, newPassword: "", confirmPassword: "" });
                                                    return;
                                                }

                                                // Nếu đúng mới update
                                                const { error: updateError } = await supabase.auth.updateUser({
                                                    password: formData.newPassword
                                                });

                                                if (updateError) {
                                                    setPasswordError("Failed to update password.");
                                                } else {
                                                    setSuccessMessage("Password updated successfully!");
                                                    setIsEditingPassword(false);
                                                    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                                    setPasswordError("");
                                                }

                                                if (error) {
                                                    setPasswordError("Current password is incorrect.");
                                                    setFormData({ ...formData, newPassword: "", confirmPassword: "" });
                                                } else {
                                                    setSuccessMessage("Password updated successfully!");
                                                    setIsEditingPassword(false);
                                                    setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
                                                    setPasswordError("");
                                                }
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }}
                                    >
                                        {isEditingPassword ? "Save changes" : "Change password"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            {/* Gradient background */}

        </div>
    );
};

export default Setting;
