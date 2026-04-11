import { useEffect, useState } from "react";
import { getUserProfileApi } from "../../api/userApi";
import Avatar from "../common/Avatar";

interface UserProfileModalProps {
    userId: string;
    onClose: () => void;
}

const UserProfileModal = ({ userId, onClose }: UserProfileModalProps) => {
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getUserProfileApi(userId);
                setProfileData(res.data);
            } catch (err: any) {
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
        if (diff < 3600000) return `truy cập ${Math.floor(diff / 60000)} phút trước`;
        if (diff < 86400000) return `truy cập ${Math.floor(diff / 3600000)} giờ trước`;
        return `truy cập vào ${date.toLocaleDateString()}`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white dark:bg-[#1c1c1c] p-10 rounded-2xl flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 dark:text-gray-400">Đang tải profile...</span>
                </div>
            </div>
        );
    }

    const { user, sharedMedia, commonGroupsCount } = profileData || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#171717] w-full max-width-[420px] max-h-[90vh] rounded-[24px] overflow-y-auto shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header/Banner Area */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-indigo-600">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors z-10"
                    >
                        ✕
                    </button>
                </div>

                {/* Profile Top Content */}
                <div className="px-6 pb-6 -mt-16 relative">
                    <div className="flex flex-col items-center">
                        <div className="p-1 bg-white dark:bg-[#171717] rounded-full">
                            <Avatar user={user} size={110} />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold dark:text-white">
                            {user.displayName || user.username}
                        </h2>
                        <span className="text-blue-500 text-sm font-medium">
                            {formatLastSeen(user.lastSeen)}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between mt-8 gap-4 px-4">
                        <ActionButton icon={<MessageIcon />} label="Tin nhắn" />
                        <ActionButton icon={<MuteIcon />} label="Tắt thông báo" />
                        <ActionButton icon={<CallIcon />} label="Gọi điện" />
                        <ActionButton icon={<MoreIcon />} label="Thêm" />
                    </div>

                    {/* Info Sections */}
                    <div className="mt-8 space-y-6">
                        {/* Bio/Info */}
                        <div className="space-y-4">
                            <InfoRow label="Tiểu sử" value={user.bio || "Người dùng chưa cài đặt tiểu sử"} />
                            <InfoRow label="Username" value={`@${user.username}`} />
                        </div>

                        <button className="w-full py-3 text-[#3390ec] font-semibold text-center border-t border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                            Thêm vào danh bạ
                        </button>

                        {/* Shared Media Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Ảnh & Link chung</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <MediaCard icon={<PhotosIcon />} count={sharedMedia.photos} label="Ảnh" />
                                <MediaCard icon={<LinksIcon />} count={sharedMedia.links} label="Liên kết" />
                                <MediaCard icon={<FilesIcon />} count={sharedMedia.files || 0} label="Tệp" />
                                <MediaCard icon={<GroupsIcon />} count={commonGroupsCount} label="Nhóm chung" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components for cleaner structure
const ActionButton = ({ icon, label }: { icon: any, label: string }) => (
    <div className="flex flex-col items-center gap-1 cursor-pointer group">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
            {icon}
        </div>
        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{label}</span>
    </div>
);

const InfoRow = ({ label, value }: { label: string, value: string }) => (
    <div className="px-1">
        <div className="text-sm dark:text-gray-200 font-medium">{value}</div>
        <div className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">{label}</div>
    </div>
);

const MediaCard = ({ icon, count, label }: { icon: any, count: number, label: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
        <div className="text-blue-500">{icon}</div>
        <div>
            <div className="text-sm font-bold dark:text-white leading-none">{count}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1">{label}</div>
        </div>
    </div>
);

// SVGs Icons
const MessageIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
const MuteIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500">
        <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
    </svg>
);
const CallIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);
const MoreIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500">
        <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
);
const PhotosIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
);
const LinksIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);
const FilesIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    </svg>
);
const GroupsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export default UserProfileModal;
