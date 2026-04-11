import axiosClient from "./axiosClient";

const API = `/auth`;

export const loginApi = (data: { email: string; password: string }) => {
    return axiosClient.post(`${API}/login`, data);
};

export const registerApi = (data: {
    username: string;
    email: string;
    password: string;
}) => {
    return axiosClient.post(`${API}/register`, data);
};

export const getMeApi = (token: string) => {
    return axiosClient.get(`${API}/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};