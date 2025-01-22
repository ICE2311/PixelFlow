"use client";

import { useCanRedo, useCanUndo, useHistory, useMutation, useSelf, useStorage } from "@liveblocks/react";
import { colorToCss, findIntersectionLayersWithRectangle, penPointsToPathLayer, pointerEventToCanvasPoint, resizeBounds } from "~/utils";
import LayerComponent from "./LayerComponent";
import { CanvasMode, LayerType } from "~/types";
import type { Camera, CanvasState, EllipseLayer, Layer, Point, RectangleLayer, Side, TextLayer, XYWH } from "~/types";
import { nanoid } from "nanoid";
import { LiveObject } from "@liveblocks/client";
import { useCallback, useEffect, useState } from "react";
import React from "react";
import ToolsBar from "../toolsbar/ToolsBar";
import Path from "./Path";
import SelectionBox from "./SelectionBox";
import useDeleteLayers from "~/hooks/useDeleteLayers";
import SelectionTools from "./SelectionTools";
import Sidebars from "../sidebars/Sidebars";
import MultiplayerGuides from "./MultiplayerGuides";
import type { User } from "@prisma/client";

const MAX_LAYERS = 100;

export default function Canvas({
    roomName,
    roomId,
    othersWithAccessToRoom,
}: {
    roomName: string;
    roomId: string;
    othersWithAccessToRoom: User[];
}) {
    const roomColor = useStorage((root) => root.roomColor);
    const layerIds = useStorage((root) => root.layerIds);
    const pencilDraft = useSelf((me) => me.presence.pencilDraft);
    const [canvasState, setCanvasState] = useState<CanvasState>({ mode: CanvasMode.None });
    const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 })
    const deleteLayers = useDeleteLayers();
    const history = useHistory();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();
    const [leftIsMinimized, setLeftIsMinimized] = useState(false);
    const selectAllLayers = useMutation(({ setMyPresence }) => {
        if (layerIds) {
            setMyPresence({ selection: [...layerIds] }, { addToHistory: true });
        }
    }, [layerIds]);

    const insertLayer = useMutation(({ storage, setMyPresence }, layerType: LayerType.Ellipse | LayerType.Rectangle | LayerType.Text, position: Point,) => {
        const liveLayers = storage.get("layer");
        if (liveLayers.size >= MAX_LAYERS) {
            return;
        }

        const liveLayerIds = storage.get("layerIds");
        const layerId = nanoid();
        let layer: LiveObject<Layer> | null = null;

        if (layerType === LayerType.Rectangle) {
            layer = new LiveObject<RectangleLayer>({
                type: LayerType.Rectangle,
                x: position.x,
                y: position.y,
                height: 100,
                width: 100,
                fill: { r: 217, g: 217, b: 217 },
                stroke: { r: 217, g: 217, b: 217 },
                opacity: 100,
            });
        } else if (layerType === LayerType.Ellipse) {
            layer = new LiveObject<EllipseLayer>({
                type: LayerType.Ellipse,
                x: position.x,
                y: position.y,
                height: 100,
                width: 100,
                fill: { r: 217, g: 217, b: 217 },
                stroke: { r: 217, g: 217, b: 217 },
                opacity: 100,
            });
        } else if (layerType === LayerType.Text) {
            layer = new LiveObject<TextLayer>({
                type: LayerType.Text,
                x: position.x,
                y: position.y,
                height: 100,
                width: 100,
                fontSize: 16,
                text: "Text",
                fontWeight: 400,
                fontFamily: "Inter",
                stroke: { r: 217, g: 217, b: 217 },
                fill: { r: 217, g: 217, b: 217 },
                opacity: 100,
            });
        }

        if (layer) {
            liveLayerIds.push(layerId);
            liveLayers?.set(layerId, layer);

            setMyPresence({ selection: [layerId] }, { addToHistory: true });
            setCanvasState({ mode: CanvasMode.None });
        }
    }, []);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            const activeElement = document.activeElement;
            const isInputField =
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA");

            if (isInputField) return;

            switch (e.key) {
                case "Backspace":
                    deleteLayers();
                    break;
                case "Delete":
                    deleteLayers();
                    break;
                case "z":
                    if (e.ctrlKey || e.metaKey) {
                        history.undo();
                        break;
                    }
                case "y":
                    if (e.ctrlKey || e.metaKey) {
                        history.redo();
                        break;
                    }
                case "a":
                    if (e.ctrlKey || e.metaKey) {
                        selectAllLayers();
                        break;
                    }
            }
        }

        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [history, selectAllLayers, deleteLayers]);

    const startDrawing = useMutation(({ setMyPresence }, point: Point, pressure: number) => {
        setMyPresence({ pencilDraft: [[point.x, point.y, pressure]], penColor: { r: 217, g: 217, b: 217 } });
    }, [])

    const continueDrawing = useMutation(({ self, setMyPresence }, point: Point, e: React.PointerEvent,) => {
        const { pencilDraft } = self.presence
        if (canvasState.mode !== CanvasMode.Pencil || e.buttons !== 1 || pencilDraft === null) {
            return
        }
        setMyPresence({ cursor: point, pencilDraft: [...pencilDraft, [point.x, point.y, e.pressure]], penColor: { r: 217, g: 217, b: 217 } });
    }, [canvasState.mode])

    const insertPath = useMutation(({ storage, self, setMyPresence }) => {
        const liveLayers = storage.get("layer");
        const { pencilDraft } = self.presence
        if (liveLayers.size >= MAX_LAYERS || (pencilDraft !== null && pencilDraft.length < 2)) {
            setMyPresence({ pencilDraft: null });
            return
        }
        const id = nanoid();

        liveLayers.set(id, new LiveObject(penPointsToPathLayer(pencilDraft ?? [], { r: 217, g: 217, b: 217 })));

        const liveLayerIds = storage.get("layerIds");
        liveLayerIds.push(id);
        setMyPresence({ pencilDraft: null });
        setCanvasState({ mode: CanvasMode.Pencil });

    }, [canvasState.mode])


    const unSelectedLayers = useMutation(({ self, setMyPresence }) => {
        if (self.presence.selection.length > 0) {
            setMyPresence({ selection: [] }, { addToHistory: true });
        }
    }, [])

    const onPointerUp = useMutation(
        ({ }, e: React.PointerEvent) => {
            const point = pointerEventToCanvasPoint(e, camera);

            if (canvasState.mode === CanvasMode.RightClick) return;

            if (canvasState.mode === CanvasMode.None || canvasState.mode === CanvasMode.Pressing) {
                setCanvasState({ mode: CanvasMode.None });
                unSelectedLayers()
            } else if (canvasState.mode === CanvasMode.Inserting) {
                insertLayer(canvasState.layerType, point);
            } else if (canvasState.mode === CanvasMode.Dragging) {
                setCanvasState({ mode: CanvasMode.Dragging, origin: null });
            } else if (canvasState.mode === CanvasMode.Pencil) {
                insertPath()
            } else {
                setCanvasState({ mode: CanvasMode.None });
            }
            history.resume()
        }, [canvasState, setCanvasState, insertLayer, unSelectedLayers, history]);


    const onPointerDown = useMutation(({ }, e: React.PointerEvent) => {
        const point = pointerEventToCanvasPoint(e, camera);

        if (canvasState.mode === CanvasMode.Dragging) {
            setCanvasState({ mode: CanvasMode.Dragging, origin: point });
            return;
        }
        if (canvasState.mode === CanvasMode.Inserting) return;
        if (canvasState.mode === CanvasMode.Pencil) {
            startDrawing(point, e.pressure);
            return;
        }
        setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    }, [camera, canvasState.mode, setCanvasState, startDrawing]);

    const resizeSelectedLayer = useMutation(({ storage, self }, point: Point) => {
        if (canvasState.mode !== CanvasMode.Resizing) {
            return;
        }
        const bounds = resizeBounds(
            canvasState.initialBounds,
            canvasState.corner,
            point,
        );
        const liveLayers = storage.get("layer");
        if (self.presence.selection.length > 0) {
            const layer = liveLayers.get(self.presence.selection[0]!);
            if (layer) {
                layer.update(bounds);
            }
        }
    }, [canvasState]);

    const translateSelectedLayer = useMutation(({ storage, self }, point: Point) => {
        if (canvasState.mode !== CanvasMode.Translating) {
            return;
        }
        const offset = {
            x: point.x - canvasState.current.x,
            y: point.y - canvasState.current.y
        }

        const liveLayers = storage.get("layer");
        for (const id of self.presence.selection) {
            const layer = liveLayers.get(id);
            if (layer) {
                layer.update({
                    x: layer.get("x") + offset.x,
                    y: layer.get("y") + offset.y
                })
            }
            setCanvasState({ mode: CanvasMode.Translating, current: point });
        }
    }, [canvasState])

    const startMultiSelection = useCallback((current: Point, origin: Point) => {
        if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
            setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });
        }
    }, []);

    const updateSelectionNet = useMutation(({ storage, setMyPresence }, current: Point, origin: Point) => {
        if (layerIds) {
            const layers = storage.get("layer").toImmutable();
            setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });
            const ids = findIntersectionLayersWithRectangle(layerIds, layers, origin, current);
            setMyPresence({ selection: ids });
        }
    }, [layerIds]);

    const onPointerMove = useMutation(({ setMyPresence }, e: React.PointerEvent) => {
        const point = pointerEventToCanvasPoint(e, camera)
        if (canvasState.mode === CanvasMode.Pressing) {
            startMultiSelection(point, canvasState.origin);
        } else if (canvasState.mode === CanvasMode.Dragging && canvasState.origin !== null) {
            const deltaX = e.movementX
            const deltaY = e.movementY
            setCamera((camera) => ({
                x: camera.x + deltaX,
                y: camera.y + deltaY,
                zoom: camera.zoom
            }));
        } else if (canvasState.mode === CanvasMode.SelectionNet) {
            updateSelectionNet(point, canvasState.origin);
        } else if (canvasState.mode === CanvasMode.Translating) {
            translateSelectedLayer(point)
        } else if (canvasState.mode === CanvasMode.Pencil) {
            continueDrawing(point, e);
        } else if (canvasState.mode === CanvasMode.Resizing) {
            resizeSelectedLayer(point)
        }
        setMyPresence({ cursor: point });
    }, [canvasState, camera, continueDrawing, resizeSelectedLayer, updateSelectionNet, translateSelectedLayer, startMultiSelection]);


    const onWheel = useCallback((e: React.WheelEvent) => {
        setCamera((camera) => ({
            x: camera.x - e.deltaX,
            y: camera.y - e.deltaY,
            zoom: camera.zoom,
        }));
    }, []);

    const onLayerPointerDown = useMutation(({ self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
        const point = pointerEventToCanvasPoint(e, camera)
        if (canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Inserting) {
            return
        }
        history.pause()
        e.stopPropagation()
        if (!self.presence.selection.includes(layerId)) {
            setMyPresence({ selection: [layerId] }, { addToHistory: true })
        }
        if (e.nativeEvent.button === 2) {
            setCanvasState({ mode: CanvasMode.RightClick })
        } else {
            setCanvasState({ mode: CanvasMode.Translating, current: point })
        }
    }, [canvasState.mode, camera, history])

    const onResizeHandlePointerDown = useCallback((corner: Side, initialBounds: XYWH) => {
        history.pause();
        setCanvasState({
            mode: CanvasMode.Resizing,
            initialBounds,
            corner,
        });
    }, [history]);

    const onPointerLeave = useMutation(({ setMyPresence }) => {
        setMyPresence({ cursor: null });
    }, []);

    return (
        <div className="flex h-screen w-full overflow-hidden overscroll-none">
            <main className="fixed left-0 right-0 h-screen overflow-y-auto">
                <div
                    style={{ backgroundColor: roomColor ? colorToCss(roomColor) : "#616161" }}
                    className="h-full w-full"
                >
                    <SelectionTools camera={camera} canvasMode={canvasState.mode} />
                    <svg
                        onWheel={onWheel}
                        onPointerUp={onPointerUp}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerLeave={onPointerLeave}
                        className="h-full w-full"
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <g onWheel={onWheel} style={{ transform: `scale(${camera.zoom}) translate(${camera.x}px, ${camera.y}px)` }}>
                            {layerIds?.map((layerId) => (
                                <LayerComponent key={layerId} id={layerId} onLayerPointerDown={onLayerPointerDown} />
                            ))}
                            <SelectionBox
                                onResizeHandlePointerDown={onResizeHandlePointerDown}
                            />
                            {canvasState.mode === CanvasMode.SelectionNet &&
                                canvasState.current != null && (
                                    <rect
                                        className="fill-blue-600/5 stroke-blue-600 stroke-[0.5]"
                                        x={Math.min(canvasState.origin.x, canvasState.current.x)}
                                        y={Math.min(canvasState.origin.y, canvasState.current.y)}
                                        width={Math.abs(
                                            canvasState.origin.x - canvasState.current.x,
                                        )}
                                        height={Math.abs(
                                            canvasState.origin.y - canvasState.current.y,
                                        )}
                                    />
                                )}
                            <MultiplayerGuides />
                            {pencilDraft !== null && pencilDraft.length > 0 && <Path x={0} y={0} fill={colorToCss({ r: 217, g: 217, b: 217 })} opacity={100} points={pencilDraft} />}
                        </g>
                    </svg>
                </div>
            </main>
            <ToolsBar
                canvasState={canvasState}
                setCanvasState={(newState) => setCanvasState(newState)}
                zoomIn={() => { setCamera((camera) => ({ ...camera, zoom: camera.zoom + 0.1 })); }}
                zoomOut={() => { setCamera((camera) => ({ ...camera, zoom: camera.zoom - 0.1 })); }}
                canZoomIn={camera.zoom < 2}
                canZoomOut={camera.zoom > 0.5}
                canUndo={canUndo}
                canRedo={canRedo}
                undo={history.undo}
                redo={history.redo}
            />
            <Sidebars
                roomName={roomName}
                roomId={roomId}
                othersWithAccessToRoom={othersWithAccessToRoom}
                leftIsMinimized={leftIsMinimized}
                setLeftIsMinimized={setLeftIsMinimized}
            />
        </div>
    );
}

