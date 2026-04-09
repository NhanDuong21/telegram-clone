import axios from "axios";

const BASE = "http://localhost:5000/api";

const getAuthHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});


export const getConversationsApi = () =>
    axios.get(`${BASE}/conversations`, getAuthHeader());

export const createOrGetConversationApi = (receiverId: string) =>
    axios.post(`${BASE}/conversations`, { receiverId }, getAuthHeader());

export const createGroupConversationApi = (name: string, participantIds: string[]) =>
    axios.post(`${BASE}/conversations/group`, { name, participantIds }, getAuthHeader());


export const updateGroupSettingsApi = (conversationId: string, data: { name?: string; imageUrl?: string }) =>
    axios.put(`${BASE}/conversations/${conversationId}/group-settings`, data, getAuthHeader());

export const addMembersApi = (conversationId: string, participantIds: string[]) =>
    axios.put(`${BASE}/conversations/${conversationId}/members`, { participantIds }, getAuthHeader());

export const removeMemberApi = (conversationId: string, memberId: string) =>
    axios.delete(`${BASE}/conversations/${conversationId}/members/${memberId}`, getAuthHeader());
    
export const getMessagesApi = (conversationId: string, before?: string, limit: number = 30) => {
    let url = `${BASE}/messages/${conversationId}?limit=${limit}`;
    if (before) url += `&before=${encodeURIComponent(before)}`;
    return axios.get(url, getAuthHeader());
};

export const sendMessageApi = (conversationId: string, data: { text?: string; imageUrl?: string }) =>
    axios.post(`${BASE}/messages`, { conversationId, ...data }, getAuthHeader());

export const uploadImageApi = (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return axios.post(`${BASE}/upload`, formData, {
        headers: {
            ...getAuthHeader().headers,
            "Content-Type": "multipart/form-data"
        }
    });
};
