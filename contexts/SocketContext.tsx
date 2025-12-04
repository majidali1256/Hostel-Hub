import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    connect: () => { },
    disconnect: () => { }
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = () => {
        const token = localStorage.getItem('token');

        if (token) {
            // Disconnect existing socket if any
            if (socket) {
                socket.disconnect();
            }

            const newSocket = io('http://localhost:5001', {
                auth: { token },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            newSocket.on('connect', () => {
                console.log('Socket connected');
                setIsConnected(true);
                newSocket.emit('user:online');
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setIsConnected(false);
            });

            setSocket(newSocket);
        }
    };

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    };

    useEffect(() => {
        connect();
        return () => {
            if (socket) socket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
            {children}
        </SocketContext.Provider>
    );
};
