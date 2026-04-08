import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const loginApi = (data: { email: string; password: string }) => {
    return axios.post(`${API}/login`, data);
};

export const registerApi = (data: {
    username: string;
    email: string;
    password: string;
}) => {
    return axios.post(`${API}/register`, data);
};

export const getMeApi = (token: string) => {
    return axios.get(`${API}/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};