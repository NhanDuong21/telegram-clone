import { memo } from 'react';
import './ImageAlbum.css';

interface ImageAlbumProps {
    images: string[];
    onImageClick?: (url: string) => void;
    onContextMenu?: (e: React.MouseEvent, imageUrl: string) => void;
}

const ImageAlbum = ({ images, onImageClick, onContextMenu }: ImageAlbumProps) => {
    const count = Math.min(images.length, 5);
    
    return (
        <div className={`image-album album-grid-${count}`}>
            {images.slice(0, 5).map((url, i) => (
                <div 
                    key={i} 
                    className={`album-item item-${i}`} 
                    onClick={() => onImageClick?.(url)}
                    onContextMenu={(e) => onContextMenu?.(e, url)}
                >
                    <img src={url} alt={`Shared ${i + 1}`} loading="lazy" />
                </div>
            ))}
        </div>
    );
};

export default memo(ImageAlbum);
