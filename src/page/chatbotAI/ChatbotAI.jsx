import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2, User, Bot, ClipboardCopy, Check } from "lucide-react"; 
import { supabase } from '../../supabaseClient';

// =======================================================
// 0. COMPONENT UserAvatar
// =======================================================
const UserAvatar = ({ user, size = "md" }) => {
    const dims = size === "sm" ? "w-10 h-10" : size === "xl" ? "w-32 h-32" : "w-12 h-12"; 

    if (!user) {
        return (
            <div className={`${dims} rounded-full bg-gray-600 flex items-center justify-center text-white flex-shrink-0`}>
                <User size={size === "sm" ? 16 : 24} />
            </div>
        );
    } 

    const metadata = user?.raw_user_meta_data || user?.user_metadata || {};
    const avatarUrl = user.avatar_url || metadata.avatar_url; 
    const fullName = user.full_name || metadata.full_name || user.email || "User";
    
    const AvatarImg = (
        <>
            {avatarUrl ? (
                <img 
                    src={avatarUrl} 
                    alt={fullName} 
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff&size=40`; }}
                    className={`${dims} rounded-full object-cover border border-gray-600 flex-shrink-0`} 
                />
            ) : (
                <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff&size=40`}
                    alt={fullName}
                    className={`${dims} rounded-full object-cover border border-gray-600 flex-shrink-0`}
                />
            )}
        </>
    );

    return AvatarImg;
};


// --- Cấu hình API Key và URL ---
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || "";
const apiKey = getApiKey();
const modelName = "gemini-2.5-flash"; 
const apiUrlBase = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
const apiUrl = `${apiUrlBase}${apiKey ? `?key=${apiKey}` : ''}`; 

// --- Định nghĩa cấu trúc tin nhắn ---
const initialMessages = [
    { 
        id: Date.now(),
        role: "assistant", 
        content: "Xin chào! Tôi là trợ lý AI của HyperX. Tôi có thể giúp bạn tìm kiếm thông tin, giải đáp thắc mắc về công nghệ, hoặc hướng dẫn sử dụng nền tảng này. Hãy hỏi tôi bất cứ điều gì!",
        sources: null 
    }
];

// =======================================================
// 1.5. COMPONENT TypingText
// =======================================================
const TypingText = ({ fullText, speed = 20, isStreaming, isLast }) => {
    const [displayedText, setDisplayedText] = useState('');
    const contentRef = useRef(fullText);
    
    useEffect(() => {
        contentRef.current = fullText;
    }, [fullText]);

    useEffect(() => {
        if (isStreaming) {
            setDisplayedText(''); 
            return;
        }

        if (fullText) {
            let i = 0;
            setDisplayedText(''); 
            const timer = setInterval(() => {
                if (i < contentRef.current.length) {
                    setDisplayedText(prev => prev + contentRef.current.charAt(i));
                    i++;
                } else {
                    clearInterval(timer);
                }
            }, speed); 

            return () => clearInterval(timer);
        }
    }, [fullText, speed, isStreaming]);

    const showTypingIndicator = isLast && isStreaming;

    return (
        <p className="text-sm whitespace-pre-line leading-relaxed font-sans">
            {displayedText}
            {showTypingIndicator && (
                <span className="inline-block w-2 h-2 ml-2 bg-white rounded-full animate-pulse"></span>
            )}
        </p>
    );
};

// =======================================================
// 1. COMPONENT MESSAGE
// =======================================================
const Message = ({ msg, isLast, isTyping, currentUser }) => { 
    const [isCopied, setIsCopied] = useState(false); 
    
    const isUser = msg.role === "user";
    const alignment = isUser ? "self-end" : "self-start";
    
    const bubbleMaxWidth = isUser ? 'max-w-[85%]' : 'max-w-[85%] sm:max-w-[70%]'; 

    const handleCopy = () => {
        if (msg.isPlaceholder) return; 

        navigator.clipboard.writeText(msg.content)
            .then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000); 
            })
            .catch(err => console.error("Could not copy text: ", err));
    };

    const bubbleClasses = isUser 
        ? 'bg-indigo-600 rounded-tr-none text-white border-none' 
        : 'bg-gray-800 rounded-tl-none text-gray-200 border border-gray-700'; 
        
    return (
        <div className={`flex flex-col w-full ${alignment} mb-4 group`}> 
            
            <div className={`flex items-start gap-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className="flex-shrink-0 mr-1 ml-1"> 
                    {isUser ? (
                        <UserAvatar user={currentUser} size="sm" /> 
                    ) : (
                        <div className={`w-10 h-10 p-2 rounded-full bg-gray-700 text-white flex items-center justify-center flex-shrink-0`}>
                            <Bot size={18} />
                        </div>
                    )} 
                </div>

                <div className={`${bubbleMaxWidth} p-4 rounded-xl shadow-lg transition-all duration-300 ${bubbleClasses}`}
                >
                    {isUser ? (
                        <p className="text-sm whitespace-pre-line leading-relaxed font-sans"> 
                            {msg.content}
                        </p>
                    ) : (
                        <TypingText 
                            fullText={msg.content} 
                            isStreaming={msg.isPlaceholder && isTyping && isLast}
                            isLast={isLast}
                            speed={15} 
                        />
                    )}
                    
                    {/* Nguồn Grounding */}
                    {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-2 border-t border-gray-600">
                            <p className="text-xs font-semibold mb-2 text-gray-400">Nguồn tham khảo:</p>
                            <ul className="space-y-1 text-xs">
                                {msg.sources.map((source, index) => (
                                    <li key={index} className="flex items-start">
                                        <a 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-indigo-400 hover:text-indigo-300 transition underline truncate max-w-full"
                                            title={source.title}
                                        >
                                            <span className="font-mono text-gray-500 mr-2">[{index + 1}]</span>
                                            {source.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* KHU VỰC ACTION MENU CHO TIN NHẮN CỦA AI */}
                {!isUser && !msg.isPlaceholder && (
                    <div className={`flex items-start flex-shrink-0 opacity-0 transition-opacity duration-200 ${isCopied ? 'opacity-100' : 'group-hover:opacity-100'} self-center ml-1`}>
                        <button 
                            onClick={handleCopy}
                            title={isCopied ? "Đã sao chép!" : "Sao chép nội dung"}
                            className={`p-1 rounded-md text-xs font-medium flex items-center justify-center -translate-y-1
                                ${isCopied ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'} 
                                transition-all`}
                        >
                            {isCopied ? <Check size={16} /> : <ClipboardCopy size={16} />}
                        </button>
                    </div>
                )}
                
            </div>
            
        </div>
    );
};

export default function ChatbotAIPage({ user }) {
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    
    const [userProfile, setUserProfile] = useState(null); 

    const [error, setError] = useState(apiKey ? null : "Cảnh báo: Không tìm thấy VITE_GEMINI_API_KEY. Vui lòng kiểm tra file .env");

    const messagesEndRef = useRef(null);
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user?.id) { 
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, email')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error("Error fetching user profile:", error);
                    setUserProfile(user); 
                } else {
                    setUserProfile({
                        ...user, 
                        full_name: data.full_name || user.full_name,
                        avatar_url: data.avatar_url || user.avatar_url,
                        email: data.email || user.email
                    });
                }
            } else {
                setUserProfile(null);
            }
        };

        fetchUserProfile();
    }, [user]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const callGeminiApi = async (userPrompt, chatHistory) => {
        setError(null);
        
        if (!apiKey) {
             const authError = "Lỗi xác thực (403/401): API Key bị thiếu. Vui lòng khai báo VITE_GEMINI_API_KEY trong file .env.";
             setError(authError);
             return { responseText: authError, sources: [] };
        }

        const systemPrompt = "You are HyperX, a helpful and knowledgeable AI assistant. You answer questions concisely, professionally, and in Vietnamese. If the answer requires up-to-date knowledge, use the provided Google Search results to ground your response.";

        const payload = {
            contents: chatHistory,
            tools: [{ "google_search": {} }], 
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        let responseText = "";
        let sources = [];
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                
                if (response.status === 403 || response.status === 401) {
                    throw new Error("Lỗi xác thực (403/401): Vui lòng kiểm tra API Key. Có thể bị thiếu, không hợp lệ, hoặc không có quyền truy cập Gemini API.");
                }

                throw new Error(errorBody.error?.message || `API call failed with status: ${response.status}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                responseText = candidate.content.parts[0].text;
                
                const groundingMetadata = candidate.groundingMetadata;
                if (groundingMetadata && groundingMetadata.groundingAttributions) {
                    sources = groundingMetadata.groundingAttributions
                        .map(attribution => ({
                            uri: attribution.web?.uri,
                            title: attribution.web?.title,
                        }))
                        .filter(source => source.uri && source.title);
                }
            } else {
                responseText = "Xin lỗi, tôi không thể tạo ra phản hồi cho truy vấn này.";
            }

        } catch (err) {
            console.error("Gemini API Error:", err);
            setError("Lỗi kết nối AI: " + err.message); 
            responseText = "Đã xảy ra lỗi hệ thống khi xử lý yêu cầu của bạn.";
        }
        
        return { responseText, sources };
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const prompt = input.trim();
        if (!prompt || isTyping) return;

        setInput("");
        setIsTyping(true);
        setError(null);

        const userMessage = { id: Date.now(), role: "user", content: prompt };
        
        const botPlaceholderId = Date.now() + 1;
        const botPlaceholder = { id: botPlaceholderId, role: "assistant", content: "", isPlaceholder: true };

        setMessages(prev => [...prev, userMessage, botPlaceholder]);

        const historyToSend = messages.slice(-5).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        
        historyToSend.push({ role: 'user', parts: [{ text: prompt }] });


        const { responseText, sources } = await callGeminiApi(prompt, historyToSend);

        setMessages(prev => prev.map(msg => 
            msg.id === botPlaceholderId
            ? { ...msg, content: responseText, sources: sources, isPlaceholder: false }
            : msg
        ));
        
        setIsTyping(false);
    };

    return (
        <div className="relative isolate bg-gray-900 pt-16 overflow-hidden ">
            {/* Background Blur Effect */}
            <div className="absolute min-h-screen inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none">
                <div style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }} className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[1155px] -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30" />
            </div>

            {/* Container chính */}
            <div className="w-full max-w-5xl mx-auto flex flex-col h-[630px] relative z-10 pt-8"> 
                
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-12 pt-4 pb-6 custom-scrollbar"> 
                    {messages.map((msg, index) => (
                        <Message 
                            key={msg.id} 
                            msg={msg} 
                            isLast={index === messages.length - 1}
                            currentUser={userProfile} 
                            isTyping={isTyping}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="w-full bg-gray-900/90 backdrop-blur-md p-4 sm:p-6 border-t border-gray-700 shadow-xl flex-shrink-0">
                    <div className="max-w-4xl mx-auto">
                        {error && (
                            <div className="mb-3 p-3 text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg">
                                Lỗi: {error}
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="relative flex items-center">
                            <input 
                                type="text" 
                                placeholder={isTyping ? "AI đang trả lời..." : "Nhập câu hỏi của bạn..."} 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                disabled={isTyping}
                                className="w-full bg-gray-800 border border-gray-600 rounded-full pl-5 pr-16 py-3 text-white focus:ring-pink-500 focus:border-pink-500 transition placeholder-gray-400 disabled:opacity-70 disabled:cursor-not-allowed" 
                            />
                            <button 
                                type="submit" 
                                disabled={isTyping || input.trim() === ""}
                                className="absolute right-2 p-3 bg-pink-600 text-white rounded-full hover:bg-pink-500 transition shadow-lg shadow-pink-900/40 disabled:bg-gray-600 disabled:opacity-50"
                            >
                                {isTyping ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}