import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search, Forward, CornerUpRight } from "lucide-react";
import type { Conversation, Message } from "../../../types";
import Avatar from "../../common/Avatar";
import "./ForwardModal.css";

interface ForwardModalProps {
    message: Message;
    conversations: Conversation[];
    onClose: () => void;
    onForward: (conversationId: string, message: Message) => void;
}

const ForwardModal = ({ message, conversations, onClose, onForward }: ForwardModalProps) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredConversations = conversations.filter(c => {
        if (c.name?.toLowerCase().includes(searchTerm.toLowerCase())) return true;
        return c.participants.some(p => p.username.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="forward-modal"
                onClick={e => e.stopPropagation()}
            >
                <div className="forward-modal-header">
                    <div className="header-title">
                        <CornerUpRight size={22} className="title-icon" strokeWidth={2.5} />
                        <h3>Chuyển tiếp tới...</h3>
                    </div>
                    <button className="header-close-btn" onClick={onClose} aria-label="Đóng">
                        <X size={20} />
                    </button>
                </div>

                <div className="forward-content-preview">
                    <div className="preview-indicator" />
                    <div className="preview-details">
                        <div className="preview-author">
                            {message.sender.username}
                        </div>
                        <div className="preview-text">
                            {message.text || (message.imageUrl ? "📷 Hình ảnh" : "Tin nhắn")}
                        </div>
                    </div>
                </div>

                <div className="forward-search-wrapper">
                    <Search size={18} className="search-bar-icon" />
                    <input 
                        className="forward-search-input"
                        type="text" 
                        placeholder="Tìm người hoặc nhóm..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="forward-list-container">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map(conv => {
                            const otherUser = conv.participants.find(p => p._id !== message.sender._id) || conv.participants[0];
                            const displayTitle = conv.isGroup ? conv.name : (otherUser?.username || "Người dùng");

                            return (
                                <div 
                                    key={conv._id} 
                                    className="forward-target-item"
                                    onClick={() => onForward(conv._id, message)}
                                >
                                    <div className="target-item-info">
                                        <div className="target-avatar">
                                            {conv.isGroup ? (
                                                <div className="group-avatar-preview">👥</div>
                                            ) : (
                                                <Avatar user={otherUser} size={40} />
                                            )}
                                        </div>
                                        <div className="target-name-wrapper">
                                            <div className="target-name">{displayTitle}</div>
                                            <div className="target-type">{conv.isGroup ? `${conv.participants.length} thành viên` : "Cá nhân"}</div>
                                        </div>
                                    </div>
                                    <div className="forward-action-icon">
                                        <Forward size={20} />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="forward-empty-state">
                            <p>Không tìm thấy kết quả nào cho "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ForwardModal;
