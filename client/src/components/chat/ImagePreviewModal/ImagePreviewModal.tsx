import { motion } from "framer-motion";
import './ImagePreviewModal.css';

interface ImagePreviewModalProps {
    imageUrl: string;
    onClose: () => void;
    onDelete?: () => void;
}

const ImagePreviewModal = ({ imageUrl, onClose, onDelete }: ImagePreviewModalProps) => {
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `telegram_image_${Date.now()}.jpg`;
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v2"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </button>
                {onDelete && (
                    <button className="image-preview-btn delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Xóa ảnh">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                )}
                <button className="image-preview-btn" onClick={onClose} title="Đóng">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
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
                <motion.img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="image-preview-main"
                    drag
                    dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                    dragElastic={0.1}
                    whileTap={{ cursor: "grabbing" }}
                />
            </motion.div>
        </motion.div>
    );
};

export default ImagePreviewModal;
