import Taskbar from '../components/Taskbar';
import Sidebar from '../components/Sidebar';
import { useEffect, useState, useContext } from 'react';
import { openDB } from 'idb';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import SocketContext from '../context/socket';
import { Outlet } from 'react-router';


export default function Main() {
    const [postBox, setPostBox] = useState<boolean>(false);
    const [audience, setAudience] = useState<'public' | 'all' | 'specific' | null>(null);
    const [message, setMessage] = useState<string>('');
    const onlinePeers = useSelector((state: RootState) => state.Peers.peerId);
    const { socket, persistentUserId } = useContext(SocketContext);


    useEffect(() => {
        const deliverPendingMessages = async () => {
            const db = await openDB('p2pchats', 1);

            // Use persistent user ID for pending messages
            for (const peer of onlinePeers) {
                const key = [persistentUserId, peer];
                const pending = await db.get('pendingMessages', key);
                if (pending && pending.messages.length > 0) {
                    for (const msg of pending.messages) {
                        socket?.send(JSON.stringify({
                            type: 'message',
                            to: peer,
                            content: msg.content,
                            from: persistentUserId
                        }));
                    }
                    await db.delete('pendingMessages', key);
                }
            }
        };

        if (persistentUserId && onlinePeers.length > 0) {
            deliverPendingMessages();
        }
    }, [onlinePeers, persistentUserId]);

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('audiance', audience, message, persistentUserId)
        if (!audience || !message.trim() || !persistentUserId) {
            alert('Please select audience and enter a message.');
            return;
        }

        const db = await openDB('p2pchats', 1);

        // If there are connected peers, send the message to all
        if (onlinePeers && onlinePeers.length > 0) {
            console.log('peer is connected sending message')
            socket?.send(JSON.stringify({
                type: 'public-post',
                from: persistentUserId,
                content: `${message}`,
                timestamp: Date.now()
            }));

        } else {
            // If no connected peers, save to pendingMessages for all previous known peers
            const prevChat = await db.get('prevChat', persistentUserId);
            const previousPeers: string[] = prevChat?.peers || [];
            console.log('no peer found storing it for further events', previousPeers)

            for (const peer of previousPeers) {
                const key = [persistentUserId, peer];
                const existing = await db.get('pendingMessages', key);
                const newMsg = {
                    content: `[Public Post]: ${message}`,
                    timestamp: Date.now()
                };

                if (existing) {
                    existing.messages.push(newMsg);
                    await db.put('pendingMessages', existing);
                } else {
                    await db.put('pendingMessages', {
                        from: persistentUserId,
                        to: peer,
                        messages: [newMsg]
                    });
                }
            }
        }

        setMessage('');
        setAudience(null);
        setPostBox(false);
    };


    return (
        <main className='mainchatContent'>
            {postBox && (
                <div className='postbox'>
                    <h3>Write a Post</h3>
                    <p>Choose where to post your message.</p>
                    <form onSubmit={handlePostSubmit}>
                        <label>
                            <input
                                type="radio"
                                name="audience"
                                value="public"
                                checked={audience === 'public'}
                                onChange={() => setAudience('public')}
                            />
                            Public
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="audience"
                                value="all"
                                checked={audience === 'all'}
                                onChange={() => setAudience('all')}
                            />
                            All Communities
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="audience"
                                value="specific"
                                checked={audience === 'specific'}
                                onChange={() => setAudience('specific')}
                            />
                            Specific Community
                        </label>
                        <br />
                        <input
                            type="text"
                            placeholder="Enter the message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                        />
                        <br />
                        <button type="submit">Send</button>
                        <button type="button" onClick={() => setPostBox(false)}>Cancel</button>
                    </form>
                </div>
            )}
            <section className='leftsidebars'>
                <Taskbar />
                <Sidebar />
            </section>
            <section className='main-rightsideContent'>
                <Outlet />
                <button className="leaf-button" onClick={() => setPostBox(true)}>
                    <i className="fa-solid fa-leaf"></i>
                </button>
            </section>
        </main>
    );
}
