import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { Menu, Search as SearchIcon } from "lucide-react";
import { searchUsersApi } from "../../../api/userApi";
import { createOrGetConversationApi } from "../../../api/chatApi";
import Avatar from "../../common/Avatar";
import DrawerMenu from "./DrawerMenu";
import type { User, Conversation } from "../../../types/chat";
import './Sidebar.css';

interface SidebarProps {
    conversations: Conversation[];
    selectedId: string | null;
    currentUserId: string;
    currentUser: User | null;
    onlineUsers: string[];
    unreadCounts: Record<string, number>;
    onSelectConversation: (conv: Conversation) => void;
    onConversationCreated: (conv: Conversation) => void;
    onViewProfile: (userId: string) => void;
    onLogout: () => void;
}

const Sidebar = ({
    conversations,
    selectedId,
    currentUserId,
    currentUser,
    onlineUsers,
    unreadCounts,
    onSelectConversation,
    onConversationCreated,
    onViewProfile,
    onLogout,
}: SidebarProps) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [startingChat, setStartingChat] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

    const formatTimestamp = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        if (diff < 86400000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="sidebar">
            <div className="sidebar__header">
                <button 
                    className="hamburger-btn"
                    onClick={() => setIsDrawerOpen(true)}
                >
                    <Menu size={24} />
                </button>
                <div className="sidebar__search-wrapper">
                    <SearchIcon size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm"
                        value={query}
                        onChange={handleQueryChange}
                        className="sidebar__search-input"
                    />
                </div>
            </div>

            <DrawerMenu 
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                user={currentUser}
                onLogout={onLogout}
            />

            <AnimatePresence>
                {(results.length > 0 || searchLoading || (query.trim() && !searchLoading)) && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="sidebar__search-results"
                    >
                        {searchLoading && <p className="sidebar__status-msg">Đang tìm...</p>}
                        {!searchLoading && results.length === 0 && query.trim() && (
                            <p className="sidebar__status-msg">Không tìm thấy kết quả</p>
                        )}
                        {results.map((user) => (
                            <div
                                key={user._id}
                                className={`search-item ${startingChat === user._id ? "search-item--loading" : ""}`}
                                onClick={() => handleStartChat(user)}
                            >
                                <Avatar user={user} size={48} />
                                <div className="search-item__info">
                                    <div className="search-item__name">{user.username}</div>
                                    <div className="search-item__status">
                                        {onlineUsers.includes(user._id) ? "Đang trực tuyến" : "Ngoại tuyến"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="conversation-list">
                {conversations.length === 0 && !query.trim() && (
                    <div className="conversation-list--empty">
                        <p>Chưa có cuộc trò chuyện nào.</p>
                        <p>Tìm kiếm để bắt đầu!</p>
                    </div>
                )}
                <AnimatePresence mode="popLayout">
                    {conversations.map((conv) => {
                        const other = getOtherUser(conv);
                        const isSelected = conv._id === selectedId;
                        const unreadCount = unreadCounts[conv._id] !== undefined ? unreadCounts[conv._id] : (conv.unreadCount || 0);
                        const displayTitle = conv.isGroup ? conv.name : (other?.username ?? "Unknown");
                        const lastMsg = conv.lastMessage?.text || "Gửi tin nhắn đầu tiên";
                        const time = conv.lastMessage?.createdAt ? formatTimestamp(conv.lastMessage.createdAt) : "";

                        return (
                            <motion.div
                                key={conv._id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={`conversation-item ${isSelected ? "conversation-item--selected" : ""}`}
                                onClick={() => onSelectConversation(conv)}
                            >
                                <div className="item-avatar-wrapper" onClick={(e) => {
                                    if (!conv.isGroup && other) {
                                        e.stopPropagation();
                                        onViewProfile(other._id);
                                    }
                                }}>
                                    {conv.isGroup ? (
                                        <div className="group-avatar-fallback">
                                            {conv.name?.substring(0, 1).toUpperCase()}
                                        </div>
                                    ) : (
                                        <Avatar user={other} size={54} />
                                    )}
                                    {other && !conv.isGroup && onlineUsers.includes(other._id) && (
                                        <div className="online-indicator" />
                                    )}
                                </div>
                                <div className="conversation-item__info">
                                    <div className="item-row">
                                        <span className="item-name">{displayTitle}</span>
                                        <span className="item-time">{time}</span>
                                    </div>
                                    <div className="item-row">
                                        <span className="item-preview">{lastMsg}</span>
                                        {unreadCount > 0 && (
                                            <div className="item-unread-badge">{unreadCount}</div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Create Group FAB can be added here or in the drawer */}
        </div>
    );
};

export default Sidebar;
