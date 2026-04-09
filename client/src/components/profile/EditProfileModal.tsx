import { useState } from "react";
import { updateProfileApi } from "../../api/userApi";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";

interface EditProfileModalProps {
  onClose: () => void;
}

const EditProfileModal = ({ onClose }: EditProfileModalProps) => {
  const { user, updateUser } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!username.trim() || username.trim().length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }
    
    setError("");
    setIsSubmitting(true);
    try {
      const res = await updateProfileApi({ username, avatar: avatarUrl });
      updateUser(res.data.user);
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "20px", color: "#333", textAlign: "center" }}>
          Edit Profile
        </h2>

        {/* Live Preview Avatar */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "-8px" }}>
           <Avatar user={{ _id: user?._id || "1", username: username || "?", avatar: avatarUrl }} size={80} />
        </div>

        {error && (
          <div style={{ color: "red", fontSize: "14px", backgroundColor: "#ffebeb", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#555" }}>
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. John Doe"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #dce1e6",
                outline: "none",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#555" }}>
              Avatar URL (Optional)
            </label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #dce1e6",
                outline: "none",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "white",
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              background: "#0088cc",
              color: "white",
              cursor: "pointer",
              fontWeight: 500,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
