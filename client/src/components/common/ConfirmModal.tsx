import React from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    title,
    message,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    isDanger = false,
    onConfirm,
    onCancel,
}) => {
    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="confirm-modal__title">{title}</h3>
                <p className="confirm-modal__message">{message}</p>
                <div className="confirm-modal__actions">
                    <button className="confirm-modal__btn confirm-modal__btn--cancel" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`confirm-modal__btn ${isDanger ? 'confirm-modal__btn--danger' : 'confirm-modal__btn--confirm'}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
