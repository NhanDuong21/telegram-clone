import axios from "axios";

const API = "http://localhost:5000/api/users";

// Lấy token từ localStorage để gắn vào header
const getAuthHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

// GET /api/users/search?q=keyword
export const searchUsersApi = (query: string) => {
    return axios.get(`${API}/search?q=${encodeURIComponent(query)}`, getAuthHeader());
};
