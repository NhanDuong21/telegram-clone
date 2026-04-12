import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    BellOff, 
    Eraser, 
    Trash2,
    ChevronRight
} from "lucide-react";
import "./HeaderMenu.css";

interface HeaderMenuProps {
    isOpen: boolean;
    onClose: () => void;
    isGroup: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
    onDeleteChat: () => void;
    onClearChat: () => void;
    onSettingsClick?: () => void;
}

const HeaderMenu = ({ 
    isOpen, 
    onClose, 
    isGroup, 
    isMuted, 
    onToggleMute, 
    onDeleteChat, 
    onClearChat, 
    onSettingsClick 
}: HeaderMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="header-dropdown-menu"
                >
                    <button className="header-menu-item" onClick={() => { onToggleMute(); onClose(); }}>
                        <div className="item-content">
                            <BellOff size={18} />
                            <span>{isMuted ? "Bật thông báo" : "Tắt thông báo"}</span>
                        </div>
                        <ChevronRight size={16} className="chevron-right" />
                    </button>

                    <div className="header-menu-divider" />       
                    
                    {isGroup && onSettingsClick && (
                         <button className="header-menu-item" onClick={() => { onSettingsClick(); onClose(); }}>
                            <div className="item-content">
                                <Eraser size={18} />
                                <span>Cài đặt nhóm</span>
                            </div>
                        </button>
                    )}

                    <button className="header-menu-item" onClick={() => { onClearChat(); onClose(); }}>
                        <div className="item-content">
                            <Eraser size={18} />
                            <span>Xóa lịch sử</span>
                        </div>
                    </button>

                    <button className="header-menu-item destructive" onClick={() => { onDeleteChat(); onClose(); }}>
                        <div className="item-content">
                            <Trash2 size={18} />
                            <span>Xoá cuộc trò chuyện</span>
                        </div>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default HeaderMenu;
