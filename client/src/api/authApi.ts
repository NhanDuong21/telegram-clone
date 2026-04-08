import axios from "axios";

const API = "http://localhost:5000/api/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loginApi = (data: any) => {
    return axios.post(`${API}/login`, data);
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerApi = (data: any) => {
    return axios.post(`${API}/register`, data);
};