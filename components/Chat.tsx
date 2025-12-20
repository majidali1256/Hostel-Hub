import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { format } from 'date-fns';

interface Message {
    _id: string;
    conversationId: string;
    senderId: any;
    content: string;
    type: 'text' | 'image' | 'file';
    createdAt: Date;
    readBy: Array<{ userId: string; readAt: Date }>;
}

interface ChatProps {
    conversationId: string;
    currentUserId: string;
    chatName?: string;
    onClose?: () => void;
}

const Chat: React.FC<ChatProps> = ({ conversationId, currentUserId, chatName, onClose }) => {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load messages
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5001/api/conversations/${conversationId}/messages`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                setMessages(data);
            } catch (error) {
                console.error('Failed to load messages:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();
    }, [conversationId]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        // Join conversation room
        socket.emit('join:conversation', conversationId);

        // Listen for new messages
        socket.on('message:new', (message: Message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        // Listen for typing indicators
        socket.on('user:typing', ({ userId }) => {
            if (userId !== currentUserId) {
                setOtherUserTyping(true);
            }
        });

        socket.on('user:stopped-typing', ({ userId }) => {
            if (userId !== currentUserId) {
                setOtherUserTyping(false);
            }
        });

        // Listen for read receipts
        socket.on('message:read', ({ messageId, userId }) => {
            setMessages(prev => prev.map(msg =>
                msg._id === messageId
                    ? { ...msg, readBy: [...msg.readBy, { userId, readAt: new Date() }] }
                    : msg
            ));
        });

        return () => {
            socket.emit('leave:conversation', conversationId);
            socket.off('message:new');
            socket.off('user:typing');
            socket.off('user:stopped-typing');
            socket.off('message:read');
        };
    }, [socket, conversationId, currentUserId]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle typing
    const handleTyping = () => {
        if (!socket) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('typing:start', conversationId);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('typing:stop', conversationId);
        }, 1000);
    };

    // Send message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        console.log('Sending message:', newMessage);
        console.log('Conversation ID:', conversationId);

        try {
            const token = localStorage.getItem('token');
            console.log('Token exists:', !!token);

            const res = await fetch('http://localhost:5001/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversationId,
                    content: newMessage.trim(),
                    type: 'text'
                })
            });

            console.log('Send response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('Message sent successfully:', data);
                setNewMessage('');
                if (socket) {
                    socket.emit('typing:stop', conversationId);
                }
                setIsTyping(false);
                // Manually add message to list if socket didn't do it
                setMessages(prev => [...prev, data]);
            } else {
                const errData = await res.json();
                console.error('Send failed:', errData);
                alert(`Failed to send message: ${errData.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error('Failed to send message:', error);
            alert(`Error sending message: ${error.message}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading messages...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{chatName || 'Chat'}</h3>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => {
                        const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
                        const isOwn = senderId === currentUserId;
                        const isRead = (message.readBy || []).some(r => r.userId !== currentUserId);

                        return (
                            <div
                                key={message._id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {!isOwn && typeof message.senderId === 'object' && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            {message.senderId.firstName} {message.senderId.lastName}
                                        </span>
                                    )}
                                    <div
                                        className={`rounded-lg px-4 py-2 ${isOwn
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                            }`}
                                    >
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {format(new Date(message.createdAt), 'HH:mm')}
                                        </span>
                                        {isOwn && isRead && (
                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {otherUserTyping && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>typing...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            console.log('Input changed:', e.target.value);
                            setNewMessage(e.target.value);
                            try {
                                handleTyping();
                            } catch (err) {
                                console.error('handleTyping error:', err);
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={false}
                    />
                    <button
                        type="submit"
                        disabled={false}
                        onClick={() => console.log('Send button clicked')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
