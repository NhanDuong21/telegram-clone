import axios from "axios";

// Xử lý tự động chuẩn hóa URL, ngăn lỗi điền thiếu/thừa gạch chéo
const rawDomain = import.meta.env.VITE_API_URL || "";
// Đảm bảo baseURL lúc nào cũng auto có đít /api trước khi gọi
const baseURL = `${rawDomain.replace(/\/$/, "")}/api`;

const axiosClient = axios.create({
    baseURL,
});

export default axiosClient;
