import { useState, useEffect } from 'react';
import { X, Plus, Send, Trash2 } from 'lucide-react';
import ReactDOM from 'react-dom';
import './SendImageModal.css';

interface SendImageModalProps {
    files: File[];
    onClose: () => void;
    onSend: (caption: string, files: File[]) => void;
    onAddMore: () => void;
}

const SendImageModal = ({ files, onClose, onSend, onAddMore }: SendImageModalProps) => {
    const [caption, setCaption] = useState("");
    const [previews, setPreviews] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>(files);

    useEffect(() => {
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviews(newPreviews);

        return () => {
            newPreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [selectedFiles]);

    // Update internal state when props change
    useEffect(() => {
        setSelectedFiles(files);
    }, [files]);

    const handleRemove = (index: number) => {
        const nextFiles = [...selectedFiles];
        nextFiles.splice(index, 1);
        if (nextFiles.length === 0) {
            onClose();
        } else {
            setSelectedFiles(nextFiles);
        }
    };

    const handleSend = () => {
        onSend(caption, selectedFiles);
    };

    const modalContent = (
        <div className="send-image-overlay" onClick={onClose}>
            <div className="send-image-modal" onClick={e => e.stopPropagation()}>
                <div className="send-image-header">
                    <h3>Gửi {selectedFiles.length} ảnh</h3>
                    <button className="close-icon-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="send-image-body">
                    <div className="image-previews-container">
                        {previews.map((url, i) => (
                            <div key={i} className="preview-card">
                                <img src={url} alt={`preview-${i}`} />
                                <button className="remove-preview-btn" onClick={() => handleRemove(i)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="caption-input-wrapper">
                        <textarea
                            placeholder="Thêm chú thích..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="send-image-footer">
                    <button className="add-more-btn" onClick={onAddMore}>
                        <Plus size={20} />
                        <span>Thêm</span>
                    </button>
                    <div className="footer-right">
                        <button className="cancel-btn" onClick={onClose}>Hủy</button>
                        <button className="send-btn-primary" onClick={handleSend}>
                            <Send size={18} />
                            <span>Gửi</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default SendImageModal;
