import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
    createdAt: Date;
}

interface NotificationCenterProps {
    onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        loadNotifications();
    }, [filter]);

    useEffect(() => {
        if (!socket) return;

        socket.on('notification:new', (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            showToast(notification);
        });

        return () => {
            socket.off('notification:new');
        };
    }, [socket]);

    const loadNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const unreadOnly = filter === 'unread' ? '?unreadOnly=true' : '';
            const res = await fetch(`http://localhost:5001/api/notifications${unreadOnly}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5001/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5001/api/notifications/read-all', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5001/api/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const showToast = (notification: Notification) => {
        // Simple toast notification (you can enhance this with a toast library)
        console.log('New notification:', notification);
    };

    const getIcon = (type: string) => {
        const icons: Record<string, string> = {
            booking: '📅',
            message: '💬',
            review: '⭐',
            appointment: '📍',
            system: '🔔',
            payment: '💳'
        };
        return icons[type] || '🔔';
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            high: 'border-l-red-500',
            medium: 'border-l-blue-500',
            low: 'border-l-gray-400'
        };
        return colors[priority] || 'border-l-gray-400';
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 animate-scale-in shadow-2xl">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="w-8 h-8 border-[3px] border-gray-200 dark:border-gray-700 rounded-full"></div>
                            <div className="absolute inset-0 w-8 h-8 border-[3px] border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading notifications...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-scale-in border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{unreadCount} unread</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${filter === 'all'
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${filter === 'unread'
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Unread ({unreadCount})
                        </button>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="ml-auto px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12 animate-fade-in">
                            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 font-medium">No notifications</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        notifications.map((notification, index) => (
                            <div
                                key={notification._id}
                                className={`p-4 rounded-xl border-l-4 ${getPriorityColor(notification.priority)} ${notification.read ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'
                                    } hover:shadow-md transition-all duration-200 cursor-pointer animate-stagger-in`}
                                style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                                onClick={() => !notification.read && markAsRead(notification._id)}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{getIcon(notification.type)}</span>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{notification.title}</h4>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{notification.message}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification._id);
                                                }}
                                                className="text-gray-400 hover:text-red-500 transition-all duration-200 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        {notification.actionUrl && (
                                            <a
                                                href={notification.actionUrl}
                                                className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                View details →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
