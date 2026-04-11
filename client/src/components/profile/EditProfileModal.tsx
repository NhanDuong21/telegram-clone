import { useState, useRef } from "react";
import { updateProfileApi } from "../../api/userApi";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";

interface EditProfileModalProps {
  onClose: () => void;
}

const EditProfileModal = ({ onClose }: EditProfileModalProps) => {
  const { user, updateUser } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string>(user?.avatar || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        setError("Vui lòng chọn file ảnh hợp lệ.");
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        setError("File ảnh quá lớn (tối đa 2MB).");
        return;
    }

    setAvatarFile(file);
    setError("");

    // Create local preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
        setLocalPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!username.trim() || username.trim().length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }
    
    setError("");
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await updateProfileApi(formData);
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
        <div 
            style={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                gap: "12px" 
            }}
        >
           <Avatar user={{ _id: user?._id || "1", username: username || "?", avatar: localPreview }} size={100} />
           <button
             onClick={() => fileInputRef.current?.click()}
             type="button"
             style={{
                 fontSize: "13px",
                 color: "#0088cc",
                 background: "none",
                 border: "none",
                 cursor: "pointer",
                 fontWeight: 600
             }}
           >
             Thay đổi ảnh đại diện
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             accept="image/*" 
             style={{ display: "none" }} 
           />
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
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {isSubmitting && (
                <div style={{ 
                    width: "14px", height: "14px", 
                    border: "2px solid rgba(255,255,255,0.3)", 
                    borderTopColor: "white", 
                    borderRadius: "50%", 
                    animation: "spin 1s linear infinite" 
                }} />
            )}
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EditProfileModal;
