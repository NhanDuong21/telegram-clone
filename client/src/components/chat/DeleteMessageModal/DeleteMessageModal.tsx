import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import "./DeleteMessageModal.css";

interface DeleteMessageModalProps {
    onClose: () => void;
    onConfirm: (type: 'one-way' | 'two-way') => void;
    isSender: boolean;
    targetName?: string; // The person on the other end
}

const DeleteMessageModal = ({ onClose, onConfirm, isSender, targetName }: DeleteMessageModalProps) => {
    const [deleteForBoth, setDeleteForBoth] = useState(isSender);

    const handleDelete = () => {
        onConfirm(deleteForBoth ? 'two-way' : 'one-way');
    };

    return (
        <div className="delete-modal-overlay" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="delete-modal-container" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="delete-modal-header">
                    <h3 className="delete-modal-title">Bạn có muốn xóa tin nhắn này?</h3>
                    <button className="delete-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="delete-modal-body">
                    <p className="delete-modal-desc">
                        {deleteForBoth 
                            ? "Tin nhắn sẽ bị xóa khỏi lịch sử của bạn và đối phương."
                            : "Tin nhắn sẽ bị xóa khỏi lịch sử của bạn."}
                    </p>

                    {isSender && targetName && (
                        <label className="delete-checkbox-wrapper">
                            <input 
                                type="checkbox" 
                                checked={deleteForBoth} 
                                onChange={(e) => setDeleteForBoth(e.target.checked)} 
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">Xóa ở phía {targetName}</span>
                        </label>
                    )}
                </div>
                
                <div className="delete-modal-footer">
                    <button 
                        className="delete-btn delete-btn--cancel"
                        onClick={onClose}
                    >
                        Bỏ qua
                    </button>
                    <button 
                        className="delete-btn delete-btn--confirm"
                        onClick={handleDelete}
                    >
                        Xóa
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default DeleteMessageModal;
