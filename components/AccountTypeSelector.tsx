import React from 'react';
import Button from './Button';

interface AccountTypeSelectorProps {
  username: string;
  onSelectRole: (role: 'owner' | 'customer') => void;
}

const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({ username, onSelectRole }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 space-y-8 border border-gray-100 dark:border-gray-700 text-center animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20 animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">One Last Step, {username}!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            To personalize your experience, please tell us who you are.
          </p>
        </div>
        
        <div className="space-y-4 pt-2">
          <button
            onClick={() => onSelectRole('owner')}
            className="w-full text-left p-6 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group active:scale-[0.98] hover:shadow-md animate-stagger-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">I'm a Hostel Owner</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">I want to list and manage my properties.</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => onSelectRole('customer')}
            className="w-full text-left p-6 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group active:scale-[0.98] hover:shadow-md animate-stagger-in"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">I'm Looking for a Hostel</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">I want to search, find, and rate hostels.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeSelector;
