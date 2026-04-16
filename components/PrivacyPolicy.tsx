import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Privacy Policy</h1>
      
      <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">1. Information We Collect</h2>
        <p className="mb-4">
          We collect information that you manually provide to us when creating an account, such as your email address, name, and contact details. When using our platform, we also collect technical information such as your IP address, browser type, and interactions with the service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">2. How We Use Your Information</h2>
        <p className="mb-4">
          We use the information we collect to provide, maintain, and improve our services, communicate with you about listings or bookings, and enforce our terms and policies.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">3. Information Sharing</h2>
        <p className="mb-4">
          We do not sell your personal data. We may share information with third-party service providers who assist us in operating our platform, or if required by law.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">4. Data Security</h2>
        <p className="mb-4">
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">5. Your Rights (GDPR / CCPA)</h2>
        <p className="mb-4">
          Depending on your location, you may have the right to access, correct, delete, or restrict the use of your personal data. Please contact us to exercise these rights.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">6. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this Privacy Policy, please contact our support team.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
