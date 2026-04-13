import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { changePasswordApi } from '../../../api/authApi';
import './SettingsModal.css';

interface ChangePasswordFormProps {
    onSuccess?: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSuccess }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        if (newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        setLoading(true);
        try {
            await changePasswordApi({ currentPassword, newPassword });
            setSuccess(true);
            if (onSuccess) {
                setTimeout(onSuccess, 1500);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Đã xảy ra lỗi khi đổi mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="settings-form">
            {error && (
                <div className="settings-form-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="settings-form-success">
                    <ShieldCheck size={16} />
                    <span>Đổi mật khẩu thành công!</span>
                </div>
            )}

            <div className="settings-input-field">
                <label>Mật khẩu hiện tại</label>
                <div className="settings-password-wrapper">
                    <input 
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        required
                    />
                    <button 
                        type="button" 
                        className="settings-toggle-eye"
                        onClick={() => setShowCurrent(!showCurrent)}
                    >
                        {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div className="settings-input-field">
                <label>Mật khẩu mới</label>
                <div className="settings-password-wrapper">
                    <input 
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        required
                    />
                    <button 
                        type="button" 
                        className="settings-toggle-eye"
                        onClick={() => setShowNew(!showNew)}
                    >
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div className="settings-input-field">
                <label>Xác nhận mật khẩu mới</label>
                <div className="settings-password-wrapper">
                    <input 
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                    />
                    <button 
                        type="button" 
                        className="settings-toggle-eye"
                        onClick={() => setShowConfirm(!showConfirm)}
                    >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <button 
                type="submit" 
                className="settings-submit-btn" 
                disabled={loading || success}
            >
                {loading ? "Đang xử lý..." : "Cập nhật"}
            </button>
        </form>
    );
};

export default ChangePasswordForm;
