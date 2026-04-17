import mongoose, { Schema } from "mongoose";

export interface IUser extends mongoose.Document {
    username: string;
    email: string;
    password: string;
    avatar?: string;
    bio?: string;
    fullName?: string;
    birthday?: Date;
    lastSeen?: Date;
    blockedUsers: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, "Username là bắt buộc"],
            unique: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: function(v: string) {
                    return /^[a-z0-9_]{5,32}$/.test(v);
                },
                message: "Username phải từ 5 đến 32 ký tự, chỉ chứa chữ cái thường, số và dấu gạch dưới."
            },
            minlength: [5, "Username phải dài ít nhất 5 ký tự"],
            maxlength: [32, "Username không được vượt quá 32 ký tự"],
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        avatar: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            default: "",
        },
        fullName: {
            type: String,
            default: "",
        },
        birthday: {
            type: Date,
            default: null,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        blockedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;