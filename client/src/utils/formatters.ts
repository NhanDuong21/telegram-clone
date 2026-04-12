export const formatUserStatus = (isOnline: boolean, lastSeen: Date | string | undefined): string => {
    if (isOnline) {
        return "Online";
    }

    if (!lastSeen) {
        return "Truy cập gần đây";
    }

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMs = now.getTime() - lastSeenDate.getTime();
    
    // Within 60 minutes
    if (diffInMs < 3600000) {
        const minutes = Math.floor(diffInMs / 60000);
        return minutes <= 1 ? "Vừa mới truy cập" : `Truy cập ${minutes} phút trước`;
    }

    // Within 24 hours
    if (diffInMs < 86400000) {
        const hours = Math.floor(diffInMs / 3600000);
        return `Truy cập ${hours} giờ trước`;
    }

    // More than 24 hours
    return "Truy cập gần đây";
};
