import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LoadingScreen from "./components/common/LoadingScreen";

const LoginPage = lazy(() => import("./pages/LoginPage/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage/ForgotPasswordPage"));
const ChatPage = lazy(() => import("./pages/ChatPage/ChatPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage/NotFoundPage"));

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const savedScale = localStorage.getItem('ui-scale');
    if (savedScale) {
      const zoom = parseInt(savedScale) / 100;
      document.documentElement.style.setProperty('--ui-zoom', zoom.toString());
    }
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Toaster position="bottom-center" />
        <Suspense fallback={<LoadingScreen />}>
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
              path="/forgot-password"
              element={user ? <Navigate to="/" /> : <ForgotPasswordPage />}
            />
            <Route
              path="/"
              element={user ? <ChatPage /> : <Navigate to="/login" />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;