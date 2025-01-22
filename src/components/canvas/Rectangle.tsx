import type { RectangleLayer } from "~/types";
import { colorToCss } from "~/utils";

export default function Rectangle({ id, layer, onPointerDown }: { id: string; layer: RectangleLayer, onPointerDown: (e: React.PointerEvent, layerId: string) => void }) {
    const { x, y, width, height, fill, stroke, opacity, cornerRadius } = layer
    return (
        <g className="group">
            <rect
                style={{ transform: `translate(${x}px, ${y}px)` }}
                width={width}
                height={height}
                fill="none"
                stroke="#0b99ff"
                strokeWidth="5"
                className="pointer-events-none opacity-0 group-hover:opacity-100"
            />
            <rect
                onPointerDown={(e) => onPointerDown(e, id)}
                style={{ transform: `translate(${x}px, ${y}px)` }}
                width={width}
                height={height}
                fill={fill ? colorToCss(fill) : '#ccc'}
                stroke={stroke ? colorToCss(stroke) : '#ccc'}
                strokeWidth={1}
                opacity={`${opacity ?? 100}%`}
                rx={cornerRadius ?? 0}
                ry={cornerRadius ?? 0}
            />
        </g>
    )
}