import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  MessageSquare, Send, ArrowLeft, Search, Users,
  Circle, CheckCheck, Check,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

var ACCENT = "#6366f1";
var GREEN = "#22c55e";

interface Conversation {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export default function ChatPortal() {
  var [location, setLocation] = useLocation();
  var { user } = useAuthContext();
  var [conversations, setConversations] = useState<Conversation[]>([]);
  var [messages, setMessages] = useState<Message[]>([]);
  var [activeChat, setActiveChat] = useState<string | null>(null);
  var [activeChatUser, setActiveChatUser] = useState<Conversation | null>(null);
  var [newMessage, setNewMessage] = useState("");
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState("");
  var [allUsers, setAllUsers] = useState<any[]>([]);
  var messagesEndRef = useRef<HTMLDivElement>(null);

  var token = localStorage.getItem("sign_language_lms_token");
  var API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000";
  var myId = user?.id ?? "";

  // Check if there's a ?user= param from mentor dashboard
  useEffect(function () {
    var params = new URLSearchParams(window.location.search);
    var userId = params.get("user");
    if (userId) {
      setActiveChat(userId);
    }
  }, []);

  useEffect(function () { fetchConversations(); }, []);
  useEffect(function () { if (activeChat) fetchMessages(activeChat); }, [activeChat]);
  useEffect(function () {
    fetchAllUsers();
  }, [user]);

  // Heartbeat: mark self as online every 15 seconds
  useEffect(function () {
    var sendHeartbeat = function () {
      fetch(API_URL + "/chat/heartbeat", { method: "POST", headers: { Authorization: "Bearer " + token } }).catch(function () {});
    };
    sendHeartbeat();
    var interval = setInterval(sendHeartbeat, 15000);
    return function () { clearInterval(interval); };
  }, []);

  // Poll for new messages every 3 seconds
  useEffect(function () {
    if (!activeChat) return;
    var interval = setInterval(function () { if (activeChat) fetchMessages(activeChat); }, 3000);
    return function () { clearInterval(interval); };
  }, [activeChat]);

  // Refresh conversations every 10 seconds for online status updates
  useEffect(function () {
    var interval = setInterval(fetchConversations, 10000);
    return function () { clearInterval(interval); };
  }, []);

  useEffect(function () {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  var fetchConversations = async function () {
    try {
      var res = await fetch(API_URL + "/chat/conversations", { headers: { Authorization: "Bearer " + token } });
      setConversations(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  var fetchMessages = async function (userId: string) {
    try {
      var res = await fetch(API_URL + "/chat/messages/" + userId, { headers: { Authorization: "Bearer " + token } });
      setMessages(await res.json());
    } catch (err) { console.error(err); }
  };

  var fetchAllUsers = async function () {
    try {
      if (user?.role === "MENTOR") {
        // Mentors see students
        var res = await fetch(API_URL + "/mentor/students", { headers: { Authorization: "Bearer " + token } });
        setAllUsers(await res.json());
      } else {
        // Students see mentors
        var res2 = await fetch(API_URL + "/leaderboard", { headers: { Authorization: "Bearer " + token } });
        var data = await res2.json();
        // Fetch full user details for mentors
        var mentorRes = await fetch(API_URL + "/users/me", { headers: { Authorization: "Bearer " + token } });
        var me = await mentorRes.json();
        // We need to get all users - use a simple approach: get from conversations
        var convRes = await fetch(API_URL + "/chat/conversations", { headers: { Authorization: "Bearer " + token } });
        var convs = await convRes.json();
        setAllUsers(convs.map(function (c: any) { return { id: c.id, username: c.username, firstName: c.firstName, lastName: c.lastName, role: c.role, xp: 0 }; }));
      }
    } catch (err) { console.error(err); }
  };

  var sendMessage = async function () {
    if (!newMessage.trim() || !activeChat) return;
    try {
      var res = await fetch(API_URL + "/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ receiverId: activeChat, content: newMessage.trim() }),
      });
      if (res.ok) {
        var msg = await res.json();
        setMessages(function (prev) { return [...prev, msg]; });
        setNewMessage("");
        fetchConversations();
      }
    } catch (err) { console.error(err); }
  };

  var handleKeyDown = function (e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  var getName = function (u: any) {
    if (u.firstName) return u.firstName + (u.lastName ? " " + u.lastName : "");
    return u.username;
  };

  var selectChat = function (userId: string, conv?: Conversation) {
    setActiveChat(userId);
    setActiveChatUser(conv || allUsers.find(function (u) { return u.id === userId; }) || null);
    fetchMessages(userId);
  };

  var startNewChat = function (userId: string) {
    var u = allUsers.find(function (s) { return s.id === userId; });
    if (u) {
      setActiveChat(userId);
      setActiveChatUser(u);
      setMessages([]);
      setSearch("");
    }
  };

  var filteredUsers = allUsers.filter(function (u) {
    if (!search) return true;
    var name = getName(u).toLowerCase();
    return name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ height: "100vh", display: "flex", background: "#0f172a", fontFamily: "Inter,sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 340, borderRight: "1px solid #334155", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Sidebar Header */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={function () { setLocation("/dashboard"); }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}>
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
              placeholder="Search students..."
              value={search}
              onChange={function (e) { setSearch(e.target.value); }}
              style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, background: "#1e293b", border: "1px solid #334155", color: "#f8fafc", fontSize: 13, outline: "none" }}
            />
          </div>
        </div>

        {/* Conversations + Students */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Existing Conversations */}
          {!search && conversations.length > 0 && (
            <div>
              <div style={{ padding: "8px 18px", color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Recent</div>
              {conversations.map(function (conv) {
                var isActive = activeChat === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={function () { selectChat(conv.id, conv); }}
                    style={{
                      padding: "10px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                      background: isActive ? "rgba(99,102,241,0.1)" : "transparent",
                      borderLeft: isActive ? "3px solid " + ACCENT : "3px solid transparent",
                      transition: "all .15s",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 99, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{getName(conv)[0].toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>{getName(conv)}</span>
                        {conv.lastMessageAt && <span style={{ color: "#64748b", fontSize: 10 }}>{new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{conv.lastMessage || "No messages yet"}</span>
                        {conv.unreadCount > 0 && (
                          <span style={{ background: ACCENT, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* All Students (search mode or empty) */}
          {search && filteredUsers.length > 0 && (
            <div>
              <div style={{ padding: "8px 18px", color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Students</div>
              {filteredUsers.map(function (u) {
                return (
                  <div
                    key={u.id}
                    onClick={function () { startNewChat(u.id); }}
                    style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background .15s" }}
                    onMouseEnter={function (e) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 99, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{getName(u)[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>{getName(u)}</div>
                      <div style={{ color: "#64748b", fontSize: 11 }}>{u.xp} XP</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!search && conversations.length === 0 && !loading && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Users size={28} style={{ color: "#334155", margin: "0 auto 8px" }} />
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 4 }}>No conversations yet</p>
              <p style={{ color: "#475569", fontSize: 12 }}>Search for a student to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{activeChatUser ? getName(activeChatUser)[0].toUpperCase() : "?"}</span>
              </div>
              <div>
                <div style={{ color: "#f8fafc", fontSize: 14, fontWeight: 700 }}>{activeChatUser ? getName(activeChatUser) : "Loading..."}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Circle size={6} style={{ color: GREEN, fill: GREEN }} />
                  <span style={{ color: "#64748b", fontSize: 11 }}>Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.length === 0 && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "#475569", fontSize: 13 }}>No messages yet. Say hello!</p>
                </div>
              )}
              {messages.map(function (msg) {
                var isMine = msg.senderId === myId;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "70%", padding: "10px 14px", borderRadius: 16,
                      background: isMine ? ACCENT : "#1e293b",
                      borderBottomRightRadius: isMine ? 4 : 16,
                      borderBottomLeftRadius: isMine ? 16 : 4,
                      border: isMine ? "none" : "1px solid #334155",
                    }}>
                      <p style={{ color: "#f8fafc", fontSize: 13, margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>{msg.content}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
                        <span style={{ color: isMine ? "rgba(255,255,255,0.5)" : "#64748b", fontSize: 10 }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMine && (msg.read ? <CheckCheck size={12} style={{ color: GREEN }} /> : <Check size={12} style={{ color: "rgba(255,255,255,0.5)" }} />)}
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
                  onChange={function (e) { setNewMessage(e.target.value); }}
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
          /* Empty state */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 99, background: "rgba(99,102,241,0.1)", border: "2px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={28} style={{ color: ACCENT }} />
            </div>
            <h3 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700, margin: 0 }}>Select a conversation</h3>
            <p style={{ color: "#64748b", fontSize: 13 }}>Search for a student to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
