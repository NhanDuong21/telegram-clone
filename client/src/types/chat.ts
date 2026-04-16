export interface User {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    lastSeen?: string;
    bio?: string;
    fullName?: string;
    birthday?: string;
    phone?: string;
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
        type?: 'text' | 'image' | 'video' | 'voice' | 'system';
        isDeleted?: boolean;
        isRead?: boolean;
        createdAt: string;
    } | null;
    updatedAt: string;
    unreadCount?: number;
    isMuted?: boolean;
    isTemporary?: boolean;
    isPinned?: boolean;
    description?: string;
    showHistoryForNewMembers?: boolean;
    permissions?: {
        sendMessages?: boolean;
        sendMedia?: boolean;
        addMembers?: boolean;
        pinMessages?: boolean;
        changeGroupInfo?: boolean;
    };
}

export interface Message {
    _id: string;
    conversationId: string;
    text?: string;
    imageUrl?: string;
    imageUrls?: string[];
    sender: {
        _id: string;
        username: string;
        fullName?: string;
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
    videoUrl?: string;
    videoDuration?: number;
    videoWidth?: number;
    videoHeight?: number;
    type?: 'text' | 'image' | 'video' | 'voice' | 'system';
    forwardFrom?: { _id: string; username: string; fullName?: string; avatar?: string };
    isSending?: boolean;
    isError?: boolean;
    tempId?: string;
    createdAt: string;
}
