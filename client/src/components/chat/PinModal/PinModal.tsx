import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import "./PinModal.css";

interface PinModalProps {
    onClose: () => void;
    onConfirm: (isPinned: boolean, pinForBoth: boolean) => void;
    targetName?: string;
}

const PinModal = ({ onClose, onConfirm, targetName }: PinModalProps) => {
    const [pinForBoth, setPinForBoth] = useState(true);

    return (
        <div className="pin-modal-overlay" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="pin-modal-container" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pin-modal-header">
                    <h3 className="pin-modal-title">Bạn có muốn ghim tin nhắn này?</h3>
                    <button className="pin-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="pin-modal-body">
                    <p className="pin-modal-desc">
                        Tin nhắn sẽ được ghim lên đầu cuộc trò chuyện để mọi người dễ dàng thấy.
                    </p>

                    {targetName && (
                        <label className="pin-checkbox-wrapper">
                            <input 
                                type="checkbox" 
                                checked={pinForBoth} 
                                onChange={(e) => setPinForBoth(e.target.checked)} 
                            />
                            <span className="pin-checkbox-custom"></span>
                            <span className="pin-checkbox-label">Ghim 2 chiều</span>
                        </label>
                    )}
                </div>
                
                <div className="pin-modal-footer">
                    <button 
                        className="pin-btn pin-btn--cancel"
                        onClick={onClose}
                    >
                        Bỏ qua
                    </button>
                    <button 
                        className="pin-btn pin-btn--confirm"
                        onClick={() => onConfirm(true, pinForBoth)}
                    >
                        Ghim
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PinModal;
