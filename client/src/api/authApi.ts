import axiosClient from "./axiosClient";

const API = `/auth`;

export const loginApi = (data: { email: string; password: string }) => {
    return axiosClient.post(`${API}/login`, data);
};

export const registerApi = (data: {
    username: string;
    email: string;
    password: string;
    verificationToken: string;
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

export const sendOtpApi = (email: string, type: 'register' | 'forgot') => {
    return axiosClient.post(`${API}/send-otp`, { email, type });
};

export const verifyOtpApi = (email: string, otp: string) => {
    return axiosClient.post(`${API}/verify-otp`, { email, otp });
};

export const resetPasswordApi = (data: any) => {
    return axiosClient.post(`${API}/reset-password`, data);
};