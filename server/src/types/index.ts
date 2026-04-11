import { Request } from "express";
import { IUser } from "../models/User";
import { IMessage, IConversation } from "./chat";

export * from "./chat";

export interface AuthRequest extends Request {
    user?: any;
    file?: any;
}

export type { IUser, IMessage, IConversation };
