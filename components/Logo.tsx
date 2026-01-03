
import React from 'react';

interface LogoProps {
  className?: string;
}

export const SwaveLogo: React.FC<LogoProps> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Bottom Part - Orange (Rotated 180) */}
    {/* Side/Depth (Darker) - Shifted Up-Left (-2, -2) due to rotation logic */}
    <polygon 
        points="83,73 63,88 13,78 13,62 63,72 83,57" 
        fill="#B44600" 
    />
    {/* Face (Brighter) */}
    <polygon 
        points="85,75 65,90 15,80 15,64 65,74 85,59" 
        fill="#F27A21" 
    />
    {/* Highlight Line */}
    <polyline 
        points="85,75 65,90 15,80" 
        fill="none" 
        stroke="white" 
        strokeOpacity="0.3" 
        strokeWidth="1" 
    />

    {/* Top Part - Purple */}
    {/* Side/Depth (Darker) - Shifted Down-Right (+2, +2) */}
    <polygon 
        points="17,27 37,12 87,22 87,38 37,28 17,43" 
        fill="#5a2775" 
    />
    {/* Face (Brighter) */}
    <polygon 
        points="15,25 35,10 85,20 85,36 35,26 15,41" 
        fill="#8E3EBB" 
    />
    {/* Highlight Line */}
    <polyline 
        points="15,25 35,10 85,20" 
        fill="none" 
        stroke="white" 
        strokeOpacity="0.3" 
        strokeWidth="1" 
    />
  </svg>
);
