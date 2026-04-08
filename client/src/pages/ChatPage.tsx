const ChatPage = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: "30%", borderRight: "1px solid #ccc" }}>
        <h3>Conversations</h3>
      </div>

      {/* Chat box */}
      <div style={{ flex: 1 }}>
        <h3>Chat</h3>
      </div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default ChatPage;
