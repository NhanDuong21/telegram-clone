import { useState } from "react";
import { searchUsersApi } from "../../api/userApi";
import { updateGroupSettingsApi, addMembersApi, removeMemberApi } from "../../api/chatApi";
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
                    <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: "20px", cursor: "pointer" }}>✕</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
                    <div>
                        <label style={{ fontSize: "14px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Tên nhóm</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} 
                               style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                    </div>
                    <div>
                        <label style={{ fontSize: "14px", fontWeight: 600, display: "block", marginBottom: "4px" }}>Ảnh nhóm (URL)</label>
                        <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} 
                               placeholder="https://..."
                               style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                    </div>
                    <button onClick={handleSaveInfo} disabled={isSaving || !name.trim()}
                            style={{ alignSelf: "flex-end", padding: "8px 16px", backgroundColor: "#0088cc", color: "white", border: "none", borderRadius: "6px", cursor: isSaving ? "not-allowed" : "pointer" }}>
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>

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

                <div>
                    <h4 style={{ margin: "0 0 10px 0" }}>Thành viên ({conversation.participants.length})</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", border: "1px solid #eee", padding: "8px", borderRadius: "6px" }}>
                        {conversation.participants.map(p => (
                            <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px", backgroundColor: "#fdfdfd", borderRadius: "4px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Avatar user={p as any} size={32} />
                                    <span>{p.username} {p._id === currentUserId && "(Bạn)"}</span>
                                </div>
                                {p._id !== currentUserId && (
                                    <button onClick={() => handleRemoveMember(p._id)} disabled={opLoading} style={{ padding: "4px 8px", backgroundColor: "#d63031", color: "white", border: "none", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>Kick</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GroupSettingsModal;
