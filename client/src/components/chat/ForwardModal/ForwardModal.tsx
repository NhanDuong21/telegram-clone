import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search, Forward } from "lucide-react";
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

    const filteredConversations = conversations.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.participants.some(p => p.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="modal-container forward-modal"
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>Chuyển tiếp tin nhắn</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="forward-message-preview">
                    <div className="preview-label">Tin nhắn đang chọn:</div>
                    <div className="preview-content">
                        {message.text || (message.imageUrl ? "📷 Một hình ảnh" : "Tin nhắn")}
                    </div>
                </div>

                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm cuộc trò chuyện..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="conversation-list">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map(conv => (
                            <div 
                                key={conv._id} 
                                className="forward-item"
                                onClick={() => onForward(conv._id, message)}
                            >
                                <div className="forward-item-info">
                                    <div className="avatar-small">
                                        {conv.isGroup ? (
                                            <div className="group-avatar-small">👥</div>
                                        ) : (
                                            <Avatar user={conv.participants[0]} size={32} />
                                        )}
                                    </div>
                                    <div className="conv-name">{conv.name || conv.participants[0]?.username}</div>
                                </div>
                                <Forward size={18} className="forward-icon-btn" />
                            </div>
                        ))
                    ) : (
                        <div className="empty-search">Không tìm thấy cuộc trò chuyện nào</div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ForwardModal;
