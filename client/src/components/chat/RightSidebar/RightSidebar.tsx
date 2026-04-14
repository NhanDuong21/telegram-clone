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
  const [view, setView] = useState<'info' | 'photos'>('info');
  const [photos, setPhotos] = useState<any[]>([]);
  const [photosCount, setPhotosCount] = useState(0);
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
      const isImage = message.type === 'image' || (message.imageUrl && message.imageUrl.trim() !== "");
      if (String(message.conversationId) === String(conversation._id) && isImage) {
        setPhotosCount(prev => prev + 1);
        setPhotos(prev => [{ _id: message._id, imageUrl: message.imageUrl, createdAt: message.createdAt }, ...prev]);
      }
    };

    const handleMessageDeleted = ({ messageId, conversationId: deletedConvId }: any) => {
        if (String(deletedConvId) === String(conversation._id)) {
            setPhotos(prev => {
                const affectedImages = prev.filter(p => p._id === messageId);
                if (affectedImages.length > 0) {
                    setPhotosCount(c => Math.max(0, c - affectedImages.length));
                    return prev.filter(p => p._id !== messageId);
                }
                return prev;
            });
        }
    };

    const handleMessageUpdated = (updatedMsg: any) => {
        if (String(updatedMsg.conversationId) === String(conversation._id)) {
            setPhotos(prev => {
                const oldImagesCount = prev.filter(p => p._id === updatedMsg._id).length;
                const remaining = prev.filter(p => p._id !== updatedMsg._id);
                
                const newImages: any[] = [];
                if (updatedMsg.imageUrls && updatedMsg.imageUrls.length > 0) {
                    updatedMsg.imageUrls.forEach((url: string) => {
                        newImages.push({ _id: updatedMsg._id, imageUrl: url, createdAt: updatedMsg.createdAt });
                    });
                } else if (updatedMsg.imageUrl) {
                    newImages.push({ _id: updatedMsg._id, imageUrl: updatedMsg.imageUrl, createdAt: updatedMsg.createdAt });
                }

                setPhotosCount(c => Math.max(0, c - oldImagesCount + newImages.length));
                return [...newImages, ...remaining].sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            });
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
  }, [conversation?._id]);

  const fetchMediaData = async () => {
    if (!conversation?._id) return;
    try {
      const res = await getSharedMediaApi(conversation._id, 'image');
      setPhotos(res.data.media);
      setPhotosCount(res.data.totalCount);
    } catch (error) {
      console.error("Fetch shared media failed:", error);
    }
  };

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
    if (view === 'photos') {
      return (
        <div className="right-sidebar-header">
          <div className="header-left">
            <button className="sidebar-close-btn" onClick={() => setView('info')}>
              <ArrowLeft size={20} />
            </button>
            <h3>Ảnh</h3>
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
                <span className="shared-label">{photosCount} ảnh</span>
              </div>
              <div className="shared-item">
                <Video size={20} className="shared-icon" />
                <span className="shared-label">0 video</span>
              </div>
              <div className="shared-item">
                <FileText size={20} className="shared-icon" />
                <span className="shared-label">0 tệp tin</span>
              </div>
              <div className="shared-item">
                <Music size={20} className="shared-icon" />
                <span className="shared-label">0 nhạc</span>
              </div>
              <div className="shared-item">
                <LinkIcon size={20} className="shared-icon" />
                <span className="shared-label">0 liên kết</span>
              </div>
              {!isGroup && (
                <div className="shared-item">
                  <Users size={20} className="shared-icon" />
                  <span className="shared-label">0 nhóm chung</span>
                </div>
              )}
            </div>
          </>
        ) : (
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
