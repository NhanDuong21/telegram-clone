import { useState, useCallback, useRef, useEffect } from 'react';

interface ContextMenuPos {
    x: number;
    y: number;
}

export const useContextMenu = () => {
    const [pos, setPos] = useState<ContextMenuPos | null>(null);
    const [targetItem, setTargetItem] = useState<any>(null);
    const longPressTimer = useRef<any>(null);

    const onContextMenu = useCallback((e: React.MouseEvent, item: any) => {
        e.preventDefault();
        e.stopPropagation();
        setPos({ x: e.clientX, y: e.clientY });
        setTargetItem(item);
    }, []);

    const onTouchStart = useCallback((e: React.TouchEvent, item: any) => {
        longPressTimer.current = setTimeout(() => {
            const touch = e.touches[0];
            e.stopPropagation();
            setPos({ x: touch.clientX, y: touch.clientY });
            setTargetItem(item);
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
        onContextMenu,
        onTouchStart,
        onTouchEnd,
        closeContextMenu
    };
};
