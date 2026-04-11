import { motion } from "framer-motion";
import { useState } from "react";
import { searchUsersApi } from "../../../api/userApi";
import { updateGroupSettingsApi, addMembersApi, removeMemberApi, uploadImageApi, deleteGroupApi } from "../../../api/chatApi";
import Avatar from "../../common/Avatar";
import type { Conversation, User } from "../../../types";
import './GroupSettingsModal.css';

interface GroupSettingsModalProps {
    conversation: Conversation;
    currentUserId: string;
    onClose: () => void;
    onUpdated: (conv: Conversation) => void;
}

const GroupSettingsModal = ({ conversation, currentUserId, onClose, onUpdated }: GroupSettingsModalProps) => {
    const [name, setName] = useState(conversation.name || "");
    const [imageUrl, setImageUrl] = useState(conversation.imageUrl || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const isOwner = conversation.owner === currentUserId;

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [opLoading, setOpLoading] = useState(false);

    const handleSaveInfo = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            const res = await updateGroupSettingsApi(conversation._id, { name: name.trim(), imageUrl: imageUrl.trim() });
            onUpdated(res.data.conversation);
            alert("Đã lưu thông tin nhóm!");
        } catch (error) {
            console.error("Save info failed", error);
            alert("Lưu thông tin thất bại");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn file ảnh hợp lệ.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("File ảnh quá lớn (tối đa 5MB).");
            return;
        }

        setIsUploading(true);
        try {
            const res = await uploadImageApi(file);
            setImageUrl(res.data.imageUrl);
        } catch (error: unknown) {
            console.error("Upload failed:", error);
            const err = error as { response?: { data?: { message?: string } } };
            alert(err.response?.data?.message || "Lỗi upload ảnh.");
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    const handleSearch = async () => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await searchUsersApi(trimmed);
            const existingIds = conversation.participants.map(p => p._id);
            const filtered = res.data.users.filter((u: User) => !existingIds.includes(u._id));
            setResults(filtered);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddMember = async (user: User) => {
        if (opLoading) return;
        setOpLoading(true);
        try {
            const res = await addMembersApi(conversation._id, [user._id]);
            onUpdated(res.data.conversation);
            setResults(results.filter(u => u._id !== user._id));
        } catch (error) {
            console.error("Add member failed", error);
        } finally {
            setOpLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (opLoading) return;
        if (conversation.participants.length <= 3) {
            alert("Nhóm phải có tối thiểu 3 thành viên!");
            return;
        }
        if (!confirm("Bạn có chắc chắn muốn kick thành viên này?")) return;

        setOpLoading(true);
        try {
            const res = await removeMemberApi(conversation._id, memberId);
            onUpdated(res.data.conversation);
        } catch (error) {
            console.error("Remove member failed", error);
        } finally {
            setOpLoading(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm("CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN nhóm này không? Hành động này không thể hoàn tác.")) return;
        
        setOpLoading(true);
        try {
            await deleteGroupApi(conversation._id);
            onClose();
        } catch (error: unknown) {
            console.error("Delete group failed", error);
            const err = error as { response?: { data?: { message?: string } } };
            alert(err.response?.data?.message || "Không thể xóa nhóm");
        } finally {
            setOpLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="settings-overlay"
            onClick={onClose}
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="settings-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="settings-header">
                    <h3 className="settings-title">Cài đặt nhóm</h3>
                    <button onClick={onClose} className="close-settings-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}>
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="settings-section">
                    <div className="settings-row">
                        <label className="form-label">Tên nhóm</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            disabled={!isOwner}
                            className="form-input"
                            style={{ backgroundColor: !isOwner ? "#f0f0f0" : "white" }} 
                        />
                    </div>
                    <div className="settings-row">
                        <label className="form-label">Ảnh nhóm</label>
                        <div className="avatar-preview-container">
                            <div className="group-avatar-box">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="preview" className="group-avatar-img" />
                                ) : (
                                    <span className="group-avatar-initial">
                                        {name ? name.substring(0, 1).toUpperCase() : "G"}
                                    </span>
                                )}
                            </div>
                            <div className="avatar-actions">
                                {isOwner ? (
                                    <>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileChange}
                                            style={{ display: "none" }} 
                                            id="group-avatar-upload" 
                                            disabled={isUploading}
                                        />
                                        <label 
                                            htmlFor="group-avatar-upload" 
                                            className={`upload-label ${isUploading ? "upload-label--disabled" : ""}`}
                                        >
                                            {isUploading && <div className="spinner" style={{ width: "12px", height: "12px" }} />}
                                            {isUploading ? "Đang tải lên..." : "Chọn ảnh"}
                                        </label>
                                        {imageUrl && !isUploading && (
                                            <button 
                                                onClick={() => setImageUrl("")} 
                                                className="delete-avatar-btn"
                                            >
                                                Xóa ảnh
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <span style={{ fontSize: "13px", color: "#666" }}>Chỉ Owner mới có thể thay đổi ảnh</span>
                                )}
                            </div>
                        </div>
                    </div>
                    {isOwner && (
                        <button 
                            onClick={handleSaveInfo} 
                            disabled={isSaving || !name.trim()}
                            className="save-info-btn"
                        >
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    )}
                </div>

                {isOwner && (
                    <div className="form-group">
                        <h4 className="sub-title">Thêm thành viên</h4>
                        <div className="search-input-group">
                            <input 
                                type="text" 
                                placeholder="Tìm bằng username..." 
                                value={query} 
                                onChange={e => setQuery(e.target.value)} 
                                onKeyDown={e => e.key === "Enter" && handleSearch()}
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
                        {results.length > 0 && (
                            <div className="search-results">
                                {results.map((user: User) => (
                                    <div key={user._id} className="search-result-item">
                                        <div className="user-info">
                                            <Avatar user={user as any} size={28} />
                                            <span className="user-name">{user.username}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleAddMember(user as any)} 
                                            disabled={opLoading} 
                                            className="add-btn"
                                        >
                                            + Thêm
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <h4 className="sub-title">Thành viên ({conversation.participants.length})</h4>
                    <div className="member-list">
                        {conversation.participants.map(p => (
                            <div key={p._id} className="member-item">
                                <div className="member-main-info">
                                    <Avatar user={p} size={32} />
                                    <span className="user-name">
                                        {p.username} {p._id === currentUserId && "(Bạn)"}
                                        {conversation.owner === p._id && <span className="owner-badge">Owner</span>}
                                    </span>
                                </div>
                                {isOwner && p._id !== currentUserId && (
                                    <button 
                                        onClick={() => handleRemoveMember(p._id)} 
                                        disabled={opLoading} 
                                        className="kick-btn"
                                    >
                                        Kick
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {isOwner && (
                    <div className="danger-zone">
                        <button 
                            onClick={handleDeleteGroup} 
                            disabled={opLoading} 
                            className="delete-group-btn"
                        >
                            {opLoading ? "Đang xử lý..." : "Xóa vĩnh viễn Group"}
                        </button>
                    </div>
                )}

            </motion.div>
        </motion.div>
    );
};

export default GroupSettingsModal;
