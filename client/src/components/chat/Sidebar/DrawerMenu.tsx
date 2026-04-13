import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Users,
  Megaphone,
  Contact,
  Phone,
  Bookmark,
  Settings,
  Moon,
  LogOut,
} from "lucide-react";
import type { User as UserType } from "../../../types/chat";
import Avatar from "../../common/Avatar";
import { useTheme } from "../../../context/ThemeContext";
import ConfirmModal from "../Modals/ConfirmModal";
import { useState } from "react";
import "./DrawerMenu.css";

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onLogout: () => void;
  onOpenMyProfile: () => void;
}

const DrawerMenu = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onOpenMyProfile,
}: DrawerMenuProps) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="drawer-overlay"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="drawer-menu"
          >
            <div className="drawer-header">
              <div className="drawer-avatar-wrapper">
                <Avatar user={user} size={80} />
              </div>
              <div className="drawer-user-info-centered">
                <h3 className="drawer-name">{user?.displayName || user?.username || "Người dùng"}</h3>
                <p className="drawer-username">@{user?.username || "username"}</p>
              </div>
            </div>

            <div className="drawer-content">
              <div className="menu-item-group">
                <button
                  className="menu-item"
                  onClick={() => {
                    onOpenMyProfile();
                    onClose();
                  }}
                >
                  <User size={22} className="menu-icon" />
                  <span>Trang cá nhân</span>
                </button>
                <button className="menu-item">
                  <Users size={22} className="menu-icon" />
                  <span>Nhóm mới</span>
                </button>
                <button className="menu-item">
                  <Settings size={22} className="menu-icon" />
                  <span>Cài đặt</span>
                </button>
              </div>

              <div className="menu-divider" />

              <div className="menu-item-group">
                <div className="menu-item menu-item--toggle">
                  <div className="item-left">
                    <Moon size={22} className="menu-icon" />
                    <span>Chế độ ban đêm</span>
                  </div>
                  <label className="theme-toggle">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={toggleTheme}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              <button
                className="menu-item menu-item--logout"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut size={22} className="menu-icon" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </motion.div>

          <ConfirmModal 
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={onLogout}
            title="Đăng xuất"
            description="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?"
            confirmText="Đăng xuất"
            cancelText="Hủy"
            isDanger={true}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default DrawerMenu;
