import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  id: string;
  forceLight?: boolean;
}

const Input: React.FC<InputProps> = ({ label, id, forceLight = false, ...props }) => {
  const labelClasses = forceLight
    ? "block text-sm font-semibold text-gray-700 mb-1.5"
    : "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  const inputClasses = forceLight
    ? "w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
    : "w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500";

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