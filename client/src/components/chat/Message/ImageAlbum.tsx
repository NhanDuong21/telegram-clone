import { memo } from 'react';
import { Loader2, AlertCircle, RefreshCw, Play } from 'lucide-react';
import MediaMetaOverlay from './MediaMetaOverlay';
import './ImageAlbum.css';

export interface MediaAttachment {
    id: string;
    type: 'image' | 'video';
    url: string;
}

interface ImageAlbumProps {
    mediaItems: MediaAttachment[];
    isSending?: boolean;
    isError?: boolean;
    onMediaClick?: (url: string, type: 'image' | 'video') => void;
    onContextMenu?: (e: React.MouseEvent, url: string) => void;
    progress?: number;
    isMe?: boolean;
    isRead?: boolean;
    createdAt?: string;
    onMediaLoad?: () => void;
}

const ImageAlbum = ({ mediaItems, isSending, isError, onMediaClick, onContextMenu, progress, isMe = false, isRead = false, createdAt, onMediaLoad }: ImageAlbumProps) => {
    return (
        <div className={`media-grid ${isSending ? 'is-sending' : ''} ${isError ? 'is-error' : ''}`}>
            {mediaItems.map((item) => (
                <div 
                    key={item.id} 
                    className="media-item" 
                    onClick={() => !isSending && onMediaClick?.(item.url, item.type)}
                    onContextMenu={(e) => !isSending && onContextMenu?.(e, item.url)}
                >
                    {item.type === 'video' ? (
                        <>
                            <video src={item.url} onLoadedData={onMediaLoad} />
                            <div className="media-video-icon">
                                <Play size={20} fill="currentColor" />
                            </div>
                        </>
                    ) : (
                        <img src={item.url} alt="Attached" loading="lazy" onLoad={onMediaLoad} />
                    )}
                </div>
            ))}

            {isSending && (
                <div className="media-overlay media-overlay--loading">
                    {progress !== undefined && progress < 100 ? (
                        <div className="upload-progress-circle album-progress">
                            <svg viewBox="0 0 36 36" className="circular-chart">
                                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="circle" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="progress-text">{progress}%</div>
                        </div>
                    ) : (
                        <>
                            <Loader2 className="spinner-icon" size={24} />
                            <span>Đang gửi...</span>
                        </>
                    )}
                </div>
            )}

            {isError && (
                <div className="media-overlay media-overlay--error">
                    <AlertCircle className="error-icon" size={24} />
                    <span>Lỗi tải lên</span>
                    <button className="retry-media-btn" title="Thử lại">
                        <RefreshCw size={14} />
                    </button>
                </div>
            )}

            {createdAt && (
                <MediaMetaOverlay 
                    createdAt={createdAt} 
                    isMe={isMe} 
                    isSending={isSending} 
                    isRead={isRead} 
                />
            )}
        </div>
    );
};

export default memo(ImageAlbum);
