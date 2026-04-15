import { motion } from "framer-motion";
import { Download, X, Trash2 } from "lucide-react";
import './ImagePreviewModal.css';

interface ImagePreviewModalProps {
    imageUrl: string;
    onClose: () => void;
    onDelete?: () => void;
    isOwner?: boolean;
}

const ImagePreviewModal = ({ imageUrl, onClose, onDelete, isOwner }: ImagePreviewModalProps) => {
    const isVideo = imageUrl.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i) || imageUrl.includes('video/upload');

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `telegram_media_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="image-preview-overlay"
            onClick={onClose}
        >
            <div className="image-preview-header">
                <button className="image-preview-btn" onClick={handleDownload} title="Tải về">
                    <Download size={24} />
                </button>
                {isOwner && onDelete && (
                    <button className="image-preview-btn image-preview-delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }} title={isVideo ? "Xóa video" : "Xóa ảnh"}>
                        <Trash2 size={24} />
                    </button>
                )}
                <button className="image-preview-btn" onClick={onClose} title="Đóng">
                    <X size={24} />
                </button>
            </div>

            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="image-preview-content"
                onClick={(e) => e.stopPropagation()}
            >
                {isVideo ? (
                    <video 
                        src={imageUrl} 
                        controls 
                        autoPlay
                        className="image-preview-main"
                        style={{ maxHeight: '80vh', maxWidth: '90vw' }}
                    />
                ) : (
                    <motion.img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="image-preview-main"
                        drag
                        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                        dragElastic={0.1}
                        whileTap={{ cursor: "grabbing" }}
                    />
                )}
            </motion.div>
        </motion.div>
    );
};

export default ImagePreviewModal;
