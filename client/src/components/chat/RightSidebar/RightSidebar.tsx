import { motion } from "framer-motion";
import {
  X,
  MessageCircle,
  Bell,
  Gift,
  UserPlus,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Link as LinkIcon,
  Users,
} from "lucide-react";
import type { User, Conversation } from "../../../types";
import Avatar from "../../common/Avatar";
import "./RightSidebar.css";

interface RightSidebarProps {
  onClose: () => void;
  user: User | null;
  conversation: Conversation | null;
  isOnline: boolean;
}

const RightSidebar = ({
  onClose,
  user,
  conversation,
  isOnline,
}: RightSidebarProps) => {
  if (!conversation) return null;

  const isGroup = conversation.isGroup;
  const displayName = isGroup ? conversation.name : user?.username;
  const displayStatus = isGroup
    ? `${conversation.participants.length} thành viên`
    : isOnline
      ? "Online"
      : "Offline";

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="right-sidebar"
    >
      <div className="right-sidebar-header">
        <div className="header-left">
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={22} />
          </button>
          <h3>Thông tin</h3>
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
            <span>Nhắn tin</span>
          </button>
          <button className="q-action-item">
            <div className="q-action-icon">
              <Bell size={22} />
            </div>
            <span>Tắt âm</span>
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
                  <div className="info-value">None</div>
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
            <span className="tab-label">53 ảnh</span>
          </div>

          {!isGroup && (
            <div className="media-tab-item">
              <Users size={20} className="tab-icon" />
              <span className="tab-label">2 nhóm chung</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RightSidebar;
