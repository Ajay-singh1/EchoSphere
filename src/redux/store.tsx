import {configureStore} from '@reduxjs/toolkit'
import PeerSlice from './PeerSlice'
import ChatList from './ChatList'

export const store=configureStore({
    reducer:{
        Peers:PeerSlice,
        ChatList:ChatList
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch