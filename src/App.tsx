import './App.css'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router'
import Home from './pages/Home'
import Chat from './Chat'
import { SoecketProvider } from './context/socket'

function App() {

    return (
        <>
            <BrowserRouter>
                <SoecketProvider>
                    <Routes>
                        <Route path="/" element={<Navigate to="/chat/" replace />} />
                        <Route path='/home' element={<Home />} />
                        <Route path='/chat/*' element={<Chat />} />
                    </Routes>
                </SoecketProvider>
            </BrowserRouter>
        </>
    )
}

export default App
