import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getUserProfileApi } from "../../../api/userApi";
import Avatar from "../../common/Avatar";
import type { User } from "../../../types";
import './UserProfileModal.css';

interface UserProfileModalProps {
    userId: string;
    onClose: () => void;
}

const UserProfileModal = ({ userId, onClose }: UserProfileModalProps) => {
    const [profileData, setProfileData] = useState<{ user: User } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getUserProfileApi(userId);
                setProfileData(res.data);
            } catch (err: unknown) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    const formatLastSeen = (dateStr?: string) => {
        if (!dateStr) return "Sống ẩn dật";
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        if (diff < 60000) return "vừa mới truy cập";
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
        if (diff < 86400000) return `truy cập ${Math.floor(diff / 3600000)} giờ trước`;
        return `truy cập vào ${date.toLocaleDateString()}`;
    };

    if (loading || !profileData) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="profile-overlay"
            >
                <div className="loading-modal">
                    {loading ? (
                        <>
                            <div className="spinner"></div>
                            <span className="text-gray-400 text-sm font-medium">Đang tải profile...</span>
                        </>
                    ) : (
                        <span className="text-red-400 text-sm font-medium">Không thể tải profile</span>
                    )}
                </div>
            </motion.div>
        );
    }

    const { user } = profileData;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="profile-overlay" 
            onClick={onClose}
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="profile-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="profile-modal__close-container">
                    <button onClick={onClose} className="profile-modal__close-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="profile-top">
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar-inner">
                            <Avatar user={user} size={120} />
                        </div>
                    </div>
                    <h2 className="profile-name">
                        {user?.fullName || user?.username || "Unknown"}
                    </h2>
                    <span className="profile-status">
                        {formatLastSeen(user?.lastSeen)}
                    </span>

                    <div className="profile-actions">
                        <ActionButton icon={<MessageIcon />} label="Nhắn tin" primary />
                        <ActionButton icon={<MuteIcon />} label="Tắt âm" />
                        <ActionButton icon={<CallIcon />} label="Gọi" />
                        <ActionButton icon={<MoreIcon />} label="Thêm" />
                    </div>
                </div>

                <div className="profile-body">
                    <div className="profile-info-section">
                        <InfoSection icon={<BioIcon />} label="Tiểu sử" value={user?.bio || "Người dùng chưa cài đặt tiểu sử"} />
                        
                        <div className="username-row group">
                            <div className="flex gap-4">
                                <div className="text-teal-400 mt-0.5"><UserIcon /></div>
                                <div>
                                    <div className="username-row__text">@{user?.username}</div>
                                    <div className="text-[12px] text-gray-400 mt-0.5">Username</div>
                                </div>
                            </div>
                            <div className="qr-icon">
                                <QRIcon />
                            </div>
                        </div>
                    </div>

                    <button className="add-contact-btn">
                        Thêm vào danh bạ
                    </button>

                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Helper Components ---

const ActionButton = ({ icon, label, primary }: { icon: React.ReactNode, label: string, primary?: boolean }) => (
    <div className="action-btn group">
        <div className={`action-btn__icon-box ${primary ? 'action-btn__icon-box--primary' : ''}`}>
            {icon}
        </div>
        <span className="action-btn__label">{label}</span>
    </div>
);

const InfoSection = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="info-row">
        <div className="info-row__icon">{icon}</div>
        <div className="info-row__content">
            <div className="info-row__value">{value}</div>
            <div className="info-row__label">{label}</div>
        </div>
    </div>
);

// --- SVG Icons ---

const MessageIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const MuteIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></svg>;
const CallIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const MoreIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
const BioIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const QRIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M7 7h.01M17 7h.01M17 17h.01M7 17h.01" /></svg>;

export default UserProfileModal;
