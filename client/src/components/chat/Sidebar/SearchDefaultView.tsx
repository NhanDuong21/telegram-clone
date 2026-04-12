import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import type { User, Conversation } from "../../../types";
import Avatar from "../../common/Avatar";
import ClearSearchModal from "./ClearSearchModal";
import { formatUserStatus } from "../../../utils/formatters";
import "./SearchDefaultView.css";

interface SearchDefaultViewProps {
    frequentContacts: User[];
    recentConversations: Conversation[];
    conversations: Conversation[];
    onlineUsers: string[];
    onClearRecent: () => void;
    onSelectUser: (user: User) => void;
    onSelectConversation: (conv: Conversation) => void;
}

const SearchDefaultView = ({ 
    frequentContacts, 
    recentConversations: initialRecent, 
    conversations,
    onlineUsers,
    onClearRecent,
    onSelectUser,
    onSelectConversation
}: SearchDefaultViewProps) => {
    const [recentSearches, setRecentSearches] = useState<Conversation[]>(initialRecent);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const handleClearHistory = () => {
        setRecentSearches([]);
        onClearRecent();
    };

    const handleSelectConversation = (conv: Conversation) => {
        setRecentSearches(prev => {
            const filtered = prev.filter(c => c._id !== conv._id);
            return [conv, ...filtered].slice(0, 10);
        });
        onSelectConversation(conv);
    };

    const handleSelectUser = (user: User) => {
        // Find existing conversation in the full list
        const existingConv = conversations.find(c => 
            !c.isGroup && c.participants.some(p => p._id === user._id)
        );

        if (existingConv) {
            setRecentSearches(prev => {
                const filtered = prev.filter(c => c._id !== existingConv._id);
                return [existingConv, ...filtered].slice(0, 10);
            });
        }
        onSelectUser(user);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="search-default-view"
        >
            {/* Frequent Contacts Section */}
            <div className="search-section">
                <div className="search-section-header">Liên lạc thường xuyên</div>
                <div className="frequent-contacts-scroll">
                    {frequentContacts.map((user) => {
                        const isOnline = onlineUsers.includes(user._id);
                        return (
                            <div 
                                key={`frequent-${user._id}`} 
                                className="frequent-contact-item"
                                onClick={() => handleSelectUser(user)}
                            >
                                <div className="frequent-avatar-wrapper">
                                    <Avatar user={user} size={54} />
                                    {isOnline && <div className="online-indicator" />}
                                </div>
                                <span className="frequent-name">
                                    {user.username.split(' ')[0]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Section / Empty State */}
            <div className="search-section search-section--flexible">
                {recentSearches.length > 0 ? (
                    <>
                        <div className="search-section-header recent-header">
                            <span>Gần đây</span>
                            <button className="clear-recent-btn" onClick={() => setIsClearModalOpen(true)}>Xóa</button>
                        </div>
                        <div className="recent-list">
                            {recentSearches.map((conv) => {
                                const otherUser = conv.isGroup ? null : conv.participants[0];
                                const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;
                                
                                // Show last message if exists, otherwise show status
                                const statusText = conv.lastMessage?.text 
                                    || (otherUser ? formatUserStatus(isOnline, otherUser.lastSeen) : (conv.isGroup ? `${conv.participants.length} thành viên` : ""));

                                return (
                                    <div 
                                        key={`recent-${conv._id}`} 
                                        className="recent-item"
                                        onClick={() => handleSelectConversation(conv)}
                                    >
                                        <div className="recent-avatar">
                                            {conv.isGroup ? (
                                                <div className="recent-group-avatar">👥</div>
                                            ) : (
                                                <Avatar user={otherUser} size={48} />
                                            )}
                                        </div>
                                        <div className="recent-info">
                                            <div className="recent-name-row">
                                                <span className="recent-title">{conv.isGroup ? conv.name : otherUser?.username}</span>
                                            </div>
                                            <div className="recent-status">
                                                <span className={isOnline && !conv.lastMessage ? 'status-online' : 'status-offline'}>
                                                    {statusText}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="search-empty-state">
                        <div className="empty-state-icon-wrapper">
                            <Search size={64} strokeWidth={1.5} className="empty-state-icon" />
                        </div>
                        <div className="empty-state-text">
                            Kết quả tìm kiếm gần đây<br />sẽ hiện ở đây.
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isClearModalOpen && (
                    <ClearSearchModal 
                        onClose={() => setIsClearModalOpen(false)}
                        onConfirm={handleClearHistory}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SearchDefaultView;
