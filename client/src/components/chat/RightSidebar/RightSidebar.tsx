import { memo } from "react";
import {
  X,
  MessageCircle,
  Bell,
  BellOff,
  UserPlus,
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from 'react-hot-toast';
import type { User, Conversation } from "../../../types";
import Avatar from "../../common/Avatar";
import ImagePreviewModal from "../ImagePreviewModal/ImagePreviewModal";
import { AnimatePresence } from "framer-motion";
import { connectSocket } from "../../../socket";
import { SOCKET_EVENTS } from "../../../constants/socketEvents";
import { removeFileApi, getSharedMediaApi } from "../../../api/chatApi";
import "./RightSidebar.css";

interface RightSidebarProps {
  onClose: () => void;
  user: User | null;
  conversation?: Conversation | null;
  isOnline: boolean;
  mode?: 'info' | 'my-profile';
  onToggleMute?: (conversationId: string) => void;
}

const RightSidebar = ({
  onClose,
  user,
  conversation,
  isOnline,
  mode = 'info',
  onToggleMute,
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

  const handleDeletePhoto = async () => {
    if (!previewData || !conversation?._id) return;
    
    if (window.confirm("Bạn có chắc muốn xóa ảnh này khỏi cuộc trò chuyện?")) {
        try {
            await removeFileApi(previewData.messageId, previewData.url);
            setPreviewData(null);
            // State will be updated via socket listener fetchMediaData
        } catch (error) {
            console.error("Delete photo failed:", error);
            alert("Không thể xóa ảnh.");
        }
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
        {view === 'info' ? (
          <>
            <div className="profile-hero">
              <div className="profile-hero-avatar">
                {isGroup ? (
                  <div className="large-group-avatar">
                    {conversation?.imageUrl ? (
                      <img src={conversation.imageUrl} alt={conversation.name} />
                    ) : (
                      "👥"
                    )}
                  </div>
                ) : (
                  <Avatar user={user} size={120} />
                )}
              </div>
              <div className="profile-hero-info">
                <h2>{mode === 'my-profile' ? (user?.fullName || user?.username) : (isGroup ? conversation?.name : (user?.fullName || user?.username))}</h2>
                <p className={isOnline ? "status-online" : "status-offline"}>{statusText}</p>
              </div>
            </div>

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

            <div className="info-section">
              {(!isGroup && user?.bio) && (
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
              {!isGroup && (
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
              )}
              {isGroup && conversation?.description && (
                <div className="info-item">
                  <div className="info-icon">
                    <Info size={20} />
                  </div>
                  <div className="info-details">
                    <div className="info-value">{conversation.description}</div>
                    <div className="info-label">Mô tả nhóm</div>
                  </div>
                </div>
              )}
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
              {!isGroup && (
                <div className="shared-item">
                  <Users size={20} className="shared-icon" />
                  <span className="shared-label">0 nhóm chung</span>
                </div>
              )}
            </div>
          </>
        ) : view === 'photos' ? (
            <div className="shared-media-grid">
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
           ) : (
            <div className="shared-media-grid">
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
                      <div className="video-overlay">
                        <Video size={24} fill="white" color="white" />
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
    </div>
  );
};

export default memo(RightSidebar);
