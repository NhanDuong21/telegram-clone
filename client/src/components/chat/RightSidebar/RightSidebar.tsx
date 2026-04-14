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
} from "lucide-react";
import type { User, Conversation } from "../../../types";
import Avatar from "../../common/Avatar";
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

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-header">
        <div className="header-left">
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <h3>{mode === 'my-profile' ? "Thông tin cá nhân" : "Thông tin"}</h3>
        </div>
      </div>

      <div className="right-sidebar-content">
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
            <div className="info-item">
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
          <div className="shared-item">
            <ImageIcon size={20} className="shared-icon" />
            <span className="shared-label">0 ảnh</span>
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
      </div>
    </div>
  );
};

export default memo(RightSidebar);
