import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-[100] transform transition-transform duration-300">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-700 dark:text-gray-300 mb-4 md:mb-0 text-center md:text-left">
          <p>
            We use cookies to improve your experience, analyze site usage, and assist in our marketing efforts. 
            By continuing to use this site, you agree to our use of cookies according to our{' '}
            <a href="?view=privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>
            {' '}and{' '}
            <a href="?view=terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a>.
          </p>
        </div>
        <div className="flex flex-row items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handleDecline}
            className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors border border-transparent"
          >
            Decline All
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
