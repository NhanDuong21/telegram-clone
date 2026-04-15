import { memo } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import './ImageAlbum.css';

interface ImageAlbumProps {
    images: string[];
    isSending?: boolean;
    isError?: boolean;
    onImageClick?: (url: string) => void;
    onContextMenu?: (e: React.MouseEvent, imageUrl: string) => void;
    progress?: number;
}

const ImageAlbum = ({ images, isSending, isError, onImageClick, onContextMenu, progress }: ImageAlbumProps) => {
    const count = Math.min(images.length, 5);
    
    return (
        <div className={`image-album album-grid-${count} ${isSending ? 'is-sending' : ''} ${isError ? 'is-error' : ''}`}>
            {images.slice(0, 5).map((url, i) => (
                <div 
                    key={i} 
                    className={`album-item item-${i}`} 
                    onClick={() => !isSending && onImageClick?.(url)}
                    onContextMenu={(e) => !isSending && onContextMenu?.(e, url)}
                >
                    <img src={url} alt={`Shared ${i + 1}`} loading="lazy" />
                </div>
            ))}

            {isSending && (
                <div className="album-overlay album-overlay--loading">
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
                <div className="album-overlay album-overlay--error">
                    <AlertCircle className="error-icon" size={24} />
                    <span>Lỗi tải lên</span>
                    <button className="retry-album-btn" title="Thử lại">
                        <RefreshCw size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default memo(ImageAlbum);
