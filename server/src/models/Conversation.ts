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
