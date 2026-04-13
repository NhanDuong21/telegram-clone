export * from "./chat";

export interface User {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
    displayName?: string;
    lastSeen?: string;
    phone?: string;
    blockedUsers?: string[];
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}
