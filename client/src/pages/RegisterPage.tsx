import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const navigate = useNavigate();
  const { login } = useAuth(); // Import login so we can auto-login after success

  const handleRegister = async () => {
    if (isSubmitting) return;
    
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);
    
    try {
      const res = await registerApi({ username, email, password });
      
      setSuccessMessage("Đăng ký thành công! Đang đăng nhập...");
      
      // Backend authController's register already returns { message, user, token }
      // Auto-login for better UX
      if (res.data.token) {
        await login(res.data.token);
        navigate("/");
      } else {
        // Fallback in case token isn't returned
        setTimeout(() => navigate("/login"), 1000);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại, Nyan disconect database rồi");
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

        <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#222", marginBottom: "8px", marginTop: "0" }}>Tạo tài khoản mới</h2>
        <p style={{ fontSize: "15px", color: "#707579", textAlign: "center", marginBottom: "32px", lineHeight: "1.4" }}>
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