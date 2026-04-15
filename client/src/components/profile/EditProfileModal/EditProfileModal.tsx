import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { updateProfileApi } from "../../../api/userApi";
import { useAuth } from "../../../context/AuthContext";
import Avatar from "../../common/Avatar";
import './EditProfileModal.css';

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
    } catch (err: unknown) {
      const error = err as any; // Temporary cast for axios error access while we still use local Error interfaces
      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="edit-profile-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="edit-profile-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="edit-profile-title">
          Edit Profile
        </h2>

        <div className="edit-profile-form">
          <div className="avatar-edit-section">
            <Avatar user={{ _id: user?._id || "1", username: username || "?", avatar: localPreview }} size={100} />
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="change-avatar-btn"
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
            <div className="error-msg">
              {error}
            </div>
          )}

          <div className="form-group">
            <div>
              <label className="form-label">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. John Doe"
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="footer-actions">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="btn-save"
          >
            {isSubmitting && <div className="submit-spinner" />}
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditProfileModal;
