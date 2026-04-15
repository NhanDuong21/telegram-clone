import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useMemo } from "react";
import { Menu, Search as SearchIcon, ArrowLeft, BellOff, Pin } from "lucide-react";
import { searchUsersApi } from "../../../api/userApi";
import Avatar from "../../common/Avatar";
import DrawerMenu from "./DrawerMenu";
import SearchDefaultView from "./SearchDefaultView";
import SidebarContextMenu from "./SidebarContextMenu";
import type { User, Conversation } from "../../../types/chat";
import './Sidebar.css';
import './SidebarContextMenu.css';

interface SidebarProps {
    conversations: Conversation[];
    selectedId: string | null;
    currentUserId: string;
    currentUser: User | null;
    onlineUsers: string[];
    unreadCounts: Record<string, number>;
    onSelectConversation: (conv: Conversation) => void;
    onTempConversationCreated: (conv: Conversation) => void;
    onLogout: () => void;
    onOpenMyProfile: () => void;
    onPinToggle: (conv: Conversation, isPinned: boolean) => void;
    onMuteToggle: (conv: Conversation, isMuted: boolean) => void;
    onBlockUser: (user: User) => void;
    onClearHistory: (conv: Conversation) => void;
    onDeleteChat: (conv: Conversation) => void;
    onOpenSettings: () => void;
}

const Sidebar = ({
    conversations,
    selectedId,
    currentUserId,
    currentUser,
    onlineUsers,
    unreadCounts,
    onSelectConversation,
    onTempConversationCreated,
    onLogout,
    onOpenMyProfile,
    onPinToggle,
    onMuteToggle,
    onBlockUser,
    onClearHistory,
    onDeleteChat,
    onOpenSettings,
}: SidebarProps) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [startingChat, setStartingChat] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [menuConfig, setMenuConfig] = useState<{
        isOpen: boolean;
        x: number;
        y: number;
        conversation: Conversation | null;
    }>({ isOpen: false, x: 0, y: 0, conversation: null });

    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleContextMenu = (e: React.MouseEvent, conversation: Conversation) => {
        e.preventDefault();
        setMenuConfig({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            conversation
        });
    };

    const handleTouchStart = (conversation: Conversation) => {
        longPressTimer.current = setTimeout(() => {
            setMenuConfig({
                isOpen: true,
                x: 0,
                y: 0,
                conversation
            });
        }, 600);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const displayedConversations = useMemo(() => {
        return conversations
            .filter(conv => conv.isGroup || (conv.lastMessage && conv.lastMessage._id) || conv._id === selectedId)
            .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });
    }, [conversations]);
    
    // Hard Reset: Lift state to parent and initialize from localStorage ONLY
    const [recentSearches, setRecentSearches] = useState<Conversation[]>(() => {
        try {
            const saved = localStorage.getItem('tg_recent_searches');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (searchTerm: string) => {
        const trimmed = searchTerm.trim();
        if (!trimmed.startsWith('@') || trimmed.length < 2) {
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

    const getOtherUser = (conv: Conversation): User | undefined =>
        conv.participants.find((p) => p._id !== currentUserId);

    const renderLastMessagePreview = (lastMessage: Conversation['lastMessage']) => {
        if (!lastMessage) return "Gửi tin nhắn đầu tiên";
        
        // 1. Check for deletion status first (highest priority)
        if (lastMessage.isDeleted) {
            return "Tin nhắn đã bị xóa";
        }
        
        // 2. Then check for message type
        if (lastMessage.type === 'image' || (!lastMessage.type && (lastMessage as any).imageUrl)) {
            const caption = lastMessage.text?.trim();
            return caption ? `[ Hình ảnh ] ${caption}` : "[ Hình ảnh ]";
        }
        
        return lastMessage.text || "Tin nhắn mới";
    };

    const getSubtitle = (user: User) => {
        const existingConv = conversations.find(c => 
            !c.isGroup && c.participants.some(p => p._id === user._id)
        );

        if (existingConv?.lastMessage) {
            return renderLastMessagePreview(existingConv.lastMessage);
        }

        return onlineUsers.includes(user._id) ? "Online" : "Gửi tin nhắn đầu tiên";
    };

    const handleStartChat = async (user: User) => {
        // Find existing conversation
        const existingConv = conversations.find(c => 
            !c.isGroup && c.participants.some(p => String(p._id) === String(user._id))
        );

        const updateRecentSearches = (conv: Conversation) => {
            setRecentSearches(prev => {
                const current = Array.isArray(prev) ? prev : [];
                const filtered = current.filter(c => 
                    String(c._id || (c as any).id) !== String(conv._id || (conv as any).id)
                );
                const newList = [conv, ...filtered].slice(0, 10);
                localStorage.setItem('tg_recent_searches', JSON.stringify(newList));
                return newList;
            });
        };

        if (existingConv) {
            updateRecentSearches(existingConv);
            onSelectConversation(existingConv);
            setQuery("");
            setResults([]);
            setIsSearchFocused(false);
            return;
        }

        setStartingChat(user._id);
        try {
            // Create a temporary conversation object locally
            const tempConv: Conversation = {
                _id: 'temp_' + user._id,
                participants: [currentUser!, user],
                isGroup: false,
                lastMessage: null,
                updatedAt: new Date().toISOString(),
                isTemporary: true
            };
            
            onTempConversationCreated(tempConv);
            setQuery("");
            setResults([]);
            setIsSearchFocused(false);
        } catch (error) {
            console.error("Failed to start temporary conversation:", error);
        } finally {
            setStartingChat(null);
        }
    };

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
                {isSearchFocused ? (
                    <button 
                        className="sidebar-back-btn" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsSearchFocused(false);
                            setQuery("");
                            setResults([]);
                            inputRef.current?.blur();
                        }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                ) : (
                    <button 
                        className="hamburger-btn"
                        onClick={() => setIsDrawerOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                )}
                <div className="sidebar__search-wrapper">
                    <SearchIcon size={20} className="search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Tìm người dùng @username..."
                        value={query}
                        onChange={handleQueryChange}
                        onFocus={() => setIsSearchFocused(true)}
                        className="sidebar__search-input"
                    />
                </div>
            </div>

            <DrawerMenu 
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                user={currentUser}
                onLogout={onLogout}
                onOpenMyProfile={onOpenMyProfile}
                onOpenSettings={onOpenSettings}
            />

            <div className="sidebar__main-content">
                <AnimatePresence mode="wait">
                    {isSearchFocused && !query.trim() ? (
                        <SearchDefaultView 
                            key="search-default"
                            frequentContacts={conversations.slice(0, 5).map(c => getOtherUser(c)).filter(Boolean) as User[]}
                            recentSearches={recentSearches}
                            setRecentSearches={setRecentSearches}
                            onlineUsers={onlineUsers}
                            currentUserId={currentUserId}
                            onSelectUser={handleStartChat}
                            onSelectConversation={(conv) => {
                                // Update recent searches in parent
                                setRecentSearches(prev => {
                                    const filtered = prev.filter(c => String(c._id) !== String(conv._id));
                                    const newList = [conv, ...filtered].slice(0, 10);
                                    localStorage.setItem('tg_recent_searches', JSON.stringify(newList));
                                    return newList;
                                });
                                onSelectConversation(conv);
                                setIsSearchFocused(false);
                                setQuery("");
                            }}
                        />
                    ) : query.trim() !== "" ? (
                        <motion.div 
                            key="search-results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="sidebar__search-results-persistent"
                        >
                            {searchLoading && <p className="sidebar__status-msg">Đang tìm...</p>}
                             {!searchLoading && query.trim().length >= 2 && results.length === 0 && (
                                <div className="sidebar__status-msg">
                                    <p>Không tìm thấy người dùng nào</p>
                                    <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
                                        Mẹo: Bạn phải nhập chính xác @username để tìm kiếm
                                    </p>
                                </div>
                            )}
                            {results.map((user) => (
                                <div
                                    key={user._id}
                                    className={`search-item ${startingChat === user._id ? "search-item--loading" : ""}`}
                                    onClick={() => handleStartChat(user)}
                                >
                                    <Avatar user={user} size={48} />
                                    <div className="search-item__info">
                                        <div className="search-item__name">{user.fullName || user.username}</div>
                                        <div className="search-item__status">
                                            {getSubtitle(user)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="chat-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="conversation-list"
                        >
                            {conversations.length === 0 && (
                                <div className="conversation-list--empty">
                                    <p>Chưa có cuộc trò chuyện nào.</p>
                                    <p>Tìm kiếm để bắt đầu!</p>
                                </div>
                            )}
                            {displayedConversations.map((conv) => {
                                const other = getOtherUser(conv);
                                const isSelected = conv._id === selectedId;
                                const unreadCount = unreadCounts[conv._id] !== undefined ? unreadCounts[conv._id] : (conv.unreadCount || 0);
                                const displayTitle = conv.isGroup ? conv.name : (other?.fullName || other?.username || "Unknown");
                                const lastMsg = renderLastMessagePreview(conv.lastMessage);
                                const time = conv.lastMessage?.createdAt ? formatTimestamp(conv.lastMessage.createdAt) : "";

                                return (
                                    <div
                                        key={conv._id}
                                        className={`conversation-item ${isSelected ? "conversation-item--selected" : ""}`}
                                        onClick={() => onSelectConversation(conv)}
                                        onContextMenu={(e) => handleContextMenu(e, conv)}
                                        onTouchStart={() => handleTouchStart(conv)}
                                        onTouchEnd={handleTouchEnd}
                                    >
                                        <div className="item-avatar-wrapper">
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
                                                <div className="item-name-row">
                                                    <span className="item-name">{displayTitle}</span>
                                                    {conv.isMuted && <BellOff size={12} className="mute-icon" />}
                                                </div>
                                                <div className="item-time-wrapper">
                                                    {conv.isPinned && <Pin size={12} className="item-pin-icon" />}
                                                    <span className="item-time">{time}</span>
                                                </div>
                                            </div>
                                            <div className="item-row">
                                                <span className="item-preview">{lastMsg}</span>
                                                {unreadCount > 0 && (
                                                    <div className={`item-unread-badge ${conv.isMuted ? 'item-unread-badge--muted' : ''}`}>
                                                        {unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {menuConfig.isOpen && menuConfig.conversation && (
                    <SidebarContextMenu 
                        x={menuConfig.x}
                        y={menuConfig.y}
                        conversation={menuConfig.conversation}
                        onClose={() => setMenuConfig({ ...menuConfig, isOpen: false })}
                        onPin={(isPinned) => onPinToggle(menuConfig.conversation!, isPinned)}
                        onMute={(isMuted) => onMuteToggle(menuConfig.conversation!, isMuted)}
                        onBlock={() => {
                            const other = getOtherUser(menuConfig.conversation!);
                            if (other) onBlockUser(other);
                        }}
                        onClear={() => onClearHistory(menuConfig.conversation!)}
                        onDelete={() => onDeleteChat(menuConfig.conversation!)}
                        currentUserId={currentUserId}
                        currentUser={currentUser}
                    />
                )}
            </AnimatePresence>

            {/* Create Group FAB can be added here or in the drawer */}
        </div>
    );
};

export default Sidebar;
