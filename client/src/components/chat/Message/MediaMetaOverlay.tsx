import { Clock, Check, CheckCheck } from "lucide-react";
import "./MediaMetaOverlay.css";

interface MediaMetaOverlayProps {
    createdAt: string;
    isMe: boolean;
    isSending?: boolean;
    isRead?: boolean;
}

const MediaMetaOverlay = ({ createdAt, isMe, isSending, isRead }: MediaMetaOverlayProps) => {
    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="media-meta-overlay">
            <span className="media-timestamp">{formatTime(createdAt)}</span>
            {isMe && (
                <div className="media-status-icons">
                    {isSending ? (
                        <Clock size={12} className="media-status-icon color-sending" />
                    ) : isRead ? (
                        <CheckCheck size={14} className="media-status-icon color-read" />
                    ) : (
                        <Check size={14} className="media-status-icon color-sent" />
                    )}
                </div>
            )}
        </div>
    );
};

export default MediaMetaOverlay;
