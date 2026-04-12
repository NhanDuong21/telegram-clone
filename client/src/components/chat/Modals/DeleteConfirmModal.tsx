import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./DeleteConfirmModal.css";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (deleteForBoth: boolean) => void;
    title: string;
    description: string;
    targetName?: string;
    confirmText?: string;
}

const DeleteConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    targetName = "người kia",
    confirmText = "Xóa",
}: DeleteConfirmModalProps) => {
    const [deleteForBoth, setDeleteForBoth] = useState(false);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="delete-modal-overlay" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="delete-modal-container"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="delete-modal-header">
                            <h3 className="delete-modal-title">{title}</h3>
                        </div>
                        <div className="delete-modal-body">
                            <p className="delete-modal-desc">{description}</p>
                            
                            <label className="delete-checkbox-wrapper">
                                <input 
                                    type="checkbox" 
                                    checked={deleteForBoth}
                                    onChange={(e) => setDeleteForBoth(e.target.checked)}
                                />
                                <span className="delete-checkbox-custom"></span>
                                <span className="delete-checkbox-label">Xóa cho cả {targetName}</span>
                            </label>
                        </div>
                        <div className="delete-modal-footer">
                            <button className="del-btn del-btn--cancel" onClick={onClose}>
                                Hủy
                            </button>
                            <button 
                                className="del-btn del-btn--confirm danger"
                                onClick={() => {
                                    onConfirm(deleteForBoth);
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

export default DeleteConfirmModal;
