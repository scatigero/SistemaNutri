import React from 'react';
import { Leaf } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'sistema-nutri' | 'nutrisystem';
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md', variant = 'sistema-nutri' }) => {
  const sizeClasses = {
    sm: {
      icon: 'w-5 h-5',
      iconBox: 'p-1.5 rounded-lg',
      text: 'text-base font-bold',
    },
    md: {
      icon: 'w-6 h-6',
      iconBox: 'p-2 rounded-xl',
      text: 'text-xl font-extrabold',
    },
    lg: {
      icon: 'w-8 h-8',
      iconBox: 'p-2.5 rounded-2xl',
      text: 'text-2xl font-extrabold',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className || ''}`}>
      <div className={`bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center flex-shrink-0 ${currentSize.iconBox}`}>
        <Leaf className={`${currentSize.icon} transform -rotate-12`} />
      </div>
      <div className="flex flex-col leading-tight">
        {variant === 'sistema-nutri' ? (
          <span className={`tracking-tight text-slate-900 ${currentSize.text}`}>
            Sistema <span className="text-emerald-600 font-black">Nutri</span>
          </span>
        ) : (
          <span className={`tracking-tight text-slate-900 ${currentSize.text}`}>
            Nutri<span className="text-emerald-600">System</span>
          </span>
        )}
      </div>
    </div>
  );
};
