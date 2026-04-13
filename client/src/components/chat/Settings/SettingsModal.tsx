import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    User as UserIcon, 
    Bell, 
    Shield, 
    MessageSquare, 
    Globe, 
    Eye, 
    ArrowLeft,
} from 'lucide-react';
import type { User } from '../../../types/chat';
import Avatar from '../../common/Avatar';
import ChangePasswordForm from './ChangePasswordForm';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onEditProfile: () => void;
}

import ReactDOM from 'react-dom';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onEditProfile }) => {
    const [currentView, setCurrentView] = useState<'main' | 'change-password'>('main');
    const [uiScale, setUiScale] = useState(() => {
        const saved = localStorage.getItem('ui-scale');
        return saved ? parseInt(saved) : 100;
    });
    const [showRestartModal, setShowRestartModal] = useState(false);
    const [originalScale] = useState(uiScale);

    const handleBack = () => {
        setCurrentView('main');
    };

    const handleModalClose = () => {
        handleBack();
        onClose();
    };

    const handleRestart = () => {
        localStorage.setItem('ui-scale', uiScale.toString());
        window.location.reload();
    };

    const handleSkipRestart = () => {
        setShowRestartModal(false);
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <AnimatePresence mode="wait">
            <div className="modal-root-overlay">
                <motion.div 
                    className="settings-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleModalClose}
                />
                
                <motion.div 
                    className="settings-modal"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                >
                    {currentView === 'main' ? (
                        <div className="settings-main-view">
                            <div className="settings-header">
                                <h3 className="settings-title">Cài đặt</h3>
                                <button className="settings-close-btn" onClick={handleModalClose}>
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="settings-profile-section">
                                <div className="settings-avatar-wrapper">
                                    <Avatar user={user} size={70} />
                                </div>
                                <div className="settings-user-info">
                                    <div className="settings-user-name">{user?.fullName || user?.username}</div>
                                    <div className="settings-user-status">{user?.email || "Chưa cập nhật email"}</div>
                                    <div className="settings-user-username">@{user?.username}</div>
                                </div>
                            </div>

                            <div className="settings-list">
                                <div className="settings-item" onClick={() => { onEditProfile(); onClose(); }}>
                                    <UserIcon className="settings-item-icon" size={22} />
                                    <span className="settings-item-label">Tài khoản của tôi</span>
                                </div>
                                <div className="settings-item">
                                    <Bell className="settings-item-icon" size={22} />
                                    <span className="settings-item-label">Thông báo và âm thanh</span>
                                </div>
                                <div className="settings-item" onClick={() => setCurrentView('change-password')}>
                                    <Shield className="settings-item-icon" size={22} />
                                    <span className="settings-item-label">Đổi mật khẩu</span>
                                </div>
                                <div className="settings-item">
                                    <MessageSquare className="settings-item-icon" size={22} />
                                    <span className="settings-item-label">Cài đặt trò chuyện</span>
                                </div>
                                <div className="settings-item">
                                    <Globe className="settings-item-icon" size={22} />
                                    <span className="settings-item-label">Ngôn ngữ</span>
                                </div>
                                <div className="settings-divider" />
                                <div className="settings-item settings-item--scale">
                                    <div className="settings-item-top">
                                        <div className="settings-item-left">
                                            <Eye className="settings-item-icon" size={22} />
                                            <span className="settings-item-label">Tỷ lệ giao diện mặc định</span>
                                        </div>
                                        <span className="scale-value">{uiScale}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="70" 
                                        max="150" 
                                        step="5"
                                        value={uiScale} 
                                        onChange={(e) => setUiScale(parseInt(e.target.value))}
                                        onMouseUp={() => uiScale !== originalScale && setShowRestartModal(true)}
                                        onTouchEnd={() => uiScale !== originalScale && setShowRestartModal(true)}
                                        className="scale-slider"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="settings-sub-view">
                            <div className="settings-header">
                                <div className="settings-header-left">
                                    <button className="settings-back-btn" onClick={handleBack}>
                                        <ArrowLeft size={22} />
                                    </button>
                                    <h3 className="settings-title">Đổi mật khẩu</h3>
                                </div>
                                <button className="settings-close-btn" onClick={handleModalClose}>
                                    <X size={22} />
                                </button>
                            </div>
                            <div className="settings-view-content">
                                <ChangePasswordForm onSuccess={handleBack} />
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Restart Confirmation Modal */}
                <AnimatePresence>
                    {showRestartModal && (
                        <div className="restart-modal-overlay">
                            <motion.div 
                                className="restart-modal-card"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <p className="restart-modal-text">
                                    Bạn cần khởi động lại để áp dụng một số cài đặt mới. Khởi động lại ngay bây giờ?
                                </p>
                                <div className="restart-modal-actions">
                                    <button className="restart-btn restart-btn--skip" onClick={handleSkipRestart}>
                                        Bỏ qua
                                    </button>
                                    <button className="restart-btn restart-btn--confirm" onClick={handleRestart}>
                                        Khởi động lại
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default SettingsModal;
