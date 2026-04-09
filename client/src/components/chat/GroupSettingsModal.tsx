/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { searchUsersApi } from "../../api/userApi";
import { updateGroupSettingsApi, addMembersApi, removeMemberApi, uploadImageApi, deleteGroupApi } from "../../api/chatApi";
import Avatar from "../common/Avatar";
import type { Conversation } from "./Sidebar";
import type { User } from "./CreateGroupModal";

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

    // Search state
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // API state
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
        } catch (error: any) {
            console.error("Upload failed:", error);
            alert(error.response?.data?.message || "Lỗi upload ảnh.");
        } finally {
            setIsUploading(false);
            e.target.value = ""; // Reset input
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
            // filter out existing members
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
        if (!confirm("CẢNH BÁO: Bọn có chắc chắn muốn XÓA VĨNH VIỄN nhóm này không? Hành động này không thể hoàn tác.")) return;
        
        setOpLoading(true);
        try {
            await deleteGroupApi(conversation._id);
            onClose();
        } catch (error: any) {
            console.error("Delete group failed", error);
            alert(error.response?.data?.message || "Không thể xóa nhóm");
        } finally {
            setOpLoading(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: "white", padding: "24px", borderRadius: "12px",
                width: "450px", maxWidth: "90%", maxHeight: "85vh", overflowY: "auto",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "20px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "20px" }}>Cài đặt nhóm</h3>
                    <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}>
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
                    <div>
                        <label style={{ fontSize: "14px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Tên nhóm</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!isOwner}
                               style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", backgroundColor: !isOwner ? "#f0f0f0" : "white" }} />
                    </div>
                    <div>
                        <label style={{ fontSize: "14px", fontWeight: 600, display: "block", marginBottom: "8px" }}>Ảnh nhóm</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#e4eef7", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                {imageUrl ? (
                                    <img src={imageUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span style={{ fontSize: "18px", fontWeight: "bold", color: "#0088cc" }}>
                                        {name ? name.substring(0, 1).toUpperCase() : "G"}
                                    </span>
                                )}
                            </div>
                            <div style={{ flex: 1, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
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
                                            style={{ 
                                                display: "inline-flex", padding: "8px 14px", border: "1px solid #0088cc", 
                                                color: "#0088cc", borderRadius: "8px", cursor: isUploading ? "not-allowed" : "pointer",
                                                fontSize: "13px", fontWeight: 600, opacity: isUploading ? 0.6 : 1,
                                                alignItems: "center", gap: "6px"
                                            }}
                                        >
                                            {isUploading && <div style={{ width: "12px", height: "12px", border: "2px solid rgba(0,136,204,0.3)", borderTopColor: "#0088cc", borderRadius: "50%", animation: "spin 1s linear infinite" }} />}
                                            {isUploading ? "Đang tải lên..." : "Chọn ảnh"}
                                        </label>
                                        {imageUrl && !isUploading && (
                                            <button 
                                                onClick={() => setImageUrl("")} 
                                                style={{ background: "transparent", border: "none", color: "#d63031", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
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
                        <button onClick={handleSaveInfo} disabled={isSaving || !name.trim()}
                                style={{ alignSelf: "flex-end", padding: "8px 16px", backgroundColor: "#0088cc", color: "white", border: "none", borderRadius: "6px", cursor: isSaving ? "not-allowed" : "pointer" }}>
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    )}
                </div>

                {isOwner && (
                    <div>
                        <h4 style={{ margin: "0 0 10px 0" }}>Thêm thành viên</h4>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input type="text" placeholder="Tìm bằng username..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
                                   style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} />
                            <button onClick={handleSearch} disabled={isSearching} style={{ padding: "8px 16px", backgroundColor: "#0088cc", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>Tìm</button>
                        </div>
                        {results.length > 0 && (
                            <div style={{ marginTop: "10px", border: "1px solid #eee", borderRadius: "6px", padding: "4px", maxHeight: "150px", overflowY: "auto" }}>
                                {results.map(user => (
                                    <div key={user._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", borderBottom: "1px solid #eee" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Avatar user={user as any} size={28} />
                                            <span>{user.username}</span>
                                        </div>
                                        <button onClick={() => handleAddMember(user)} disabled={opLoading} style={{ padding: "4px 8px", backgroundColor: "#00b894", color: "white", border: "none", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>+ Thêm</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <h4 style={{ margin: "0 0 10px 0" }}>Thành viên ({conversation.participants.length})</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", border: "1px solid #eee", padding: "8px", borderRadius: "6px" }}>
                        {conversation.participants.map(p => (
                            <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px", backgroundColor: "#fdfdfd", borderRadius: "4px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Avatar user={p as any} size={32} />
                                    <span>
                                        {p.username} {p._id === currentUserId && "(Bạn)"}
                                        {conversation.owner === p._id && <span style={{ marginLeft: "8px", fontSize: "11px", backgroundColor: "#3390ec", color: "white", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>Owner</span>}
                                    </span>
                                </div>
                                {isOwner && p._id !== currentUserId && (
                                    <button onClick={() => handleRemoveMember(p._id)} disabled={opLoading} style={{ padding: "4px 8px", backgroundColor: "#d63031", color: "white", border: "none", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>Kick</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {isOwner && (
                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #ffcccc", display: "flex", justifyContent: "center" }}>
                        <button onClick={handleDeleteGroup} disabled={opLoading} style={{ padding: "10px 24px", backgroundColor: "#ff4d4f", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", width: "100%", opacity: opLoading ? 0.6 : 1 }}>
                            {opLoading ? "Đang xử lý..." : "Xóa vĩnh viễn Group"}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default GroupSettingsModal;
