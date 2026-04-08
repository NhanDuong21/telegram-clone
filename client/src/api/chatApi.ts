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


export const getMessagesApi = (conversationId: string) =>
    axios.get(`${BASE}/messages/${conversationId}`, getAuthHeader());

export const sendMessageApi = (conversationId: string, text: string) =>
    axios.post(`${BASE}/messages`, { conversationId, text }, getAuthHeader());
