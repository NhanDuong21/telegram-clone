import { useNavigate } from "react-router-dom";
import "./ErrorPage.css";

type ErrorCode = 401 | 403 | 404 | 500 | 'offline';

interface ErrorPageProps {
    errorCode?: ErrorCode;
}

const UnauthorizedSticker = () => (
    <svg viewBox="0 0 200 200" className="error-sticker" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="var(--accent-color)" opacity="0.1" />
        <rect x="60" y="90" width="80" height="60" rx="8" fill="var(--accent-color)" />
        <path d="M75 90V65C75 51.1929 86.1929 40 100 40C113.807 40 125 51.1929 125 65V90" stroke="var(--accent-color)" strokeWidth="10" fill="none" />
        <circle cx="100" cy="120" r="8" fill="white" />
    </svg>
);

const NotFoundSticker = () => (
    <svg viewBox="0 0 200 200" className="error-sticker" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="var(--accent-color)" opacity="0.1" />
        <circle cx="90" cy="90" r="45" stroke="var(--accent-color)" strokeWidth="8" fill="none" />
        <line x1="125" y1="125" x2="160" y2="160" stroke="var(--accent-color)" strokeWidth="12" strokeLinecap="round" />
        <text x="75" y="105" fontSize="40" fontWeight="bold" fill="var(--accent-color)">?</text>
    </svg>
);

const ServerErrorSticker = () => (
    <svg viewBox="0 0 200 200" className="error-sticker" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="#e53935" opacity="0.1" />
        <rect x="50" y="60" width="100" height="80" rx="10" fill="#e53935" />
        <path d="M70 85L90 105L130 65" stroke="white" strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="100" cy="115" r="5" fill="white" opacity="0.5" />
        <path d="M160 50L175 35M170 80L185 85" stroke="#e53935" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

const OfflineSticker = () => (
    <svg viewBox="0 0 200 200" className="error-sticker" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="var(--text-secondary)" opacity="0.1" />
        <path d="M50 140C50 140 70 100 100 100C130 100 150 140 150 140" stroke="var(--text-secondary)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M70 110C70 110 85 90 100 90C115 90 130 110 130 110" stroke="var(--text-secondary)" strokeWidth="8" strokeLinecap="round" opacity="0.6" fill="none" />
        <circle cx="100" cy="150" r="10" fill="var(--text-secondary)" />
        <line x1="40" y1="40" x2="160" y2="160" stroke="#e53935" strokeWidth="8" strokeLinecap="round" />
    </svg>
);

const ErrorPage = ({ errorCode = 404 }: ErrorPageProps) => {
    const navigate = useNavigate();

    const errorConfig = {
        401: {
            badge: "401 Unauthorized",
            sticker: <UnauthorizedSticker />,
            title: "Khu vực hạn chế!",
            desc: "Phiên đăng nhập của bạn đã hết hạn hoặc bạn không có quyền truy cập vào đây.",
            btnText: "Quay lại Đăng nhập",
            action: () => navigate("/login")
        },
        403: {
            badge: "403 Forbidden",
            sticker: <UnauthorizedSticker />,
            title: "Khu vực cấm!",
            desc: "Bạn không có quyền truy cập vào trang này. Vui lòng quay lại trang chủ.",
            btnText: "Về trang chủ",
            action: () => navigate("/")
        },
        404: {
            badge: "404 Not Found",
            sticker: <NotFoundSticker />,
            title: "Không tìm thấy trang!",
            desc: "Địa chỉ bạn đang truy cập không tồn tại hoặc đã bị gỡ bỏ.",
            btnText: "Về trang chủ",
            action: () => navigate("/")
        },
        500: {
            badge: "500 Server Error",
            sticker: <ServerErrorSticker />,
            title: "Ối dồi ôi! Máy chủ đang nghỉ ngơi...",
            desc: "Hệ thống đang gặp sự cố nhỏ. Đội ngũ kỹ thuật đang sửa chữa, bạn quay lại sau nhé!",
            btnText: "Tải lại trang",
            action: () => window.location.reload()
        },
        'offline': {
            badge: "Offline",
            sticker: <OfflineSticker />,
            title: "Rớt mạng rồi bạn ơi!",
            desc: "Vui lòng kiểm tra lại kết nối WiFi hoặc 4G của bạn để tiếp tục trò chuyện.",
            btnText: "Thử kết nối lại",
            action: () => window.location.reload()
        }
    };

    const config = errorConfig[errorCode] || errorConfig[404];

    return (
        <div className="error-page">
            <div className="error-content">
                <div className="error-sticker-container">
                    {config.sticker}
                </div>
                
                <div className="error-badge">{config.badge}</div>
                <h1 className="error-title">{config.title}</h1>
                <p className="error-desc">{config.desc}</p>
                
                <button className="error-btn" onClick={config.action}>
                    {config.btnText}
                </button>
            </div>
        </div>
    );
};

export default ErrorPage;
