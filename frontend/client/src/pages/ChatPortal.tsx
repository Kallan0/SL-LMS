/**
 * ChatPortal Page
 *
 * Full-screen messaging interface for students and mentors.
 * - Students can message mentors (other users)
 * - Mentors can message students (other users)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Search,
  Users,
  Circle,
  CheckCheck,
  Check,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiService, type Conversation, type Message, type ChatUser } from "@/services/api";
import { ChatSkeleton } from "@/components/PageSkeletons";

const ACCENT = "#6366f1";
const GREEN = "#22c55e";

export default function ChatPortal() {
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const myId = user?.id ?? "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isMentor = user?.role === "MENTOR";

  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (userId: string) => {
    try {
      const data = await apiService.getMessages(userId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      const data = await apiService.getAllUsers();
      setAllUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeChat) return;
    try {
      const msg = await apiService.sendMessage(activeChat, newMessage.trim());
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, [newMessage, activeChat, fetchConversations]);

  // ── Effects ────────────────────────────────────────────────────────────

  // Check for ?user= param (e.g. from mentor dashboard)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user");
    if (userId) setActiveChat(userId);
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  useEffect(() => { fetchAllUsers(); }, [fetchAllUsers]);
  useEffect(() => { if (activeChat) fetchMessages(activeChat); }, [activeChat, fetchMessages]);

  // Heartbeat every 15s
  useEffect(() => {
    const beat = () => { apiService.sendHeartbeat().catch(() => {}); };
    beat();
    const interval = setInterval(beat, 15000);
    return () => clearInterval(interval);
  }, []);

  // Poll messages every 3s when a chat is active
  useEffect(() => {
    if (!activeChat) return;
    const interval = setInterval(() => fetchMessages(activeChat), 3000);
    return () => clearInterval(interval);
  }, [activeChat, fetchMessages]);

  // Refresh conversations every 10s
  useEffect(() => {
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Helpers ────────────────────────────────────────────────────────────

  const getName = (u: { firstName?: string | null; lastName?: string | null; username: string }) =>
    u.firstName ? `${u.firstName}${u.lastName ? ` ${u.lastName}` : ""}` : u.username;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const conversationStarters = [
    "Hi! I'm learning ISL. Can you help me practice?",
    "What sign should I learn next?",
    "I just completed the alphabet lesson!",
  ];

  const selectChat = (userId: string, conv?: Conversation) => {
    setActiveChat(userId);
    setActiveChatUser(conv || conversations.find((c) => c.id === userId) || null);
    fetchMessages(userId);
  };

  const startNewChat = (userId: string) => {
    const u = allUsers.find((s) => s.id === userId);
    if (u) {
      setActiveChat(userId);
      setActiveChatUser({ id: u.id, username: u.username, firstName: u.firstName, lastName: u.lastName, role: u.role, lastMessage: undefined, lastMessageAt: undefined, unreadCount: 0 });
      setMessages([]);
      setSearch("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    if (!search) return false;
    const name = getName(u).toLowerCase();
    return name.includes(search.toLowerCase()) || (u.username && u.username.toLowerCase().includes(search.toLowerCase()));
  });

  const userLabel = isMentor ? "students" : "users";
  const searchPlaceholder = isMentor ? "Search students..." : "Search users...";

  if (loading) return <ChatSkeleton />;

  return (
    <div style={{ height: "100vh", display: "flex", background: "#0f172a", fontFamily: "Inter,sans-serif" }}>
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div style={{ width: 340, borderRight: "1px solid #334155", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setLocation("/dashboard")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}>
            <ArrowLeft size={18} />
          </button>
          <MessageSquare size={20} style={{ color: ACCENT }} />
          <h2 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 800, margin: 0 }}>Messages</h2>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 18px" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, background: "#1e293b", border: "1px solid #334155", color: "#f8fafc", fontSize: 13, outline: "none" }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Existing Conversations */}
          {!search && conversations.length > 0 && (
            <div>
              <div style={{ padding: "8px 18px", color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                Recent
              </div>
              {conversations.map((conv) => {
                const isActive = activeChat === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => selectChat(conv.id, conv)}
                    style={{
                      padding: "10px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                      background: isActive ? "rgba(99,102,241,0.1)" : "transparent",
                      borderLeft: isActive ? `3px solid ${ACCENT}` : "3px solid transparent",
                      transition: "all .15s",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 99, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{getName(conv)[0].toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>{getName(conv)}</span>
                        {conv.lastMessageAt && (
                          <span style={{ color: "#64748b", fontSize: 10 }}>
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                          {conv.lastMessage || "No messages yet"}
                        </span>
                        {(conv.unreadCount ?? 0) > 0 && (
                          <span style={{ background: ACCENT, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search results */}
          {search && filteredUsers.length > 0 && (
            <div>
              <div style={{ padding: "8px 18px", color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                {userLabel}
              </div>
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => startNewChat(u.id)}
                  style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 99, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{getName(u)[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>{getName(u)}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>{u.role || "User"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!search && conversations.length === 0 && !loading && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Users size={28} style={{ color: "#334155", margin: "0 auto 8px" }} />
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 4 }}>No conversations yet</p>
              <p style={{ color: "#475569", fontSize: 12 }}>Search for a {userLabel.replace(/s$/, "")} to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Area ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>
                  {activeChatUser ? getName(activeChatUser)[0].toUpperCase() : "?"}
                </span>
              </div>
              <div>
                <div style={{ color: "#f8fafc", fontSize: 14, fontWeight: 700 }}>
                  {activeChatUser ? getName(activeChatUser) : "Loading..."}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Circle size={6} style={{ color: GREEN, fill: GREEN }} />
                  <span style={{ color: "#64748b", fontSize: 11 }}>Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.length === 0 && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 20 }}>
                  <p style={{ color: "#64748b", fontSize: 13, marginBottom: 4 }}>No messages yet. Start the conversation!</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 320 }}>
                    {conversationStarters.map((starter, i) => (
                      <button key={i} onClick={() => { setNewMessage(starter); }}
                        style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#94a3b8", fontSize: 12, textAlign: "left", cursor: "pointer", transition: "all .15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.color = "#e2e8f0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.color = "#94a3b8"; }}
                      >
                        💡 {starter}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId === myId;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "70%", padding: "10px 14px", borderRadius: 16,
                      background: isMine ? ACCENT : "#1e293b",
                      borderBottomRightRadius: isMine ? 4 : 16,
                      borderBottomLeftRadius: isMine ? 16 : 4,
                      border: isMine ? "none" : "1px solid #334155",
                    }}>
                      <p style={{ color: "#f8fafc", fontSize: 13, margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>
                        {msg.content}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
                        <span style={{ color: isMine ? "rgba(255,255,255,0.5)" : "#64748b", fontSize: 10 }}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isMine && (msg.read
                          ? <CheckCheck size={12} style={{ color: GREEN }} />
                          : <Check size={12} style={{ color: "rgba(255,255,255,0.5)" }} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #334155" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 12, background: "#1e293b",
                    border: "1px solid #334155", color: "#f8fafc", fontSize: 13, outline: "none",
                    resize: "none", fontFamily: "Inter,sans-serif", minHeight: 40, maxHeight: 120,
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    width: 40, height: 40, borderRadius: 12, border: "none",
                    background: newMessage.trim() ? ACCENT : "#334155",
                    color: "#fff", cursor: newMessage.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "background .15s",
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state — no chat selected */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 99, background: "rgba(99,102,241,0.1)", border: "2px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={28} style={{ color: ACCENT }} />
            </div>
            <h3 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700, margin: 0 }}>Select a conversation</h3>
            <p style={{ color: "#64748b", fontSize: 13 }}>Search for a {userLabel.replace(/s$/, "")} to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
