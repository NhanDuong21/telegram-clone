import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCcw, RotateCw } from 'lucide-react';
import './AvatarCropperModal.css';

interface AvatarCropperModalProps {
    imageSrc: string;
    onCancel: () => void;
    onCropDone: (croppedBlob: Blob, previewUrl: string) => void;
}

/**
 * Utility: create a cropped image from a canvas, handling zoom + rotation.
 */
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    rotation: number = 0
): Promise<{ blob: Blob; url: string }> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas toBlob failed'));
                return;
            }
            const url = URL.createObjectURL(blob);
            resolve({ blob, url });
        }, 'image/jpeg', 0.92);
    });
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (err) => reject(err));
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = url;
    });
}

const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({ imageSrc, onCancel, onCropDone }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleDone = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const { blob, url } = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            onCropDone(blob, url);
        } catch (err) {
            console.error('Crop failed:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="cropper-overlay">
            {/* Header */}
            <div className="cropper-header">
                <div className="cropper-header-left">
                    <button className="cropper-close-btn" onClick={onCancel}>
                        <X size={22} />
                    </button>
                    <h3>Căn chỉnh ảnh</h3>
                </div>
                <button
                    className="cropper-done-btn"
                    onClick={handleDone}
                    disabled={isProcessing}
                    title="Đặt ảnh"
                >
                    <Check size={22} />
                </button>
            </div>

            {/* Crop Area */}
            <div className="cropper-area">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    cropShape="round"
                    showGrid={true}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={onCropComplete}
                />
            </div>

            {/* Controls */}
            <div className="cropper-controls">
                {/* Zoom */}
                <div className="cropper-zoom-row">
                    <ZoomOut size={18} />
                    <input
                        type="range"
                        className="cropper-slider"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                    />
                    <ZoomIn size={18} />
                </div>

                {/* Rotate */}
                <div className="cropper-rotate-row">
                    <button className="cropper-rotate-btn" onClick={() => setRotation((r) => r - 90)} title="Xoay trái">
                        <RotateCcw size={18} />
                    </button>
                    <span className="cropper-rotate-label">{rotation}°</span>
                    <button className="cropper-rotate-btn" onClick={() => setRotation((r) => r + 90)} title="Xoay phải">
                        <RotateCw size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarCropperModal;
