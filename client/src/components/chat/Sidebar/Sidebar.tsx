import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { searchUsersApi } from "../../../api/userApi";
import { createOrGetConversationApi } from "../../../api/chatApi";
import Avatar from "../../common/Avatar";
import CreateGroupModal from "../CreateGroupModal/CreateGroupModal";
import type { User, Conversation } from "../../../types/chat";
import './Sidebar.css';

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
        <div className="sidebar">
            <div className="sidebar__header">
                <div className="sidebar__search-container">
                    <input
                        type="text"
                        placeholder="Tìm user..."
                        value={query}
                        onChange={handleQueryChange}
                        className="sidebar__search-input"
                    />
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowGroupModal(true)}
                    className="sidebar__create-group-btn"
                    title="Tạo nhóm chat"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                </motion.button>
            </div>

            <AnimatePresence>
                {(results.length > 0 || searchLoading || (query.trim() && !searchLoading)) && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="sidebar__search-results"
                    >
                        {searchLoading && (
                            <p className="sidebar__status-msg">Đang tìm...</p>
                        )}
                        {!searchLoading && results.length === 0 && query.trim() && (
                            <p className="sidebar__status-msg">Không tìm thấy user</p>
                        )}
                        {results.map((user) => (
                            <motion.div
                                key={user._id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`search-item ${startingChat === user._id ? "search-item--loading" : ""}`}
                                onClick={() => handleStartChat(user)}
                            >
                                <div className="avatar-container">
                                    <div onClick={(e) => { e.stopPropagation(); onViewProfile(user._id); }}>
                                      <Avatar user={user} size={38} />
                                    </div>
                                    {onlineUsers.includes(user._id) && <div className="online-badge" />}
                                </div>
                                <div className="search-item__info">
                                    <div className="search-item__name">{user.username}</div>
                                    <div className="search-item__status">
                                        {startingChat === user._id ? "Đang mở chat..." : "Nhấn để nhắn tin"}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="conversation-list">
                {conversations.length === 0 && (
                    <p className="conversation-list--empty">
                        Chưa có cuộc trò chuyện nào.<br />Tìm kiếm user để bắt đầu!
                    </p>
                )}
                <AnimatePresence>
                    {conversations.map((conv) => {
                        const other = getOtherUser(conv);
                        const isSelected = conv._id === selectedId;
                        const unreadCount = unreadCounts[conv._id] !== undefined ? unreadCounts[conv._id] : (conv.unreadCount || 0);

                        return (
                            <motion.div
                                key={conv._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                className={`conversation-item ${isSelected ? "conversation-item--selected" : ""}`}
                                onClick={() => onSelectConversation(conv)}
                            >
                                <div className="avatar-container">
                                    <div onClick={(e) => { 
                                        if (!conv.isGroup && other) {
                                            e.stopPropagation();
                                            onViewProfile(other._id);
                                        }
                                    }}>
                                        {conv.isGroup ? (
                                            conv.imageUrl ? (
                                                <img src={conv.imageUrl} alt={conv.name} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }} />
                                            ) : (
                                                <div className="group-avatar-fallback">
                                                    {conv.name ? conv.name.substring(0, 1).toUpperCase() : "G"}
                                                </div>
                                            )
                                        ) : (
                                            other && <Avatar user={other} size={44} />
                                        )}
                                    </div>
                                    {other && !conv.isGroup && onlineUsers.includes(other._id) && (
                                        <div className="conversation-item__online-badge" />
                                    )}
                                </div>
                                <div className="conversation-item__content">
                                    <div className={`conversation-item__header ${unreadCount > 0 ? "conversation-item__header--unread" : ""}`}>
                                        <span>{conv.isGroup ? conv.name : (other?.username ?? "Unknown")}</span>
                                        {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
                                    </div>
                                    <div className={`conversation-item__last-msg ${unreadCount > 0 ? "conversation-item__last-msg--unread" : ""}`}>
                                        {conv.lastMessage?.text ?? "Bắt đầu cuộc trò chuyện"}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <AnimatePresence>
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
            </AnimatePresence>
        </div>
    );
};

export default Sidebar;
