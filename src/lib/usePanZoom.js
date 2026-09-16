import { useRef, useState, useCallback, useEffect } from "react";

const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;
const ZOOM_FACTOR = 1.12;

function touchDistance(first, second) {
  return Math.hypot(
    second.clientX - first.clientX,
    second.clientY - first.clientY,
  );
}

function touchCenter(first, second, rect) {
  return {
    x: (first.clientX + second.clientX) / 2 - rect.left,
    y: (first.clientY + second.clientY) / 2 - rect.top,
  };
}

export function usePanZoom(initialOffset = { x: 0, y: 0 }, canvasSize = null) {
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
      if (e.touches.length >= 2) {
        const rect = viewportRef.current.getBoundingClientRect();
        dragState.current = {
          type: "pinch",
          distance: touchDistance(e.touches[0], e.touches[1]),
          scale,
          offset: { ...offset },
          center: touchCenter(e.touches[0], e.touches[1], rect),
        };
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;
      dragState.current = {
        type: "pan",
        startX: touch.clientX,
        startY: touch.clientY,
        startOffset: { ...offset },
      };
    },
    [offset, scale],
  );

  const onTouchMove = useCallback(
    (e) => {
      if (e.touches.length >= 2 && dragState.current?.type === "pinch") {
        e.preventDefault();
        const rect = viewportRef.current.getBoundingClientRect();
        const distance = touchDistance(e.touches[0], e.touches[1]);
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(
            MIN_SCALE,
            dragState.current.scale * (distance / dragState.current.distance),
          ),
        );
        const center = touchCenter(e.touches[0], e.touches[1], rect);
        const baseX = canvasSize ? (rect.width - canvasSize.width) / 2 : 0;
        const baseY = canvasSize ? (rect.height - canvasSize.height) / 2 : 0;
        const canvasPointX =
          (dragState.current.center.x - baseX - dragState.current.offset.x) /
          dragState.current.scale;
        const canvasPointY =
          (dragState.current.center.y - baseY - dragState.current.offset.y) /
          dragState.current.scale;
        setScale(nextScale);
        setOffset({
          x: center.x - baseX - canvasPointX * nextScale,
          y: center.y - baseY - canvasPointY * nextScale,
        });
        return;
      }
      const touch = e.touches[0];
      if (!touch || !dragState.current || dragState.current.type !== "pan")
        return;
      e.preventDefault();
      const dx = touch.clientX - dragState.current.startX;
      const dy = touch.clientY - dragState.current.startY;
      setOffset({
        x: dragState.current.startOffset.x + dx,
        y: dragState.current.startOffset.y + dy,
      });
    },
    [canvasSize],
  );

  const onTouchEnd = useCallback(
    (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        dragState.current = {
          type: "pan",
          startX: touch.clientX,
          startY: touch.clientY,
          startOffset: { ...offset },
        };
        return;
      }
      dragState.current = null;
    },
    [offset],
  );

  const zoomAt = useCallback((viewportX, viewportY, factor) => {
    const rect = viewportRef.current.getBoundingClientRect();
    const baseX = canvasSize ? (rect.width - canvasSize.width) / 2 : 0;
    const baseY = canvasSize ? (rect.height - canvasSize.height) / 2 : 0;
    setScale((prevScale) => {
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, prevScale * factor),
      );
      setOffset((prevOffset) => ({
        x:
          viewportX -
          baseX -
          (viewportX - baseX - prevOffset.x) * (newScale / prevScale),
        y:
          viewportY -
          baseY -
          (viewportY - baseY - prevOffset.y) * (newScale / prevScale),
      }));
      return newScale;
    });
  }, []);

  const onWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = viewportRef.current.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      zoomAt(viewportX, viewportY, factor);
    },
    [zoomAt],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const preventPageScroll = (event) => event.preventDefault();
    viewport.addEventListener("wheel", preventPageScroll, { passive: false });
    return () => viewport.removeEventListener("wheel", preventPageScroll);
  }, []);

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
      onTouchEnd,
      onTouchCancel: onMouseUp,
      onWheel,
    },
    zoomIn,
    zoomOut,
    reset,
  };
}
