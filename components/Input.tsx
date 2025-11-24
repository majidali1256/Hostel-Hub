import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  id: string;
  forceLight?: boolean;
}

const Input: React.FC<InputProps> = ({ label, id, forceLight = false, ...props }) => {
  const labelClasses = forceLight
    ? "block text-sm font-medium text-gray-700 mb-1"
    : "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  const inputClasses = forceLight
    ? "w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    : "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500";

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <input
        id={id}
        className={inputClasses}
        {...props}
      />
    </div>
  );
};

export default Input;