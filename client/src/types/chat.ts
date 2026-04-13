export interface User {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    lastSeen?: string;
    bio?: string;
    fullName?: string;
    birthday?: string;
    blockedUsers?: string[];
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
        isRead?: boolean;
        createdAt: string;
    } | null;
    updatedAt: string;
    unreadCount?: number;
    isMuted?: boolean;
    isTemporary?: boolean;
    isPinned?: boolean;
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
    isRead?: boolean;
    deletedFor?: string[];
    isDeleted?: boolean;
    reactions?: { user: string; emoji: string }[];
    replyTo?: Message;
    isEdited?: boolean;
    isPinned?: boolean;
    pinnedFor?: string[];
    type?: 'text' | 'image' | 'voice' | 'system';
    forwardFrom?: { _id: string; username: string; avatar?: string };
    isSending?: boolean;
    tempId?: string;
    createdAt: string;
}
