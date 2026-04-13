import React, { useState } from 'react';
import { ArrowLeft, X, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestEmailChangeApi, verifyEmailChangeApi } from '../../api/userApi';
import './EditEmailView.css';

interface EditEmailViewProps {
    onBack: () => void;
    onClose: () => void;
    onSuccess: (updatedUser: any) => void;
}

import ReactDOM from 'react-dom';

const EditEmailView: React.FC<EditEmailViewProps> = ({ onBack, onClose, onSuccess }) => {
    const [step, setStep] = useState<'INPUT' | 'OTP'>('INPUT');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('Vui lòng nhập email hợp lệ');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await requestEmailChangeApi(email);
            setStep('OTP');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        if (otpString.length < 6) {
            setError('Vui lòng nhập đủ 6 chữ số');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await verifyEmailChangeApi(email, otpString);
            onSuccess(res.data.user);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Mã OTP không chính xác');
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="edit-email-overlay">
            <motion.div 
                className="edit-email-container"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
                <div className="edit-email-header">
                    <button className="back-btn" onClick={onBack}>
                        <ArrowLeft size={22} />
                    </button>
                    <h3 className="header-title">Email</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={22} />
                    </button>
                </div>

                <div className="edit-email-content">
                    <div className="mailbox-illustration">
                        <div className="blue-circle">
                            <Mail size={48} color="#fff" strokeWidth={1.5} />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 'INPUT' ? (
                            <motion.div 
                                key="input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="step-container"
                            >
                                <h2 className="step-title">Nhập email mới</h2>
                                <p className="step-subtext">
                                    Giờ đây bạn sẽ nhận mã đăng nhập Telegram bằng email, không phải SMS. Vui lòng nhập email bạn có thể truy cập được.
                                </p>

                                <form onSubmit={handleRequestOtp} className="email-form">
                                    <div className="input-group">
                                        <input 
                                            type="email" 
                                            placeholder=" "
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                        <label>Điền email mới</label>
                                        <div className="underline"></div>
                                    </div>

                                    {error && <div className="error-message">{error}</div>}

                                    <button 
                                        type="submit" 
                                        className="confirm-btn"
                                        disabled={loading}
                                    >
                                        {loading ? 'Đang xử lý...' : 'Tiếp theo'}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="otp"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="step-container"
                            >
                                <h2 className="step-title">Xác thực Email</h2>
                                <p className="step-subtext">
                                    Chúng tôi đã gửi một mã xác thực gồm 6 chữ số đến <b>{email}</b>. Vui lòng nhập mã để tiếp tục.
                                </p>

                                <div className="otp-inputs">
                                    {otp.map((digit, i) => (
                                        <input 
                                            key={i}
                                            id={`otp-${i}`}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            autoFocus={i === 0}
                                        />
                                    ))}
                                </div>

                                {error && <div className="error-message">{error}</div>}

                                <button 
                                    onClick={handleVerifyOtp} 
                                    className="confirm-btn"
                                    disabled={loading || otp.join('').length < 6}
                                >
                                    {loading ? 'Đang xác thực...' : 'Xác nhận'}
                                </button>
                                
                                <button 
                                    className="resend-btn"
                                    onClick={() => setStep('INPUT')}
                                    disabled={loading}
                                >
                                    Đổi email khác
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default EditEmailView;
