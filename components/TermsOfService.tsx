import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Terms & Conditions</h1>
      
      <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing or using Hostel Hub ("the Service"), you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">2. Description of Service</h2>
        <p className="mb-4">
          Hostel Hub is an online platform that connects hostel owners, operators, and property managers with individuals seeking accommodation. We do not own or manage any properties listed on the Service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">3. User Accounts</h2>
        <p className="mb-4">
          When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">4. User Content and Listings</h2>
        <p className="mb-4">
          Property owners are solely responsible for the accuracy of their listings. Hostel Hub reserves the right to remove or modify listings that violate our policies or are deemed inappropriate.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">5. Payments and Fees</h2>
        <p className="mb-4">
          Certain features of the Service may require payment of fees. All fees are non-refundable unless otherwise specified. We reserve the right to change our fee structure at any time.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">6. Limitation of Liability</h2>
        <p className="mb-4">
          In no event shall Hostel Hub, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the Service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">7. Governing Law</h2>
        <p className="mb-4">
          These Terms shall be governed and construed in accordance with the local laws, without regard to its conflict of law provisions.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">8. Changes</h2>
        <p className="mb-4">
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days notice prior to any new terms taking effect.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
