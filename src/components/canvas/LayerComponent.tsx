
import { useStorage } from '@liveblocks/react'
import React, { memo } from 'react'
import Rectangle from './Rectangle'
import { LayerType } from '~/types'
import Ellipse from './Ellipse'
import Path from './Path'
import Text from './Text'
import { colorToCss } from '~/utils'

const LayerComponent = memo(({ id, onLayerPointerDown }: { id: string, onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void }) => {
    const layer = useStorage((root) => root.layer.get(id))
    if (!layer) return null

    switch (layer.type) {
        case LayerType.Rectangle:
            return <Rectangle onPointerDown={onLayerPointerDown} id={id} layer={layer} />
        case LayerType.Ellipse:
            return <Ellipse  onPointerDown={onLayerPointerDown} id={id} layer={layer} />
        case LayerType.Path:
            return <Path
                onPointerDown={(e) => onLayerPointerDown(e, id)}
                points={layer.points}
                x={layer.x}
                y={layer.y}
                fill={layer.fill ? colorToCss(layer.fill) : "#ccc"}
                stroke={layer.stroke ? colorToCss(layer.stroke) : "#ccc"}
                opacity={layer.opacity}
            />
        case LayerType.Text:
            return <Text onPointerDown={onLayerPointerDown} id={id} layer={layer} />
        default:
            return null
    }
})

LayerComponent.displayName = 'LayerComponent'

export default LayerComponent