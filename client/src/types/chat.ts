export interface User {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
}

export interface Conversation {
    _id: string;
    participants: User[];
    isGroup?: boolean;
    name?: string;
    imageUrl?: string;
    owner?: string;
    lastMessage?: {
        _id: string;
        text: string;
    } | null;
    updatedAt: string;
}

export interface Message {
    _id: string;
    conversationId: string;
    text?: string;
    imageUrl?: string;
    sender: {
        _id: string;
        username: string;
        avatar?: string;
    };
    readBy?: string[];
    createdAt: string;
}
