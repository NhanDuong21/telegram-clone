import { useNavigate } from "react-router-dom";
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="sticker-container animated-sticker">
          <svg
            viewBox="0 0 200 200"
            className="not-found-sticker"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Clean, professional magnifying glass illustration */}
            <circle cx="90" cy="90" r="50" stroke="var(--accent-color)" strokeWidth="8" fill="none" />
            <line x1="125" y1="125" x2="160" y2="160" stroke="var(--accent-color)" strokeWidth="12" strokeLinecap="round" />
            
            {/* Subtle floating circles for depth */}
            <circle cx="40" cy="40" r="4" fill="var(--text-secondary)" opacity="0.3" />
            <circle cx="160" cy="40" r="6" fill="var(--accent-color)" opacity="0.2" />
            <circle cx="150" cy="110" r="3" fill="var(--text-secondary)" opacity="0.4" />
          </svg>
        </div>

        <div className="error-badge">Error 404</div>
        <h2 className="not-found-title">Không tìm thấy trang</h2>
        
        <p className="not-found-text">
          Rất tiếc, địa chỉ bạn đang truy cập không tồn tại hoặc đã bị gỡ bỏ. 
          Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
        </p>

        <button
          onClick={() => navigate("/")}
          className="home-btn"
        >
          Quay lại trang chủ
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
