export const formatUserStatus = (isOnline: boolean, lastSeen: Date | string | undefined): string => {
    if (isOnline) {
        return "Online";
    }

    if (!lastSeen) {
        return "Offline";
    }

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return "Vừa mới truy cập";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `Truy cập ${diffInMinutes} phút trước`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `Truy cập ${diffInHours} giờ trước`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `Truy cập ${diffInDays} ngày trước`;
    }

    return `Truy cập ngày ${lastSeenDate.toLocaleDateString()}`;
};
