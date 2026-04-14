import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Pencil, 
    ArrowLeft, 
    Camera, 
    Mail,
    User as UserIcon,
    Info,
    Cake,
    MessageCircle,
    Bell,
    BellOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfileApi } from '../../api/userApi';
import type { User } from '../../types/chat';
import Avatar from '../common/Avatar';
import EditEmailView from './EditEmailView';
import './ProfileModal.css';

export type ProfileMode = 'VIEW' | 'EDIT' | 'EMAIL_EDIT';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: ProfileMode;
    userToDisplay?: User | null;
    isMuted?: boolean;
    onToggleMute?: () => void;
    onMessage?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
    isOpen, 
    onClose, 
    initialMode = 'VIEW',
    userToDisplay,
    isMuted,
    onToggleMute,
    onMessage,
}) => {
    const { user: currentUser, updateUser } = useAuth();
    const displayUser = userToDisplay || currentUser;
    const isOwnProfile = !userToDisplay || userToDisplay._id === currentUser?._id;
    const [mode, setMode] = useState<ProfileMode>(initialMode);
    
    // Form states
    const [fullName, setFullName] = useState(displayUser?.fullName || displayUser?.username || "");
    const [bio, setBio] = useState(displayUser?.bio || "");
    const [username, setUsername] = useState(displayUser?.username || "");
    const [birthday, setBirthday] = useState(displayUser?.birthday ? displayUser.birthday.split('T')[0] : "");
    const [email, setEmail] = useState(displayUser?.email || "");
    
    const [localPreview, setLocalPreview] = useState<string>(displayUser?.avatar || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state when final user state changes or modal opens
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
            setMode(userToDisplay ? 'VIEW' : initialMode);
            setFullName(displayUser?.fullName || displayUser?.username || "");
            setBio(displayUser?.bio || "");
            setUsername(displayUser?.username || "");
            setBirthday(displayUser?.birthday ? displayUser.birthday.split('T')[0] : "");
            setEmail(displayUser?.email || "");
            setLocalPreview(displayUser?.avatar || "");
            setError("");
        } else {
            document.body.classList.remove('modal-open');
        }

        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isOpen, initialMode, displayUser, userToDisplay]);

    const calculateAge = (birthDateStr: string) => {
        if (!birthDateStr) return null;
        const birthDate = new Date(birthDateStr);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "Chưa cập nhật";
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    };

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
            formData.append("fullName", fullName.trim());
            formData.append("bio", bio.trim());
            formData.append("birthday", birthday);
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
            {isOpen && (
                <div className="modal-root-overlay">
                    <motion.div 
                        className="profile-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    {mode === 'EMAIL_EDIT' ? (
                        <EditEmailView 
                            onBack={() => setMode('EDIT')}
                            onClose={onClose}
                            onSuccess={(updatedUser) => {
                                updateUser(updatedUser);
                                setMode('EDIT');
                            }}
                        />
                    ) : (
                        <motion.div 
                            className="profile-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            <AnimatePresence mode="wait">
                                {mode === 'VIEW' && (
                                    <motion.div 
                                        key="view"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="profile-view-container"
                                    >
                                        <div className="profile-header">
                                            {isOwnProfile ? (
                                                <button className="profile-icon-btn" onClick={() => setMode('EDIT')}>
                                                    <Pencil size={20} />
                                                </button>
                                            ) : <div />}
                                            <button className="profile-icon-btn" onClick={onClose}>
                                                <X size={22} />
                                            </button>
                                        </div>

                                        {error && <div className="profile-error-banner">{error}</div>}

                                        <div className="profile-hero">
                                            <div className="profile-hero-avatar">
                                                <Avatar user={displayUser} size={120} />
                                            </div>
                                            <div className="profile-hero-info">
                                                <h2 className="profile-display-name">{displayUser?.fullName || displayUser?.username}</h2>
                                                <span className="profile-online-status">online</span>
                                            </div>
                                        </div>

                                        {!isOwnProfile && (
                                            <div className="profile-quick-actions">
                                                <button className="p-action-btn" onClick={() => { onMessage?.(); onClose(); }}>
                                                    <div className="p-action-icon"><MessageCircle size={22} /></div>
                                                    <span>Nhắn tin</span>
                                                </button>
                                                <button className="p-action-btn" onClick={onToggleMute}>
                                                    <div className="p-action-icon">
                                                        {isMuted ? <Bell size={22} /> : <BellOff size={22} />}
                                                    </div>
                                                    <span>{isMuted ? 'Bật âm' : 'Tắt âm'}</span>
                                                </button>
                                            </div>
                                        )}

                                        <div className="profile-info-section">
                                            {isOwnProfile && (
                                                <div className="profile-info-item">
                                                    <div className="info-icon"><Mail size={22} /></div>
                                                    <div className="info-details">
                                                        <div className="info-value">{displayUser?.email || "Chưa cập nhật"}</div>
                                                        <div className="info-label">Email</div>
                                                    </div>
                                                </div>
                                            )}

                                            {displayUser?.bio && (
                                                <div className="profile-info-item">
                                                    <div className="info-icon"><Info size={22} /></div>
                                                    <div className="info-details">
                                                        <div className="info-value">{displayUser.bio}</div>
                                                        <div className="info-label">Tiểu sử</div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="profile-info-item">
                                                <div className="info-icon"><UserIcon size={22} /></div>
                                                <div className="info-details">
                                                    <div className="info-value">@{displayUser?.username}</div>
                                                    <div className="info-label">Tên người dùng</div>
                                                </div>
                                            </div>

                                            <div className="profile-info-item">
                                                <div className="info-icon"><Cake size={22} /></div>
                                                <div className="info-details">
                                                    <div className="info-value">
                                                        {displayUser?.birthday ? (
                                                            `${formatDate(displayUser.birthday)} (${calculateAge(displayUser.birthday)} tuổi)`
                                                        ) : "N/A"}
                                                    </div>
                                                    <div className="info-label">Ngày sinh</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {isOwnProfile && (
                                            <div className="profile-settings-hint" onClick={() => setMode('EDIT')}>
                                                <span>Click để chỉnh sửa thông tin cá nhân</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {mode === 'EDIT' && (
                                    <motion.div 
                                        key="edit"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="profile-edit-container"
                                    >
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
                                                    <Avatar user={{ ...currentUser, avatar: localPreview } as any} size={100} />
                                                    <div className="avatar-overlay"><Camera size={28} /></div>
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
                                                    <label>Họ tên</label>
                                                    <input 
                                                        type="text" 
                                                        value={fullName} 
                                                        onChange={(e) => setFullName(e.target.value)} 
                                                        placeholder="Họ tên của bạn"
                                                    />
                                                </div>

                                                <div className="edit-input-group">
                                                    <div className="input-wrapper">
                                                        <label>Tiểu sử</label>
                                                        <input 
                                                            type="text" 
                                                            value={bio} 
                                                            onChange={(e) => setBio(e.target.value.slice(0, 70))}
                                                            placeholder="Tiểu sử"
                                                        />
                                                        <span className="char-count">{bio.length}/70</span>
                                                    </div>
                                                    <p className="input-help">Bất kỳ ai cũng có thể thấy thông tin này trong hồ sơ của bạn.</p>
                                                </div>

                                                <div className="edit-input-group">
                                                    <label>Tên người dùng</label>
                                                    <input 
                                                        type="text" 
                                                        value={username} 
                                                        onChange={(e) => setUsername(e.target.value)} 
                                                        placeholder="@username"
                                                    />
                                                </div>

                                                <div className="edit-input-group">
                                                    <label>Ngày sinh</label>
                                                    <input 
                                                        type="date" 
                                                        value={birthday} 
                                                        onChange={(e) => setBirthday(e.target.value)}
                                                    />
                                                </div>

                                                <div className="edit-input-group clickable" onClick={() => setMode('EMAIL_EDIT')}>
                                                    <label>Email</label>
                                                    <div className="input-group-row">
                                                        <input 
                                                            type="text" 
                                                            value={email} 
                                                            readOnly 
                                                            className="input--readonly"
                                                        />
                                                        <div className="edit-chevron">➔</div>
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ProfileModal;
