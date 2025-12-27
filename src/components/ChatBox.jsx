import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../routes/supabaseClient';
import { 
    X, Send, Minus, MessageCircle, Loader2, 
    User, Paperclip, Smile, MoreVertical, Trash2,
    ExternalLink
} from "lucide-react";
import { 
    Dialog, Transition, TransitionChild, DialogPanel, DialogTitle,
    Menu, MenuButton, MenuItems, MenuItem 
} from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';

const ChatBox = ({ currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [recipient, setRecipient] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [clearedAt, setClearedAt] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    const navigate = useNavigate();
    const scrollRef = useRef(null);

    // 1. Listen for open-chat event
    useEffect(() => {
        const handleOpenChat = (e) => {
            const { id, full_name, avatar_url } = e.detail;
            if (currentUser?.id === id) return; // Can't chat with self
            
            setRecipient({ id, full_name, avatar_url });
            setIsOpen(true);
            setIsMinimized(false);
        };

        window.addEventListener('hyperx-open-chat', handleOpenChat);
        return () => window.removeEventListener('hyperx-open-chat', handleOpenChat);
    }, [currentUser]);

    const fetchMessages = async (convId, cAt) => {
        let query = supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId);
        
        if (cAt) {
            query = query.gt('created_at', cAt);
        }

        const { data } = await query.order('created_at', { ascending: true });
        
        if (data) setMessages(data);
    };

    // 2. Fetch or Create Conversation when recipient changes
    useEffect(() => {
        if (!isOpen || !recipient || !currentUser) return;

        const setupConversation = async () => {
            setLoading(true);
            
            // Sort IDs to ensure consistent [user_1, user_2] pairing
            const ids = [currentUser?.id, recipient?.id].sort();
            const u1 = ids[0];
            const u2 = ids[1];

            const { data: existing, error: fetchError } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_1', u1)
                .eq('user_2', u2)
                .maybeSingle();

            if (fetchError) {
                console.error("Error fetching conversation:", fetchError);
            }

            if (existing) {
                setConversation(existing);
                const myId = currentUser?.id;
                const myClearedAt = myId === existing.user_1 ? existing.user_1_cleared_at : existing.user_2_cleared_at;
                setClearedAt(myClearedAt);
                fetchMessages(existing.id, myClearedAt);
            } else {
                // Create new with sorted IDs
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert({ user_1: u1, user_2: u2 })
                    .select('*')
                    .single();
                
                if (createError) {
                    console.error("Error creating conversation:", createError);
                    // If it still conflicts (race condition), try fetching one last time
                    if (createError.code === '23505') {
                        const { data: retry } = await supabase
                            .from('conversations')
                            .select('*')
                            .eq('user_1', u1)
                            .eq('user_2', u2)
                            .maybeSingle();
                        if (retry) {
                            setConversation(retry);
                            const myId = currentUser?.id;
                            const myClearedAt = myId === retry.user_1 ? retry.user_1_cleared_at : retry.user_2_cleared_at;
                            setClearedAt(myClearedAt);
                            fetchMessages(retry.id, myClearedAt);
                        }
                    }
                } else if (newConv) {
                    setConversation(newConv);
                    setClearedAt(null);
                    setMessages([]);
                }
            }
            setLoading(false);
        };

        setupConversation();
    }, [recipient, isOpen, currentUser]);

    // 3. Real-time Message Subscription
    useEffect(() => {
        if (!conversation) return;

        const channel = supabase
            .channel(`chat:${conversation?.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation?.id}`
            }, (payload) => {
                setMessages(prev => {
                    if (!payload.new) return prev;
                    // Avoid duplicates
                    if (prev.find(m => m?.id === payload.new?.id)) return prev;
                    // Filter by clearedAt
                    if (clearedAt && payload.new.created_at && new Date(payload.new.created_at) <= new Date(clearedAt)) return prev;
                    return [...prev, payload.new];
                });
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [conversation, clearedAt]);

    // 4. Persistence & Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || !conversation || !currentUser) return;

        const msgContent = newMessage.trim();
        setNewMessage(""); // Clear input early for "instant" feel

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversation?.id,
                sender_id: currentUser?.id,
                content: msgContent
            });

        if (error) {
            console.error("Error sending message:", error);
            setNewMessage(msgContent); // Restore text if failed
        }
    };

    const handleClearChat = () => {
        if (!conversation || !messages.length) return;
        setIsConfirmModalOpen(true);
    };

    const confirmClearChat = async () => {
        if (!conversation) return;
        setLoading(true);
        setIsConfirmModalOpen(false);

        const now = new Date().toISOString();
        const myId = currentUser?.id;
        const fieldToUpdate = myId === conversation?.user_1 ? 'user_1_cleared_at' : 'user_2_cleared_at';

        const { error } = await supabase
            .from('conversations')
            .update({ [fieldToUpdate]: now })
            .eq('id', conversation?.id);

        if (error) {
            console.error("Error clearing chat:", error);
            alert("Failed to clear chat: " + error.message);
        } else {
            console.log("Chat cleared successfully at:", now, "for user:", myId);
            setClearedAt(now);
            setMessages([]);
        }
        setLoading(false);
    };

    const handleViewProfile = () => {
        if (recipient?.id) {
            navigate(`/profile/${recipient.id}`);
        }
    };

    if (!currentUser || !isOpen) return null;

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 ease-out flex flex-col items-end`}>
            {/* MINI HEADER / FLOATING ICON WHEN MINIMIZED */}
            {isMinimized ? (
                <button 
                    onClick={() => setIsMinimized(false)}
                    className="w-14 h-14 bg-cyan-600 rounded-2xl shadow-2xl shadow-cyan-500/20 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all group border border-cyan-400/30"
                >
                    <MessageCircle size={28} />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#05050A]"></div>
                </button>
            ) : (
                <div className="w-[360px] h-[500px] bg-[#0B0D14] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-white/5">
                    
                    {/* CHAT HEADER */}
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between relative">
                        <Menu as="div" className="relative">
                            <MenuButton className="flex items-center gap-3 hover:bg-white/5 p-1 -m-1 rounded-2xl transition-all group group/header">
                                <div className="relative">
                                    <UserAvatar 
                                        user={{ raw_user_meta_data: recipient }} 
                                        size="md" 
                                        className="ring-2 ring-cyan-500/20 group-hover:ring-cyan-500/50 transition-all" 
                                    />
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0B0D14]"></div>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-white truncate max-w-[140px] uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">
                                        {recipient?.full_name || "User"}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 font-medium">Online</p>
                                </div>
                                <MoreVertical size={14} className="text-gray-600 group-hover:text-cyan-500 transition-all opacity-0 group-hover:opacity-100" />
                            </MenuButton>

                            <Transition
                                as={React.Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <MenuItems className="absolute left-0 mt-2 w-52 origin-top-left rounded-2xl bg-[#161922] border border-white/10 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-[10001] overflow-hidden backdrop-blur-xl">
                                    <div className="p-1.5 space-y-1">
                                        <MenuItem>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleViewProfile}
                                                    className={`${
                                                        active ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400'
                                                    } group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-widest transition-all`}
                                                >
                                                    <User size={16} className={active ? 'text-cyan-400' : 'text-gray-500'} />
                                                    View Profile
                                                </button>
                                            )}
                                        </MenuItem>
                                        <MenuItem>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleClearChat}
                                                    disabled={messages.length === 0}
                                                    className={`${
                                                        active ? 'bg-red-500/10 text-red-400' : 'text-gray-400'
                                                    } group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-20`}
                                                >
                                                    <Trash2 size={16} className={active ? 'text-red-400' : 'text-gray-500'} />
                                                    Clear History
                                                </button>
                                            )}
                                        </MenuItem>
                                    </div>
                                </MenuItems>
                            </Transition>
                        </Menu>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsMinimized(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                                <Minus size={18} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* MESSAGE LIST */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-gradient-to-b from-transparent to-black/20"
                    >
                        {loading && messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                                <Loader2 className="animate-spin text-cyan-400" size={24} />
                                <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Encrypting...</span>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <div className="w-16 h-16 bg-cyan-500/5 rounded-full flex items-center justify-center text-cyan-500/20 mb-4 ring-1 ring-cyan-500/10">
                                    <MessageCircle size={32} />
                                </div>
                                <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Direct Terminal</h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed">Encrypted end-to-end communication established.</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                if (!msg) return null;
                                const isMe = msg.sender_id === currentUser?.id;
                                return (
                                    <div key={msg.id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-300`}>
                                        {!isMe && (
                                            <div className="flex-shrink-0 mb-1">
                                                <UserAvatar 
                                                    user={{ raw_user_meta_data: recipient }} 
                                                    size="sm" 
                                                    className="ring-1 ring-white/10"
                                                />
                                            </div>
                                        )}
                                        <div className={`max-w-[75%] rounded-[1.2rem] px-4 py-2.5 text-sm shadow-sm break-words whitespace-pre-wrap ${
                                            isMe 
                                            ? 'bg-cyan-600 text-white' 
                                            : 'bg-white/5 text-gray-200 border border-white/5'
                                        }`}>
                                            {msg.content}
                                            <div className={`text-[9px] mt-1.5 opacity-50 font-medium ${isMe ? 'text-right' : 'text-left'}`}>
                                                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* INPUT AREA */}
                    <form 
                        onSubmit={handleSendMessage}
                        className="p-4 bg-white/5 border-t border-white/5"
                    >
                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-1.5 focus-within:border-cyan-500/50 transition-all shadow-inner">
                            <button type="button" className="p-2 text-gray-500 hover:text-cyan-400 transition-colors">
                                <Smile size={20} />
                            </button>
                            <input 
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-200 placeholder-gray-600"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-600 transition-all shadow-lg active:scale-90"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* CLEAR CHAT CONFIRMATION MODAL */}
            <Transition show={isConfirmModalOpen} as={React.Fragment}>
                <Dialog as="div" className="relative z-[10000]" onClose={() => setIsConfirmModalOpen(false)}>
                    <TransitionChild
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <TransitionChild
                                as={React.Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-[#0B0D14] border border-white/10 p-6 text-left align-middle shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all ring-1 ring-white/5">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 ring-1 ring-red-500/20">
                                            <Trash2 size={24} />
                                        </div>
                                        <div>
                                            <DialogTitle as="h3" className="text-lg font-bold text-white uppercase tracking-tight">
                                                Clear Conversation
                                            </DialogTitle>
                                            <p className="text-xs text-gray-500 font-medium">This action cannot be undone.</p>
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            Are you sure you want to permanently delete all messages in this chat with <span className="text-white font-bold">{recipient?.full_name}</span>?
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]"
                                            onClick={() => setIsConfirmModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-500/10 uppercase tracking-widest text-[10px]"
                                            onClick={confirmClearChat}
                                        >
                                            Delete All
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default ChatBox;
