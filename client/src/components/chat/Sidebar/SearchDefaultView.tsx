import { motion } from "framer-motion";
import type { User, Conversation } from "../../../types";
import Avatar from "../../common/Avatar";
import "./SearchDefaultView.css";

interface SearchDefaultViewProps {
    frequentContacts: User[];
    recentConversations: Conversation[];
    onClearRecent: () => void;
    onSelectUser: (user: User) => void;
    onSelectConversation: (conv: Conversation) => void;
}

const SearchDefaultView = ({ 
    frequentContacts, 
    recentConversations, 
    onClearRecent,
    onSelectUser,
    onSelectConversation
}: SearchDefaultViewProps) => {
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
                    {frequentContacts.map(user => (
                        <div 
                            key={user._id} 
                            className="frequent-contact-item"
                            onClick={() => onSelectUser(user)}
                        >
                            <div className="frequent-avatar-wrapper">
                                <Avatar user={user} size={54} />
                                <div className="online-indicator" />
                            </div>
                            <span className="frequent-name">
                                {user.username.split(' ')[0]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Section */}
            <div className="search-section">
                <div className="search-section-header recent-header">
                    <span>Gần đây</span>
                    <button className="clear-recent-btn" onClick={onClearRecent}>Xóa</button>
                </div>
                <div className="recent-list">
                    {recentConversations.map(conv => {
                        // For mock/display purposes, find the other participant if not group
                        const otherUser = conv.isGroup ? null : conv.participants[0]; // Simplification for UI
                        return (
                            <div 
                                key={conv._id} 
                                className="recent-item"
                                onClick={() => onSelectConversation(conv)}
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
                                        {conv.isGroup ? `${conv.participants.length} thành viên` : "Online"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default SearchDefaultView;
