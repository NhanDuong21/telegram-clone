import { useRef } from 'react';
import { Play, Loader2 } from 'lucide-react';
import MediaMetaOverlay from './MediaMetaOverlay';
import './VideoMessage.css';

interface VideoMessageProps {
    videoUrl: string;
    videoDuration?: number;
    videoWidth?: number;
    videoHeight?: number;
    createdAt: string;
    isSending?: boolean;
    isError?: boolean;
    isMe?: boolean;
    isRead?: boolean;
    progress?: number;
    onVideoClick: (url: string) => void;
    onMediaLoad?: () => void;
}

const VideoMessage = ({ 
    videoUrl, 
    videoDuration, 
    videoWidth, 
    videoHeight, 
    createdAt,
    isSending, 
    isError, 
    isMe = false,
    isRead = false,
    progress,
    onVideoClick,
    onMediaLoad
}: VideoMessageProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Format duration helper (sec to mm:ss)
    const formatDuration = (seconds?: number) => {
        if (!seconds) return "";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Poster logic: Cloudinary auto-thumb
    const posterUrl = videoUrl.includes('cloudinary.com') 
        ? videoUrl.replace(/\.[^/.]+$/, ".jpg") 
        : undefined;

    const handleContainerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onVideoClick(videoUrl);
    };

    const containerStyle: React.CSSProperties = {};
    if (videoWidth && videoHeight) {
        containerStyle.aspectRatio = `${videoWidth} / ${videoHeight}`;
    }

    return (
        <div 
            className={`smart-video-container ${isSending ? 'is-sending' : ''}`}
            style={containerStyle}
            onClick={handleContainerClick}
        >
            <div className="video-blurred-bg">
                <img src={posterUrl} alt="" className="blurred-img" onLoad={onMediaLoad} />
            </div>

            <video 
                ref={videoRef}
                className="smart-video-main"
                src={videoUrl}
                poster={posterUrl}
                preload="metadata"
                onLoadedData={onMediaLoad}
            />
            
            <div className="video-content-overlay">
                {isSending ? (
                    <div className="video-status-center">
                        {progress !== undefined && progress < 100 ? (
                            <div className="upload-progress-circle">
                                <svg viewBox="0 0 36 36" className="circular-chart">
                                    <path className="circle-bg"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path className="circle"
                                        strokeDasharray={`${progress}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="progress-text">{progress}%</div>
                            </div>
                        ) : (
                            <Loader2 className="animate-spin text-white" size={32} />
                        )}
                    </div>
                ) : (
                    <div className="video-status-center">
                        <div className="play-icon-circle">
                            <Play fill="white" size={24} />
                        </div>
                    </div>
                )}

                <div className="video-info-bottom">
                    <div className="video-duration">
                        {videoDuration ? formatDuration(videoDuration) : ""}
                    </div>
                    {/* Only show overlay here if it's pure media, otherwise it's in the bubble footer */}
                    {/* But wait, prompt says ALWAYS overlay for media. Let's follow prompt. */}
                    <MediaMetaOverlay 
                        createdAt={createdAt} 
                        isMe={isMe} 
                        isSending={isSending} 
                        isRead={isRead} 
                    />
                </div>
            </div>

            {isError && (
                <div className="video-error-overlay">
                    <span>Lỗi tải video</span>
                </div>
            )}
        </div>
    );
};

export default VideoMessage;
