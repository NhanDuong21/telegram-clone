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
      
      setSuccessMessage("Registration successful! Logging you in...");
      
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
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center text-gray-800">Register</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center">
            {successMessage}
          </div>
        )}

        <input
          className="border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
        />

        <input
          className="border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
        />

        <input
          className="border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
        />

        <button 
          className="bg-blue-500 text-white rounded-lg p-2.5 font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={handleRegister}
          disabled={isSubmitting || !!successMessage}
        >
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
        
        <div className="text-center text-sm text-gray-500 mt-2">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-blue-500 hover:underline">
            Login here
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;