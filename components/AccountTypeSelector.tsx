import React from 'react';
import Button from './Button';

interface AccountTypeSelectorProps {
  username: string;
  onSelectRole: (role: 'owner' | 'customer') => void;
}

const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({ username, onSelectRole }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-gray-200 text-center">
        <h1 className="text-3xl font-bold text-gray-800">One Last Step, {username}!</h1>
        <p className="text-gray-500 mt-2">
          To personalize your experience, please tell us who you are.
        </p>
        <div className="space-y-4 pt-4">
          <button
            onClick={() => onSelectRole('owner')}
            className="w-full text-left p-6 border rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all group"
          >
            <h2 className="text-lg font-semibold text-gray-800">I'm a Hostel Owner</h2>
            <p className="text-gray-500 text-sm">I want to list and manage my properties.</p>
          </button>
          <button
            onClick={() => onSelectRole('customer')}
            className="w-full text-left p-6 border rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all group"
          >
            <h2 className="text-lg font-semibold text-gray-800">I'm Looking for a Hostel</h2>
            <p className="text-gray-500 text-sm">I want to search, find, and rate hostels.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeSelector;
