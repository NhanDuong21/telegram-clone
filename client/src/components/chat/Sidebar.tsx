import { useState } from "react";
import { searchUsersApi } from "../../api/userApi";
import { createOrGetConversationApi } from "../../api/chatApi";
import Avatar from "../common/Avatar";

interface User {
    _id: string;
    username: string;
    email: string;
}

export interface Conversation {
    _id: string;
    participants: User[];
    lastMessage?: {
        _id: string;
        text: string;
    } | null;
    updatedAt: string;
}

interface SidebarProps {
    conversations: Conversation[];
    selectedId: string | null;
    currentUserId: string;
    onlineUsers: string[];
    onSelectConversation: (conv: Conversation) => void;
    onConversationCreated: (conv: Conversation) => void;
}

const Sidebar = ({
    conversations,
    selectedId,
    currentUserId,
    onlineUsers,
    onSelectConversation,
    onConversationCreated,
}: SidebarProps) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [startingChat, setStartingChat] = useState<string | null>(null);

    const handleSearch = async () => {
        const trimmed = query.trim();
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
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
            {/* Search bar */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #e8ecf0" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                    <input
                        type="text"
                        placeholder="Tìm user để nhắn tin..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
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
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: "8px 14px",
                            borderRadius: "20px",
                            border: "none",
                            background: "linear-gradient(135deg, #0088cc, #0077b5)",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 600,
                            boxShadow: "0 1px 4px rgba(0,136,204,0.2)",
                        }}
                    >
                        🔍
                    </button>
                </div>
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
                                <Avatar user={user} size={38} />
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
                                <Avatar user={other} size={44} />
                                {other && onlineUsers.includes(other._id) && (
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
                                <div style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a2e" }}>
                                    {other?.username ?? "Unknown"}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#8a9bae",
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
        </div>
    );
};

export default Sidebar;
