import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  // Sin outline/ring propio: el :focus-visible global de globals.css lo cubre.
  const baseStyles =
    'font-bold rounded-md transition-colors duration-200 ease-standard active:scale-[.98]';

  const primary =
    'bg-accent text-accent-contrast hover:bg-accent-hover active:bg-accent-press hover:shadow-glow-sm';
  const quiet =
    'border border-border-strong text-text hover:bg-surface-raised';

  const variantStyles = {
    primary,
    secondary: quiet,
    outline: quiet,
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
