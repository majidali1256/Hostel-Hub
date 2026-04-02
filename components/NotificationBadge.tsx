import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

interface NotificationBadgeProps {
    onClick: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ onClick }) => {
    const { socket } = useSocket();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadUnreadCount();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('notification:new', () => {
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.off('notification:new');
        };
    }, [socket]);

    const loadUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5001/api/notifications/unread', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };

    return (
        <button
            onClick={onClick}
            className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 active:scale-90"
            aria-label="Notifications"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-lg shadow-red-500/30 animate-pulse-ring">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBadge;
