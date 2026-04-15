import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight, Camera, X, Search, Check } from "lucide-react";
import { searchUsersApi } from "../../../api/userApi";
import { createGroupConversationApi, uploadImageApi } from "../../../api/chatApi";
import Avatar from "../../common/Avatar";
import type { User, Conversation } from "../../../types";
import './CreateGroupModal.css';

interface CreateGroupModalProps {
    onClose: () => void;
    onGroupCreated: (group: Conversation) => void;
}

const CreateGroupModal = ({ onClose, onGroupCreated }: CreateGroupModalProps) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [groupName, setGroupName] = useState("");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Avatar states
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async () => {
        const trimmed = query.trim();
        if (!trimmed) { setResults([]); return; }
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

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleCreate = async () => {
        const name = groupName.trim();
        if (!name || selectedUsers.length < 2 || isSubmitting) return;

        setIsSubmitting(true);
        try {
            let imageUrl: string | undefined;
            if (avatarFile) {
                const uploadRes = await uploadImageApi(avatarFile);
                imageUrl = uploadRes.data.imageUrl;
            }

            const participantIds = selectedUsers.map(u => u._id);
            const res = await createGroupConversationApi(name, participantIds, imageUrl);
            onGroupCreated(res.data.conversation);
        } catch (error) {
            console.error("Create group failed", error);
            alert("Tạo nhóm thất bại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceedToStep2 = selectedUsers.length >= 2;
    const canCreate = groupName.trim().length > 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cgm-overlay"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="cgm-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -40, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="cgm-step"
                        >
                            <div className="cgm-header">
                                <button className="cgm-header-btn" onClick={onClose}>
                                    <X size={20} />
                                </button>
                                <h3 className="cgm-title">Thêm thành viên</h3>
                                <button
                                    className={`cgm-next-btn ${canProceedToStep2 ? 'active' : ''}`}
                                    disabled={!canProceedToStep2}
                                    onClick={() => setStep(2)}
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>

                            {/* Selected users horizontal strip */}
                            <AnimatePresence>
                                {selectedUsers.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="cgm-selected-strip"
                                    >
                                        {selectedUsers.map(u => (
                                            <motion.div
                                                key={u._id}
                                                layout
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                className="cgm-selected-chip"
                                                onClick={() => removeUser(u._id)}
                                            >
                                                <Avatar user={u} size={32} />
                                                <span className="cgm-chip-name">{u.fullName || u.username}</span>
                                                <X size={14} className="cgm-chip-x" />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Search input */}
                            <div className="cgm-search-box">
                                <Search size={18} className="cgm-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm người dùng..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="cgm-search-input"
                                    autoFocus
                                />
                                {query && (
                                    <button className="cgm-search-clear" onClick={() => { setQuery(""); setResults([]); }}>
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Search results */}
                            <div className="cgm-user-list">
                                {isSearching && <div className="cgm-loading">Đang tìm kiếm...</div>}
                                {results.map((user) => {
                                    const isSelected = selectedUsers.some(u => u._id === user._id);
                                    return (
                                        <motion.div
                                            key={user._id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`cgm-user-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => isSelected ? removeUser(user._id) : addUser(user)}
                                        >
                                            <Avatar user={user} size={40} />
                                            <div className="cgm-user-info">
                                                <span className="cgm-user-name">{user.fullName || user.username}</span>
                                                <span className="cgm-user-handle">@{user.username}</span>
                                            </div>
                                            <div className={`cgm-checkbox ${isSelected ? 'checked' : ''}`}>
                                                {isSelected && <Check size={14} />}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {!isSearching && results.length === 0 && query.trim() && (
                                    <div className="cgm-empty">Nhấn Enter để tìm kiếm</div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 40, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="cgm-step"
                        >
                            <div className="cgm-header">
                                <button className="cgm-header-btn" onClick={() => setStep(1)}>
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="cgm-title">Thông tin nhóm</h3>
                                <button
                                    className={`cgm-create-btn ${canCreate ? 'active' : ''}`}
                                    disabled={!canCreate || isSubmitting}
                                    onClick={handleCreate}
                                >
                                    {isSubmitting ? (
                                        <div className="cgm-spinner" />
                                    ) : (
                                        <Check size={20} />
                                    )}
                                </button>
                            </div>

                            <div className="cgm-info-section">
                                {/* Avatar Upload */}
                                <div
                                    className="cgm-avatar-upload"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Group" className="cgm-avatar-preview" />
                                    ) : (
                                        <div className="cgm-avatar-placeholder">
                                            <Camera size={28} />
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarSelect}
                                        hidden
                                    />
                                </div>

                                {/* Group name input */}
                                <input
                                    type="text"
                                    placeholder="Tên nhóm"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="cgm-name-input"
                                    autoFocus
                                />
                            </div>

                            {/* Member preview list */}
                            <div className="cgm-members-preview">
                                <div className="cgm-members-title">{selectedUsers.length} thành viên</div>
                                {selectedUsers.map(u => (
                                    <div key={u._id} className="cgm-member-row">
                                        <Avatar user={u} size={36} />
                                        <span className="cgm-member-name">{u.fullName || u.username}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default CreateGroupModal;
