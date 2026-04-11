import { useNavigate } from "react-router-dom";
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="big-404">404</h1>

        <div className="relative-content">
          <h2 className="not-found-title">
            Hình như bạn đang đi lạc?
          </h2>
          <p className="not-found-text">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang một
            địa chỉ khác.
          </p>

          <div className="button-group">
            <button
              onClick={() => navigate("/")}
              className="home-btn"
            >
              Quay lại trang chủ
            </button>

            <button
              onClick={() => navigate(-1)}
              className="back-btn"
            >
              Trở về trang trước
            </button>
          </div>
        </div>
      </div>

      <div className="decoration-dots">
        <div className="dot"></div>
        <div className="dot dot--dark dot-delay-1"></div>
        <div className="dot dot-delay-2"></div>
      </div>
    </div>
  );
};

export default NotFoundPage;
