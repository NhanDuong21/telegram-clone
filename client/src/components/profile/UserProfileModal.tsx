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
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
        if (diff < 86400000) return `truy cập ${Math.floor(diff / 3600000)} giờ trước`;
        return `truy cập vào ${date.toLocaleDateString()}`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#1c242f] p-8 rounded-2xl flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-3 border-[#3390ec] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400 text-sm font-medium">Đang tải profile...</span>
                </div>
            </div>
        );
    }

    const { user, sharedMedia, commonGroupsCount } = profileData || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div 
                className="bg-[#1c242f] w-full max-w-[400px] rounded-[18px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
                style={{ transformOrigin: 'center' }}
            >
                {/* Header with Close Button */}
                <div className="flex justify-end p-4 absolute top-0 right-0 z-10">
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-white/5 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Profile Top Content */}
                <div className="flex flex-col items-center pt-10 pb-6 px-6 border-b border-white/5">
                    <div className="p-0.5 bg-gradient-to-tr from-[#3390ec] to-teal-400 rounded-full">
                        <div className="p-1 bg-[#1c242f] rounded-full">
                            <Avatar user={user} size={120} />
                        </div>
                    </div>
                    <h2 className="mt-5 text-[22px] font-bold text-white tracking-tight">
                        {user.displayName || user.username}
                    </h2>
                    <span className="text-[#3390ec] text-[13px] font-medium mt-1">
                        {formatLastSeen(user.lastSeen)}
                    </span>

                    {/* Action Circle Buttons */}
                    <div className="flex justify-center gap-6 mt-8 w-full">
                        <ActionButton icon={<MessageIcon />} label="Nhắn tin" primary />
                        <ActionButton icon={<MuteIcon />} label="Tắt âm" />
                        <ActionButton icon={<CallIcon />} label="Gọi" />
                        <ActionButton icon={<MoreIcon />} label="Thêm" />
                    </div>
                </div>

                {/* Main Info Area */}
                <div className="p-6 space-y-7">
                    {/* User Info Rows */}
                    <div className="space-y-6">
                        <InfoSection icon={<BioIcon />} label="Tiểu sử" value={user.bio || "Người dùng chưa cài đặt tiểu sử"} />
                        
                        <div className="flex items-center justify-between group cursor-pointer">
                            <div className="flex gap-4">
                                <div className="text-teal-400 mt-0.5"><UserIcon /></div>
                                <div>
                                    <div className="text-[14px] text-teal-400 font-semibold">@{user.username}</div>
                                    <div className="text-[12px] text-gray-400 mt-0.5">Username</div>
                                </div>
                            </div>
                            <div className="text-teal-500/50 group-hover:text-teal-400 transition-colors">
                                <QRIcon />
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-2.5 text-teal-400 font-bold text-[13px] tracking-wide text-center border border-teal-500/20 rounded-xl hover:bg-teal-500/10 transition-colors uppercase">
                        Thêm vào danh bạ
                    </button>

                    {/* Shared Content List (Telegram Style) */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[1.5px] px-1">Nội dung chung</h3>
                        <div className="space-y-1">
                            <SharedItem icon={<PhotosIcon />} label="Ảnh" count={sharedMedia.photos} />
                            <SharedItem icon={<LinksIcon />} label="Liên kết" count={sharedMedia.links} />
                            <SharedItem icon={<FilesIcon />} label="Tệp" count={sharedMedia.files || 0} />
                            <SharedItem icon={<GroupsIcon />} label="Nhóm chung" count={commonGroupsCount} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---

const ActionButton = ({ icon, label, primary }: { icon: any, label: string, primary?: boolean }) => (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
        <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 
            ${primary ? 'bg-[#3390ec] text-white hover:bg-[#2b7bc9]' : 'bg-[#242f3d] text-gray-400 hover:bg-[#2c394a] hover:text-white'}`}>
            {icon}
        </div>
        <span className="text-[11px] text-gray-400 group-hover:text-gray-300 font-semibold">{label}</span>
    </div>
);

const InfoSection = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex gap-4">
        <div className="text-gray-400 mt-0.5">{icon}</div>
        <div>
            <div className="text-[14px] text-white font-medium leading-normal">{value}</div>
            <div className="text-[12px] text-gray-400 mt-1 uppercase tracking-wider text-[10px] font-bold">{label}</div>
        </div>
    </div>
);

const SharedItem = ({ icon, label, count }: { icon: any, label: string, count: number }) => (
    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
        <div className="flex items-center gap-4">
            <div className="text-gray-500 group-hover:text-[#3390ec] transition-colors">{icon}</div>
            <span className="text-[14px] text-gray-300 group-hover:text-white transition-colors">{label}</span>
        </div>
        <span className="text-[13px] font-bold text-gray-500 group-hover:text-[#3390ec]">{count || 0}</span>
    </div>
);

// --- SVG Icons (Styled for Dark Theme) ---

const MessageIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const MuteIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></svg>;
const CallIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const MoreIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
const BioIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const QRIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M7 7h.01M17 7h.01M17 17h.01M7 17h.01" /></svg>;
const PhotosIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
const LinksIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
const FilesIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>;
const GroupsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;

export default UserProfileModal;
