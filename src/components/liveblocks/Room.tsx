'use client'

import { LiveList, LiveMap, type LiveObject } from '@liveblocks/client'
import { ClientSideSuspense, LiveblocksProvider, RoomProvider } from '@liveblocks/react'
import Image from 'next/image'
import { type ReactNode } from 'react'
import { type Layer } from '~/types'

export default function Room({ children, roomId }: { children: ReactNode, roomId: string }) {
    return (

        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
            <RoomProvider
                id={roomId}
                initialPresence={{
                    selection: [],
                    cursor: null,
                    penColor: null,
                    pencilDraft: null
                }}
                initialStorage={{
                    roomColor: { r: 0, g: 0, b: 0 },
                    layer: new LiveMap<string, LiveObject<Layer>>(),
                    layerIds: new LiveList([])
                }}
            >

                <ClientSideSuspense
                    fallback={
                        <div className='flex h-screen flex-col justify-center items-center '>
                            <Image
                                src="/loader.gif"
                                alt='loader'
                                width={150}
                                height={150}
                                className='animate-bounce'
                            />
                            <h1 className='text-2xl'>Loading . . .</h1>
                        </div>}>
                    {children}
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    )
}