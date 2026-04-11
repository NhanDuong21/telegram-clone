import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import '../LoginPage/Auth.css';

const RegisterPage = () => {
  useEffect(() => {
    document.title = "Register - Telegram Web";
  }, []);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async () => {
    if (isSubmitting) return;
    
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);
    
    try {
      const res = await registerApi({ username, email, password });
      
      setSuccessMessage("Đăng ký thành công! Đang đăng nhập...");
      
      if (res.data.token) {
        await login(res.data.token);
        navigate("/");
      } else {
        setTimeout(() => navigate("/login"), 1000);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
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

        <h2 className="auth-title">Tạo tài khoản mới</h2>
        <p className="auth-subtitle">
            Vui lòng nhập tên hiển thị và thông tin đăng nhập của bạn.
        </p>
        
        {error && (
          <div className="auth-msg-error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="auth-msg-success">
            {successMessage}
          </div>
        )}

        <div className="auth-form">
            <div className="auth-input-group">
                <input
                className="auth-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
            </div>
            <div className="auth-input-group">
                <input
                className="auth-input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
            </div>

            <div className="auth-input-group">
                <input
                className="auth-input"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
            </div>

            <button 
                className="auth-button"
                onClick={handleRegister}
                disabled={isSubmitting || !!successMessage}
            >
                {isSubmitting ? "Đang tạo..." : "ĐĂNG KÝ"}
            </button>
        </div>
        
        <button onClick={() => navigate("/login")} className="auth-link">
            Đã có tài khoản? Đăng nhập
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
