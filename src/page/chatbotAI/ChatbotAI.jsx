import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Loader2, Bot, Copy, CircleCheck, Sparkles, User
} from "lucide-react";
import { supabase } from '../../routes/supabaseClient'; // Vẫn giữ để lấy User Profile
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import UserAvatar from '../../components/UserAvatar';
import ChatInput from './ChatInput';

const MAX_HISTORY_TURNS = 3;

// --- HELPERS ---
const convertToBase64 = (file) => new Promise((resolve, reject) => { 
    const reader = new FileReader(); 
    reader.onload = () => resolve(reader.result); 
    reader.onerror = reject; 
    reader.readAsDataURL(file); 
});

function splitMarkdownStable(text = "") {
  const count = (re) => (text.match(re) || []).length;
  const ticks = count(/`/g); const bold = count(/\*\*/g); const italics = count(/(^|[^*])\*([^*]|$)/g);
  const oddOpen = (n) => n % 2 !== 0;
  if (!oddOpen(ticks) && !oddOpen(bold) && !oddOpen(italics)) return { stable: text, unstable: "" };
  let cutoff = text.length;
  const lastTick = text.lastIndexOf("`"); const lastBold = text.lastIndexOf("**"); const lastItalic = text.lastIndexOf("*");
  const candidates = [lastTick, lastBold, lastItalic].filter((v) => v >= 0);
  if (candidates.length > 0) cutoff = Math.min(...candidates);
  if (cutoff < 0 || cutoff >= text.length) return { stable: text, unstable: "" };
  return { stable: text.slice(0, cutoff), unstable: text.slice(cutoff) };
}
const escapeMarkdownDuringTyping = (text = "", isTyping = false) => { if (!isTyping || !text) return text; return text.replace(/\*/g, "\\*").replace(/_/g, "\\_"); };

// --- COMPONENT: Message Bubble ---
const Message = ({ msg, isTyping, currentUser }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = msg.role === "user";
  
  const bubbleClasses = isUser 
    ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 border border-cyan-500/20" 
    : "bg-[#0B0D14]/80 backdrop-blur-md border border-white/10 text-gray-200 shadow-xl";

  const handleCopy = () => {
    if (isUser || msg.isPlaceholder || msg.isThinking) return; 
    navigator.clipboard.writeText(msg.content || "").then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); });
  };

  const isAssistantThinking = !isUser && msg.isThinking && isTyping;
  const isAssistantTyping = !isUser && msg.isPlaceholder && isTyping && msg.content && (msg.content + "").length > 0;
  const canShowCopyButton = !isUser && !msg.isPlaceholder && !msg.isThinking && msg.content && typeof msg.content === 'string' && msg.content.trim() !== "";

  return (
    <div className={`flex flex-col w-full mb-8 ${isUser ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex items-start gap-4 max-w-[90%] md:max-w-[85%] lg:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <UserAvatar user={currentUser} size="sm" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Bot size={18} />
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-2 min-w-0 ${isUser ? "items-end" : "items-start"}`}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 px-1">
                {isUser ? "You" : "HyperX AI"}
            </span>

            {isUser && msg.imageUrl && (
                <div className="mb-2 overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                    <img src={msg.imageUrl} alt="uploaded" className="max-w-[200px] max-h-[200px] object-cover" />
                </div>
            )}

            <div className={`px-5 py-4 rounded-2xl ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"} ${bubbleClasses} text-sm md:text-base leading-relaxed relative group`}>
            {isUser ? (
                <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
            ) : (
                <>
                {isAssistantThinking ? (
                    <div className="flex items-center gap-3 text-cyan-400">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Thinking...</span>
                    </div>
                ) : (
                    <div className="markdown-content">
                        {(() => {
                            const contentToRender = isAssistantTyping ? escapeMarkdownDuringTyping(msg.content || "", true) : msg.content || "";
                            const { stable, unstable } = splitMarkdownStable(contentToRender);
                            const hasStableContent = stable && stable.trim().length > 0;
                            return (
                                <>
                                {hasStableContent && (
                                    <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                        code({ inline, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || "");
                                            return !inline ? (
                                                <div className="my-4 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-[#0d1117]">
                                                    <div className="bg-[#161b22] px-4 py-2 flex justify-between items-center border-b border-white/5">
                                                        <span className="text-xs text-cyan-400 font-mono font-bold lowercase">{match?.[1] || 'code'}</span>
                                                    </div>
                                                    <SyntaxHighlighter language={match?.[1]} style={oneDark} PreTag="div" customStyle={{margin:0, borderRadius:0, background:'transparent', fontSize: '0.85rem'}} {...props}>
                                                        {String(children).replace(/\n$/, "")}
                                                    </SyntaxHighlighter>
                                                </div>
                                            ) : (
                                                <code className="bg-cyan-900/20 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs border border-cyan-500/20" {...props}>{children}</code>
                                            );
                                        },
                                        img: ({ src, alt }) => <img src={src} alt={alt} className="max-w-full rounded-xl my-3 border border-white/10 shadow-md" />,
                                        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 marker:text-cyan-500">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 marker:text-cyan-500">{children}</ol>,
                                        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 hover:decoration-cyan-500 transition-all">{children}</a>,
                                        h1: ({children}) => <h1 className="text-2xl font-bold mt-6 mb-3 text-white border-b border-white/10 pb-2">{children}</h1>,
                                        h2: ({children}) => <h2 className="text-xl font-bold mt-5 mb-2 text-white">{children}</h2>,
                                        h3: ({children}) => <h3 className="text-lg font-bold mt-4 mb-2 text-cyan-100">{children}</h3>,
                                        blockquote: ({children}) => <blockquote className="border-l-4 border-cyan-500/50 pl-4 py-1 my-4 bg-cyan-900/10 italic rounded-r-lg text-gray-400">{children}</blockquote>,
                                    }}
                                    >
                                    {stable}
                                    </ReactMarkdown>
                                )}
                                {unstable && <span className="text-cyan-200 animate-pulse">{unstable}</span>}
                                </>
                            );
                        })()}
                    </div>
                )}
                </>
            )}
            
            {canShowCopyButton && (
                <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-cyan-400 transition-colors px-2 py-1 rounded-md hover:bg-white/5">
                        {isCopied ? <CircleCheck size={12} className="text-green-400" /> : <Copy size={12} />}
                        {isCopied ? "Copied" : "Copy"}
                    </button>
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: Page Skeleton ---
const PageSkeleton = () => (
  <div className="flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto px-4 relative z-10">
    <div className="text-center mb-12 space-y-8 flex flex-col items-center">
      <div className="mb-8 relative flex items-center justify-center">
        <div className="premium-loader" />
        <Bot size={32} className="absolute text-cyan-400 opacity-20 animate-pulse" />
      </div>
      <div className="h-10 md:h-14 w-64 md:w-96 skeleton-cyan rounded-2xl" />
      <div className="space-y-3 mt-4 flex flex-col items-center w-full">
        <div className="h-4 w-72 md:w-[30rem] skeleton-cyan rounded-full opacity-60" />
        <div className="h-4 w-48 md:w-80 skeleton-cyan rounded-full opacity-40" />
      </div>
      <div className="mt-8">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-500/50 animate-pulse">Loading...</span>
      </div>
    </div>
    <div className="w-full max-w-3xl h-16 skeleton-cyan rounded-2xl mt-4" style={{ opacity: 0.15 }} />
  </div>
);

// --- MAIN PAGE ---
export default function ChatbotAIPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [input, setInput] = useState("");

  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [alert, setAlert] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [abortCtrl, setAbortCtrl] = useState(null);
  const simIntervalRef = useRef(null);
  const isTypingRef = useRef(false);
  const msgContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const dropRef = useRef(null);

  // --- HELPERS / HANDLERS ---
  const showAlert = (text, type = "info", ms = 4000) => { setAlert({ text, type }); setTimeout(() => setAlert(null), ms); };
  
  const handleCancelFile = useCallback(() => { setSelectedFile(null); setPreviewUrl(null); }, []);
  
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return; 
    if (file.size > 5 * 1024 * 1024) { showAlert("File size exceeds 5MB.", "error"); return; }
    setSelectedFile(file);
    try { 
        if (file.type.startsWith("image/")) { setPreviewUrl(URL.createObjectURL(file)); } 
        else { setPreviewUrl(null); } 
    } catch { setPreviewUrl(null); }
  }, []);

  const handleStop = useCallback(() => {
    if (abortCtrl) try { abortCtrl.abort(); } catch { }
    if (simIntervalRef.current) { clearInterval(simIntervalRef.current); simIntervalRef.current = null; }
    setIsTyping(false); setAbortCtrl(null);
    setMessages((prev) => prev.map((m) => (m.isPlaceholder ? { ...m, isPlaceholder: false, isThinking: false, content: m.content || "Stopped." } : m)));
    showAlert("Stopped.", "info", 2000);
  }, [abortCtrl]);

  // --- GEMINI API FUNCTION (ĐÃ SỬA: GỌI QUA NETLIFY FUNCTION) ---
  const callGeminiApi = useCallback(async (userPrompt, chatHistory = [], imageFile = null, onChunk = null) => {
    setAlert(null);

    // Chuẩn bị ảnh dưới dạng Base64 (nếu có)
    let imageBase64 = null;
    if (imageFile) {
        try {
            const base64Full = await convertToBase64(imageFile);
            imageBase64 = base64Full.split(",")[1];
        } catch (err) {
            console.error("Lỗi convert ảnh:", err);
        }
    }

    let accumulated = "";
    
    // Controller để cho phép user bấm nút Stop
    const controller = new AbortController();
    setAbortCtrl(controller);

    try {
      // ✅ THAY ĐỔI QUAN TRỌNG: Gọi về Netlify Functions
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: userPrompt,
            image: imageBase64,
            history: chatHistory
        }),
        signal: controller.signal
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP Error: ${response.status}`);
      }

      // Netlify function trả về { text: "..." }
      accumulated = data.text || "";

      // Giả lập hiệu ứng gõ chữ
      if (onChunk && accumulated) {
        const revealSpeed = 10; 
        let i = 0; 
        await new Promise((resolve) => {
          simIntervalRef.current = setInterval(() => { 
              i += 5; // Tăng tốc độ hiển thị
              if (i > accumulated.length) i = accumulated.length;
              
              onChunk(accumulated.slice(0, i)); 
              
              if (i >= accumulated.length) { 
                  clearInterval(simIntervalRef.current); 
                  simIntervalRef.current = null; 
                  resolve(); 
              } 
          }, revealSpeed);
        });
      }

    } catch (err) {
      if (err.name === "AbortError") return { responseText: accumulated };
      console.error("API Error:", err);
      throw err;
    } finally { 
        setAbortCtrl(null); 
        if (simIntervalRef.current) { 
            clearInterval(simIntervalRef.current); 
            simIntervalRef.current = null; 
        } 
    }
    
    return { responseText: accumulated };
  }, [setAlert, setAbortCtrl]);


  const handleSendMessage = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const prompt = (input || "").trim();
    if (!prompt && !selectedFile) return; 
    if (isTyping) return;
    
    setIsMenuOpen(false); 
    const now = Date.now();
    if (!isChatStarted) setIsChatStarted(true);
    
    const fileToSend = selectedFile; 
    const urlToShow = previewUrl;
    setInput(""); 
    setSelectedFile(null); 
    setPreviewUrl(null); 
    setIsTyping(true); 
    setAlert(null);

    const userMsg = { id: now, role: "user", content: prompt || (fileToSend ? `[Analyze file: ${fileToSend.name}]` : ""), imageUrl: urlToShow || null };
    const botPlaceholderId = now + 1;
    const botPlaceholder = { id: botPlaceholderId, role: "assistant", content: "", isPlaceholder: true, isThinking: true };
    
    setMessages((prev) => [...prev, userMsg, botPlaceholder]);
    
    const chatHistory = messages.filter(m => !m.isPlaceholder).slice(-MAX_HISTORY_TURNS * 2).map(m => ({ 
        role: m.role === 'assistant' ? 'model' : 'user', 
        parts: [{ text: m.content || "" }] 
    }));

    const onChunk = (acc) => {
      setMessages((prev) => prev.map((m) => { 
          if (m.id === botPlaceholderId) { return { ...m, content: acc, isThinking: false }; } 
          return m; 
      }));
      const el = msgContainerRef.current; 
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    };

    try {
      const { responseText } = await callGeminiApi(prompt || "", chatHistory, fileToSend, onChunk);
      
      setMessages((prev) => prev.map((m) => (m.id === botPlaceholderId ? { 
          ...m, 
          content: responseText, 
          isPlaceholder: false, 
          isThinking: false 
      } : m)));

    } catch (error) {
        console.error("LỖI GỌI API:", error);
        setMessages((prev) => prev.map((m) => (m.id === botPlaceholderId ? { 
            ...m, 
            content: `**Error:** ${error.message || "Something went wrong."}`, 
            isPlaceholder: false, 
            isThinking: false 
        } : m)));
        showAlert(`Error: ${error.message}`, "error");
    } finally { 
        setIsTyping(false); 
    }
  }, [input, selectedFile, isTyping, isChatStarted, previewUrl, messages, callGeminiApi, setIsMenuOpen]);

  // --- EFFECTS ---
  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);

  useEffect(() => {
    const handleClickOutside = (event) => { if (isMenuOpen && !event.target.closest('.input-area-wrapper')) setIsMenuOpen(false); };
    document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsProfileLoading(true);
      if (user?.id) {
        const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url, email").eq("id", user.id).single();
        if (error) setUserProfile(user);
        else setUserProfile({ ...user, full_name: data.full_name || user.full_name, avatar_url: data.avatar_url || user.avatar_url, email: data.email || user.email });
      } else setUserProfile(null);
      setIsProfileLoading(false);
    };
    fetchUserProfile();
  }, [user?.id]);

  useEffect(() => {
    if (!isChatStarted) return;
    const el = msgContainerRef.current;
    if (!el) return;
    const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
    if (isBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isChatStarted]);

  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;
    const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
    const highlight = () => dropArea.classList.add("border-cyan-500", "bg-cyan-500/5");
    const unhighlight = () => dropArea.classList.remove("border-cyan-500", "bg-cyan-500/5");
    const handleDrop = (e) => {
      preventDefaults(e); if (isTypingRef.current) return;
      const file = e.dataTransfer.files?.[0]; if (file) handleFileSelect(file);
      unhighlight();
    };
    ["dragenter", "dragover", "dragleave", "drop"].forEach((evt) => dropArea.addEventListener(evt, preventDefaults));
    ["dragenter", "dragover"].forEach((evt) => dropArea.addEventListener(evt, highlight));
    ["dragleave", "drop"].forEach((evt) => dropArea.addEventListener(evt, unhighlight));
    dropArea.addEventListener("drop", handleDrop);
    return () => { try { ["dragenter", "dragover", "dragleave", "drop"].forEach((evt) => dropArea.removeEventListener(evt, preventDefaults)); dropArea.removeEventListener("drop", handleDrop); } catch { } };
  }, [handleFileSelect, isTypingRef]);

  return (
    <div className="bg-[#05050A] text-gray-300 font-sans h-screen w-screen overflow-hidden flex flex-col pt-16 relative isolate">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 w-[60rem] h-[60rem] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 -z-10 w-[50rem] h-[50rem] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {isProfileLoading ? (
        <PageSkeleton />
      ) : isChatStarted ? (
        <div className="mt-6 flex flex-col flex-1 h-full w-full max-w-5xl mx-auto relative z-10">
          <div ref={msgContainerRef} className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-4 custom-scrollbar scroll-smooth">
            <div className="max-w-3xl mx-auto w-full">
                {messages.map((msg) => (
                <Message key={msg.id} msg={msg} currentUser={userProfile} isTyping={isTyping} />
                ))}
                <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="input-area-wrapper w-full pb-6 px-4 md:px-6 pt-2">
            <ChatInput
              isCentered={false}
              isTyping={isTyping}
              alert={alert}
              previewUrl={previewUrl}
              selectedFile={selectedFile}
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
              handleStop={handleStop}
              handleFileSelect={handleFileSelect}
              handleCancelFile={handleCancelFile}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              dropRef={dropRef}
            />
          </div>
        </div>
      ) : (
        <div className=" flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_50px_rgba(34,211,238,0.4)] mb-4 ring-1 ring-white/20">
                <Bot size={48} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  {userProfile?.full_name || "Creator"}
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-xl mx-auto font-light leading-relaxed">
             “I’m HyperX AI — built to assist and optimize.”
            </p>
          </div>
          
          <div className="w-full max-w-3xl input-area-wrapper">
            <ChatInput
              isCentered={true}
              isTyping={isTyping}
              alert={alert}
              previewUrl={previewUrl}
              selectedFile={selectedFile}
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
              handleStop={handleStop}
              handleFileSelect={handleFileSelect}
              handleCancelFile={handleCancelFile}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              dropRef={dropRef}
            />
          </div>
        </div>
      )}
    </div>
  );
}