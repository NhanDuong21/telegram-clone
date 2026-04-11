import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
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
      setError(err.response?.data?.message || "Đăng nhập thất bại, Nyan disconnect database rồi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Telegram paper plane logo */}
        <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "#3390ec", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
            <svg viewBox="0 0 24 24" style={{ width: "64px", height: "64px", fill: "white", marginLeft: "-4px" }}>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
        </div>

        <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#222", marginBottom: "8px", marginTop: "0" }}>Đăng nhập vào Telegram</h2>
        <p style={{ fontSize: "15px", color: "#707579", textAlign: "center", marginBottom: "32px", lineHeight: "1.4" }}>
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