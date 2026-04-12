import { motion } from "framer-motion";
import { X, Pencil, Phone, AtSign, BookOpen } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import Avatar from "../../common/Avatar";
import "./MyProfileModal.css";

interface MyProfileModalProps {
    onClose: () => void;
    onEdit: () => void;
}

const MyProfileModal = ({ onClose, onEdit }: MyProfileModalProps) => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="my-profile-modal-overlay" onClick={onClose}>
            <motion.div 
                className="my-profile-modal-container"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="my-profile-modal-header">
                    <h3>Thông tin cá nhân</h3>
                    <button className="my-profile-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="my-profile-modal-content">
                    <div className="my-profile-hero">
                        <div className="my-profile-avatar-wrapper">
                            <Avatar user={user} size={100} />
                            <button className="my-profile-avatar-edit-btn" title="Chỉnh sửa ảnh">
                                <Pencil size={16} />
                            </button>
                        </div>
                        <h2 className="my-profile-name">{user.username}</h2>
                        <span className="my-profile-username-tag">@{user.username.toLowerCase()}</span>
                    </div>

                    <div className="my-profile-info-list">
                        <div className="my-profile-info-item">
                            <div className="info-icon-wrapper">
                                <Phone size={22} className="info-icon" />
                            </div>
                            <div className="info-text">
                                <span className="info-value">{user.phone || "Chưa cập nhật"}</span>
                                <span className="info-label">Số điện thoại</span>
                            </div>
                        </div>

                        <div className="my-profile-info-item">
                            <div className="info-icon-wrapper">
                                <AtSign size={22} className="info-icon" />
                            </div>
                            <div className="info-text">
                                <span className="info-value">@{user.username.toLowerCase()}</span>
                                <span className="info-label">Tên người dùng</span>
                            </div>
                        </div>

                        <div className="my-profile-info-item">
                            <div className="info-icon-wrapper">
                                <BookOpen size={22} className="info-icon" />
                            </div>
                            <div className="info-text">
                                <span className="info-value">{user.bio || "Không có tiểu sử"}</span>
                                <span className="info-label">Tiểu sử (Bio)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="my-profile-modal-actions">
                    <button className="my-profile-btn my-profile-btn--edit" onClick={() => { onEdit(); onClose(); }}>
                        Chỉnh sửa thông tin
                    </button>
                    <button className="my-profile-btn my-profile-btn--close" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default MyProfileModal;
