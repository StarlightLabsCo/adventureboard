import { useRef, useEffect, useState } from "react";

interface ViewportState {
    x: number;
    y: number;
    scale: number;
}

interface CanvasItem {
    id: number;
    type: "image";
    x: number;
    y: number;
    width: number;
    height: number;
    image: HTMLImageElement;
}

export function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [viewport, setViewport] = useState<ViewportState>({
        x: 0,
        y: 0,
        scale: 1,
    });
    const [items, setItems] = useState<CanvasItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [nextItemId, setNextItemId] = useState(1);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
        null
    );
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const draw = () => {
            if (!canvas || !ctx) return;

            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            ctx.scale(dpr, dpr);

            // Clear the entire canvas
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Apply viewport transformations
            ctx.save();
            ctx.translate(-viewport.x, -viewport.y);
            ctx.scale(viewport.scale, viewport.scale);

            // Draw grid
            const gridSize = 50;
            const startX = Math.floor(viewport.x / gridSize) * gridSize;
            const startY = Math.floor(viewport.y / gridSize) * gridSize;
            const endX = viewport.x + rect.width / viewport.scale;
            const endY = viewport.y + rect.height / viewport.scale;

            ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
            ctx.lineWidth = 1 / viewport.scale;

            for (let x = startX; x < endX; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, startY);
                ctx.lineTo(x, endY);
                ctx.stroke();
            }

            for (let y = startY; y < endY; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
                ctx.stroke();
            }

            const drawControlNodes = (item: CanvasItem) => {
                const nodeSize = 10 / viewport.scale;
                const innerNodeSize = 6 / viewport.scale;
                ctx.fillStyle = "rgba(0, 0, 0, 0)";
                ctx.strokeStyle = "rgb(100, 149, 237)";
                ctx.lineWidth = 2 / viewport.scale;

                // Draw selection rectangle
                ctx.fillRect(item.x, item.y, item.width, item.height);
                ctx.strokeRect(item.x, item.y, item.width, item.height);

                // Draw nodes
                const nodes = [
                    { x: item.x, y: item.y },
                    { x: item.x + item.width, y: item.y },
                    { x: item.x, y: item.y + item.height },
                    { x: item.x + item.width, y: item.y + item.height },
                ];

                nodes.forEach((node) => {
                    // Outer blue square
                    ctx.fillStyle = "rgb(100, 149, 237)";
                    ctx.fillRect(
                        node.x - nodeSize / 2,
                        node.y - nodeSize / 2,
                        nodeSize,
                        nodeSize
                    );

                    // Inner white square
                    ctx.fillStyle = "white";
                    ctx.fillRect(
                        node.x - innerNodeSize / 2,
                        node.y - innerNodeSize / 2,
                        innerNodeSize,
                        innerNodeSize
                    );
                });
            };

            // Draw items
            items.forEach((item) => {
                if (item.type === "image") {
                    ctx.drawImage(
                        item.image,
                        item.x,
                        item.y,
                        item.width,
                        item.height
                    );
                    if (item.id === selectedItemId) {
                        drawControlNodes(item);
                    }
                }
            });

            ctx.restore();
        };

        draw();

        const resizeCanvas = () => {
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            draw();
        };

        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [viewport, items, selectedItemId]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
        if (e.metaKey && e.key === "v") {
            e.preventDefault();
            navigator.clipboard
                .read()
                .then((clipboardItems) => {
                    for (const item of clipboardItems) {
                        if (
                            item.types.includes("image/png") ||
                            item.types.includes("image/jpeg")
                        ) {
                            item.getType("image/png").then((blob) => {
                                const img = new Image();
                                img.onload = () => {
                                    const dpr = window.devicePixelRatio || 1;
                                    const scaledWidth = img.width / dpr;
                                    const scaledHeight = img.height / dpr;

                                    const newItem: CanvasItem = {
                                        id: nextItemId,
                                        type: "image",
                                        x:
                                            viewport.x +
                                            window.innerWidth /
                                                2 /
                                                viewport.scale -
                                            scaledWidth / 2,
                                        y:
                                            viewport.y +
                                            window.innerHeight /
                                                2 /
                                                viewport.scale -
                                            scaledHeight / 2,
                                        width: scaledWidth,
                                        height: scaledHeight,
                                        image: img,
                                    };
                                    setItems((prevItems) => [
                                        ...prevItems,
                                        newItem,
                                    ]);
                                    setNextItemId((prevId) => prevId + 1);
                                    setSelectedItemId(newItem.id);
                                };
                                img.src = URL.createObjectURL(blob);
                            });
                            break;
                        }
                    }
                })
                .catch((err) => {
                    console.error("Failed to read clipboard contents: ", err);
                });
        } else if (e.key === "Delete" || e.key === "Backspace") {
            if (selectedItemId !== null) {
                setItems((prevItems) =>
                    prevItems.filter((item) => item.id !== selectedItemId)
                );
                setSelectedItemId(null);
            }
        }
    };

    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 10;

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        if (e.ctrlKey) {
            e.preventDefault();

            const zoomFactor = 1 - e.deltaY * 0.001;
            const newScale = Math.min(
                MAX_ZOOM,
                Math.max(MIN_ZOOM, viewport.scale * zoomFactor)
            );

            if (newScale !== viewport.scale) {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;

                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const zoomPoint = {
                    x: mouseX / viewport.scale + viewport.x,
                    y: mouseY / viewport.scale + viewport.y,
                };

                const newViewport = {
                    scale: newScale,
                    x: zoomPoint.x - mouseX / newScale,
                    y: zoomPoint.y - mouseY / newScale,
                };

                setViewport(newViewport);
            }
        } else {
            const dx = e.deltaX / viewport.scale;
            const dy = e.deltaY / viewport.scale;

            setViewport((prev) => ({
                ...prev,
                x: prev.x + dx,
                y: prev.y + dy,
            }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = (e.clientX - rect.left) / viewport.scale + viewport.x;
        const y = (e.clientY - rect.top) / viewport.scale + viewport.y;

        const clickedItem = items.find((item) =>
            isPointInItem(x, y, item, viewport.scale)
        );

        if (clickedItem) {
            setSelectedItemId(clickedItem.id);
            setIsDragging(true);
            setDragStart({ x: x - clickedItem.x, y: y - clickedItem.y });

            const handle = getClickedHandle(x, y, clickedItem, viewport.scale);
            setResizeHandle(handle);
        } else {
            setSelectedItemId(null);
            setIsDragging(false);
            setDragStart(null);
            setResizeHandle(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = (e.clientX - rect.left) / viewport.scale + viewport.x;
        const y = (e.clientY - rect.top) / viewport.scale + viewport.y;

        const hoveredItem = items.find((item) =>
            isPointInItem(x, y, item, viewport.scale)
        );

        if (hoveredItem) {
            const handle = getClickedHandle(x, y, hoveredItem, viewport.scale);
            if (handle) {
                switch (handle) {
                    case "topLeft":
                    case "bottomRight":
                        canvasRef.current!.style.cursor = "nwse-resize";
                        break;
                    case "topRight":
                    case "bottomLeft":
                        canvasRef.current!.style.cursor = "nesw-resize";
                        break;
                }
            } else {
                canvasRef.current!.style.cursor = "default";
            }
        } else {
            canvasRef.current!.style.cursor = "default";
        }

        if (!isDragging || selectedItemId === null) return;

        setItems((prevItems) =>
            prevItems.map((item) => {
                if (item.id === selectedItemId) {
                    if (resizeHandle) {
                        let newWidth = item.width;
                        let newHeight = item.height;
                        let newX = item.x;
                        let newY = item.y;

                        const aspectRatio = item.width / item.height;

                        switch (resizeHandle) {
                            case "topLeft":
                                newWidth = item.x + item.width - x;
                                newHeight = item.y + item.height - y;
                                if (e.shiftKey) {
                                    newHeight = newWidth / aspectRatio;
                                }
                                newX = item.x + item.width - newWidth;
                                newY = item.y + item.height - newHeight;
                                break;
                            case "topRight":
                                newWidth = x - item.x;
                                newHeight = item.y + item.height - y;
                                if (e.shiftKey) {
                                    newHeight = newWidth / aspectRatio;
                                }
                                newY = item.y + item.height - newHeight;
                                break;
                            case "bottomLeft":
                                newWidth = item.x + item.width - x;
                                newHeight = y - item.y;
                                if (e.shiftKey) {
                                    newHeight = newWidth / aspectRatio;
                                }
                                newX = item.x + item.width - newWidth;
                                break;
                            case "bottomRight":
                                newWidth = x - item.x;
                                newHeight = y - item.y;
                                if (e.shiftKey) {
                                    newHeight = newWidth / aspectRatio;
                                }
                                break;
                        }

                        return {
                            ...item,
                            x: newX,
                            y: newY,
                            width: Math.max(10, newWidth),
                            height: Math.max(10, newHeight),
                        };
                    } else if (dragStart) {
                        return {
                            ...item,
                            x: x - dragStart.x,
                            y: y - dragStart.y,
                        };
                    }
                }
                return item;
            })
        );
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
        setResizeHandle(null);
    };

    useEffect(() => {
        canvasRef.current?.focus();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className='w-full h-full focus:outline-none'
            tabIndex={0}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
}

function isPointInItem(
    x: number,
    y: number,
    item: CanvasItem,
    scale: number
): boolean {
    const buffer = 10 / scale; // 10 pixels buffer
    return (
        x >= item.x - buffer &&
        x <= item.x + item.width + buffer &&
        y >= item.y - buffer &&
        y <= item.y + item.height + buffer
    );
}

function getClickedHandle(
    x: number,
    y: number,
    item: CanvasItem,
    scale: number
): string | null {
    const nodeSize = 10 / scale;
    const handleSize = nodeSize + 10 / scale; // Increased clickable area

    if (
        Math.abs(x - item.x) <= handleSize &&
        Math.abs(y - item.y) <= handleSize
    ) {
        return "topLeft";
    } else if (
        Math.abs(x - (item.x + item.width)) <= handleSize &&
        Math.abs(y - item.y) <= handleSize
    ) {
        return "topRight";
    } else if (
        Math.abs(x - item.x) <= handleSize &&
        Math.abs(y - (item.y + item.height)) <= handleSize
    ) {
        return "bottomLeft";
    } else if (
        Math.abs(x - (item.x + item.width)) <= handleSize &&
        Math.abs(y - (item.y + item.height)) <= handleSize
    ) {
        return "bottomRight";
    }
    return null;
}
