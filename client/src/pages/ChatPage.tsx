import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ChatPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", position: "relative" }}>
      <div
        style={{
          width: "30%",
          borderRight: "1px solid #ccc",
          padding: "10px",
        }}
      >
        <h3>Conversations</h3>
        {user && <p>{user.username}</p>}
      </div>

      <div style={{ flex: 1, padding: "10px" }}>
        <h3>Chat</h3>
        {user && <p>Welcome, {user.username}</p>}
      </div>

      <button
        onClick={handleLogout}
        style={{ position: "absolute", top: 10, right: 10 }}
      >
        Logout
      </button>
    </div>
  );
};

export default ChatPage;