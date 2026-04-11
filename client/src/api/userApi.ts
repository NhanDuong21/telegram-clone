import axiosClient from "./axiosClient";

const API = `/users`;

const getAuthHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

export const searchUsersApi = (query: string) => {
    return axiosClient.get(`${API}/search?q=${encodeURIComponent(query)}`, getAuthHeader());
};

export const updateProfileApi = (data: any) => {
    return axiosClient.put(`${API}/me`, data, getAuthHeader());
};