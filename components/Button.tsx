
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  forceLight?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  forceLight = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-bold py-2.5 px-5 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] shadow-sm hover:shadow-md hover:-translate-y-0.5';

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-blue-500/20',
    secondary: forceLight
      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-400 border border-gray-200 dark:border-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-red-500/20',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const disabledStyle = (disabled || isLoading) ? 'opacity-50 cursor-not-allowed !translate-y-0 !shadow-none' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${disabledStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
