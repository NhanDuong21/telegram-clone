import { motion } from "framer-motion";
import { X } from "lucide-react";
import "./ClearSearchModal.css";

interface ClearSearchModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

const ClearSearchModal = ({ onClose, onConfirm }: ClearSearchModalProps) => {
    return (
        <div className="clear-search-modal-overlay" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="clear-search-modal-container" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="clear-search-modal-header">
                    <h3 className="clear-search-modal-title">Xóa lịch sử tìm kiếm</h3>
                    <button className="clear-search-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="clear-search-modal-body">
                    <p className="clear-search-modal-desc">
                        Bạn có chắc chắn muốn xóa toàn bộ lịch sử tìm kiếm gần đây không?
                    </p>
                </div>
                
                <div className="clear-search-modal-footer">
                    <button 
                        className="clear-search-btn clear-search-btn--cancel"
                        onClick={onClose}
                    >
                        Bỏ qua
                    </button>
                    <button 
                        className="clear-search-btn clear-search-btn--confirm"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        Xóa
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ClearSearchModal;
