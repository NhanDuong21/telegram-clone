import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
    CornerUpLeft, 
    Pencil, 
    Pin, 
    Copy, 
    Forward, 
    Trash2 
} from 'lucide-react';
import './ContextMenu.css';

interface ContextMenuProps {
    x: number;
    y: number;
    isMe: boolean;
    text?: string;
    isPinned?: boolean;
    onClose: () => void;
    onReply?: () => void;
    onEdit?: () => void;
    onPin?: () => void;
    onCopy?: () => void;
    onForward?: () => void;
    onDelete?: () => void;
    onReact?: (emoji: string) => void;
}

const emojis = ['👍', '❤️', '🔥', '😂', '😮', '😢', '🙏', '👏'];

const ContextMenu = ({ 
    x, y, isMe, text, isPinned, onClose, 
    onReply, onEdit, onPin, onCopy, onForward, onDelete, onReact 
}: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPos, setAdjustedPos] = useState({ x, y });

    useEffect(() => {
        if (menuRef.current) {
            const menuWidth = 220;
            const menuHeight = 350;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            let finalX = x;
            let finalY = y;

            if (x + menuWidth > screenWidth) finalX = screenWidth - menuWidth - 10;
            if (y + menuHeight > screenHeight) finalY = screenHeight - menuHeight - 10;

            setAdjustedPos({ x: finalX, y: finalY });
        }
    }, [x, y]);

    const handleCopy = () => {
        if (text) {
            navigator.clipboard.writeText(text);
            onCopy?.();
        }
        onClose();
    };

    return createPortal(
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9, transformOrigin: 'top left' }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="context-menu"
            style={{ top: adjustedPos.y, left: adjustedPos.x }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="reactions-bar">
                {emojis.map((emoji) => (
                    <button 
                        key={emoji} 
                        className="reaction-btn"
                        onClick={() => { onReact?.(emoji); onClose(); }}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            <div className="menu-divider" />

            <div className="menu-items">
                <button className="menu-item" onClick={() => { onReply?.(); onClose(); }}>
                    <span className="menu-icon"><CornerUpLeft size={16} strokeWidth={2} /></span> Trả lời
                </button>
                
                {isMe && (
                    <button className="menu-item" onClick={() => { onEdit?.(); onClose(); }}>
                        <span className="menu-icon"><Pencil size={16} strokeWidth={2} /></span> Sửa
                    </button>
                )}

                <button className="menu-item" onClick={() => { onPin?.(); onClose(); }}>
                    <span className="menu-icon"><Pin size={16} strokeWidth={2} className={isPinned ? "pinned-icon" : ""} /></span> {isPinned ? "Bỏ ghim" : "Ghim"}
                </button>

                {text && (
                    <button className="menu-item" onClick={handleCopy}>
                        <span className="menu-icon"><Copy size={16} strokeWidth={2} /></span> Sao chép văn bản
                    </button>
                )}

                <button className="menu-item" onClick={() => { onForward?.(); onClose(); }}>
                    <span className="menu-icon"><Forward size={16} strokeWidth={2} /></span> Chuyển tiếp
                </button>

                <div className="menu-divider" />

                <button className="menu-item menu-item--danger" onClick={() => { onDelete?.(); onClose(); }}>
                    <span className="menu-icon"><Trash2 size={16} strokeWidth={2} /></span> Xóa
                </button>
            </div>
        </motion.div>,
        document.body
    );
};

export default ContextMenu;
