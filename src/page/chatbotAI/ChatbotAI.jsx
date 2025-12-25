import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Send, Loader2, Bot, ClipboardCopy, Check, Image as ImageIcon,
  StopCircle, X, CirclePause, Pause, Copy, PlusCircle, CircleCheck, Sparkles
} from "lucide-react";
import { supabase } from '../../routes/supabaseClient';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"; // Giữ nguyên theme code tối
import UserAvatar from '../../components/UserAvatar.jsx';
import ChatInput from './ChatInput.jsx';

// --- CONFIG --- (Giữ nguyên)
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || "";
const apiKey = getApiKey();
const modelName = "gemini-2.5-flash";
const apiUrlBase = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
const apiUrl = `${apiUrlBase}${apiKey ? `?key=${apiKey}` : ""}`;
const MAX_HISTORY_TURNS = 5;
const initialMessages = [];
const systemInstruction = "You are HyperX, a helpful and knowledgeable AI assistant. Answer in Vietnamese.";

// --- HELPERS --- (Giữ nguyên)
const convertToBase64 = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
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
const Message = ({ msg, isLast, isTyping, currentUser }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = msg.role === "user";
  
  // Style Bong bóng chat mới
  const bubbleClasses = isUser 
    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/20" 
    : "bg-[#0B0D14] border border-white/5 text-gray-200 shadow-none"; // Bot nền tối, border mảnh

  const handleCopy = () => {
    if (isUser || msg.isPlaceholder || msg.isThinking) return; 
    navigator.clipboard.writeText(msg.content || "").then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); });
  };

  const isAssistantThinking = !isUser && msg.isThinking && isTyping;
  const isAssistantTyping = !isUser && msg.isPlaceholder && isTyping && msg.content && (msg.content + "").length > 0;
  let displayContent = msg.content || "";
  if (isAssistantThinking) displayContent = "Thinking...";
  else if (isAssistantTyping) displayContent = escapeMarkdownDuringTyping(msg.content || "", true);
  else if (!isUser) displayContent = msg.content || "";

  const canShowCopyButton = !isUser && !msg.isPlaceholder && !msg.isThinking && msg.content && typeof msg.content === 'string' && msg.content.trim() !== "";

  return (
    <div className={`flex flex-col w-full mb-6 ${isUser ? "items-end" : "items-start"}`}>
      <div className={`flex items-start gap-3 max-w-[90%] md:max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <UserAvatar user={currentUser} size="sm" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles size={16} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 min-w-0">
            {/* Image Preview inside User Bubble */}
            {isUser && msg.imageUrl && (
                <div className="mb-1 self-end">
                    <img src={msg.imageUrl} alt="uploaded" className="rounded-xl max-w-[200px] border border-white/10 shadow-lg" />
                </div>
            )}

            <div className={`px-5 py-3.5 rounded-2xl ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"} ${bubbleClasses} text-sm md:text-base leading-relaxed`}>
            {isUser ? (
                <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
            ) : (
                <>
                {isAssistantThinking ? (
                    <div className="flex items-center gap-2 text-indigo-300">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-xs font-medium uppercase tracking-wider animate-pulse">Analyzing...</span>
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
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        code({ inline, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || "");
                                            return !inline ? (
                                                <div className="my-3 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                                    <div className="bg-[#1e1e1e] px-3 py-1.5 flex justify-between items-center border-b border-white/5">
                                                        <span className="text-xs text-gray-400 font-mono">{match?.[1] || 'code'}</span>
                                                    </div>
                                                    <SyntaxHighlighter language={match?.[1]} style={oneDark} PreTag="div" customStyle={{margin:0, borderRadius:0, background:'#1e1e1e'}} {...props}>
                                                        {String(children).replace(/\n$/, "")}
                                                    </SyntaxHighlighter>
                                                </div>
                                            ) : (
                                                <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-200 font-mono text-xs" {...props}>{children}</code>
                                            );
                                        },
                                        img: ({ src, alt }) => <img src={src} alt={alt} className="max-w-full rounded-lg my-2 border border-white/10" />,
                                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                                        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{children}</a>,
                                        h1: ({children}) => <h1 className="text-xl font-bold mt-4 mb-2 text-white">{children}</h1>,
                                        h2: ({children}) => <h2 className="text-lg font-bold mt-3 mb-2 text-white">{children}</h2>,
                                        h3: ({children}) => <h3 className="text-base font-bold mt-2 mb-1 text-white">{children}</h3>,
                                    }}
                                    >
                                    {stable}
                                    </ReactMarkdown>
                                )}
                                {unstable && <span className="text-gray-300">{unstable}</span>}
                                </>
                            );
                        })()}
                    </div>
                )}
                </>
            )}
            </div>

            {/* Copy Button for Bot */}
            {canShowCopyButton && (
                <div className="flex items-center gap-2 mt-1 ml-1">
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-white/5">
                        {isCopied ? <CircleCheck size={14} /> : <Copy size={14} />}
                        {isCopied ? "Copied" : "Copy"}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function ChatbotAIPage({ user }) {
  const [messages, setMessages] = useState(initialMessages);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [alert, setAlert] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [abortCtrl, setAbortCtrl] = useState(null);
  const simIntervalRef = useRef(null);
  const isTypingRef = useRef(false);
  const msgContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);

  useEffect(() => {
    const handleClickOutside = (event) => { if (isMenuOpen && !event.target.closest('.input-area-wrapper')) setIsMenuOpen(false); };
    document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url, email").eq("id", user.id).single();
        if (error) setUserProfile(user);
        else setUserProfile({ ...user, full_name: data.full_name || user.full_name, avatar_url: data.avatar_url || user.avatar_url, email: data.email || user.email });
      } else setUserProfile(null);
    };
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (!isChatStarted) return;
    const el = msgContainerRef.current;
    if (!el) return;
    const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100; // Tăng ngưỡng tự scroll
    if (isBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isChatStarted]);

  // Drag & Drop logic (Giữ nguyên)
  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;
    const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
    const highlight = () => dropArea.classList.add("border-indigo-500", "bg-indigo-500/10");
    const unhighlight = () => dropArea.classList.remove("border-indigo-500", "bg-indigo-500/10");
    const handleDrop = (e) => {
      preventDefaults(e); if (isTypingRef.current) return;
      const file = e.dataTransfer.files?.[0]; if (file) handleFileSelect(file);
      unhighlight();
    };
    ["dragenter", "dragover", "dragleave", "drop"].forEach((evt) => dropArea.addEventListener(evt, preventDefaults));
    ["dragenter", "dragover"].forEach((evt) => dropArea.addEventListener(evt, highlight));
    ["dragleave", "drop"].forEach((evt) => dropArea.addEventListener(evt, unhighlight));
    dropArea.addEventListener("drop", handleDrop);
    return () => { try { ["dragenter", "dragover", "dragleave", "drop"].forEach((evt) => dropArea.removeEventListener(evt, preventDefaults)); dropArea.removeEventListener("drop", handleDrop); } catch (e) {} };
  }, []);

  const showAlert = (text, type = "info", ms = 4000) => { setAlert({ text, type }); setTimeout(() => setAlert(null), ms); };
  const handleCancelFile = useCallback(() => { setSelectedFile(null); setPreviewUrl(null); }, []);
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return; if (file.size > 5 * 1024 * 1024) { showAlert("File size exceeds 5MB.", "error"); return; }
    setSelectedFile(file);
    try { if (file.type.startsWith("image/")) { setPreviewUrl(URL.createObjectURL(file)); } else { setPreviewUrl(null); } } catch (err) { setPreviewUrl(null); }
  }, []);

  const handleStop = useCallback(() => {
    if (abortCtrl) try { abortCtrl.abort(); } catch (e) {}
    if (simIntervalRef.current) { clearInterval(simIntervalRef.current); simIntervalRef.current = null; }
    setIsTyping(false); setAbortCtrl(null);
    setMessages((prev) => prev.map((m) => (m.isPlaceholder ? { ...m, isPlaceholder: false, isThinking: false } : m)));
    showAlert("Stopped.", "info", 2000);
  }, [abortCtrl]);

  const callGeminiApi = useCallback(async (userPrompt, chatHistory = [], imageFile = null, onChunk = null) => {
    // Logic gọi API giữ nguyên
    setAlert(null);
    if (!apiKey) { setAlert({ text: "Missing API Key", type: "error" }); return { responseText: "API Key Error", sources: [] }; }
    const userContentParts = [{ text: userPrompt }];
    if (imageFile) {
      try { const base64 = await convertToBase64(imageFile); const pure = base64.split(",")[1]; userContentParts.push({ inline_data: { mime_type: imageFile.type, data: pure } }); } catch (err) {}
    }
    const payload = {
      contents: [...chatHistory, { role: "user", parts: userContentParts }],
      systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
    };
    let accumulated = ""; let sources = []; const controller = new AbortController(); setAbortCtrl(controller);
    try {
      const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Unknown error");
      const candidate = result.candidates?.[0] || null;
      if (candidate) { accumulated = candidate.content?.parts?.[0]?.text || ""; }
      if (onChunk && accumulated) {
        const revealSpeed = 15; let i = 0;
        await new Promise((resolve) => {
          simIntervalRef.current = setInterval(() => { i++; onChunk(accumulated.slice(0, i)); if (i >= accumulated.length) { clearInterval(simIntervalRef.current); simIntervalRef.current = null; resolve(); } }, revealSpeed);
        });
      }
    } catch (err) { if (err.name === "AbortError") return { responseText: accumulated, sources }; setAlert({ text: err.message, type: "error" }); return { responseText: accumulated || "Error processing request.", sources }; } finally { setAbortCtrl(null); if (simIntervalRef.current) { clearInterval(simIntervalRef.current); simIntervalRef.current = null; } }
    return { responseText: accumulated, sources };
  }, [setAlert, setAbortCtrl]);

  const handleSendMessage = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const prompt = (input || "").trim();
    if (!prompt && !selectedFile) return; if (isTyping) return;
    setIsMenuOpen(false); const now = Date.now();
    if (!isChatStarted) setIsChatStarted(true);
    const fileToSend = selectedFile; const urlToShow = previewUrl;
    setInput(""); setSelectedFile(null); setPreviewUrl(null); setIsTyping(true); setAlert(null);
    const userMsg = { id: now, role: "user", content: prompt || (fileToSend ? `[Analyze file: ${fileToSend.name}]` : ""), imageUrl: urlToShow || null };
    const botPlaceholderId = now + 1;
    const botPlaceholder = { id: botPlaceholderId, role: "assistant", content: "", isPlaceholder: true, isThinking: true, sources: [] };
    setMessages((prev) => [...prev, userMsg, botPlaceholder]);
    const chatHistory = messages.filter(m => !m.isPlaceholder).slice(-MAX_HISTORY_TURNS * 2).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content || "" }] }));
    const onChunk = (acc) => {
      setMessages((prev) => prev.map((m) => { if (m.id === botPlaceholderId) { return { ...m, content: acc, isThinking: false }; } return m; }));
      const el = msgContainerRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    };
    try {
      const { responseText, sources } = await callGeminiApi(prompt || "", chatHistory, fileToSend, onChunk);
      setMessages((prev) => prev.map((m) => (m.id === botPlaceholderId ? { ...m, content: responseText, sources, isPlaceholder: false, isThinking: false } : m)));
    } catch (err) { setMessages((prev) => prev.map((m) => (m.id === botPlaceholderId ? { ...m, content: "Error receiving response.", isPlaceholder: false, isThinking: false } : m))); } finally { setIsTyping(false); }
  }, [input, selectedFile, isTyping, isChatStarted, previewUrl, messages, callGeminiApi, setIsMenuOpen]);

  return (
    // MAIN CONTAINER: Màu nền đen, khóa chiều cao
    <div className="bg-[#05050A] text-gray-300 font-sans h-screen w-screen overflow-hidden flex flex-col pt-16 relative isolate">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 w-[50rem] h-[50rem] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {isChatStarted ? (
        <div className="flex flex-col flex-1 h-full w-full max-w-5xl mx-auto relative z-10">
          
          {/* Chat History Area (Scrollable) */}
          <div ref={msgContainerRef} className="flex-1 overflow-y-auto px-4 md:px-0 pt-6 pb-4 custom-scrollbar scroll-smooth">
            <div className="max-w-3xl mx-auto w-full">
                {messages.map((msg, idx) => (
                <Message key={msg.id} msg={msg} isLast={idx === messages.length - 1} currentUser={userProfile} isTyping={isTyping} />
                ))}
                <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area (Fixed at bottom) */}
          <div className="input-area-wrapper w-full pb-6 px-4 md:px-0">
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
        // Welcome Screen (Centered)
        <div className="flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto px-4 relative z-10">
          <div className="text-center mb-10 space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_40px_rgba(99,102,241,0.4)] mb-4">
                <Bot size={40} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{userProfile?.full_name || "Creator"}</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              I'm HyperX AI. How can I help you build something amazing today?
            </p>
          </div>
          
          <div className="w-full max-w-2xl input-area-wrapper">
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