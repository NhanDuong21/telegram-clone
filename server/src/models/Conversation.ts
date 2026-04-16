import mongoose, { Schema } from "mongoose";
import { IConversation } from "../types/chat";

const conversationSchema = new Schema<IConversation>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        isGroup: {
            type: Boolean,
            default: false,
        },
        name: {
            type: String,
            default: "",
        },
        imageUrl: {
            type: String,
            default: "",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        description: {
            type: String,
            default: "",
        },
        showHistoryForNewMembers: {
            type: Boolean,
            default: true,
        },
        permissions: {
            sendMessages: { type: Boolean, default: true },
            sendMedia: { type: Boolean, default: true },
            addMembers: { type: Boolean, default: true },
            pinMessages: { type: Boolean, default: false },
            changeGroupInfo: { type: Boolean, default: false },
        },
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema);
export default Conversation;
