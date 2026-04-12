import mongoose from "mongoose";

export interface IMessage extends mongoose.Document {
    conversationId: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    text?: string;
    imageUrl?: string;
    readBy: mongoose.Types.ObjectId[];
    isRead: boolean;
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
