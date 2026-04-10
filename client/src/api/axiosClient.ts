import axios from "axios";

const rawDomain = import.meta.env.VITE_API_URL || "";
const baseURL = `${rawDomain.replace(/\/$/, "")}/api`;

const axiosClient = axios.create({
    baseURL,
});

export default axiosClient;