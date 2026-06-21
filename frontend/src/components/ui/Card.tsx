import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl bg-[#1e293b] p-4 ${
        hover
          ? 'cursor-pointer transition-all duration-200 hover:bg-[#263348] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5'
          : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
