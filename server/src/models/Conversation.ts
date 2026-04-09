import mongoose, { Schema, Document } from "mongoose";

// Conversation 1-1 giữa 2 user
export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    isGroup: boolean;
    name?: string;
    lastMessage?: mongoose.Types.ObjectId;   // Tin nhắn cuối cùng (để hiển thị preview)
    createdAt: Date;
    updatedAt: Date;
}

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

const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema);
export default Conversation;
