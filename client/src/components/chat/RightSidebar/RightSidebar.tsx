import { memo, useState, useEffect, useRef } from "react";
import {
  X,
  MessageCircle,
  Bell,
  BellOff,
  Image as ImageIcon,
  Users,
  Phone,
  MoreHorizontal,
  Video,
  FileText,
  Music,
  Link as LinkIcon,
  Info,
  ArrowLeft,
  UserMinus,
  Settings,
  LogOut,
  UserPlus,
  Camera
} from "lucide-react";
import { toast } from 'react-hot-toast';
import type { User, Conversation } from "../../../types";
import Avatar from "../../common/Avatar";
import ConfirmModal from "../../common/ConfirmModal";
import ImagePreviewModal from "../ImagePreviewModal/ImagePreviewModal";
import { AnimatePresence } from "framer-motion";
import { connectSocket } from "../../../socket";
import { SOCKET_EVENTS } from "../../../constants/socketEvents";
import { removeFileApi, getSharedMediaApi, removeMemberApi, leaveGroupApi, updateGroupSettingsApi, uploadImageApi } from "../../../api/chatApi";
import EditGroupModal from "../EditGroupModal/EditGroupModal";
import AddMemberModal from "./AddMemberModal";
import "./RightSidebar.css";

interface RightSidebarProps {
  onClose: () => void;
  user: User | null;
  conversation?: Conversation | null;
  isOnline: boolean;
  mode?: 'info' | 'my-profile';
  onToggleMute?: (conversationId: string) => void;
  onlineUsers?: string[];
  currentUserId?: string;
  onGroupUpdated?: (conv: Conversation) => void;
}

const RightSidebar = ({
  onClose,
  user,
  conversation,
  isOnline,
  mode = 'info',
  onToggleMute,
  onlineUsers = [],
  currentUserId,
  onGroupUpdated,
}: RightSidebarProps) => {
  const [view, setView] = useState<'info' | 'photos' | 'videos'>('info');
  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [mediaStats, setMediaStats] = useState({
    image: 0,
    video: 0,
    file: 0,
    link: 0,
    voice: 0
  });
  const [previewData, setPreviewData] = useState<{ url: string, messageId: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmKick, setConfirmKick] = useState<User | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const amIOwner = conversation?.owner === currentUserId;

  useEffect(() => {
    if (conversation?._id) {
      fetchMediaData();
      setView('info'); // Reset view when conversation changes
    }
  }, [conversation?._id]);

  useEffect(() => {
    if (!conversation?._id) return;
    const socket = connectSocket();

    const handleNewMessage = (message: any) => {
      if (String(message.conversationId) !== String(conversation._id)) return;

      if (message.type === 'video' || (message.videoUrl && message.videoUrl.trim() !== "")) {
        const count = (message.videoUrls && message.videoUrls.length > 0) ? message.videoUrls.length : 1;
        setMediaStats(prev => ({ ...prev, video: prev.video + count }));

        if (view === 'videos') {
            const newItems: any[] = [];
            if (message.videoUrls && message.videoUrls.length > 0) {
                message.videoUrls.forEach((url: string) => {
                    newItems.push({ _id: message._id, imageUrl: url, createdAt: message.createdAt, type: 'video' });
                });
            } else {
                newItems.push({ _id: message._id, imageUrl: message.videoUrl, createdAt: message.createdAt, type: 'video' });
            }
            setVideos(prev => [...newItems, ...prev]);
        }
      } else if (message.type === 'image' || (message.imageUrl && message.imageUrl.trim() !== "")) {
        const count = (message.imageUrls && message.imageUrls.length > 0) ? message.imageUrls.length : 1;
        setMediaStats(prev => ({ ...prev, image: prev.image + count }));
        
        // If we are currently viewing photos, add it to the list
        if (view === 'photos') {
            const newItems: any[] = [];
            if (message.imageUrls && message.imageUrls.length > 0) {
                message.imageUrls.forEach((url: string) => {
                    newItems.push({ _id: message._id, imageUrl: url, createdAt: message.createdAt, type: 'image' });
                });
            } else {
                newItems.push({ _id: message._id, imageUrl: message.imageUrl, createdAt: message.createdAt, type: 'image' });
            }
            setPhotos(prev => [...newItems, ...prev]);
        }
      }
    };

    const handleMessageDeleted = ({ conversationId: deletedConvId }: any) => {
        if (String(deletedConvId) === String(conversation._id)) {
            // Since we don't know the type from the socket event directly, 
            // we'll re-fetch stats to ensure accuracy if something was deleted.
            // Alternatively, we could check if it was in our 'photos' list.
            fetchMediaData();
        }
    };

    const handleMessageUpdated = (updatedMsg: any) => {
        if (String(updatedMsg.conversationId) === String(conversation._id)) {
            fetchMediaData();
        }
    };

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    };
  }, [conversation?._id, view]);

  const fetchMediaData = async (type: string = 'image') => {
    if (!conversation?._id) return;
    try {
      const res = await getSharedMediaApi(conversation._id, type);
      if (type === 'image') setPhotos(res.data.media);
      if (type === 'video') setVideos(res.data.media);
      
      if ((res.data as any).stats) {
        setMediaStats((res.data as any).stats);
      }
    } catch (error) {
      console.error("Fetch shared media failed:", error);
    }
  };

  useEffect(() => {
    if (view === 'videos') {
      fetchMediaData('video');
    } else if (view === 'photos') {
      fetchMediaData('image');
    }
  }, [view]);

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDeletePhoto = async () => {
    if (!previewData || !conversation?._id) return;
    setConfirmDeletePhoto(true);
  };

  const executeDeletePhoto = async () => {
    setConfirmDeletePhoto(false);
    if (!previewData) return;
    try {
      await removeFileApi(previewData.messageId, previewData.url);
      setPreviewData(null);
    } catch (error) {
      console.error("Delete photo failed:", error);
      toast.error("Không thể xóa ảnh.");
    }
  };

  const executeLeaveGroup = async () => {
    setConfirmLeave(false);
    if (!conversation) return;
    try {
      await leaveGroupApi(conversation._id);
      toast.success('Đã rời nhóm');
      onClose();
    } catch (err) {
      console.error('Leave group failed:', err);
      toast.error('Không thể rời nhóm');
    }
  };

  const executeKickMember = async () => {
    if (!confirmKick || !conversation) return;
    const member = confirmKick;
    setConfirmKick(null);
    try {
      const res = await removeMemberApi(conversation._id, member._id);
      onGroupUpdated?.(res.data.conversation);
      toast.success(`Đã kick ${member.fullName || member.username}`);
    } catch (err) {
      console.error('Kick failed:', err);
      toast.error('Không thể kick thành viên');
    }
  };

  if (mode === 'info' && !conversation) return null;

  const isGroup = conversation?.isGroup || false;
  const isMuted = conversation?.isMuted || false;
  const statusText = mode === 'my-profile' 
    ? "Online" 
    : (isGroup
      ? `${conversation?.participants.length} thành viên`
      : isOnline
        ? "Online"
        : "Offline");

  const renderHeader = () => {
    if (view === 'photos' || view === 'videos') {
      return (
        <div className="right-sidebar-header">
          <div className="header-left">
            <button className="sidebar-close-btn" onClick={() => setView('info')}>
              <ArrowLeft size={20} />
            </button>
            <h3>{view === 'photos' ? 'Ảnh' : 'Video'}</h3>
          </div>
        </div>
      );
    }

    return (
      <div className="right-sidebar-header">
        <div className="header-left">
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <h3>{mode === 'my-profile' ? "Thông tin cá nhân" : "Thông tin"}</h3>
        </div>
      </div>
    );
  };

  return (
    <div className="right-sidebar">
      {renderHeader()}

      <div className="right-sidebar-content">
        {view === 'info' && isGroup && conversation && (
          <div key="group-info">
            {/* UNIFIED Header: Same as 1-on-1 */}
            <div className="profile-hero">
              <div className="profile-hero-avatar" style={{ position: 'relative' }}>
                <Avatar 
                  conversation={conversation} 
                  size={96} 
                />
                {amIOwner && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      ref={avatarInputRef}
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadImageApi(file);
                          const newUrl = res.data.imageUrl;
                          const updateRes = await updateGroupSettingsApi(conversation._id, { imageUrl: newUrl });
                          onGroupUpdated?.(updateRes.data.conversation);
                          toast.success('Đã cập nhật avatar nhóm');
                        } catch (err) {
                          console.error('Avatar upload failed:', err);
                          toast.error('Không thể tải ảnh lên');
                        }
                      }}
                    />
                    <button
                      className="group-avatar-camera-btn"
                      onClick={() => avatarInputRef.current?.click()}
                      title="Đổi ảnh nhóm"
                    >
                      <Camera size={18} />
                    </button>
                  </>
                )}
              </div>
              <div className="profile-hero-info">
                <h2>{conversation.name}</h2>
                <div className="status-offline">
                  {conversation.participants?.length || 0} thành viên
                </div>
              </div>
            </div>

            {/* UNIFIED Action Buttons: Same circular style as 1-on-1 */}
            <div className="quick-actions-row">
              <button
                className="q-action-item"
                onClick={() => onToggleMute?.(conversation._id)}
              >
                <div className="q-action-icon">
                  {isMuted ? <BellOff size={22} /> : <Bell size={22} />}
                </div>
                <span>{isMuted ? 'Bật âm' : 'Tắt âm'}</span>
              </button>
              
              <button 
                className="q-action-item"
                onClick={() => setIsEditModalOpen(true)}
              >
                <div className="q-action-icon">
                  <Settings size={22} />
                </div>
                <span>Quản lý</span>
              </button>

              <button
                className="q-action-item q-action-item--danger"
                onClick={() => setConfirmLeave(true)}
              >
                <div className="q-action-icon">
                  <LogOut size={22} />
                </div>
                <span>Rời khỏi</span>
              </button>
            </div>

            {/* UNIFIED Media Stats: Same as 1-on-1 */}
            <div className="shared-content-section">
              <div className="shared-item" onClick={() => setView('photos')} style={{ cursor: 'pointer' }}>
                <ImageIcon size={20} className="shared-icon" />
                <span className="shared-label">{mediaStats.image || 0} ảnh</span>
              </div>
              <div className="shared-item" onClick={() => setView('videos')} style={{ cursor: 'pointer' }}>
                <Video size={20} className="shared-icon" />
                <span className="shared-label">{mediaStats.video || 0} video</span>
              </div>
              <div className="shared-item">
                <FileText size={20} className="shared-icon" />
                <span className="shared-label">{mediaStats.file || 0} tệp tin</span>
              </div>
              <div className="shared-item">
                <Music size={20} className="shared-icon" />
                <span className="shared-label">{mediaStats.voice || 0} file âm thanh</span>
              </div>
              <div className="shared-item">
                <LinkIcon size={20} className="shared-icon" />
                <span className="shared-label">{mediaStats.link || 0} liên kết</span>
              </div>
            </div>

            {/* Members Section (Group only) */}
            <div className="members-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="members-section-title">
                {conversation.participants.length} thành viên
              </span>
              <button 
                className="members-add-btn"
                onClick={() => setIsAddMemberOpen(true)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  color: '#3390ec',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(51, 144, 236, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Thêm thành viên"
              >
                <UserPlus size={18} />
              </button>
            </div>

            <div className="members-list">
              {conversation.participants.map((p: User) => {
                const isMemberOnline = onlineUsers.includes(p._id);
                const isOwner = conversation.owner === p._id;
                const isCurrentUser = p._id === currentUserId;
                const amIOwner = conversation.owner === currentUserId;

                return (
                  <div key={p._id} className="member-row">
                    <div className="member-avatar">
                      <Avatar user={p} size={42} />
                    </div>
                    
                    <div className="member-info">
                      <span className="member-name">
                        {p.fullName || p.username}
                        {isCurrentUser && <span className="member-name-you">(Bạn)</span>}
                      </span>
                      <span className={`member-status ${isMemberOnline ? 'member-status--online' : 'member-status--offline'}`}>
                        {isMemberOnline ? 'đang hoạt động' : 'ngoại tuyến'}
                      </span>
                    </div>
                    
                    <div className="member-actions">
                      {isOwner && (
                        <span className="admin-badge">admin</span>
                      )}
                      
                      {amIOwner && !isCurrentUser && (
                        <button
                          className="kick-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmKick(p);
                          }}
                          title="Kick thành viên"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'info' && (!isGroup || !conversation) && (
          <div key="personal-info">
            {/* 1-on-1: UNIFIED Header */}
            <div className="profile-hero">
              <div className="profile-hero-avatar">
                <Avatar 
                  user={user} 
                  size={128} 
                  className="w-32 h-32 aspect-square rounded-full object-cover" 
                />
              </div>
              <div className="profile-hero-info">
                <h2>{mode === 'my-profile' ? (user?.fullName || user?.username) : (user?.fullName || user?.username)}</h2>
                <p className={isOnline ? "status-online" : "status-offline"}>{statusText}</p>
              </div>
            </div>

            {/* 1-on-1: UNIFIED Action Buttons */}
            <div className="quick-actions-row">
              <button className="q-action-item">
                <div className="q-action-icon">
                  <MessageCircle size={22} />
                </div>
                <span>Nhắn tin</span>
              </button>
              <button 
                className="q-action-item"
                onClick={() => conversation && onToggleMute?.(conversation._id)}
              >
                <div className="q-action-icon">
                  {isMuted ? <Bell size={22} /> : <BellOff size={22} />}
                </div>
                <span>{isMuted ? 'Bật âm' : 'Tắt âm'}</span>
              </button>
              <button className="q-action-item">
                <div className="q-action-icon">
                  <Phone size={22} />
                </div>
                <span>Gọi điện</span>
              </button>
              <button className="q-action-item">
                <div className="q-action-icon">
                  <MoreHorizontal size={22} />
                </div>
                <span>Thêm</span>
              </button>
            </div>

            {/* 1-on-1: Info Section */}
            <div className="info-section">
              {user?.bio && (
                <div className="info-item">
                  <div className="info-icon">
                    <Info size={20} />
                  </div>
                  <div className="info-details">
                    <div className="info-value">{user?.bio}</div>
                    <div className="info-label">Tiểu sử</div>
                  </div>
                </div>
              )}
              <div className="info-item" onClick={() => {
                const val = `@${user?.username}`;
                navigator.clipboard.writeText(val);
                toast.success(`Đã sao chép ${val}`);
              }} style={{ cursor: 'pointer' }}>
                <div className="info-icon">
                  <UserPlus size={20} />
                </div>
                <div className="info-details">
                  <div className="info-value">@{user?.username?.toLowerCase() || "username"}</div>
                  <div className="info-label">Tên người dùng</div>
                </div>
              </div>
              {mode === 'my-profile' && (
                <div className="info-item">
                  <div className="info-icon">
                    <UserPlus size={20} />
                  </div>
                  <div className="info-details">
                    <div className="info-value">{user?.email || "Chưa cập nhật"}</div>
                    <div className="info-label">Email</div>
                  </div>
                </div>
              )}
            </div>

            {/* 1-on-1: UNIFIED Media Stats */}
            <div className="shared-content-section">
              <div className="shared-item" onClick={() => setView('photos')} style={{ cursor: 'pointer' }}>
                <ImageIcon size={20} className="shared-icon" />
                <span className="shared-label">{mediaStats.image} ảnh</span>
              </div>
              <div className="shared-item" onClick={() => setView('videos')} style={{ cursor: 'pointer' }}>
                <Video size={20} className="shared-icon" />
                <span className="shared-label">{mediaStats.video} video</span>
              </div>
              <div className="shared-item">
                <FileText size={20} className="shared-icon" />
                <span className="shared-label">{mediaStats.file} tệp tin</span>
              </div>
              <div className="shared-item">
                <Music size={20} className="shared-icon" />
                <span className="shared-label">{mediaStats.voice} nhạc</span>
              </div>
              <div className="shared-item">
                <LinkIcon size={20} className="shared-icon" />
                <span className="shared-label">{mediaStats.link} liên kết</span>
              </div>
              <div className="shared-item">
                <Users size={20} className="shared-icon" />
                <span className="shared-label">0 nhóm chung</span>
              </div>
            </div>
          </div>
        )}

        {view === 'photos' && (
          <div key="photo-gallery" className="shared-media-grid">
            {photos.length === 0 ? (
              <div className="empty-media">
                <p>Chưa có ảnh nào được chia sẻ</p>
              </div>
            ) : (
              <div className="photo-grid">
                {photos.map((msg, idx) => (
                  <div 
                    key={msg._id || idx} 
                    className="photo-grid-item"
                    onClick={() => setPreviewData({ url: msg.imageUrl, messageId: msg._id })}
                  >
                    <img src={msg.imageUrl} alt="Shared" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'videos' && (
          <div key="video-gallery" className="shared-media-grid">
            {videos.length === 0 ? (
              <div className="empty-media">
                <p>Chưa có video nào được chia sẻ</p>
              </div>
            ) : (
              <div className="photo-grid">
                {videos.map((msg, idx) => (
                  <div 
                    key={msg._id || idx} 
                    className="photo-grid-item video-grid-item"
                    onClick={() => setPreviewData({ url: msg.imageUrl, messageId: msg._id })}
                  >
                    <video src={msg.imageUrl} muted />
                    <div className="video-duration-badge">
                      {formatDuration(msg.duration)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewData && (
          <ImagePreviewModal 
            imageUrl={previewData.url}
            onClose={() => setPreviewData(null)}
            onDelete={handleDeletePhoto}
          />
        )}
      </AnimatePresence>

      {isEditModalOpen && isGroup && conversation && (
        <EditGroupModal 
          conversation={conversation}
          currentUserId={currentUserId || ''}
          onClose={() => setIsEditModalOpen(false)}
          onGroupUpdated={(updated) => {
             onGroupUpdated?.(updated);
          }}
        />
      )}
      {isAddMemberOpen && isGroup && conversation && (
        <AddMemberModal
          conversation={conversation}
          onClose={() => setIsAddMemberOpen(false)}
          onMembersAdded={() => {
            // Can be handled by socket or callback
            setIsAddMemberOpen(false);
          }}
        />
      )}

      {confirmDeletePhoto && (
        <ConfirmModal
          title="Xóa ảnh"
          message="Bạn có chắc muốn xóa ảnh này khỏi cuộc trò chuyện?"
          confirmLabel="Xóa"
          isDanger
          onConfirm={executeDeletePhoto}
          onCancel={() => setConfirmDeletePhoto(false)}
        />
      )}

      {confirmLeave && (
        <ConfirmModal
          title="Rời nhóm"
          message="Bạn có chắc chắn muốn rời khỏi nhóm này?"
          confirmLabel="Rời nhóm"
          isDanger
          onConfirm={executeLeaveGroup}
          onCancel={() => setConfirmLeave(false)}
        />
      )}

      {confirmKick && (
        <ConfirmModal
          title="Kick thành viên"
          message={`Bạn có chắc muốn kick ${confirmKick.fullName || confirmKick.username} khỏi nhóm?`}
          confirmLabel="Kick"
          isDanger
          onConfirm={executeKickMember}
          onCancel={() => setConfirmKick(null)}
        />
      )}
    </div>
  );
};

export default memo(RightSidebar);
