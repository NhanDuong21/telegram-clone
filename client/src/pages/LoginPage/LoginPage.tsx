import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import './Auth.css';

const LoginPage = () => {
  useEffect(() => {
    document.title = "Telegram Web";
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (isSubmitting) return;
    
    setError("");
    setIsSubmitting(true);
    
    try {
      const res = await loginApi({ email, password });
      await login(res.data.token);
      navigate("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
            <svg viewBox="0 0 24 24" className="auth-logo-svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
        </div>

        <h2 className="auth-title">Đăng nhập vào Telegram</h2>
        <p className="auth-subtitle">
            Vui lòng nhập Email và Mật khẩu<br />của bạn.
        </p>
        
        {error && (
          <div className="auth-msg-error">
            {error}
          </div>
        )}

        <div className="auth-form">
            <div className="auth-input-group">
                <input
                className="auth-input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
            </div>

            <div className="auth-input-group">
                <input
                className="auth-input"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
            </div>

            <button 
                className="auth-button"
                onClick={handleLogin}
                disabled={isSubmitting}
            >
                {isSubmitting ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
            </button>
        </div>
        
        <button onClick={() => navigate("/register")} className="auth-link">
            Tạo tài khoản mới
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
