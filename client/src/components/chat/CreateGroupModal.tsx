import { useState } from "react";
import { searchUsersApi } from "../../api/userApi";
import { createGroupConversationApi } from "../../api/chatApi";
import Avatar from "../common/Avatar";

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
        // At least 2 other users selected, so group > 2 (including myself)
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
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "12px",
                width: "400px",
                maxWidth: "90%",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
            }}>
                <h3 style={{ margin: 0, fontSize: "18px" }}>Tạo Nhóm Trò Chuyện</h3>

                <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Tên nhóm</label>
                    <input
                        type="text"
                        placeholder="Nhập tên nhóm..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        style={{
                            width: "100%", padding: "10px", borderRadius: "8px",
                            border: "1px solid #ccc", outline: "none", boxSizing: "border-box"
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Thêm thành viên</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <input
                            type="text"
                            placeholder="Tìm kiếm user..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                flex: 1, padding: "10px", borderRadius: "8px",
                                border: "1px solid #ccc", outline: "none"
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            style={{
                                padding: "8px 16px", borderRadius: "8px", border: "none",
                                background: "#0088cc", color: "white", cursor: "pointer",
                                opacity: isSearching ? 0.7 : 1
                            }}
                        >
                            Tìm
                        </button>
                    </div>

                    {/* Search Results */}
                    {results.length > 0 && (
                        <div style={{ marginTop: "8px", maxHeight: "150px", overflowY: "auto", border: "1px solid #eee", borderRadius: "8px", padding: "4px" }}>
                            {results.map((user) => (
                                <div key={user._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px", borderRadius: "6px", backgroundColor: "#f9f9f9", marginBottom: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Avatar user={user} size={28} />
                                        <span style={{ fontSize: "13px" }}>{user.username}</span>
                                    </div>
                                    <button onClick={() => addUser(user)} style={{ border: "none", background: "#e4eef7", color: "#0088cc", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                                        + Thêm
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                    <div>
                        <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Đã chọn ({selectedUsers.length})</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {selectedUsers.map(user => (
                                <div key={user._id} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#e4eef7", padding: "4px 8px", borderRadius: "16px", fontSize: "12px" }}>
                                    <span>{user.username}</span>
                                    <span onClick={() => removeUser(user._id)} style={{ cursor: "pointer", color: "#d63031", display: "flex", alignItems: "center" }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: "12px", height: "12px" }}>
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "10px 16px", borderRadius: "8px", border: "1px solid #ccc",
                            background: "white", cursor: "pointer", fontWeight: 600
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!canCreate}
                        style={{
                            padding: "10px 16px", borderRadius: "8px", border: "none",
                            background: canCreate ? "#0088cc" : "#ccc", color: "white",
                            cursor: canCreate ? "pointer" : "not-allowed", fontWeight: 600,
                            minWidth: "120px"
                        }}
                    >
                        {isSubmitting ? "Đang tạo..." : "Tạo Nhóm"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
