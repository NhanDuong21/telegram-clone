import { useState, useRef } from "react";
import { searchUsersApi } from "../../api/userApi";
import { createOrGetConversationApi } from "../../api/chatApi";
import Avatar from "../common/Avatar";
import CreateGroupModal from "./CreateGroupModal";

import type { User, Conversation } from "../../types/chat";

interface SidebarProps {
    conversations: Conversation[];
    selectedId: string | null;
    currentUserId: string;
    onlineUsers: string[];
    unreadCounts: Record<string, number>;
    onSelectConversation: (conv: Conversation) => void;
    onConversationCreated: (conv: Conversation) => void;
    onViewProfile: (userId: string) => void;
}

const Sidebar = ({
    conversations,
    selectedId,
    currentUserId,
    onlineUsers,
    unreadCounts,
    onSelectConversation,
    onConversationCreated,
    onViewProfile,
}: SidebarProps) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [startingChat, setStartingChat] = useState<string | null>(null);
    const [showGroupModal, setShowGroupModal] = useState(false);

    // Debounce timer ID
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = async (searchTerm: string) => {
        const trimmed = searchTerm.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }
        setSearchLoading(true);
        try {
            const res = await searchUsersApi(trimmed);
            setResults(res.data.users);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            handleSearch(val);
        }, 300);
    };

    const handleStartChat = async (user: User) => {
        setStartingChat(user._id);
        try {
            const res = await createOrGetConversationApi(user._id);
            const conv: Conversation = res.data.conversation;
            onConversationCreated(conv);
            onSelectConversation(conv);
            setQuery("");
            setResults([]);
        } catch (error) {
            console.error("Failed to start conversation:", error);
        } finally {
            setStartingChat(null);
        }
    };

    const getOtherUser = (conv: Conversation): User | undefined =>
        conv.participants.find((p) => p._id !== currentUserId);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fafbfc" }}>
            {/* Search bar & Create Group Header */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #e8ecf0", display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "4px", flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Tìm user..."
                        value={query}
                        onChange={handleQueryChange}
                        style={{
                            flex: 1,
                            padding: "9px 12px",
                            borderRadius: "20px",
                            border: "1px solid #dce1e6",
                            fontSize: "13px",
                            outline: "none",
                            backgroundColor: "#f0f2f5",
                            transition: "border-color 0.2s",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#0088cc"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "#dce1e6"; }}
                    />
                </div>
                <button
                    onClick={() => setShowGroupModal(true)}
                    style={{
                        padding: "8px",
                        borderRadius: "20px",
                        border: "1px solid #0088cc",
                        background: "#e4eef7",
                        color: "#0088cc",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                        whiteSpace: "nowrap"
                    }}
                    title="Tạo nhóm chat"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px" }}>
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                </button>
            </div>

            {/* Search results */}
            {(results.length > 0 || searchLoading || (query.trim() && !searchLoading)) && (
                <div style={{ borderBottom: "2px solid #0088cc", background: "#f0f6fb" }}>
                    {searchLoading && (
                        <p style={{ padding: "12px 14px", color: "#8a9bae", fontSize: "13px", margin: 0 }}>
                            Đang tìm...
                        </p>
                    )}
                    {!searchLoading && results.length === 0 && query.trim() && (
                        <p style={{ padding: "12px 14px", color: "#8a9bae", fontSize: "13px", margin: 0 }}>
                            Không tìm thấy user
                        </p>
                    )}
                    {results.map((user) => (
                        <div
                            key={user._id}
                            onClick={() => handleStartChat(user)}
                            style={{
                                padding: "10px 14px",
                                borderBottom: "1px solid #e8ecf0",
                                cursor: startingChat === user._id ? "wait" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                opacity: startingChat === user._id ? 0.6 : 1,
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#e4eef7"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                            <div style={{ position: "relative", flexShrink: 0 }}>
                                <div 
                                    style={{ cursor: "pointer" }}
                                    onClick={(e) => { e.stopPropagation(); onViewProfile(user._id); }}
                                >
                                  <Avatar user={user} size={38} />
                                </div>
                                {onlineUsers.includes(user._id) && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            right: 0,
                                            width: "11px",
                                            height: "11px",
                                            backgroundColor: "#44b700",
                                            borderRadius: "50%",
                                            border: "2px solid #f0f6fb",
                                        }}
                                    />
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a2e" }}>
                                    {user.username}
                                </div>
                                <div style={{ fontSize: "12px", color: "#8a9bae" }}>
                                    {startingChat === user._id ? "Đang mở chat..." : "Nhấn để nhắn tin"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Conversation list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                {conversations.length === 0 && (
                    <p style={{
                        padding: "24px 16px",
                        color: "#8a9bae",
                        fontSize: "13px",
                        textAlign: "center",
                        lineHeight: "1.6",
                        margin: 0,
                    }}>
                        Chưa có cuộc trò chuyện nào.<br />Tìm kiếm user để bắt đầu!
                    </p>
                )}
                {conversations.map((conv) => {
                    const other = getOtherUser(conv);
                    const isSelected = conv._id === selectedId;
                    return (
                        <div
                            key={conv._id}
                            onClick={() => onSelectConversation(conv)}
                            style={{
                                padding: "12px 14px",
                                borderBottom: "1px solid #eef1f4",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                backgroundColor: isSelected ? "#e4eef7" : "transparent",
                                borderLeft: isSelected ? "3px solid #0088cc" : "3px solid transparent",
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = "#f0f2f5";
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = "transparent";
                            }}
                        >
                            <div style={{ position: "relative", flexShrink: 0 }}>
                                <div 
                                    style={{ cursor: "pointer" }}
                                    onClick={(e) => { 
                                        if (!conv.isGroup && other) {
                                            e.stopPropagation();
                                            onViewProfile(other._id);
                                        }
                                    }}
                                >
                                    {conv.isGroup ? (
                                        conv.imageUrl ? (
                                            <img src={conv.imageUrl} alt={conv.name} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }} />
                                        ) : (
                                            <div style={{
                                                width: "44px", height: "44px", borderRadius: "50%",
                                                backgroundColor: "#0088cc", color: "white", display: "flex",
                                                alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold"
                                            }}>
                                                {conv.name ? conv.name.substring(0, 1).toUpperCase() : "G"}
                                            </div>
                                        )
                                    ) : (
                                        other && <Avatar user={other} size={44} />
                                    )}
                                </div>
                                {other && !conv.isGroup && onlineUsers.includes(other._id) && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 1,
                                            right: 1,
                                            width: "12px",
                                            height: "12px",
                                            backgroundColor: "#44b700",
                                            borderRadius: "50%",
                                            border: "2px solid #fafbfc",
                                        }}
                                    />
                                )}
                            </div>
                            <div style={{ overflow: "hidden", flex: 1 }}>
                                <div style={{ 
                                    fontWeight: unreadCounts[conv._id] > 0 ? 800 : 600, 
                                    fontSize: "14px", 
                                    color: unreadCounts[conv._id] > 0 ? "#0088cc" : "#1a1a2e",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <span>{conv.isGroup ? conv.name : (other?.username ?? "Unknown")}</span>
                                    {unreadCounts[conv._id] > 0 && (
                                        <div style={{
                                            background: "#0088cc",
                                            color: "white",
                                            fontSize: "11px",
                                            fontWeight: "bold",
                                            borderRadius: "10px",
                                            padding: "2px 6px",
                                            minWidth: "18px",
                                            textAlign: "center"
                                        }}>
                                            {unreadCounts[conv._id]}
                                        </div>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: unreadCounts[conv._id] > 0 ? "#1a1a2e" : "#8a9bae",
                                        fontWeight: unreadCounts[conv._id] > 0 ? 600 : "normal",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        marginTop: "2px",
                                    }}
                                >
                                    {conv.lastMessage?.text ?? "Bắt đầu cuộc trò chuyện"}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showGroupModal && (
                <CreateGroupModal
                    onClose={() => setShowGroupModal(false)}
                    onGroupCreated={(conv) => {
                        onConversationCreated(conv);
                        onSelectConversation(conv);
                        setShowGroupModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default Sidebar;
