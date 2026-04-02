import React from 'react';

const AppLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      {/* Logo with float animation */}
      <div className="animate-fade-in-up flex flex-col items-center gap-6">
        <div className="relative">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl shadow-2xl shadow-blue-500/20 dark:shadow-blue-500/30 animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          {/* Pulse rings behind logo */}
          <div className="absolute inset-0 bg-blue-500/20 rounded-2xl animate-ping" style={{ animationDuration: '2s' }}></div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Hostel Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Home, away from Home.</p>
        </div>

        {/* Custom spinner */}
        <div className="relative mt-4">
          <div className="w-10 h-10 border-[3px] border-gray-200 dark:border-gray-700 rounded-full"></div>
          <div className="absolute inset-0 w-10 h-10 border-[3px] border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default AppLoadingScreen;
