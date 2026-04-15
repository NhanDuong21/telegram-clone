import mongoose, { Schema } from "mongoose";
import { IMessage } from "../types/chat";
export type { IMessage };

const messageSchema = new Schema<IMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            trim: true,
            default: "",
        },
        imageUrl: {
            type: String,
            trim: true,
            default: "",
        },
        imageUrls: {
            type: [String],
            default: [],
        },
        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isRead: {
            type: Boolean,
            default: false,
        },
        deletedFor: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isDeleted: {
            type: Boolean,
            default: false,
        },
        reactions: [
            {
                user: { type: Schema.Types.ObjectId, ref: "User" },
                emoji: String,
            },
        ],
        replyTo: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        pinnedFor: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        forwardFrom: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        videoUrl: {
            type: String,
            trim: true,
            default: "",
        },
        videoUrls: {
            type: [String],
            default: [],
        },
        videoDuration: { type: Number, default: 0 },
        videoDurations: { type: [Number], default: [] },
        videoWidth: { type: Number },
        videoHeight: { type: Number },
        type: {
            type: String,
            enum: ['text', 'image', 'video', 'voice', 'system'],
            default: 'text',
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;
