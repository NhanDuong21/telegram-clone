import { motion, AnimatePresence } from "framer-motion";
import { 
    User, Users, Megaphone, Contact, Phone, 
    Bookmark, Settings, Moon, LogOut
} from "lucide-react";
import type { User as UserType } from "../../../types/chat";
import Avatar from "../../common/Avatar";
import { useTheme } from "../../../context/ThemeContext";
import "./DrawerMenu.css";

interface DrawerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserType | null;
    onLogout: () => void;
}

const DrawerMenu = ({ isOpen, onClose, user, onLogout }: DrawerMenuProps) => {
    const { isDarkMode, toggleTheme } = useTheme();

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
                            <div className="drawer-user-info">
                                <Avatar user={user} size={64} />
                                <div className="user-details-wrapper">
                                    <div className="user-name-row">
                                        <span className="drawer-user-name">{user?.username || "Người dùng"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="drawer-content">
                            <div className="menu-item-group">
                                <button className="menu-item">
                                    <User size={22} className="menu-icon" />
                                    <span>Trang cá nhân</span>
                                </button>
                                <button className="menu-item">
                                    <Users size={22} className="menu-icon" />
                                    <span>Nhóm mới</span>
                                </button>
                                <button className="menu-item">
                                    <Megaphone size={22} className="menu-icon" />
                                    <span>Kênh mới</span>
                                </button>
                                <button className="menu-item">
                                    <Contact size={22} className="menu-icon" />
                                    <span>Danh bạ</span>
                                </button>
                                <button className="menu-item">
                                    <Phone size={22} className="menu-icon" />
                                    <span>Cuộc gọi</span>
                                </button>
                                <button className="menu-item">
                                    <Bookmark size={22} className="menu-icon" />
                                    <span>Tin nhắn đã lưu</span>
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
                                        <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                                        <span className="toggle-slider" />
                                    </label>
                                </div>
                            </div>

                            <button className="menu-item menu-item--logout" onClick={onLogout}>
                                <LogOut size={22} className="menu-icon" />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DrawerMenu;
