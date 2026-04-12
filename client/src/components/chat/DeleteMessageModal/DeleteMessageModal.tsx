import { motion } from "framer-motion";
import "./DeleteMessageModal.css";

interface DeleteMessageModalProps {
    onClose: () => void;
    onConfirm: (type: 'one-way' | 'two-way') => void;
    isSender: boolean;
}

const DeleteMessageModal = ({ onClose, onConfirm, isSender }: DeleteMessageModalProps) => {
    return (
        <div className="delete-modal-overlay" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="delete-modal-content" 
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="delete-modal-title">Xóa tin nhắn?</h3>
                <p className="delete-modal-text">Bạn có chắc chắn muốn xóa tin nhắn này?</p>
                
                <div className="delete-modal-actions">
                    <button 
                        className="delete-modal-btn delete-modal-btn--secondary"
                        onClick={() => onConfirm('one-way')}
                    >
                        Xóa cho tôi
                    </button>
                    {isSender && (
                        <button 
                            className="delete-modal-btn delete-modal-btn--danger"
                            onClick={() => onConfirm('two-way')}
                        >
                            Xóa cho mọi người
                        </button>
                    )}
                    <button 
                        className="delete-modal-btn delete-modal-btn--cancel"
                        onClick={onClose}
                    >
                        Hủy
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default DeleteMessageModal;
