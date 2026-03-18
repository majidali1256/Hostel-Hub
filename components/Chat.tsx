import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { format } from 'date-fns';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { api } from '../services/mongoService';
import EmojiPicker from 'emoji-picker-react';

export interface Message {
    _id: string;
    conversationId: string;
    senderId: any;
    content: string;
    type: 'text' | 'image' | 'audio';
    createdAt: string;
    readBy?: Array<{ userId: string; readAt: string }>;
    starredBy?: string[];
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
    isEdited?: boolean;
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

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Advanced Chat State
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    // Load messages
    const loadMessages = useCallback(async (before?: string) => {
        try {
            if (!before) setError(null);
            const res = await api.conversations.getMessages(conversationId, 20, before);

            // Handle both new (paginated) and old (array) API responses for robustness
            const messagesList = Array.isArray(res) ? res : res?.messages;
            const hasMoreData = Array.isArray(res) ? false : res?.hasMore;

            // Check for error response from server
            if (res?.error) {
                console.error('Server error:', res.error);
                if (!before) setError(res.error);
                setIsLoading(false);
                setIsLoadingMore(false);
                return;
            }

            if (messagesList !== undefined) {
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
            // Avoid duplicates: don't add if it's from the current user (already added optimistically)
            const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
            if (String(senderId) === String(currentUserId)) {
                // Update the temp message with the real one from server
                setMessages(prev => {
                    const hasTempMessage = prev.some(m => m._id.startsWith('temp-'));
                    if (hasTempMessage) {
                        // Replace temp message with the real one
                        return prev.map(m => m._id.startsWith('temp-') && m.content === message.content ? message : m);
                    }
                    // If no temp message found, check if this exact message already exists
                    const exists = prev.some(m => m._id === message._id);
                    return exists ? prev : [...prev, message];
                });
            } else {
                // Message from other user - add it
                setMessages(prev => {
                    const exists = prev.some(m => m._id === message._id);
                    return exists ? prev : [...prev, message];
                });
            }
            scrollToBottom();
        });

        socket.on('message:deleted', (messageId: string) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        });

        socket.on('message:edited', (editedMessage: Message) => {
            setMessages(prev => prev.map(m => m._id === editedMessage._id ? editedMessage : m));
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
            socket.off('message:edited');
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

    // Close emoji picker on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // --- Audio Recording Logic ---
    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop()); // Stop microphone access
                
                // Convert blob to base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result as string;
                    handleSendMessage(undefined, base64Audio, 'audio');
                };
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
            
        } catch (err) {
            console.error('Error accessing microphone:', err);
            toast.showError('Microphone access denied or unavailable.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        }
    };

    const handleCancelRecording = () => {
         if (mediaRecorderRef.current && isRecording) {
            // Stop but don't send
            mediaRecorderRef.current.onstop = () => {
                const stream = mediaRecorderRef.current?.stream;
                stream?.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
         }
    };

    // Format duration helper
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    // ----------------------------

    const handleSendMessage = async (e?: React.FormEvent, content: string = newMessage, type: 'text' | 'image' | 'audio' = 'text') => {
        if (e) e.preventDefault();
        const textToSend = content.trim();

        if (!textToSend && type === 'text') return;

        if (editingMessageId && type === 'text') {
            try {
                const res = await api.messages.updateContent(editingMessageId, textToSend);
                setMessages(prev => prev.map(m => m._id === editingMessageId ? res : m));
                setEditingMessageId(null);
                setNewMessage('');
                toast.showSuccess('Message updated');
            } catch (error) {
                console.error('Error updating message:', error);
                toast.showError('Failed to update message');
            }
            return;
        }

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

    const handleEditMessageClick = (message: Message) => {
        setEditingMessageId(message._id);
        setNewMessage(message.content);
        setShowEmojiPicker(false);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setNewMessage('');
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
                                            ) : message.type === 'audio' ? (
                                                <div className="flex items-center gap-2">
                                                    <audio controls src={message.content} className="max-w-[200px] h-10" />
                                                </div>
                                            ) : (
                                                <p className="text-sm break-words">
                                                    {message.content}
                                                    {message.isEdited && <span className="text-xs opacity-70 ml-1">(edited)</span>}
                                                </p>
                                            )}
                                        </div>

                                        {/* Message Actions */}
                                        <div className={`absolute top-0 ${isOwn ? '-left-[4.5rem]' : '-right-16'} hidden group-hover:flex items-center gap-1 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-1`}>
                                            {isOwn && message.type === 'text' && (
                                                <button
                                                    onClick={() => handleEditMessageClick(message)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="Edit message"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            )}
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

                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {format(new Date(message.createdAt), 'HH:mm')}
                                        </span>
                                        {isOwn && (
                                            <span className="flex items-center">
                                                {message.status === 'sending' ? (
                                                    <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : isRead ? (
                                                    // Double Blue Check (Read)
                                                    <div className="flex -space-x-2">
                                                        <svg className="w-4 h-4 text-blue-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    // Single Gray Check (Sent)
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </span>
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
            <form onSubmit={(e) => handleSendMessage(e)} className="p-4 border-t border-gray-200 dark:border-gray-700 relative">
                {isRecording ? (
                    <div className="flex items-center justify-between w-full h-12">
                        <div className="flex items-center gap-3 text-red-500 animate-pulse">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            <span className="font-medium">{formatDuration(recordingDuration)}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCancelRecording}
                                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleStopRecording}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2 items-center w-full">
                        {editingMessageId ? (
                            <button
                                type="button"
                                onClick={cancelEditing}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Cancel Edit"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ) : (
                            <>
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
                            </>
                        )}
                        <div className="relative flex-1 flex items-center">
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="absolute left-2 p-1 text-gray-400 hover:text-yellow-500 focus:outline-none"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            {showEmojiPicker && (
                                <div className="absolute bottom-12 left-0 z-50 shadow-xl" ref={emojiPickerRef}>
                                    <EmojiPicker 
                                        onEmojiClick={(e) => setNewMessage(prev => prev + e.emoji)}
                                        width={300}
                                        height={400}
                                    />
                                </div>
                            )}
                        </div>
                        {newMessage.trim() ? (
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                            >
                                {editingMessageId ? 'Save' : 'Send'}
                            </button>
                        ) : !editingMessageId && (
                            <button
                                type="button"
                                onClick={handleStartRecording}
                                className="p-2 px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shrink-0 flex items-center justify-center"
                                title="Hold to record audio"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

export default Chat;
