import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Pencil, 
    ArrowLeft, 
    Camera, 
    Settings as SettingsIcon,
    Phone,
    User as UserIcon,
    Info,
    Calendar,
    ChevronRight,
    Palette
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfileApi } from '../../api/userApi';
import Avatar from '../common/Avatar';
import './ProfileModal.css';

export type ProfileMode = 'VIEW' | 'EDIT';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: ProfileMode;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
    isOpen, 
    onClose, 
    initialMode = 'VIEW' 
}) => {
    const { user, updateUser } = useAuth();
    const [mode, setMode] = useState<ProfileMode>(initialMode);
    
    // Form states
    const [name, setName] = useState(user?.displayName || user?.username || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [username, setUsername] = useState(user?.username || "");
    const [phone, setPhone] = useState(user?.phone || "");
    
    const [localPreview, setLocalPreview] = useState<string>(user?.avatar || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state when final user state changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setName(user?.displayName || user?.username || "");
            setBio(user?.bio || "");
            setUsername(user?.username || "");
            setPhone(user?.phone || "");
            setLocalPreview(user?.avatar || "");
        }
    }, [isOpen, initialMode, user]);

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
        const reader = new FileReader();
        reader.onloadend = () => {
            setLocalPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!username.trim() || username.trim().length < 2) {
            setError("Tên người dùng phải có ít nhất 2 ký tự.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("username", username.trim());
            formData.append("displayName", name.trim());
            formData.append("bio", bio.trim());
            // phone update could be here if backend supports it
            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            const res = await updateProfileApi(formData);
            updateUser(res.data.user);
            setMode('VIEW');
        } catch (err: any) {
            setError(err.response?.data?.message || "Lỗi khi cập nhật hồ sơ");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <AnimatePresence mode="wait">
            <div className="modal-root-overlay">
                <motion.div 
                    className="profile-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />
                <motion.div 
                    className="profile-modal"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                    {mode === 'VIEW' ? (
                        <div className="profile-view-container">
                            <div className="profile-header">
                                <button className="profile-icon-btn" onClick={() => setMode('EDIT')}>
                                    <Pencil size={20} />
                                </button>
                                <button className="profile-icon-btn" onClick={onClose}>
                                    <X size={22} />
                                </button>
                            </div>

                            {error && <div className="profile-error-banner">{error}</div>}

                            <div className="profile-hero">
                                <div className="profile-hero-avatar">
                                    <Avatar user={user} size={120} />
                                </div>
                                <div className="profile-hero-info">
                                    <h2 className="profile-display-name">{user?.displayName || user?.username}</h2>
                                    <span className="profile-online-status">online</span>
                                </div>
                            </div>

                            <div className="profile-info-section">
                                <div className="profile-info-item">
                                    <div className="info-icon">
                                        <Phone size={22} />
                                    </div>
                                    <div className="info-details">
                                        <div className="info-value">+{user?.phone || "Chưa cập nhật"}</div>
                                        <div className="info-label">Số điện thoại</div>
                                    </div>
                                </div>

                                <div className="profile-info-item">
                                    <div className="info-icon">
                                        <Info size={22} />
                                    </div>
                                    <div className="info-details">
                                        <div className="info-value">{user?.bio || "Chưa có tiểu sử"}</div>
                                        <div className="info-label">Tiểu sử</div>
                                    </div>
                                </div>

                                <div className="profile-info-item">
                                    <div className="info-icon">
                                        <UserIcon size={22} />
                                    </div>
                                    <div className="info-details">
                                        <div className="info-value">@{user?.username}</div>
                                        <div className="info-label">Tên người dùng</div>
                                    </div>
                                </div>

                                <div className="profile-info-item">
                                    <div className="info-icon">
                                        <Calendar size={22} />
                                    </div>
                                    <div className="info-details">
                                        <div className="info-value">Chưa cập nhật</div>
                                        <div className="info-label">Ngày sinh</div>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-settings-hint">
                                <SettingsIcon size={18} />
                                <span>Cài đặt trò chuyện</span>
                            </div>
                        </div>
                    ) : (
                        <div className="profile-edit-container">
                            <div className="profile-header">
                                <div className="header-left">
                                    <button className="profile-icon-btn" onClick={() => setMode('VIEW')}>
                                        <ArrowLeft size={22} />
                                    </button>
                                    <span className="header-title">Thông tin</span>
                                </div>
                                <button className="profile-icon-btn" onClick={onClose}>
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="profile-edit-scrollable">
                                {error && <div className="profile-error-banner">{error}</div>}
                                <div className="avatar-edit-box">
                                    <div className="avatar-preview-container" onClick={() => fileInputRef.current?.click()}>
                                        <Avatar user={{ ...user, avatar: localPreview } as any} size={100} />
                                        <div className="avatar-overlay">
                                            <Camera size={28} />
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        style={{ display: 'none' }} 
                                        onChange={handleFileChange}
                                        accept="image/*"
                                    />
                                </div>

                                <div className="edit-form">
                                    <div className="edit-input-group">
                                        <div className="input-wrapper">
                                            <input 
                                                type="text" 
                                                value={bio} 
                                                onChange={(e) => setBio(e.target.value.slice(0, 60))}
                                                placeholder="Tiểu sử"
                                            />
                                            <span className="char-count">{bio.length}/60</span>
                                        </div>
                                        <p className="input-help">Bất kỳ ai cũng có thể thấy thông tin này trong hồ sơ của bạn.</p>
                                    </div>

                                    <div className="edit-input-group">
                                        <label>Họ tên</label>
                                        <input 
                                            type="text" 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)} 
                                        />
                                    </div>

                                    <div className="edit-input-group">
                                        <label>Email (Số điện thoại placeholder)</label>
                                        <input 
                                            type="text" 
                                            value={phone} 
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="SĐT"
                                        />
                                    </div>

                                    <div className="edit-input-group">
                                        <label>Tên người dùng</label>
                                        <input 
                                            type="text" 
                                            value={username} 
                                            onChange={(e) => setUsername(e.target.value)} 
                                        />
                                    </div>

                                    <div className="edit-divider" />

                                    <div className="edit-action-list">
                                        <div className="edit-action-item">
                                            <div className="item-main">
                                                <Info size={22} className="item-icon" />
                                                <span>Kênh cá nhân</span>
                                            </div>
                                            <ChevronRight size={20} className="chevron" />
                                        </div>
                                        <div className="edit-action-item">
                                            <div className="item-main">
                                                <Palette size={22} className="item-icon" />
                                                <span>Màu tên của bạn</span>
                                            </div>
                                            <div className="color-preview" />
                                            <ChevronRight size={20} className="chevron" />
                                        </div>
                                        <div className="edit-action-item">
                                            <div className="item-main">
                                                <Calendar size={22} className="item-icon" />
                                                <span>Ngày sinh</span>
                                            </div>
                                            <ChevronRight size={20} className="chevron" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-edit-footer">
                                <button 
                                    className="profile-save-btn" 
                                    onClick={handleSave}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Đang lưu..." : "Lưu hồ sơ"}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default ProfileModal;
