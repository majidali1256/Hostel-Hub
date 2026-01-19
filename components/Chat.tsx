import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { format } from 'date-fns';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { api } from '../services/mongoService';

export interface Message {
    _id: string;
    conversationId: string;
    senderId: any;
    content: string;
    type: 'text' | 'image';
    createdAt: string;
    readBy?: Array<{ userId: string; readAt: string }>;
    starredBy?: string[];
    status?: 'sending' | 'sent' | 'error';
}

interface ChatProps {
    conversationId: string;
    currentUserId: string;
    chatName?: string;
    onClose?: () => void;
}

const Chat: React.FC<ChatProps> = ({ conversationId, currentUserId, chatName, onClose }) => {
    const { socket, isConnected } = useSocket();
    const { confirm } = useConfirm();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    // Load messages
    const loadMessages = useCallback(async (before?: string) => {
        try {
            if (!before) setError(null);
            const res = await api.conversations.getMessages(conversationId, 20, before);

            // Handle both new (paginated) and old (array) API responses for robustness
            const messagesList = Array.isArray(res) ? res : res?.messages;
            const hasMoreData = Array.isArray(res) ? false : res?.hasMore;

            if (messagesList) {
                if (before) {
                    setMessages(prev => [...messagesList, ...prev]);
                    setIsLoadingMore(false);
                } else {
                    setMessages(messagesList);
                    setIsLoading(false);
                    scrollToBottom();
                }
                setHasMore(hasMoreData ?? false);
            } else {
                console.error('No messages found or error:', res);
                if (!before) setError('Invalid response from server');
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        } catch (error: any) {
            console.error('Failed to load messages:', error);
            if (!before) setError(error.message || 'Connection failed');
            setIsLoading(false);
            setIsLoadingMore(false);
            toast.showError('Failed to load messages');
        }
    }, [conversationId]);

    useEffect(() => {
        setMessages([]);
        setIsLoading(true);
        loadMessages();
    }, [conversationId, loadMessages]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        socket.emit('join:conversation', conversationId);

        socket.on('message:new', (message: Message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        socket.on('message:deleted', (messageId: string) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        });

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

        socket.on('message:read', ({ messageId, userId }) => {
            setMessages(prev => prev.map(msg =>
                msg._id === messageId
                    ? { ...msg, readBy: [...msg.readBy || [], { userId, readAt: new Date().toISOString() }] }
                    : msg
            ));
        });

        return () => {
            socket.emit('leave:conversation', conversationId);
            socket.off('message:new');
            socket.off('message:deleted');
            socket.off('user:typing');
            socket.off('user:stopped-typing');
            socket.off('message:read');
        };
    }, [socket, conversationId, currentUserId]);

    const prevScrollHeightRef = useRef<number>(0);

    // Maintain scroll position when loading old messages
    useEffect(() => {
        if (!messagesContainerRef.current || prevScrollHeightRef.current === 0) return;

        const newScrollHeight = messagesContainerRef.current.scrollHeight;
        const diff = newScrollHeight - prevScrollHeightRef.current;

        // Only adjust if height increased (messages added)
        if (diff > 0) {
            messagesContainerRef.current.scrollTop = diff;
        }
        prevScrollHeightRef.current = 0;
    }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleScroll = () => {
        if (messagesContainerRef.current && messagesContainerRef.current.scrollTop < 50 && hasMore && !isLoadingMore) {
            setIsLoadingMore(true);
            prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
            const firstMessage = messages[0];
            if (firstMessage) {
                loadMessages(new Date(firstMessage.createdAt).toISOString());
            }
        }
    };

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

    const handleSendMessage = async (e?: React.FormEvent, content: string = newMessage, type: 'text' | 'image' = 'text') => {
        if (e) e.preventDefault();
        const textToSend = content.trim();

        if (!textToSend && type === 'text') return;

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            _id: tempId,
            conversationId,
            senderId: currentUserId,
            content: textToSend,
            type,
            createdAt: new Date().toISOString(),
            readBy: [],
            starredBy: [],
            status: 'sending'
        };

        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        setIsTyping(false);
        socket?.emit('typing:stop', conversationId);
        scrollToBottom();

        try {
            const res = await api.conversations.sendMessage(conversationId, textToSend, type);

            // Replace temp message with real one
            setMessages(prev => prev.map(m => m._id === tempId ? res : m));
        } catch (error: any) {
            console.error('Failed to send message:', error);
            toast.showError('Error sending message');
            // Mark as error
            setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'error' } : m));
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (await confirm({
            title: 'Delete Message',
            message: 'Are you sure you want to delete this message?',
            type: 'danger',
            confirmText: 'Delete'
        })) {
            try {
                await api.messages.delete(messageId);
                setMessages(prev => prev.filter(m => m._id !== messageId));
                toast.showSuccess('Message deleted');
            } catch (error) {
                toast.showError('Error deleting message');
            }
        }
    };

    const handleStarMessage = async (messageId: string) => {
        try {
            const updatedMsg = await api.messages.star(messageId);
            setMessages(prev => prev.map(m => m._id === messageId ? updatedMsg : m));
        } catch (error) {
            console.error('Error styling message');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Compress Image
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max dimensions (like WhatsApp/Insta optimization)
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    const base64String = canvas.toDataURL('image/jpeg', 0.7);
                    handleSendMessage(undefined, base64String, 'image');
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading messages...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="text-red-500 font-medium">Failed to load messages</div>
                <div className="text-sm text-gray-500 px-4 text-center">{error}</div>
                <button
                    onClick={() => { setIsLoading(true); loadMessages(); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Retry Connection
                </button>
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
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {isLoadingMore && (
                    <div className="text-center py-2 text-sm text-gray-500">Loading older messages...</div>
                )}

                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => {
                        const rawSenderId = typeof message.senderId === 'object' && message.senderId !== null
                            ? (message.senderId._id || message.senderId.id)
                            : message.senderId;

                        // Robust comparison converting both to strings
                        const isOwn = String(rawSenderId) === String(currentUserId);

                        const isRead = (message.readBy || []).some(r => r.userId !== currentUserId);
                        const isStarred = (message.starredBy || []).includes(currentUserId);

                        return (
                            <div
                                key={message._id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                            >
                                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {!isOwn && typeof message.senderId === 'object' && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            {message.senderId.firstName} {message.senderId.lastName}
                                        </span>
                                    )}
                                    <div className="relative group">
                                        <div
                                            className={`px-4 py-2 shadow-sm max-w-full break-words ${isOwn
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-sm'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-tl-sm'
                                                }`}
                                        >
                                            {message.type === 'image' ? (
                                                <div className="relative">
                                                    <img
                                                        src={message.content}
                                                        alt="Shared"
                                                        className={`max-w-full rounded-lg ${message.status === 'sending' ? 'opacity-70 blur-sm transition-all duration-300' : ''}`}
                                                    />
                                                    {message.status === 'sending' && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm break-words">{message.content}</p>
                                            )}
                                        </div>

                                        {/* Message Actions */}
                                        <div className={`absolute top-0 ${isOwn ? '-left-16' : '-right-16'} hidden group-hover:flex items-center gap-1 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-1`}>
                                            <button
                                                onClick={() => handleStarMessage(message._id)}
                                                className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${isStarred ? 'text-yellow-400' : 'text-gray-400'}`}
                                                title="Star message"
                                            >
                                                <svg className="w-4 h-4" fill={isStarred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            </button>
                                            {isOwn && (
                                                <button
                                                    onClick={() => handleDeleteMessage(message._id)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-400 hover:text-red-500"
                                                    title="Delete message"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
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
                                        {isStarred && (
                                            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
            <form onSubmit={(e) => handleSendMessage(e)} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Upload Image"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
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
