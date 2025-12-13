import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import ModerationQueue from './ModerationQueue';
import UserManagement from './UserManagement';
import VerificationReview from './VerificationReview';
import AnalyticsDashboard from './AnalyticsDashboard';
import BulkActionsPanel from './BulkActionsPanel';
import ReportsGenerator from './ReportsGenerator';
import AdminSettings from './AdminSettings';

const AdminLayout: React.FC = () => {
    const [activePage, setActivePage] = useState('dashboard');

    const renderContent = () => {
        switch (activePage) {
            case 'dashboard':
                return <AdminDashboard onNavigate={setActivePage} />;
            case 'analytics':
                return <AnalyticsDashboard />;
            case 'verification':
                return <VerificationReview />;
            case 'moderation':
                return <ModerationQueue />;
            case 'users':
                return <UserManagement />;
            case 'bulk':
                return <BulkActionsPanel />;
            case 'reports':
                return <ReportsGenerator />;
            case 'settings':
                return <AdminSettings />;
            default:
                return <AdminDashboard onNavigate={setActivePage} />;
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'verification', label: 'Verification', icon: '✅' },
        { id: 'moderation', label: 'Moderation', icon: '🛡️' },
        { id: 'bulk', label: 'Bulk Actions', icon: '⚡' },
        { id: 'reports', label: 'Reports', icon: '📋' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold">🏠 HostelHub Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activePage === item.id
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-colors">
                        <span className="text-lg">🚪</span>
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">{activePage}</h2>
                </header>
                <main className="p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
