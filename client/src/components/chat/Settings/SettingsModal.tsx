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
    const [uiScale, setUiScale] = useState(100);

    const handleBack = () => {
        setCurrentView('main');
    };

    const handleModalClose = () => {
        handleBack();
        onClose();
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
                                    <div className="settings-user-name">{user?.displayName || user?.username}</div>
                                    <div className="settings-user-status">+{user?.email || "Chưa cập nhật số điện thoại"}</div>
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
                                        min="80" 
                                        max="150" 
                                        value={uiScale} 
                                        onChange={(e) => setUiScale(parseInt(e.target.value))}
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
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default SettingsModal;
