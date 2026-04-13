import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Pin, PinOff, BellOff, Bell, UserMinus, Trash2, Eraser } from 'lucide-react';
import type { Conversation } from '../../../types/chat';
import './SidebarContextMenu.css';

interface SidebarContextMenuProps {
    x: number;
    y: number;
    conversation: Conversation;
    onClose: () => void;
    onPin: (isPinned: boolean) => void;
    onMute: (isMuted: boolean) => void;
    onBlock: () => void;
    onClear: () => void;
    onDelete: () => void;
}

const SidebarContextMenu = ({
    x,
    y,
    conversation,
    onClose,
    onPin,
    onMute,
    onBlock,
    onClear,
    onDelete,
}: SidebarContextMenuProps) => {
    const isMobile = window.innerWidth < 768;

    const items = [
        {
            label: conversation.isPinned ? "Bỏ ghim" : "Ghim",
            icon: conversation.isPinned ? <PinOff size={20} /> : <Pin size={20} />,
            onClick: () => onPin(!conversation.isPinned),
        },
        {
            label: conversation.isMuted ? "Bật âm" : "Tắt thông báo",
            icon: conversation.isMuted ? <Bell size={20} /> : <BellOff size={20} />,
            onClick: () => onMute(!conversation.isMuted),
        },
        {
            label: "Chặn người dùng",
            icon: <UserMinus size={20} />,
            onClick: onBlock,
            disabled: conversation.isGroup
        },
        {
            label: "Xóa lịch sử",
            icon: <Eraser size={20} />,
            onClick: onClear,
            red: true
        },
        {
            label: "Xóa cuộc trò chuyện",
            icon: <Trash2 size={20} />,
            onClick: onDelete,
            red: true
        }
    ];

    const menuStyles = isMobile 
        ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' as const }
        : { left: x, top: y, position: 'fixed' as const };

    return createPortal(
        <>
            <div className="context-menu-backdrop" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className={`sidebar-context-menu ${isMobile ? 'is-mobile' : ''}`}
                style={menuStyles}
                onClick={(e) => e.stopPropagation()}
            >
                <ul>
                    {items.map((item, index) => (
                        <li 
                            key={index} 
                            onClick={() => { item.onClick(); onClose(); }}
                            className={`${item.red ? 'item-red' : ''} ${item.disabled ? 'item-disabled' : ''}`}
                        >
                            <span className="menu-icon">{item.icon}</span>
                            <span className="menu-label">{item.label}</span>
                        </li>
                    ))}
                </ul>
            </motion.div>
        </>,
        document.body
    );
};

export default SidebarContextMenu;
