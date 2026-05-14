import { useState, useRef, useEffect } from "react";
import { sendAIChatMessage } from "../lib/api.js";

/* ── Suggested starter questions ───────────────────────── */
const SUGGESTIONS = [
  "What are the side effects of my medicines?",
  "Can I take my medicines on an empty stomach?",
  "Which medicine should I take first?",
  "What does my compliance score mean?",
  "Are any of my medicines interacting?",
];

/* ── Render text with basic markdown: **bold**, newlines ── */
function MessageText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part.split("\n").map((line, j) => (
            <span key={`${i}-${j}`}>
              {line}
              {j < part.split("\n").length - 1 && <br />}
            </span>
          ))
        )
      )}
    </span>
  );
}

/* ── Typing dots animation ─────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "10px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#6366f1",
            animation: "saathiDot 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function SwaasthSaathi() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      parts: "Namaste! 🙏 I'm **SwaasthSaathi**, your personal medicine assistant.\n\nI can answer questions about your medicines, side effects, dosage timings, compliance, and general health. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", parts: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Build history (exclude the initial greeting from history sent to API)
    const history = messages.slice(1).map((m) => ({
      role: m.role,
      parts: m.parts,
    }));

    try {
      const { reply } = await sendAIChatMessage(msg, history);
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

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* ── Keyframes ─────────────────────────────────────── */}
      <style>{`
        @keyframes saathiDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
        @keyframes saathiSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes saathiPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
          50%       { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
        }
        .saathi-msg { animation: saathiSlideUp 0.25s ease; }
      `}</style>

      {/* ── Floating bubble ───────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="SwaasthSaathi — Your AI Medicine Assistant"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 99990,
          width: 62,
          height: 62,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          boxShadow: "0 8px 32px rgba(99,102,241,0.45)",
          animation: open ? "none" : "saathiPulse 2s infinite",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* ── Chat window ───────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            right: 24,
            zIndex: 99989,
            width: "min(420px, calc(100vw - 32px))",
            height: "min(580px, calc(100vh - 130px))",
            borderRadius: 20,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
            animation: "saathiSlideUp 0.3s ease",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              🤖
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>
                SwaasthSaathi
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                AI Medicine Assistant • Online
              </div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade80",
              }}
            />
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 14px",
              background: "#f8faff",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className="saathi-msg"
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {m.role === "model" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                      marginRight: 8,
                      alignSelf: "flex-end",
                    }}
                  >
                    🤖
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "10px 14px",
                    borderRadius:
                      m.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    background:
                      m.role === "user"
                        ? "linear-gradient(135deg,#6366f1,#4f46e5)"
                        : "#fff",
                    color: m.role === "user" ? "#fff" : "#1e293b",
                    fontSize: 14,
                    lineHeight: 1.55,
                    boxShadow:
                      m.role === "user"
                        ? "0 4px 12px rgba(99,102,241,0.3)"
                        : "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                >
                  <MessageText text={m.parts} />
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  🤖
                </div>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "18px 18px 18px 4px",
                    padding: "4px 14px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (shown only at start) */}
          {messages.length === 1 && (
            <div
              style={{
                padding: "8px 12px",
                background: "#f0f4ff",
                borderTop: "1px solid #e0e7ff",
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                flexShrink: 0,
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 20,
                    border: "1px solid #c7d2fe",
                    background: "#fff",
                    color: "#4f46e5",
                    fontSize: 11.5,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              background: "#fff",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your medicines…"
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "10px 14px",
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                maxHeight: 100,
                overflowY: "auto",
                background: "#f8faff",
                color: "#1e293b",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "#6366f1")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "#e2e8f0")
              }
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "none",
                background:
                  !input.trim() || loading
                    ? "#e2e8f0"
                    : "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: !input.trim() || loading ? "#94a3b8" : "#fff",
                fontSize: 18,
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s",
                boxShadow:
                  !input.trim() || loading
                    ? "none"
                    : "0 4px 12px rgba(99,102,241,0.4)",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
