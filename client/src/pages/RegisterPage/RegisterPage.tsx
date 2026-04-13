import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtpApi, verifyOtpApi, registerApi } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import '../LoginPage/Auth.css';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timer, setTimer] = useState(0);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    document.title = "Register - Telegram Web";
  }, []);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    if (!email || isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      await sendOtpApi(email, 'register');
      setStep(2);
      setTimer(60);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [verificationToken, setVerificationToken] = useState("");

  const handleVerifyOtp = async () => {
    if (!otp || isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      const res = await verifyOtpApi(email, otp);
      setVerificationToken(res.data.verificationToken);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || "Xác thực OTP thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (isSubmitting || password.length < 6 || !verificationToken) return;
    
    setError("");
    setIsSubmitting(true);
    
    try {
      const res = await registerApi({ 
        username, 
        email, 
        password, 
        verificationToken 
      });
      setSuccessMessage("Đăng ký thành công!");
      if (res.data.token) {
        await login(res.data.token);
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordValid = password.length >= 6;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
            <svg viewBox="0 0 24 24" className="auth-logo-svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
        </div>

        <h2 className="auth-title">
          {step === 1 && "Tạo tài khoản"}
          {step === 2 && "Xác thực Email"}
          {step === 3 && "Thiết lập bảo mật"}
        </h2>
        
        <p className="auth-subtitle">
          {step === 1 && "Nhập Username và Email để bắt đầu."}
          {step === 2 && `Chúng tôi đã gửi mã 6 số đến ${email}`}
          {step === 3 && "Vui lòng đặt mật khẩu cho tài khoản của bạn."}
        </p>
        
        {error && <div className="auth-msg-error">{error}</div>}
        {successMessage && <div className="auth-msg-success">{successMessage}</div>}

        <div className="auth-form">
          {step === 1 && (
            <>
              <div className="auth-input-group">
                <input
                  className="auth-input"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="auth-input-group">
                <input
                  className="auth-input"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button 
                className="auth-button"
                onClick={handleSendOtp}
                disabled={isSubmitting || !email || !username}
              >
                {isSubmitting ? "Đang gửi..." : "TIẾP THEO"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-input-group">
                <input
                  className="auth-input"
                  placeholder="Nhập mã 6 số"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button 
                className="auth-button"
                onClick={handleVerifyOtp}
                disabled={isSubmitting || otp.length !== 6}
              >
                {isSubmitting ? "Đang xác thực..." : "XÁC NHẬN Mã"}
              </button>
              <button 
                className="auth-link" 
                style={{ marginTop: '10px' }}
                disabled={timer > 0 || isSubmitting}
                onClick={handleSendOtp}
              >
                {timer > 0 ? `Gửi lại mã (${timer}s)` : "Gửi lại mã OTP"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="auth-input-group">
                <input
                  className="auth-input"
                  placeholder="Mật khẩu (ít nhất 6 ký tự)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: isPasswordValid ? '#43a047' : '#e53935',
                  textAlign: 'left'
                }}>
                  {password.length > 0 && (isPasswordValid ? "✔ Mật khẩu hợp lệ" : "✖ Phải có ít nhất 6 ký tự")}
                </div>
              </div>
              <button 
                className="auth-button"
                onClick={handleRegister}
                disabled={isSubmitting || !isPasswordValid}
              >
                {isSubmitting ? "Đang xử lý..." : "HOÀN TẤT"}
              </button>
            </>
          )}
        </div>
        
        <button onClick={() => navigate("/login")} className="auth-link">
            Đã có tài khoản? Đăng nhập
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
