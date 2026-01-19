
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <SocketProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </SocketProvider>
    </ToastProvider>
  </React.StrictMode>
);
