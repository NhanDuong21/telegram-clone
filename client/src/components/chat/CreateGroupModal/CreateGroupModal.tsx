import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { searchUsersApi } from "../../../api/userApi";
import { createGroupConversationApi } from "../../../api/chatApi";
import Avatar from "../../common/Avatar";
import './CreateGroupModal.css';

export interface User {
    _id: string;
    username: string;
    avatar?: string;
}

interface CreateGroupModalProps {
    onClose: () => void;
    onGroupCreated: (group: any) => void;
}

const CreateGroupModal = ({ onClose, onGroupCreated }: CreateGroupModalProps) => {
    const [groupName, setGroupName] = useState("");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSearch = async () => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await searchUsersApi(trimmed);
            setResults(res.data.users);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const addUser = (user: User) => {
        if (!selectedUsers.find((u) => u._id === user._id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
        setQuery("");
        setResults([]);
    };

    const removeUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
    };

    const handleCreate = async () => {
        const name = groupName.trim();
        if (!name || selectedUsers.length < 2 || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const participantIds = selectedUsers.map(u => u._id);
            const res = await createGroupConversationApi(name, participantIds);
            onGroupCreated(res.data.conversation);
            onClose();
        } catch (error) {
            console.error("Create group failed", error);
            alert("Tạo nhóm thất bại. Đảm bảo nhóm không bị trùng lặp user.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canCreate = groupName.trim() && selectedUsers.length >= 2;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={onClose}
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="modal-title">Tạo Nhóm Trò Chuyện</h3>

                <div className="form-group">
                    <label className="form-label">Tên nhóm</label>
                    <input
                        type="text"
                        placeholder="Nhập tên nhóm..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Thêm thành viên</label>
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="Tìm kiếm user..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="form-input"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="search-btn"
                        >
                            Tìm
                        </button>
                    </div>

                    <AnimatePresence>
                        {results.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="search-results"
                            >
                                {results.map((user) => (
                                    <div key={user._id} className="search-result-item">
                                        <div className="user-info">
                                            <Avatar user={user} size={28} />
                                            <span className="user-name">{user.username}</span>
                                        </div>
                                        <button onClick={() => addUser(user)} className="add-btn">
                                            + Thêm
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {selectedUsers.length > 0 && (
                    <div className="selected-users-section">
                        <div className="selected-count">Đã chọn ({selectedUsers.length})</div>
                        <div className="selected-users-list">
                            <AnimatePresence>
                                {selectedUsers.map(user => (
                                    <motion.div 
                                        key={user._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="selected-user-tag"
                                    >
                                        <span>{user.username}</span>
                                        <span onClick={() => removeUser(user._id)} className="remove-tag-btn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: "12px", height: "12px" }}>
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">
                        Hủy
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!canCreate || isSubmitting}
                        className="btn-primary"
                    >
                        {isSubmitting ? "Đang tạo..." : "Tạo Nhóm"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CreateGroupModal;
