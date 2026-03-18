import React, { useState, useEffect } from 'react';
import Chat from './Chat';
import { api } from '../services/mongoService';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';

interface ChatDashboardProps {
    currentUser: any;
    initialConversationId?: string | null;
}

const ChatDashboard: React.FC<ChatDashboardProps> = ({ currentUser, initialConversationId }) => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId || null);
    const [isLoading, setIsLoading] = useState(true);
    const { confirm } = useConfirm();
    const toast = useToast();

    useEffect(() => {
        if (initialConversationId) {
            setSelectedConversationId(initialConversationId);
        }
        loadConversations();
    }, [initialConversationId]);

    const loadConversations = async () => {
        try {
            const data = await api.conversations.getAll();
            console.log('Loaded conversations:', data);

            // Check if data is an array, otherwise set empty array
            if (Array.isArray(data)) {
                setConversations(data);
            } else {
                setConversations([]);
                if (data?.error) {
                    console.log('Conversations API error:', data.error);
                }
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
            setConversations([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Safety check
    if (!currentUser || !currentUser.id) {
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="text-red-600">Error: User not properly loaded</p>
            </div>
        );
    }

    if (selectedConversationId) {
        const selectedConv = conversations.find(c => c._id === selectedConversationId);
        const otherParticipant = selectedConv?.participants?.find((p: any) => p._id !== currentUser.id);
        const chatName = selectedConv?.hostelId?.name || 
            (otherParticipant ? `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() : 'Chat');

        return (
            <div className="max-w-4xl mx-auto h-[calc(100vh-100px)]">
                <Chat
                    conversationId={selectedConversationId}
                    currentUserId={currentUser.id}
                    chatName={chatName || 'Chat'}
                    onClose={() => setSelectedConversationId(null)}
                    onDelete={async () => {
                        if (await confirm({
                            title: 'Delete Conversation',
                            message: 'Are you sure you want to delete this conversation? This cannot be undone.',
                            type: 'danger',
                            confirmText: 'Delete'
                        })) {
                            try {
                                await api.conversations.delete(selectedConversationId);
                                setConversations(prev => prev.filter(c => c._id !== selectedConversationId));
                                setSelectedConversationId(null);
                                toast.showSuccess('Conversation deleted');
                            } catch (error) {
                                toast.showError('Failed to delete conversation');
                            }
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Messages</h2>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Loading conversations...
                </div>
            ) : conversations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Messages Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">Connect with roommates or hostel owners to start chatting!</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(conv => {
                        const otherParticipant = conv.participants?.find((p: any) => p._id !== currentUser.id);
                        const isSelected = conv._id === selectedConversationId;
                        return (
                            <div
                                key={conv._id}
                                onClick={async () => {
                                    setSelectedConversationId(conv._id);
                                    if (conv.unreadCount > 0) {
                                        // Update UI optimistically
                                        setConversations(prev => prev.map(c =>
                                            c._id === conv._id ? { ...c, unreadCount: 0 } : c
                                        ));
                                        // Call backend
                                        try {
                                            await api.conversations.markAsRead(conv._id);
                                        } catch (err) {
                                            console.error('Failed to mark read', err);
                                        }
                                    }
                                }}
                                className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-4 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                            >
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg relative">
                                    {otherParticipant?.firstName?.[0] || '?'}
                                    {conv.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-800">
                                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`font-semibold truncate ${conv.unreadCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {conv.hostelId?.name || `${otherParticipant?.firstName || ''} ${otherParticipant?.lastName || ''}`.trim() || 'Chat'}
                                        </h3>
                                        {conv.lastMessage && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm truncate flex items-center gap-1 ${conv.unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {conv.lastMessage?.content === 'Voice Message' ? (
                                            <>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                </svg>
                                                Voice Message
                                            </>
                                        ) : conv.lastMessage ? conv.lastMessage.content : 'Start a conversation'}
                                    </p>
                                </div>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (await confirm({
                                            title: 'Delete Conversation',
                                            message: 'Are you sure you want to delete this conversation? This cannot be undone.',
                                            type: 'danger',
                                            confirmText: 'Delete'
                                        })) {
                                            try {
                                                await api.conversations.delete(conv._id);
                                                setConversations(prev => prev.filter(c => c._id !== conv._id));
                                                toast.showSuccess('Conversation deleted');
                                            } catch (error) {
                                                toast.showError('Failed to delete conversation');
                                            }
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete conversation"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ChatDashboard;
