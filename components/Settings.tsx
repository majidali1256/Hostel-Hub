import React from 'react';
import { User } from '../types';
import Button from './Button';

interface SettingsProps {
  user: User;
  onUpdateUser: (updatedData: Partial<User> | FormData) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, theme, toggleTheme }) => {
  // Profile editing moved to Profile component

  const Card: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6">{title}</h2>
      {children}
    </div>
  );

  const NotificationToggle: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex justify-between items-center py-3 border-b dark:border-gray-700">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" value="" className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Appearance Card */}
      <Card title="Appearance">
        <div className="flex justify-between items-center py-3">
          <span className="text-gray-600 dark:text-gray-300">Dark Mode</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={theme === 'dark'}
              onChange={toggleTheme}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </Card>

      {/* Notifications Card */}
      <Card title="Notifications">
        <div className="space-y-2">
          <NotificationToggle label="Email Notifications" />
          <NotificationToggle label="Push Notifications" />
          <NotificationToggle label="New Hostel Alerts" />
        </div>
      </Card>

      {/* Account Card */}
      <Card title="Account Management">
        <div className="space-y-4">
          <Button variant="secondary" onClick={() => alert('Change password functionality not implemented.')}>
            Change Password
          </Button>
          <Button
            className="!bg-red-50 !text-red-700 hover:!bg-red-100 focus:!ring-red-300"
            onClick={() => alert('Delete account functionality not implemented.')}
          >
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;