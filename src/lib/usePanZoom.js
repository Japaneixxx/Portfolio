import { useRef, useState, useCallback } from "react";

const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;
const ZOOM_FACTOR = 1.12;

export function usePanZoom(initialOffset = { x: 0, y: 0 }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState(initialOffset);
  const viewportRef = useRef(null);
  const dragState = useRef(null);

  const onMouseDown = useCallback(
    (e) => {
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffset: { ...offset },
      };
    },
    [offset],
  );

  const onMouseMove = useCallback((e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset({
      x: dragState.current.startOffset.x + dx,
      y: dragState.current.startOffset.y + dy,
    });
  }, []);

  const onMouseUp = useCallback(() => {
    dragState.current = null;
  }, []);

  const onTouchStart = useCallback(
    (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      dragState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startOffset: { ...offset },
      };
    },
    [offset],
  );

  const onTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    if (!touch || !dragState.current) return;
    e.preventDefault();
    const dx = touch.clientX - dragState.current.startX;
    const dy = touch.clientY - dragState.current.startY;
    setOffset({
      x: dragState.current.startOffset.x + dx,
      y: dragState.current.startOffset.y + dy,
    });
  }, []);

  const zoomAt = useCallback((mouseX, mouseY, factor) => {
    setScale((prevScale) => {
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, prevScale * factor),
      );
      setOffset((prevOffset) => ({
        x: mouseX - (mouseX - prevOffset.x) * (newScale / prevScale),
        y: mouseY - (mouseY - prevOffset.y) * (newScale / prevScale),
      }));
      return newScale;
    });
  }, []);

  const onWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = viewportRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      zoomAt(mouseX, mouseY, factor);
    },
    [zoomAt],
  );

  const zoomIn = useCallback(() => {
    const rect = viewportRef.current.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, ZOOM_FACTOR);
  }, [zoomAt]);

  const zoomOut = useCallback(() => {
    const rect = viewportRef.current.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, 1 / ZOOM_FACTOR);
  }, [zoomAt]);

  const reset = useCallback(() => {
    setScale(1);
    setOffset(initialOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    viewportRef,
    scale,
    offset,
    canvasStyle: {
      transformOrigin: "0 0",
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    },
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd: onMouseUp,
      onTouchCancel: onMouseUp,
      onWheel,
    },
    zoomIn,
    zoomOut,
    reset,
  };
}
