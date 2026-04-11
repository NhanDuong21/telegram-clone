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
        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;
