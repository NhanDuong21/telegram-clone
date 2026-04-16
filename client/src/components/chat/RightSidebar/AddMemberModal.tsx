import { useState } from "react";
import { ArrowLeft, Search, Check, X } from "lucide-react";
import { searchUsersApi } from "../../../api/userApi";
import { addMembersApi } from "../../../api/chatApi";
import type { User, Conversation } from "../../../types";
import Avatar from "../../common/Avatar";
import toast from 'react-hot-toast';
import './AddMemberModal.css';

interface AddMemberModalProps {
    conversation: Conversation;
    onClose: () => void;
    onMembersAdded: () => void; // RightSidebar should re-fetch or socket should handle it.
}

const AddMemberModal = ({ conversation, onClose, onMembersAdded }: AddMemberModalProps) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Current members shouldn't be added again
    const currentMemberIds = new Set(conversation.participants.map(p => typeof p === 'string' ? p : p._id));

    const handleSearch = async () => {
        const trimmed = query.trim();
        if (!trimmed) { setResults([]); return; }
        setIsSearching(true);
        try {
            const res = await searchUsersApi(trimmed);
            const filtered = res.data.users.filter((u: User) => !currentMemberIds.has(u._id));
            setResults(filtered);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleUser = (user: User) => {
        if (selectedUsers.find((u) => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;
        setIsSubmitting(true);
        try {
            await addMembersApi(conversation._id, selectedUsers.map(u => u._id));
            toast.success("Thêm thành viên thành công");
            onMembersAdded();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Không thể thêm thành viên");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-member-overlay" onClick={onClose}>
            <div className="add-member-modal" onClick={e => e.stopPropagation()}>
                <div className="add-member-header">
                    <button className="add-member-close" onClick={onClose}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="add-member-title">
                        <h3>Thêm thành viên</h3>
                        <span>{selectedUsers.length} người</span>
                    </div>
                </div>

                <div className="add-member-search">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            autoFocus
                        />
                        {query && (
                            <button className="clear-search" onClick={() => { setQuery(""); setResults([]); }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="add-member-content">
                    {/* Selected Users Chips */}
                    {selectedUsers.length > 0 && (
                        <div className="selected-users-chips">
                            {selectedUsers.map(user => (
                                <div key={user._id} className="selected-chip">
                                    <Avatar src={user.avatar} name={user.fullName || user.username} size={24} />
                                    <span>{user.fullName || user.username}</span>
                                    <button onClick={() => toggleUser(user)}><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search Results */}
                    <div className="search-results-list">
                        {isSearching ? (
                            <div className="centered-msg">Đang tìm kiếm...</div>
                        ) : results.length > 0 ? (
                            results.map((user) => {
                                const isSelected = !!selectedUsers.find(u => u._id === user._id);
                                return (
                                    <div key={user._id} className="user-list-item" onClick={() => toggleUser(user)}>
                                        <div className="item-avatar-wrapper">
                                            <Avatar src={user.avatar} name={user.fullName || user.username} size={40} />
                                            {isSelected && (
                                                <div className="avatar-check-badge">
                                                    <Check size={12} color="#FFF" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="user-info">
                                            <span className="user-name">{user.fullName || user.username}</span>
                                            {user.lastSeen && <span className="user-subtext">{user.lastSeen}</span>}
                                        </div>
                                    </div>
                                );
                            })
                        ) : query && !isSearching ? (
                            <div className="centered-msg">Không tìm thấy ai</div>
                        ) : (
                            <div className="centered-msg">Nhập email hoặc tên để tìm người dùng</div>
                        )}
                    </div>
                </div>

                {selectedUsers.length > 0 && (
                    <div className="add-member-footer">
                        <button className="add-member-submit" onClick={handleAddMembers} disabled={isSubmitting}>
                            {isSubmitting ? "Đang xử lý..." : "Thêm"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddMemberModal;
