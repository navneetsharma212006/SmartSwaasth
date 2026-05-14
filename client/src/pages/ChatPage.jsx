import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSend, FiUser } from "react-icons/fi";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { getChatHistory } from "../lib/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = API_BASE_URL.replace("/api", "");

export default function ChatPage() {
  const { userId } = useParams(); // The ID of the person we are chatting with
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user || !userId) return;

    // Load history
    const loadHistory = async () => {
      try {
        const data = await getChatHistory(userId);
        setMessages(data.messages || []);
        setOtherUser(data.otherUser);
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();

    // Initialize Socket
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join_chat", { userId1: user.id, userId2: userId });
    });

    socketRef.current.on("receive_message", (message) => {
      // Only append if it belongs to this chat
      if (
        (message.senderId === user.id && message.receiverId === userId) ||
        (message.senderId === userId && message.receiverId === user.id)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [user, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageData = {
      senderId: user.id,
      receiverId: userId,
      content: inputText.trim(),
    };

    // Emit to socket
    socketRef.current.emit("send_message", messageData);
    
    // Optimistically add to UI immediately (optional, or wait for receive_message)
    // We will just clear the input and wait for receive_message
    setInputText("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-black/50">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[80vh] flex flex-col bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-black/10 flex items-center gap-4 bg-black/[0.02]">
        <button 
          onClick={() => navigate("/patients")} 
          className="p-2 -ml-2 rounded-lg hover:bg-black/5 text-black/60 hover:text-black transition-colors"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-black/60">
            {otherUser?.name ? otherUser.name.charAt(0) : <FiUser />}
          </div>
          <div>
            <h2 className="font-semibold text-lg leading-tight">
              {otherUser ? (otherUser.role === "caregiver" ? `Dr. ${otherUser.name}` : otherUser.name) : "User"}
            </h2>
            <p className="text-xs text-black/50 capitalize">{otherUser?.role || ""}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="text-center text-black/40 mt-10">
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user.id;
            return (
              <div 
                key={msg._id || index} 
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isMe 
                      ? "bg-black text-white rounded-br-sm" 
                      : "bg-white border border-black/10 text-black rounded-bl-sm shadow-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/60" : "text-black/40"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white border-t border-black/10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-black/5 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/90 transition-colors shadow-sm"
          >
            <FiSend className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
