import type { AxiosResponse } from "axios";
import axiosClient from "./axiosClient";
import type { Conversation, Message } from "../types";

const getAuthHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

export const getConversationsApi = (): Promise<AxiosResponse<{ conversations: Conversation[] }>> =>
    axiosClient.get(`/conversations`, getAuthHeader());

export const createOrGetConversationApi = (receiverId: string): Promise<AxiosResponse<{ conversation: Conversation }>> =>
    axiosClient.post(`/conversations`, { receiverId }, getAuthHeader());

export const createGroupConversationApi = (
    name: string,
    participantIds: string[]
): Promise<AxiosResponse<{ conversation: Conversation }>> =>
    axiosClient.post(
        `/conversations/group`,
        { name, participantIds },
        getAuthHeader()
    );

export const updateGroupSettingsApi = (
    conversationId: string,
    data: { name?: string; imageUrl?: string }
): Promise<AxiosResponse<{ conversation: Conversation }>> =>
    axiosClient.put(
        `/conversations/${conversationId}/group-settings`,
        data,
        getAuthHeader()
    );

export const addMembersApi = (conversationId: string, participantIds: string[]) =>
    axiosClient.put(
        `/conversations/${conversationId}/members`,
        { participantIds },
        getAuthHeader()
    );

export const removeMemberApi = (conversationId: string, memberId: string) =>
    axiosClient.delete(
        `/conversations/${conversationId}/members/${memberId}`,
        getAuthHeader()
    );

export const deleteGroupApi = (conversationId: string) =>
    axiosClient.delete(`/conversations/${conversationId}/group`, getAuthHeader());

export const clearChatApi = (conversationId: string) =>
    axiosClient.delete(
        `/conversations/${conversationId}/messages`,
        getAuthHeader()
    );

export const deleteConversationApi = (conversationId: string) =>
    axiosClient.delete(`/conversations/${conversationId}`, getAuthHeader());

export const getMessagesApi = (
    conversationId: string,
    before?: string,
    limit: number = 30
): Promise<AxiosResponse<{ messages: Message[]; hasMore: boolean }>> => {
    let url = `/messages/${conversationId}?limit=${limit}`;
    if (before) url += `&before=${encodeURIComponent(before)}`;
    return axiosClient.get(url, getAuthHeader());
};

export const sendMessageApi = (
    conversationId: string,
    data: { text?: string; imageUrl?: string; replyTo?: string; forwardFrom?: string }
): Promise<AxiosResponse<{ message: Message }>> =>
    axiosClient.post(`/messages`, { conversationId, ...data }, getAuthHeader());

export const updateMessageApi = (
    messageId: string,
    data: { text?: string; isPinned?: boolean }
): Promise<AxiosResponse<{ updatedMessage: Message }>> =>
    axiosClient.patch(`/messages/${messageId}`, data, getAuthHeader());

export const uploadImageApi = (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    return axiosClient.post(`/upload`, formData, {
        headers: {
            ...getAuthHeader().headers,
            "Content-Type": "multipart/form-data",
        },
    });
};

export const deleteMessageApi = (messageId: string, type: 'one-way' | 'two-way') =>
    axiosClient.delete(`/messages/${messageId}`, {
        data: { type },
        ...getAuthHeader()
    });