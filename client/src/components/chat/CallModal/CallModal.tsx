import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import "./CallModal.css";

interface CallModalProps {
    onClose: () => void;
}

const CallModal = ({ onClose }: CallModalProps) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="call-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="call-modal-icon">
                    <TriangleAlert size={48} color="#e53935" strokeWidth={2.5} />
                </div>
                <h2 className="call-modal-title">Tính năng chưa update!</h2>
                <div className="call-modal-body">
                    Biết tính năng này khó lắm không?. Bấm gì mà bấm lắm thế, 
                     Từ từ rồi mới làm cái này😡
                </div>
                <button className="call-modal-btn" onClick={onClose}>
                    Dạ xin lỗi ạ
                </button>
            </motion.div>
        </div>
    );
};

export default CallModal;
