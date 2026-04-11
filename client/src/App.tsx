import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const LoginPage = lazy(() => import("./pages/LoginPage/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage/RegisterPage"));
const ChatPage = lazy(() => import("./pages/ChatPage/ChatPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage/NotFoundPage"));

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" /> : <RegisterPage />}
          />
          <Route
            path="/"
            element={user ? <ChatPage /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;