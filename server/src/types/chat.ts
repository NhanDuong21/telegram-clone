import mongoose from "mongoose";

export interface IMessage extends mongoose.Document {
    conversationId: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    text?: string;
    imageUrl?: string;
    imageUrls?: string[];
    readBy: mongoose.Types.ObjectId[];
    isRead: boolean;
    deletedFor: mongoose.Types.ObjectId[];
    isDeleted?: boolean;
    reactions: { user: mongoose.Types.ObjectId; emoji: string }[];
    replyTo?: mongoose.Types.ObjectId;
    isEdited?: boolean;
    isPinned?: boolean;
    pinnedFor: mongoose.Types.ObjectId[];
    forwardFrom?: any;
    videoUrl?: string;
    videoUrls?: string[];
    videoDuration?: number;
    videoDurations?: number[];
    videoWidth?: number;
    videoHeight?: number;
    type?: 'text' | 'image' | 'video' | 'voice' | 'system';
    createdAt: Date;
    updatedAt: Date;
}

export interface IConversation extends mongoose.Document {
    participants: mongoose.Types.ObjectId[];
    isGroup: boolean;
    name?: string;
    imageUrl?: string;
    lastMessage?: mongoose.Types.ObjectId;
    owner?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
