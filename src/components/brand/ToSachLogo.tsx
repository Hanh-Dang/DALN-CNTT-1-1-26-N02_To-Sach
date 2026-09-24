import React from 'react';

interface ToSachLogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
  textClassName?: string;
  sloganClassName?: string;
}

export const ToSachLogo: React.FC<ToSachLogoProps> = ({
  size = 40,
  className = '',
  withText = false,
  textClassName = 'text-xl font-black text-white leading-none',
  sloganClassName = 'text-[9px] font-bold text-[#F5A623] uppercase tracking-wider mt-1 leading-none',
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official Bird Nest & Open Book Wings Icon */}
      <div 
        className="rounded-xl overflow-hidden shadow-xs shrink-0 flex items-center justify-center ring-1 ring-[#F5A623]/40 bg-[#0B1F3A]"
        style={{ width: size, height: size }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 44 44" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path d="M10 0H34C39.5191 0 44 4.48085 44 10V34C44 39.5191 39.5191 44 34 44H10C4.48085 44 0 39.5191 0 34V10C0 4.48085 4.48085 0 10 0Z" fill="#0B1F3A"/>
          <path d="M12 32C17 35 27 35 32 32" stroke="#F5A623" strokeWidth="3" strokeLinecap="round"/>
          <path d="M14 26C18 29 26 29 30 26" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M22 14C17 17 12 18 8 16C8 23 15 25 22 25C29 25 36 23 36 16C32 18 27 17 22 14Z" fill="#F5A623"/>
          <path d="M19.5 13C19.5 14.3798 20.6202 15.5 22 15.5C23.3798 15.5 24.5 14.3798 24.5 13C24.5 11.6202 23.3798 10.5 22 10.5C20.6202 10.5 19.5 11.6202 19.5 13Z" fill="white"/>
          <path d="M22 15.5V24.5" stroke="#0B1F3A" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {withText && (
        <div className="shrink-0 flex flex-col justify-center">
          <span className={textClassName}>
            Tổ Sách
          </span>
          <span className={sloganClassName}>
            SÁCH VỀ TỔ, TRI THỨC BAY XA
          </span>
        </div>
      )}
    </div>
  );
};
