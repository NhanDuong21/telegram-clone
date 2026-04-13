import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendOtpApi, verifyOtpApi, resetPasswordApi } from "../../api/authApi";
import "./ForgotPasswordPage.css";

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    try {
      await sendOtpApi(email, 'forgot');
      setStep(2);
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi mã OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6 || isSubmitting || !verificationToken) return;

    setError("");
    setIsSubmitting(true);
    try {
      await resetPasswordApi({ 
        email, 
        newPassword, 
        verificationToken 
      });
      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
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
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Quên mật khẩu</h1>
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
          </div>
          <p>
            {step === 1 && "Nhập email của bạn để nhận mã khôi phục."}
            {step === 2 && `Chúng tôi đã gửi mã xác thực đến ${email}`}
            {step === 3 && "Thiết lập mật khẩu mới cho tài khoản của bạn."}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <form className="forgot-password-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Địa chỉ Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="forgot-password-btn" 
              disabled={isSubmitting || !email}
            >
              {isSubmitting ? "Đang xử lý..." : "Tiếp tục"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="forgot-password-form" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Mã xác thực (6 chữ số)</label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div className="otp-timer">
              {countdown > 0 ? (
                `Gửi lại mã sau ${countdown}s`
              ) : (
                <>
                  Không nhận được mã? 
                  <button type="button" className="resend-btn" onClick={handleResendOtp}>Gửi lại</button>
                </>
              )}
            </div>
            <button 
              type="submit" 
              className="forgot-password-btn" 
              disabled={isSubmitting || otp.length !== 6}
            >
              {isSubmitting ? "Đang xác thực..." : "Xác thực"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="forgot-password-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div className={`validation-hint ${isPasswordValid ? 'valid' : 'invalid'}`}>
                {isPasswordValid ? '✔' : '✖'} Mật khẩu phải có ít nhất 6 ký tự
              </div>
            </div>
            <button 
              type="submit" 
              className="forgot-password-btn" 
              disabled={isSubmitting || !isPasswordValid}
            >
              {isSubmitting ? "Đang lưu..." : "Đổi mật khẩu"}
            </button>
          </form>
        )}

        <Link to="/login" className="back-to-login">
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
