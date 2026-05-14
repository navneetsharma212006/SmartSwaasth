import { useState, useRef, useEffect } from "react";
import { aiChat } from "../lib/api";

/* ── Markdown-style basic formatter ─────────────────────────────────────── */
function formatMessage(text) {
  // Bold **text**
  let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Italic *text*
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // Bullet lines starting with - or •
  html = html.replace(/^[-•]\s(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul class='list-disc pl-4 my-1 space-y-0.5'>$1</ul>");
  // Line breaks
  html = html.replace(/\n/g, "<br/>");
  return html;
}

const SUGGESTIONS = [
  "What medicines am I taking?",
  "How is my adherence this month?",
  "Can I take these medicines together?",
  "What are the side effects of my medicines?",
  "Should I take my medicine before or after food?",
];

const WELCOME = `Namaste! 🙏 I'm **SwaasthSaathi**, your personal AI health assistant.

I know your medicine schedule and can help you with:
• Understanding your medicines
• Checking your adherence
• Side effects & precautions
• Medicine timing advice

How can I help you today?`;

export default function SwaasthSaathi() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", parts: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", parts: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history for multi-turn context (exclude welcome message)
      const history = messages
        .slice(1) // skip welcome
        .map((m) => ({ role: m.role, parts: m.parts }));

      const { reply } = await aiChat(msg, history);
      setMessages((prev) => [...prev, { role: "model", parts: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          parts: "Sorry, I'm having trouble connecting right now. Please try again in a moment. 🙏",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating bubble ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open SwaasthSaathi AI"
        className="fixed bottom-6 right-6 z-[9990] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          boxShadow: "0 8px 32px rgba(16,185,129,0.5)",
        }}
      >
        {open ? (
          <span className="text-white text-xl font-bold">✕</span>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[9989] flex flex-col rounded-3xl shadow-2xl overflow-hidden"
          style={{
            width: "min(380px, calc(100vw - 2rem))",
            height: "min(580px, calc(100vh - 8rem))",
            background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{
              background: "linear-gradient(90deg, #065f46, #047857)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center text-xl shrink-0 border border-emerald-400/30">
              🤖
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">SwaasthSaathi</p>
              <p className="text-emerald-300 text-xs">AI Health Assistant • Online</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "model" && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5 border border-emerald-500/30">
                    🤖
                  </div>
                )}
                <div
                  className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    m.role === "user"
                      ? {
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          color: "white",
                          borderBottomRightRadius: "4px",
                        }
                      : {
                          background: "rgba(255,255,255,0.07)",
                          color: "#e2e8f0",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderBottomLeftRadius: "4px",
                        }
                  }
                  dangerouslySetInnerHTML={{ __html: formatMessage(m.parts) }}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm shrink-0 mr-2 border border-emerald-500/30">
                  🤖
                </div>
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                        style={{
                          animation: "bounce 1s infinite",
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions (show only at start) */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full text-emerald-300 transition-colors hover:bg-emerald-500/20"
                  style={{ border: "1px solid rgba(16,185,129,0.3)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div
            className="px-3 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="flex items-end gap-2 rounded-2xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-grow
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask SwaasthSaathi anything..."
                className="flex-1 bg-transparent text-white text-sm outline-none resize-none placeholder-white/30 leading-relaxed"
                style={{ maxHeight: "100px" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                <svg className="w-4 h-4 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
            <p className="text-center text-white/20 text-[10px] mt-1.5">
              Powered by Google Gemini · Always consult your doctor
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
