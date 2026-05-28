import React from 'react';

interface SuccessBeaconLogoProps {
  variant?: 'full' | 'badge' | 'icon';
  className?: string;
  size?: number | string;
  lightMode?: boolean;
}

export default function SuccessBeaconLogo({ 
  variant = 'full', 
  className = '', 
  size,
  lightMode = false
}: SuccessBeaconLogoProps) {
  
  // Clean, high-fidelity SVG illustration of the Success Beacon Lighthouse & Open Book/Pen Quill
  const renderIcon = (customSize?: number | string, forceLightMode: boolean = false) => {
    const iconSize = customSize || (variant === 'badge' ? 120 : variant === 'full' ? 90 : 48);
    const isLight = forceLightMode || lightMode;
    const primaryColor = isLight ? '#ffffff' : '#0f172a'; // Slate-900 or White
    const beamColor = '#eab308'; // Amber-500

    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Beacon Light Gradients */}
          <linearGradient id="left-beam" x1="180" y1="95" x2="10" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={beamColor} stopOpacity="0.8" />
            <stop offset="60%" stopColor={beamColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={beamColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="right-beam" x1="220" y1="95" x2="390" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={beamColor} stopOpacity="0.8" />
            <stop offset="60%" stopColor={beamColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={beamColor} stopOpacity="0" />
          </linearGradient>

          {/* Golden Glow Filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- LIGHT BEAMS (Golden Radial-linear spread) --- */}
        <g opacity="0.85">
          {/* Left beam */}
          <path
            d="M 175 92 L 0 50 L 0 160 Z"
            fill="url(#left-beam)"
          />
          {/* Right beam */}
          <path
            d="M 225 92 L 400 50 L 400 160 Z"
            fill="url(#right-beam)"
          />
          {/* Central Beacon Lantern Glow Core */}
          <circle
            cx="200"
            cy="95"
            r="16"
            fill="#ffffff"
            filter="url(#glow)"
            className="animate-pulse"
          />
          <circle
            cx="200"
            cy="95"
            r="8"
            fill="#fef08a"
          />
        </g>

        {/* --- LIGHTHOUSE STRUCTURE & SHAFT --- */}
        {/* Gallery platform support bracket / balcony railings */}
        <path
          d="M 172 110 L 228 110 L 222 118 L 178 118 Z"
          fill={primaryColor}
        />
        <rect
          x="164"
          y="105"
          width="72"
          height="5"
          rx="2"
          fill={primaryColor}
        />

        {/* Main Shaft (Drawn with custom elegant tapered pillar lines) */}
        <path
          d="M 178 118 L 222 118 L 234 220 L 166 220 Z"
          fill={primaryColor}
        />

        {/* Arched Observation Windows */}
        <path
          d="M 194 150 C 194 144 206 144 206 150 L 206 164 L 194 164 Z"
          fill="#3b82f6"
          opacity="0.2"
        />
        <path
          d="M 194 150 C 194 144 206 144 206 150 L 206 164 L 194 164 Z"
          stroke={primaryColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Upper Lantern Room Pillars */}
        <rect
          x="184"
          y="85"
          width="4"
          height="20"
          fill={primaryColor}
        />
        <rect
          x="198"
          y="85"
          width="4"
          height="20"
          fill={primaryColor}
        />
        <rect
          x="212"
          y="85"
          width="4"
          height="20"
          fill={primaryColor}
        />

        {/* Lighthouse Dome Roof & Spire */}
        <path
          d="M 178 85 C 178 68 222 68 222 85 Z"
          fill={primaryColor}
        />
        <path
          d="M 200 68 L 200 48"
          stroke={primaryColor}
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <circle
          cx="200"
          cy="44"
          r="6.5"
          fill={primaryColor}
        />

        {/* --- THE OPEN BOOK BASE (Merging into Fountain Pen Nib) --- */}
        {/* Left Book Page Base */}
        <path
          d="M 200 230 C 120 226 60 252 40 262 L 40 286 C 60 276 120 250 200 254 Z"
          fill={primaryColor}
        />
        {/* Right Book Page Base */}
        <path
          d="M 200 230 C 280 226 340 252 360 262 L 360 286 C 340 276 280 250 200 254 Z"
          fill={primaryColor}
        />

        {/* Distinct 3D Page Layers below to suggest depth of open textbook */}
        <path
          d="M 40 266 C 60 258 120 252 200 258"
          stroke={lightMode ? '#1e293b' : '#cbd5e1'}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M 360 266 C 340 258 280 252 200 258"
          stroke={lightMode ? '#1e293b' : '#cbd5e1'}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Elegant Fountain Pen Quill Pen Point (Negative cut-out at the Book Center) */}
        {/* We outline the pen nib inside the book spine to match the logo perfectly */}
        <path
          d="M 200 216 L 182 250 L 186 295 L 214 295 L 218 250 Z"
          fill={isLight ? '#0f172a' : '#ffffff'}
          className="transition-colors"
        />
        {/* Slit and Breather Hole of Fountain Pen Quill */}
        <circle
          cx="200"
          cy="260"
          r="3.5"
          fill={primaryColor}
        />
        <line
          x1="200"
          y1="218"
          x2="200"
          y2="257.5"
          stroke={primaryColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  if (variant === 'badge') {
    // Elegant apple style mockup app icon (Rounded Dark Navy Blue container with logo inside)
    return (
      <div 
        className={`w-48 h-48 bg-[#0a1e38] rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg border border-slate-700/30 font-sans relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 ${className}`}
        style={size ? { width: size, height: size } : {}}
      >
        {/* Soft radial glare */}
        <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none"></div>
        {renderIcon('100%', true)}
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderIcon(size)}
      </div>
    );
  }

  // default to full banner with typography setup
  return (
    <div className={`flex flex-col items-center text-center font-sans ${className}`} id="success-beacon-branding-logo">
      {/* SVG Emblem */}
      <div className="mb-2 relative">
        {renderIcon(size || 160)}
      </div>

      {/* Primary Brand Typography */}
      <h1 className="text-3xl font-extrabold tracking-widest text-[#0a1e38] font-display flex flex-col">
        <span>SUCCESS</span>
        <span className="text-amber-500 text-lg font-bold tracking-[0.25em] border-t border-b border-slate-200 py-1 mt-1 font-sans">
          BEACON
        </span>
      </h1>

      {/* Secondary Branding Tagline */}
      <p className="text-[10px] text-slate-400 font-mono tracking-[0.23em] font-black uppercase mt-2.5">
        Guiding You To Achieve
      </p>
    </div>
  );
}
