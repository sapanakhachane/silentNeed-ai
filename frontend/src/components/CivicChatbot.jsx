import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw, 
  HelpCircle, Droplets, AlertTriangle, Compass, ChevronDown, Check
} from "lucide-react";
import { sendChatMessage } from "../services/api";
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from "../i18n/translations";

export default function CivicChatbot({ currentLang = "en", setLang, communities = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const messagesEndRef = useRef(null);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Initialize or reset welcome message when language changes
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: t.chatWelcome,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  }, [currentLang, t.chatWelcome]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (overrideText) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInput("");
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await sendChatMessage(userMsg.text, currentLang, history);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: res?.reply || "Unable to retrieve diagnostic response. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "⚠️ Communication error. The SilentNeed AI engine is currently operating in offline mode.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = {
    en: [
      { label: "💧 Water Contamination", query: "Which community has the worst drinking water crisis?" },
      { label: "🚨 Highest Silent Need", query: "Which community has the highest Silent Need Index?" },
      { label: "💡 The Paradox", query: "Explain why zero complaints does not mean zero problems." },
      { label: "🗺️ OSM Deserts", query: "What are OpenStreetMap Infrastructure Deserts?" }
    ],
    hi: [
      { label: "💧 गंभीर जल संकट", query: "सबसे गंभीर पेयजल संकट किस बस्ती में है?" },
      { label: "🚨 सर्वोच्च साइलेंट नीड", query: "किस बस्ती का साइलेंट नीड इंडेक्स सबसे अधिक है?" },
      { label: "💡 शिकायत विरोधाभास", query: "कम शिकायतों का मतलब कम समस्याएं क्यों नहीं है?" },
      { label: "🗺️ OSM सुविधा शून्य", query: "ओपन-स्ट्रीट-मैप इंफ्रास्ट्रक्चर डेजर्ट क्या है?" }
    ],
    mr: [
      { label: "💧 पाणी टंचाई", query: "सर्वात जास्त पाणी टंचाई कोणत्या वस्तीत आहे?" },
      { label: "🚨 सर्वोच्च सायलेंट नीड", query: "कोणत्या वस्तीत सर्वात जास्त अदृश्य गरज आहे?" },
      { label: "💡 दुर्लक्षाचा विरोधाभास", query: "नागरी दुर्लक्षाचा विरोधाभास समजावून सांगा." }
    ],
    bn: [
      { label: "💧 জল সংকট", query: "কোন এলাকায় সবচেয়ে বেশি পানীয় জলের সংকট?" },
      { label: "🚨 সর্বোচ্চ নীরব চাহিদা", query: "কোন সম্প্রদায়ের সাইলেন্ট নিড সবচেয়ে বেশি?" },
      { label: "💡 অভিযোগের নীতি", query: "কম অভিযোগ মানেই কম সমস্যা নয় কেন?" }
    ],
    ta: [
      { label: "💧 குடிநீர் நெருக்கடி", query: "மிகக் கடுமையான குடிநீர் தட்டுப்பாடு எங்கு உள்ளது?" },
      { label: "🚨 அதிகபட்ச தேவை", query: "அதிகபட்ச மறைமுகத் தேவை உள்ள பகுதி எது?" }
    ],
    es: [
      { label: "💧 Crisis de Agua", query: "¿Cuál comunidad tiene la peor crisis de agua potable?" },
      { label: "🚨 Mayor Necesidad", query: "¿Cuál es la comunidad con mayor Índice de Necesidad Silenciosa?" },
      { label: "💡 La Paradoja", query: "Explique la paradoja de quejas cívicas." }
    ]
  };

  const activePrompts = quickPrompts[currentLang] || quickPrompts.en;

  const renderFormattedText = (text) => {
    // Basic Markdown bold & newline rendering
    const paragraphs = text.split("\n\n");
    return paragraphs.map((para, pIdx) => {
      const lines = para.split("\n");
      return (
        <p key={pIdx} className="mb-2 last:mb-0">
          {lines.map((line, lIdx) => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <React.Fragment key={lIdx}>
                {parts.map((part, partIdx) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={partIdx} className="font-semibold text-emerald-300">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return part;
                })}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            );
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-full shadow-2xl shadow-emerald-950/60 transition-all duration-300 hover:scale-105 group border border-emerald-400/30 backdrop-blur-md"
          aria-label="Open SilentNeed AI Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse text-emerald-100" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold tracking-wide uppercase text-emerald-200">
              {t.appName}
            </div>
            <div className="text-sm font-medium text-white flex items-center gap-1.5">
              <span>{t.chatTitle}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
          </div>
        </button>
      )}

      {/* Floating Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[440px] h-[580px] max-h-[85vh] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">{t.chatTitle}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{t.chatSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language pill in header */}
              {setLang && (
                <div className="relative">
                  <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    <span>{SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.flag || "🌐"}</span>
                    <span className="uppercase text-[11px] font-bold">{currentLang}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showLangMenu && (
                    <div className="absolute right-0 mt-1 w-36 py-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLang(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-slate-700 transition ${
                            currentLang === lang.code ? "text-emerald-400 font-bold bg-slate-700/50" : "text-slate-300"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.native}</span>
                          </span>
                          {currentLang === lang.code && <Check className="w-3 h-3 text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Prompts */}
          <div className="px-3.5 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-0.5" />
            {activePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/40 text-slate-300 border border-slate-700/60 transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Message History Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-900/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-xs"
                  }`}
                >
                  {msg.sender === "bot" ? renderFormattedText(msg.text) : msg.text}
                  <div
                    className={`text-[9px] mt-1.5 font-medium ${
                      msg.sender === "user" ? "text-emerald-200/80 text-right" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-teal-900/80 border border-teal-500/30 flex items-center justify-center shrink-0 text-teal-300 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl rounded-bl-xs px-4 py-2.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-slate-400 ml-1.5">Analyzing municipal data...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.chatPlaceholder}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:hover:from-emerald-600 text-white rounded-xl shadow-md transition"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 px-1">
              <span>Empowered by Scikit-Learn & OpenStreetMap Overpass</span>
              <button
                onClick={() => setMessages([
                  {
                    id: "welcome",
                    sender: "bot",
                    text: t.chatWelcome,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  }
                ])}
                className="hover:text-slate-300 transition"
              >
                Reset Chat
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
