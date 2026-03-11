import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showToggle?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  showToggle,
  type,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-[14px] text-[#8E8E93] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`w-full bg-[#1C1C1E] border ${error ? 'border-red-500' : 'border-[#2C2C2E]'} rounded-[12px] p-[14px] text-[16px] text-white placeholder-[#48484A] outline-none focus:border-[#007AFF] transition-all ${className}`}
          {...props}
        />
        {isPassword && showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93]"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-[12px] mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;
