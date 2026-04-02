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

  const Card: React.FC<{ title: string, children: React.ReactNode, delay?: string }> = ({ title, children, delay = '0s' }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in-up" style={{ animationDelay: delay }}>
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6">{title}</h2>
      {children}
    </div>
  );

  const NotificationToggle: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex justify-between items-center py-3 border-b dark:border-gray-700 last:border-b-0">
      <span className="text-gray-600 dark:text-gray-300 font-medium">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" value="" className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/30 dark:peer-focus:ring-blue-800/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 peer-checked:bg-blue-600 shadow-inner"></div>
      </label>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Appearance Card */}
      <Card title="🎨 Appearance" delay="0s">
        <div className="flex justify-between items-center py-3">
          <div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</span>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Switch between light and dark themes</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={theme === 'dark'}
              onChange={toggleTheme}
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/30 dark:peer-focus:ring-blue-800/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 peer-checked:bg-blue-600 shadow-inner"></div>
          </label>
        </div>
      </Card>

      {/* Notifications Card */}
      <Card title="🔔 Notifications" delay="0.1s">
        <div className="space-y-1">
          <NotificationToggle label="Email Notifications" />
          <NotificationToggle label="Push Notifications" />
          <NotificationToggle label="New Hostel Alerts" />
        </div>
      </Card>

      {/* Account Card */}
      <Card title="⚙️ Account Management" delay="0.2s">
        <div className="space-y-3">
          <button
            onClick={() => alert('Change password functionality not implemented.')}
            className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-white">Change Password</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => alert('Delete account functionality not implemented.')}
            className="w-full flex items-center justify-between p-4 border border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-red-700 dark:text-red-400">Delete Account</p>
                <p className="text-sm text-red-500 dark:text-red-400/70">Permanently delete your account and data</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;