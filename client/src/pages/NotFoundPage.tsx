import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6">
      <div className="text-center">
        {/* Minh họa số 404 cách điệu */}
        <h1 className="text-9xl font-black text-blue-600 opacity-20">404</h1>

        <div className="relative -mt-20">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Hình như bạn đang đi lạc?
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang một
            địa chỉ khác.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Quay lại trang chủ
            </button>

            <button
              onClick={() => navigate(-1)}
              className="px-8 py-3 bg-white text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Trở về trang trước
            </button>
          </div>
        </div>
      </div>

      {/* Trang trí thêm (Option) */}
      <div className="mt-16 grid grid-cols-3 gap-8 opacity-40">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      </div>
    </div>
  );
};

export default NotFoundPage;
