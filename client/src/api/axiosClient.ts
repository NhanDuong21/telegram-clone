import axios from "axios";

const isDev = import.meta.env.DEV;
const baseUrl = import.meta.env.VITE_API_URL || (isDev ? "http://localhost:5000/api" : "/api");

const axiosClient = axios.create({
    baseURL: baseUrl,
    timeout: 15000, 
});

export default axiosClient;