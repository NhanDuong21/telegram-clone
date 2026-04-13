import type { AxiosResponse } from "axios";
import axiosClient from "./axiosClient";
import type { User } from "../types";

const API = `/users`;

const getAuthHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

export const searchUsersApi = (query: string): Promise<AxiosResponse<{ users: User[] }>> => {
    return axiosClient.get(`${API}/search?q=${encodeURIComponent(query)}`, getAuthHeader());
};

export const updateProfileApi = (data: FormData): Promise<AxiosResponse<{ user: User }>> => {
    return axiosClient.put(`${API}/me`, data, getAuthHeader());
};

export const getUserProfileApi = (id: string) => {
    return axiosClient.get(`${API}/${id}/profile`, getAuthHeader());
};

export const toggleBlockUserApi = (targetId: string): Promise<AxiosResponse<{ blockedUsers: string[] }>> => {
    return axiosClient.post(`${API}/toggle-block`, { targetId }, getAuthHeader());
};
export const requestEmailChangeApi = (newEmail: string): Promise<AxiosResponse<{ message: string }>> => {
    return axiosClient.post(`${API}/request-email-change`, { newEmail }, getAuthHeader());
};

export const verifyEmailChangeApi = (newEmail: string, otp: string): Promise<AxiosResponse<{ user: User, message: string }>> => {
    return axiosClient.post(`${API}/verify-email-change`, { newEmail, otp }, getAuthHeader());
};
