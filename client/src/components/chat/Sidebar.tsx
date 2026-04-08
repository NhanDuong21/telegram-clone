import { useState } from "react";
import { searchUsersApi } from "../../api/userApi";
import { createOrGetConversationApi } from "../../api/chatApi";

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
    const [startingChat, setStartingChat] = useState<string | null>(null); // userId currently being opened

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

    // Khi click vào 1 user trong kết quả tìm kiếm:
    // 1. Gọi POST /api/conversations để tạo hoặc lấy conversation 1-1
    // 2. Cập nhật danh sách conversation ở ChatPage
    // 3. Mở conversation đó ngay lập tức
    const handleStartChat = async (user: User) => {
        setStartingChat(user._id);
        try {
            const res = await createOrGetConversationApi(user._id);
            const conv: Conversation = res.data.conversation;
            onConversationCreated(conv); // thêm vào list nếu chưa có
            onSelectConversation(conv);  // mở luôn
            // Xoá kết quả search sau khi đã mở chat
            setQuery("");
            setResults([]);
        } catch (error) {
            console.error("Failed to start conversation:", error);
        } finally {
            setStartingChat(null);
        }
    };

    // Lấy tên người kia trong conversation 
    const getOtherUser = (conv: Conversation): User | undefined =>
        conv.participants.find((p) => p._id !== currentUserId);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                    <input
                        type="text"
                        placeholder="Tìm user để nhắn tin..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            flex: 1,
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            fontSize: "14px",
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#0088cc",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        Tìm
                    </button>
                </div>
            </div>

            {(results.length > 0 || searchLoading || (query.trim() && !searchLoading)) && (
                <div style={{ borderBottom: "2px solid #0088cc" }}>
                    {searchLoading && (
                        <p style={{ padding: "10px 12px", color: "#999", fontSize: "13px" }}>
                            Đang tìm...
                        </p>
                    )}
                    {!searchLoading && results.length === 0 && query.trim() && (
                        <p style={{ padding: "10px 12px", color: "#999", fontSize: "13px" }}>
                            Không tìm thấy user
                        </p>
                    )}
                    {results.map((user) => (
                        <div
                            key={user._id}
                            onClick={() => handleStartChat(user)}
                            style={{
                                padding: "10px 12px",
                                borderBottom: "1px solid #f0f0f0",
                                cursor: startingChat === user._id ? "wait" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                opacity: startingChat === user._id ? 0.6 : 1,
                                backgroundColor: "#f9f9f9",
                            }}
                        >
                            <div style={{ position: "relative" }}>
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "50%",
                                        backgroundColor: "#0088cc",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "bold",
                                        fontSize: "14px",
                                        flexShrink: 0,
                                    }}
                                >
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                {onlineUsers.includes(user._id) && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: -2,
                                            right: -2,
                                            width: "12px",
                                            height: "12px",
                                            backgroundColor: "#4caf50",
                                            borderRadius: "50%",
                                            border: "2px solid white",
                                        }}
                                    />
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: 500, fontSize: "14px" }}>
                                    {user.username}
                                </div>
                                <div style={{ fontSize: "12px", color: "#999" }}>
                                    {startingChat === user._id ? "Đang mở chat..." : "Nhắn tin"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ flex: 1, overflowY: "auto" }}>
                {conversations.length === 0 && (
                    <p style={{ padding: "16px", color: "#aaa", fontSize: "13px", textAlign: "center" }}>
                        Chưa có cuộc trò chuyện nào. Tìm kiếm user để bắt đầu!
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
                                padding: "10px 12px",
                                borderBottom: "1px solid #f0f0f0",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                backgroundColor: isSelected ? "#e8f4fc" : "white",
                                borderLeft: isSelected ? "3px solid #0088cc" : "3px solid transparent",
                            }}
                        >
                            <div style={{ position: "relative" }}>
                                <div
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        backgroundColor: "#0088cc",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "bold",
                                        fontSize: "16px",
                                        flexShrink: 0,
                                    }}
                                >
                                    {other?.username.charAt(0).toUpperCase() ?? "?"}
                                </div>
                                {other && onlineUsers.includes(other._id) && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: -2,
                                            right: -2,
                                            width: "12px",
                                            height: "12px",
                                            backgroundColor: "#4caf50",
                                            borderRadius: "50%",
                                            border: "2px solid white",
                                        }}
                                    />
                                )}
                            </div>
                            <div style={{ overflow: "hidden" }}>
                                <div style={{ fontWeight: 500, fontSize: "14px" }}>
                                    {other?.username ?? "Unknown"}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#999",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
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
