import React from 'react';
import { User } from '../types';
import Button from './Button';
import { SettingsIcon } from './icons/SettingsIcon';

interface SidebarProps {
    user: User;
    unreadMessagesCount?: number;
    onLogout: () => void;
    onNavigate: (view: 'dashboard' | 'profile' | 'settings' | 'chat' | 'agreements' | 'admin' | 'rent-estimator' | 'bookings' | 'booking-history' | 'smart-search' | 'privacy' | 'terms') => void;
    onClose: () => void;
    onOpenFeedback?: () => void;
}

const roleStyles: { [key: string]: string } = {
    owner: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    customer: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    pending: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    admin: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
};

const Sidebar: React.FC<SidebarProps> = ({ user, unreadMessagesCount = 0, onLogout, onNavigate, onClose, onOpenFeedback }) => {
    const navItemClasses = "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-700/70 hover:text-blue-600 dark:hover:text-blue-400 text-left relative group active:scale-[0.98]";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" onClick={onClose}>
            <aside
                className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col p-4 h-screen shadow-2xl animate-slide-in-left"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-2 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-800 dark:text-white">Hostel Hub</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 active:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto px-1">
                    <button onClick={() => onNavigate('dashboard')} className={navItemClasses} style={{ animationDelay: '0.05s' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span>Dashboard</span>
                    </button>

                    <button onClick={() => onNavigate('chat')} className={navItemClasses} style={{ animationDelay: '0.1s' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Messages</span>
                        {unreadMessagesCount > 0 && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center animate-pulse-ring">
                                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                            </span>
                        )}
                    </button>

                    <button onClick={() => onNavigate('agreements')} className={navItemClasses} style={{ animationDelay: '0.15s' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Agreements</span>
                    </button>

                    {/* Customer-specific: Booking History */}
                    {user.role === 'customer' && (
                        <button onClick={() => onNavigate('booking-history')} className={navItemClasses} style={{ animationDelay: '0.25s' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span>My Bookings</span>
                        </button>
                    )}

                    {user.role === 'owner' && (
                        <>
                            <button onClick={() => onNavigate('bookings')} className={navItemClasses} style={{ animationDelay: '0.25s' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <span>Manage Bookings</span>
                            </button>
                            <button onClick={() => onNavigate('rent-estimator')} className={navItemClasses} style={{ animationDelay: '0.3s' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Rent Estimator</span>
                            </button>
                        </>
                    )}

                    {user.role === 'admin' && (
                        <button onClick={() => onNavigate('admin')} className={navItemClasses} style={{ animationDelay: '0.25s' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Admin Dashboard</span>
                        </button>
                    )}



                    <button onClick={() => onNavigate('profile')} className={navItemClasses} style={{ animationDelay: '0.35s' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>My Profile</span>
                    </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                    <button onClick={() => { onOpenFeedback?.(); onClose(); }} className={navItemClasses}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Help & Support</span>
                    </button>
                    <button onClick={() => onNavigate('settings')} className={navItemClasses}>
                        <SettingsIcon />
                        <span>Settings</span>
                    </button>
                    <div className="flex items-center gap-3 w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 transition-all duration-200">
                        {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-500/20" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-lg shadow-blue-500/20">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 truncate">
                            <p className="font-semibold text-gray-800 dark:text-white truncate">{user.username}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${roleStyles[user.role]}`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                    
                    <div className="pt-2 flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <button onClick={() => onNavigate('privacy')} className="hover:text-gray-700 dark:hover:text-gray-300 hover:underline">Privacy</button>
                        <span>&bull;</span>
                        <button onClick={() => onNavigate('terms')} className="hover:text-gray-700 dark:hover:text-gray-300 hover:underline">Terms</button>
                    </div>

                    <Button onClick={onLogout} variant="secondary" fullWidth>
                        Logout
                    </Button>
                </div>
            </aside>
        </div>
    );
};

export default Sidebar;