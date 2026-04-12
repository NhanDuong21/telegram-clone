import { motion } from "framer-motion";
import {
  X,
  MessageCircle,
  Bell,
  BellOff,
  UserPlus,
  Image as ImageIcon,
  Users,
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
  const displayName = mode === 'my-profile' ? user?.username : (isGroup ? conversation?.name : user?.username);
  const displayStatus = mode === 'my-profile' 
    ? "Online" 
    : (isGroup
      ? `${conversation?.participants.length} thành viên`
      : isOnline
        ? "Online"
        : "Offline");

  return (
    <motion.div
      initial={{ width: 0, x: "20px", opacity: 0 }}
      animate={{ width: "350px", x: 0, opacity: 1 }}
      exit={{ width: 0, x: "20px", opacity: 0 }}
      transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
      className="right-sidebar"
      style={{ overflow: "hidden" }}
    >
      <div style={{ width: "350px" }}>
      <div className="right-sidebar-header">
        <div className="header-left">
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={22} />
          </button>
          <h3>{mode === 'my-profile' ? "Thông tin cá nhân" : "Thông tin"}</h3>
        </div>
      </div>

      <div className="right-sidebar-content">
        <div className="profile-hero">
          <div className="profile-hero-avatar">
            {isGroup ? (
              <div className="large-group-avatar">👥</div>
            ) : (
              <Avatar user={user} size={120} />
            )}
          </div>
          <div className="profile-hero-info">
            <h2>{displayName}</h2>
            <span className={isOnline ? "status-online" : "status-offline"}>
              {displayStatus}
            </span>
          </div>
        </div>

        <div className="quick-actions-row">
          <button className="q-action-item">
            <div className="q-action-icon">
              <MessageCircle size={22} />
            </div>
            <span>{mode === 'my-profile' ? 'Chỉnh sửa' : 'Nhắn tin'}</span>
          </button>
          <button 
            className="q-action-item"
            onClick={() => conversation && onToggleMute?.(conversation._id)}
          >
            <div className="q-action-icon">
              {mode === 'my-profile' ? <Bell size={22} /> : (isMuted ? <Bell size={22} /> : <BellOff size={22} />)}
            </div>
            <span>
              {mode === 'my-profile' 
                ? 'Trạng thái' 
                : (isMuted ? 'Bật âm' : 'Tắt âm')}
            </span>
          </button>
        </div>

        <div className="info-section">
          {!isGroup && (
            <>
              <div className="info-item">
                <div className="info-icon">
                  <UserPlus size={20} />
                </div>
                <div className="info-details">
                  <div className="info-value">{user?.bio || "None"}</div>
                  <div className="info-label">Bio</div>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon" style={{ opacity: 0 }}>
                  <UserPlus size={20} />
                </div>
                <div className="info-details">
                  <div className="info-value">
                    @{user?.username?.toLowerCase() || "username"}
                  </div>
                  <div className="info-label">Tên người dùng</div>
                </div>
              </div>
              {mode === 'my-profile' && (
                  <div className="info-item">
                    <div className="info-icon" style={{ opacity: 0 }}>
                      <UserPlus size={20} />
                    </div>
                    <div className="info-details">
                      <div className="info-value">{user?.phone || "Chưa cập nhật"}</div>
                      <div className="info-label">Số điện thoại</div>
                    </div>
                  </div>
              )}
            </>
          )}
          {isGroup && (
            <div className="info-item">
              <div className="info-icon">
                <ImageIcon size={20} />
              </div>
              <div className="info-details">
                <div className="info-value">Mô tả nhóm này...</div>
                <div className="info-label">Thông tin nhóm</div>
              </div>
            </div>
          )}
        </div>

        <div className="media-tabs-section">
          <div className="media-tab-item">
            <ImageIcon size={20} className="tab-icon" />
            <span className="tab-label">0 ảnh</span>
          </div>

          {!isGroup && mode !== 'my-profile' && (
            <div className="media-tab-item">
              <Users size={20} className="tab-icon" />
              <span className="tab-label">0 nhóm chung</span>
            </div>
          )}
        </div>
      </div>
      </div>
    </motion.div>
  );
};

export default RightSidebar;
