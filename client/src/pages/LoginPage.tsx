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
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <input
          className="border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <input
          className="border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button 
          className="bg-blue-500 text-white rounded-lg p-2.5 font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        
        <div className="text-center text-sm text-gray-500 mt-2">
          Don't have an account?{" "}
          <button onClick={() => navigate("/register")} className="text-blue-500 hover:underline">
            Register here
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;