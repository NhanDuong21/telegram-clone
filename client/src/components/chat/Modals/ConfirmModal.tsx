import { motion, AnimatePresence } from "framer-motion";
import "./ConfirmModal.css";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "OK",
    cancelText = "Bỏ qua",
    isDanger = false,
}: ConfirmModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="confirm-modal-overlay" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="confirm-modal-container"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="confirm-modal-header">
                            <h3 className="confirm-modal-title">{title}</h3>
                        </div>
                        <div className="confirm-modal-body">
                            <p className="confirm-modal-desc">{description}</p>
                        </div>
                        <div className="confirm-modal-footer">
                            <button className="confirm-btn confirm-btn--cancel" onClick={onClose}>
                                {cancelText}
                            </button>
                            <button 
                                className={`confirm-btn ${isDanger ? 'confirm-btn--danger' : 'confirm-btn--confirm'}`}
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
