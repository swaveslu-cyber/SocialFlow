
import React from 'react';

interface LogoProps {
  className?: string;
  customLogoUrl?: string;
}

export const SwaveLogo: React.FC<LogoProps> = ({ className = "w-full h-full", customLogoUrl }) => {
  
  if (customLogoUrl) {
    return (
      <img src={customLogoUrl} alt="Agency Logo" className={`${className} object-contain rounded-xl`} />
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="#7B2CBF" />
        </linearGradient>
        <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-secondary)" />
          <stop offset="100%" stopColor="#FF6D00" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>

      <g filter="url(#shadow)">
          {/* Orange Shape (Bottom) */}
          {/* Depth / Side Face */}
          <path d="M5,70 L15,85 L60,85 L85,65 L85,72 L60,92 L15,92 L5,77 Z" fill="#B44600" />
          {/* Main Face */}
          <path d="M85,65 L60,85 L15,85 L5,70 L15,55 L40,55 L65,30 L85,30 Z" fill="url(#orangeGrad)" />
          
          {/* Purple Shape (Top) */}
          {/* Depth / Side Face */}
          <path d="M15,70 L35,70 L60,45 L85,45 L95,30 L95,37 L85,52 L60,52 L35,77 L15,77 Z" fill="#3a1c4d" />
          {/* Main Face */}
          <path d="M15,35 L40,15 L85,15 L95,30 L85,45 L60,45 L35,70 L15,70 Z" fill="url(#purpleGrad)" />
      </g>
    </svg>
  );
};
