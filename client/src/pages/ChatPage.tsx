import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMeApi } from "../api/authApi";

type ChatPageProps = {
  setIsLoggedIn?: React.Dispatch<React.SetStateAction<boolean>>;
};

const ChatPage = ({ setIsLoggedIn }: ChatPageProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn?.(false);
    navigate("/login");
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await getMeApi(token);
        setUser(res.data.user);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        handleLogout();
      }
    };

    fetchUser();
  }, [handleLogout]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div
        style={{
          width: "30%",
          borderRight: "1px solid #ccc",
          padding: "10px",
        }}
      >
        <h3>Conversations</h3>
        {user && (
          <div style={{ marginBottom: "20px" }}>
            <strong>{user.username}</strong>
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: "10px" }}>
        <h3>Chat</h3>
        {user && <p>Welcome, {user.username}</p>}
      </div>

      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default ChatPage;
