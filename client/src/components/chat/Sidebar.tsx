import { useState } from "react";
import { searchUsersApi } from "../../api/userApi";

// Kiểu dữ liệu user trả về từ API
interface User {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
}

const Sidebar = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Gọi API tìm user khi bấm nút hoặc Enter
    const handleSearch = async () => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const res = await searchUsersApi(trimmed);
            setResults(res.data.users);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Cho phép bấm Enter để search
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Thanh tìm kiếm */}
            <div style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                    <input
                        type="text"
                        placeholder="Tìm user..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            flex: 1,
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            fontSize: "14px",
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#0088cc",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        Tìm
                    </button>
                </div>
            </div>

            {/* Kết quả tìm kiếm */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                {loading && (
                    <p style={{ padding: "12px", color: "#999" }}>Đang tìm...</p>
                )}

                {!loading && results.length === 0 && query.trim() && (
                    <p style={{ padding: "12px", color: "#999" }}>
                        Không tìm thấy user
                    </p>
                )}

                {results.map((user) => (
                    <div
                        key={user._id}
                        style={{
                            padding: "10px 12px",
                            borderBottom: "1px solid #f0f0f0",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}
                    >
                        {/* Avatar placeholder */}
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: "#0088cc",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                fontSize: "14px",
                                flexShrink: 0,
                            }}
                        >
                            {user.username.charAt(0).toUpperCase()}
                        </div>

                        {/* Thông tin user */}
                        <div>
                            <div style={{ fontWeight: 500, fontSize: "14px" }}>
                                {user.username}
                            </div>
                            <div style={{ fontSize: "12px", color: "#999" }}>
                                {user.email}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
