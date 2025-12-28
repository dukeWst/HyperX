import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../routes/supabaseClient';
import { 
    X, Send, Minus, MessageCircle, Loader2, 
    User, Smile, MoreVertical, Trash2
} from "lucide-react";
import { 
    Dialog, Transition, TransitionChild, DialogPanel, DialogTitle,
    Menu, MenuButton, MenuItems, MenuItem 
} from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';

// ==========================================
// 1. COMPONENT CON: CHAT SESSION
// (Chịu trách nhiệm hiển thị UI Chat hoặc Avatar)
// ==========================================
const ChatSession = ({ 
    recipient, 
    currentUser, 
    onRemove, 
    onToggle, 
    isOpen 
}) => {
    const [hasUnread, setHasUnread] = useState(false); 
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [clearedAt, setClearedAt] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    const navigate = useNavigate();
    const scrollRef = useRef(null);

    // --- LOGIC: Fetch Data & Realtime ---
    useEffect(() => {
        if (!recipient || !currentUser) return;

        const setupConversation = async () => {
            setLoading(true);
            const ids = [currentUser?.id, recipient?.id].sort();
            
            // Tìm hội thoại
            const { data: existing } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_1', ids[0])
                .eq('user_2', ids[1])
                .maybeSingle();

            if (existing) {
                setConversation(existing);
                const myId = currentUser?.id;
                const myClearedAt = myId === existing.user_1 ? existing.user_1_cleared_at : existing.user_2_cleared_at;
                setClearedAt(myClearedAt);
                await fetchMessages(existing.id, myClearedAt);
            } else {
                // Tạo mới
                const { data: newConv } = await supabase
                    .from('conversations')
                    .insert({ user_1: ids[0], user_2: ids[1] })
                    .select('*')
                    .single();
                if (newConv) {
                    setConversation(newConv);
                    setMessages([]);
                }
            }
            setLoading(false);
        };
        setupConversation();
    }, [recipient, currentUser]);

    const fetchMessages = async (convId, cAt) => {
        let query = supabase.from('messages').select('*').eq('conversation_id', convId);
        if (cAt) query = query.gt('created_at', cAt);
        const { data } = await query.order('created_at', { ascending: true });
        if (data) setMessages(data);
    };

    // --- LOGIC: Realtime & Unread Dot ---
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
                const newMsg = payload.new;
                if (!newMsg) return;

                // Nếu tin nhắn tới mà mình đang KHÔNG mở (đang ở dạng avatar) -> Hiện chấm đỏ
                if (newMsg.sender_id !== currentUser.id && !isOpen) {
                    setHasUnread(true);
                }

                setMessages(prev => {
                    if (prev.find(m => m.id === newMsg.id)) return prev;
                    if (clearedAt && new Date(newMsg.created_at) <= new Date(clearedAt)) return prev;
                    return [...prev, newMsg];
                });
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [conversation, clearedAt, isOpen, currentUser]);

    // Tự động xóa chấm đỏ khi chat box được mở ra
    useEffect(() => {
        if (isOpen) setHasUnread(false);
    }, [isOpen]);

    // Scroll xuống cuối
    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // --- HANDLERS ---
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || !conversation) return;
        const content = newMessage.trim();
        setNewMessage("");
        await supabase.from('messages').insert({
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            content: content
        });
    };

    const handleClearChat = async () => {
        if (!conversation) return;
        setIsConfirmModalOpen(false);
        const now = new Date().toISOString();
        const field = currentUser.id === conversation.user_1 ? 'user_1_cleared_at' : 'user_2_cleared_at';
        await supabase.from('conversations').update({ [field]: now }).eq('id', conversation.id);
        setClearedAt(now);
        setMessages([]);
    };

    // ==========================================
    // RENDER 1: GIAO DIỆN AVATAR (KHI THU NHỎ)
    // ==========================================
    if (!isOpen) {
        return (
            <div className="relative group pointer-events-auto">
                <button 
                    onClick={() => onToggle(true)} // Gọi lên cha để mở Chat Box
                    className="w-14 h-14 bg-[#161922] rounded-2xl shadow-xl border border-cyan-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 hover:border-cyan-400 overflow-hidden"
                    title={recipient.full_name}
                >
                    <UserAvatar user={{ raw_user_meta_data: recipient }} size="md" className="pointer-events-none"/>
                    
                    {/* Chấm đỏ thông báo */}
                    {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#05050A] animate-pulse shadow-lg shadow-red-500/50"></div>
                    )}
                </button>

                {/* Nút X nhỏ để tắt hẳn session */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute -top-2 -left-2 w-5 h-5 bg-gray-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500 text-[10px] shadow-lg z-10"
                >
                    <X size={12} />
                </button>
            </div>
        );
    }

    // ==========================================
    // RENDER 2: GIAO DIỆN FULL CHAT BOX
    // ==========================================
    return (
        <div className="w-[360px] h-[500px] bg-[#0B0D14] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300 ring-1 ring-white/5 pointer-events-auto">
            {/* HEADER */}
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <Menu as="div" className="relative">
                    <MenuButton className="flex items-center gap-3 hover:bg-white/5 p-1 -m-1 rounded-2xl transition-all group">
                        <div className="relative">
                            <UserAvatar user={{ raw_user_meta_data: recipient }} size="md" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0B0D14]"></div>
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-white truncate max-w-[140px] uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">
                                {recipient?.full_name}
                            </h3>
                            <p className="text-[10px] text-gray-500 font-medium">Online</p>
                        </div>
                        <MoreVertical size={14} className="text-gray-600 group-hover:text-cyan-500 opacity-0 group-hover:opacity-100 transition-all" />
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
                        <MenuItems className="absolute left-0 mt-2 w-52 origin-top-left rounded-2xl bg-[#161922] border border-white/10 shadow-2xl z-[10001] p-1.5 backdrop-blur-xl">
                            <MenuItem>
                                {({ active }) => (
                                    <button onClick={() => navigate(`/profile/${recipient.id}`)} className={`${active ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400'} group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-widest transition-all`}>
                                        <User size={16} /> View Profile
                                    </button>
                                )}
                            </MenuItem>
                            <MenuItem>
                                {({ active }) => (
                                    <button onClick={() => setIsConfirmModalOpen(true)} disabled={messages.length === 0} className={`${active ? 'bg-red-500/10 text-red-400' : 'text-gray-400'} group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50`}>
                                        <Trash2 size={16} /> Clear History
                                    </button>
                                )}
                            </MenuItem>
                        </MenuItems>
                    </Transition>
                </Menu>

                <div className="flex items-center gap-1">
                    {/* Nút Minimize: Gọi hàm onToggle(false) để thu nhỏ về avatar */}
                    <button onClick={() => onToggle(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Minus size={18} />
                    </button>
                    {/* Nút Close: Xóa hẳn session */}
                    <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* MESSAGES */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
                {loading && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                        <Loader2 className="animate-spin text-cyan-400" size={24} />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 bg-cyan-500/5 rounded-full flex items-center justify-center text-cyan-500/20 mb-4 ring-1 ring-cyan-500/10"><MessageCircle size={32} /></div>
                        <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Direct Terminal</h4>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        return (
                            <div key={msg.id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-300`}>
                                {!isMe && <div className="mb-1"><UserAvatar user={{ raw_user_meta_data: recipient }} size="sm" className="ring-1 ring-white/10" /></div>}
                                <div className={`max-w-[75%] rounded-[1.2rem] px-4 py-2.5 text-sm shadow-sm break-words whitespace-pre-wrap ${isMe ? 'bg-cyan-600 text-white' : 'bg-white/5 text-gray-200 border border-white/5'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* INPUT */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/5">
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-1.5 focus-within:border-cyan-500/50 transition-all shadow-inner">
                    <button type="button" className="p-2 text-gray-500 hover:text-cyan-400 transition-colors"><Smile size={20} /></button>
                    <input 
                        type="text" 
                        placeholder="Type a message..." 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-200 placeholder-gray-600"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-500 disabled:opacity-30 transition-all shadow-lg active:scale-90">
                        <Send size={18} />
                    </button>
                </div>
            </form>

            {/* CONFIRM MODAL */}
            <Transition show={isConfirmModalOpen} as={React.Fragment}>
                <Dialog as="div" className="relative z-[10000]" onClose={() => setIsConfirmModalOpen(false)}>
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="fixed inset-0 overflow-y-auto flex min-h-full items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-[#0B0D14] border border-white/10 p-6 shadow-2xl ring-1 ring-white/5">
                            <DialogTitle className="text-lg font-bold text-white uppercase mb-4">Clear Conversation?</DialogTitle>
                            <div className="flex gap-3">
                                <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-gray-400 text-xs font-bold uppercase">Cancel</button>
                                <button onClick={handleClearChat} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-500">Delete All</button>
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

// ==========================================
// 2. COMPONENT CHA: CHAT BOX
// (Layout & Quản lý trạng thái Active)
// ==========================================
const ChatBox = ({ currentUser }) => {
    // Danh sách tất cả các user đang chat (dù mở hay đóng)
    const [activeSessions, setActiveSessions] = useState([]);
    
    // ID của user đang được mở to (nếu null nghĩa là tất cả đều thu nhỏ)
    const [activeChatId, setActiveChatId] = useState(null);

    // Lắng nghe sự kiện mở chat từ nơi khác (VD: Profile Page)
    useEffect(() => {
        const handleOpenChat = (e) => {
            const newUser = e.detail;
            if (currentUser?.id === newUser.id) return;

            setActiveSessions(prev => {
                const exists = prev.find(s => s.id === newUser.id);
                if (!exists) return [...prev, newUser];
                return prev;
            });
            // Tự động mở to khi click "Message"
            setActiveChatId(newUser.id);
        };

        window.addEventListener('hyperx-open-chat', handleOpenChat);
        return () => window.removeEventListener('hyperx-open-chat', handleOpenChat);
    }, [currentUser]);

    // Lọc ra: Ai đang mở to? Ai đang thu nhỏ?
    const activeSessionData = activeSessions.find(s => s.id === activeChatId);
    const inactiveSessions = activeSessions.filter(s => s.id !== activeChatId);

    if (!currentUser || activeSessions.length === 0) return null;

    return (
        // CONTAINER CHÍNH: Xếp ngang (Row) và Căn đáy (Items End)
        // pointer-events-none để không chặn click vào web phía sau ở những chỗ trống
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-row items-end gap-4 pointer-events-none">
            
            {/* --- KHU VỰC 1: CHAT BOX TO (BÊN TRÁI) --- */}
            <div className="flex-shrink-0">
                {activeSessionData && (
                    <ChatSession 
                        key={activeSessionData.id}
                        recipient={activeSessionData}
                        currentUser={currentUser}
                        isOpen={true} // Luôn luôn TRUE ở khu vực này
                        onToggle={(shouldOpen) => {
                            // Nếu bấm nút (-) -> Đóng lại -> ID về null -> Tự động nhảy sang cột phải
                            if (!shouldOpen) setActiveChatId(null);
                        }}
                        onRemove={() => {
                            setActiveSessions(prev => prev.filter(s => s.id !== activeSessionData.id));
                            setActiveChatId(null);
                        }}
                    />
                )}
            </div>

            {/* --- KHU VỰC 2: CỘT AVATAR (BÊN PHẢI) --- */}
            {/* flex-col-reverse: Xếp chồng từ dưới lên trên */}
            <div className="flex flex-col-reverse gap-3 pb-1">
                {inactiveSessions.map((recipient) => (
                    <ChatSession 
                        key={recipient.id}
                        recipient={recipient}
                        currentUser={currentUser}
                        isOpen={false} // Luôn luôn FALSE ở khu vực này
                        onToggle={(shouldOpen) => {
                            // Nếu bấm vào avatar -> Mở ra -> Set ID -> Tự động nhảy sang trái
                            if (shouldOpen) setActiveChatId(recipient.id);
                        }}
                        onRemove={() => {
                            setActiveSessions(prev => prev.filter(s => s.id !== recipient.id));
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChatBox;