import { useState, useCallback, useRef, useEffect } from 'react';

interface ContextMenuPos {
    x: number;
    y: number;
}

export const useContextMenu = () => {
    const [pos, setPos] = useState<ContextMenuPos | null>(null);
    const [targetItem, setTargetItem] = useState<any>(null);
    const [targetFileUrl, setTargetFileUrl] = useState<string | null>(null);
    const longPressTimer = useRef<any>(null);

    const onContextMenu = useCallback((e: React.MouseEvent, item: any, fileUrl?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setPos({ x: e.clientX, y: e.clientY });
        setTargetItem(item);
        setTargetFileUrl(fileUrl || null);
    }, []);

    const onTouchStart = useCallback((e: React.TouchEvent, item: any, fileUrl?: string) => {
        longPressTimer.current = setTimeout(() => {
            const touch = e.touches[0];
            e.stopPropagation();
            setPos({ x: touch.clientX, y: touch.clientY });
            setTargetItem(item);
            setTargetFileUrl(fileUrl || null);
        }, 500);
    }, []);

    const onTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const closeContextMenu = useCallback(() => {
        setPos(null);
        setTargetItem(null);
        setTargetFileUrl(null);
    }, []);

    useEffect(() => {
        const handleGlobalClick = () => closeContextMenu();
        if (pos) {
            window.addEventListener('click', handleGlobalClick);
            window.addEventListener('contextmenu', handleGlobalClick);
        }
        return () => {
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('contextmenu', handleGlobalClick);
        };
    }, [pos, closeContextMenu]);

    return {
        pos,
        targetItem,
        targetFileUrl,
        onContextMenu,
        onTouchStart,
        onTouchEnd,
        closeContextMenu
    };
};
