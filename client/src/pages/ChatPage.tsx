import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/chat/Sidebar";

const ChatPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div style={{ display: "flex", height: "100vh", position: "relative" }}>
            {/* Sidebar bên trái: tìm kiếm user + danh sách chat */}
            <div
                style={{
                    width: "320px",
                    borderRight: "1px solid #ddd",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header sidebar: tên user + logout */}
                <div
                    style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid #ddd",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#f5f5f5",
                    }}
                >
                    <span style={{ fontWeight: 600 }}>
                        {user?.username}
                    </span>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            backgroundColor: "white",
                            cursor: "pointer",
                        }}
                    >
                        Logout
                    </button>
                </div>

                {/* Sidebar content: search + kết quả */}
                <Sidebar />
            </div>

            {/* Khu vực chat bên phải (chưa implement) */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontSize: "16px",
                }}
            >
                Chọn một cuộc trò chuyện để bắt đầu
            </div>
        </div>
    );
};

export default ChatPage;