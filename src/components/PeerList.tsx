import { Link } from 'react-router'
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { useContext, useEffect, useState, useCallback } from 'react';
import SocketContext from '../context/socket';

interface PublicPost {
    from: string;
    content: string;
    timestamp: number;
}

export default function PeerList() {
    const { peerId, peerCount } = useSelector((state: RootState) => state.Peers)
    const { socket } = useContext(SocketContext)
    const [publicPosts, setPublicPosts] = useState<PublicPost[]>([])

    const handleTriggerDiscovery = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'search-peers' }))
        }
    }

    // Memoize the message handler to prevent unnecessary re-renders
    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const msg = JSON.parse(event.data);
            console.log('Received message:', msg); // Debug log

            if (msg.type === 'public-post') {
                const newPost: PublicPost = {
                    from: msg.from,
                    content: msg.content,
                    timestamp: msg.timestamp || Date.now()
                };

                console.log('Adding public post:', newPost); // Debug log

                setPublicPosts(prev => {
                    // Check if this post already exists to prevent duplicates
                    const exists = prev.some(post =>
                        post.from === newPost.from &&
                        post.timestamp === newPost.timestamp &&
                        post.content === newPost.content
                    );

                    if (exists) {
                        return prev;
                    }

                    return [newPost, ...prev]; // latest first
                });
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }, []);

    // Listen for public-post messages
    useEffect(() => {
        if (!socket) return;

        console.log('Setting up WebSocket listener');

        socket.addEventListener('message', handleMessage);

        return () => {
            console.log('Cleaning up WebSocket listener');
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket, handleMessage]);

    return (
        <div className="network-feed-container">
            <div className="peers-section">
                {peerId.length === 0 ? (
                    <div className="no-peers-state">
                        <div className="status-icon">
                            <span className="icon">🔍</span>
                        </div>
                        <h2 className="status-title">No Connected or Active Peer Found!</h2>
                        <p className="status-description">
                            Active Peer will be displayed here, you can explore active community through sidebars
                        </p>
                        <button onClick={handleTriggerDiscovery} className="discovery-button">
                            <i className="fa-solid fa-rotate"></i>
                            <span>Search for peers</span>
                        </button>
                    </div>
                ) : (
                    <div className="peers-found-state">
                        <div className="peers-header">
                            <div className="peers-count">
                                <span className="count-number">{peerCount}</span>
                                <span className="count-label">connected peers found!</span>
                            </div>
                            <button onClick={handleTriggerDiscovery} className="refresh-button">
                                <i className="fa-solid fa-rotate"></i>
                            </button>
                        </div>
                        <div className="connected-peers">
                            {peerId.map((id, key) => (
                                <Link key={key} to={`/chat/p/${id}`} className="peer-card">
                                    <div className="peer-avatar">
                                        <span className="avatar-icon">👤</span>
                                    </div>
                                    <div className="peer-info">
                                        <span className="peer-id">{id.slice(0, 12)}...</span>
                                        <span className="peer-status">Online</span>
                                    </div>
                                    <div className="peer-action">
                                        <span className="chat-arrow">→</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="post-creation-section">
                <div className="creation-header">
                    <h4 className="creation-title">Ask for Help, share your thoughts</h4>
                    <p className="creation-subtitle">Post your thoughts now in your network</p>
                </div>
            </div>

            <div className="feeds-section">
                <div className="feeds-header">
                    <h3 className="feeds-title">Your Network Feeds</h3>
                    <div className="feeds-count">
                        {publicPosts.length} {publicPosts.length === 1 ? 'post' : 'posts'}
                    </div>
                </div>

                <div className="feeds-content">
                    {publicPosts.length > 0 ? (
                        <div className="posts-list">
                            {publicPosts.map((post, idx) => (
                                <div key={idx} className="post-card">
                                    <div className="post-header">
                                        <div className="post-author">
                                            <div className="author-avatar">
                                                <span className="avatar-text">
                                                    {post.from.slice(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="author-info">
                                                <span className="author-name">{post.from.slice(0, 15)}...</span>
                                                <span className="post-time">
                                                    {new Date(post.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="post-menu">
                                            <span className="menu-dots">⋯</span>
                                        </div>
                                    </div>
                                    <div className="post-content">
                                        <p className="post-text">{post.content}</p>
                                    </div>
                                    <div className="post-actions">
                                        <button className="action-button">
                                            <span className="action-icon">💬</span>
                                            <span className="action-text">Reply</span>
                                        </button>
                                        <button className="action-button">
                                            <span className="action-icon">🔄</span>
                                            <span className="action-text">Share</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-feeds-state">
                            <div className="empty-icon">📝</div>
                            <p className="empty-text">No public posts yet.</p>
                            <p className="empty-subtext">Be the first to share something with your network!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}