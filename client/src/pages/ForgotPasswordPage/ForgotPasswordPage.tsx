import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendOtpApi, verifyOtpApi, resetPasswordApi } from "../../api/authApi";
import "./ForgotPasswordPage.css";
import "../LoginPage/Auth.css"; // Reuse auth styles

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    try {
      await sendOtpApi(email, 'forgot');
      setStep(2);
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || "Email không tồn tại trong hệ thống");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!otp || isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    try {
      const res = await verifyOtpApi(email, otp);
      setVerificationToken(res.data.verificationToken);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || "Mã OTP không chính xác");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 6 || isSubmitting || !verificationToken) return;

    setError("");
    setIsSubmitting(true);
    try {
      await resetPasswordApi({ 
        email, 
        newPassword, 
        verificationToken 
      });
      alert("Đổi mật khẩu thành công!");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isSubmitting) return;
    try {
      await sendOtpApi(email, 'forgot');
      setCountdown(60);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi lại mã OTP");
    }
  };

  const isPasswordValid = newPassword.length >= 6;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
            <svg viewBox="0 0 24 24" className="auth-logo-svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
        </div>

        <h2 className="auth-title">Quên mật khẩu</h2>
        <p className="auth-subtitle">
            {step === 1 && "Nhập email của bạn để nhận mã khôi phục."}
            {step === 2 && `Chúng tôi đã gửi mã xác thực đến\n${email}`}
            {step === 3 && "Thiết lập mật khẩu mới (ít nhất 6 ký tự)."}
        </p>

        {error && <div className="auth-msg-error">{error}</div>}

        <div className="auth-form">
          {step === 1 && (
            <>
              <div className="auth-input-group">
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  required
                />
              </div>
              <button 
                className="auth-button" 
                onClick={() => handleSendOtp()}
                disabled={isSubmitting || !email}
              >
                {isSubmitting ? "ĐANG XỬ LÝ..." : "TIẾP TỤC"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-input-group">
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Mã xác thực"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  required
                />
              </div>
              {countdown > 0 ? (
                <p className="auth-subtitle" style={{ marginBottom: '10px', fontSize: '13px' }}>
                  Gửi lại mã sau {countdown}s
                </p>
              ) : (
                <button className="auth-link" style={{ marginBottom: '10px' }} onClick={handleResendOtp}>
                  Gửi lại mã
                </button>
              )}
              <button 
                className="auth-button" 
                onClick={() => handleVerifyOtp()}
                disabled={isSubmitting || otp.length !== 6}
              >
                {isSubmitting ? "ĐANG XÁC THỰC..." : "XÁC THỰC"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="auth-input-group">
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  required
                />
              </div>
              {!isPasswordValid && newPassword.length > 0 && (
                <p className="auth-msg-error" style={{ fontSize: '12px', padding: '5px' }}>
                  Mật khẩu phải có ít nhất 6 ký tự
                </p>
              )}
              <button 
                className="auth-button" 
                onClick={() => handleResetPassword()}
                disabled={isSubmitting || !isPasswordValid}
              >
                {isSubmitting ? "ĐANG LƯU..." : "TIẾP TỤC"}
              </button>
            </>
          )}
        </div>

        <div className="auth-footer-links">
          <Link to="/login" className="auth-link">
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
