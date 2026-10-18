import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const GoogleIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <path fill="#EA4335" d="M12 5c1.54 0 2.92.54 4.01 1.43l3-3C17.18 1.7 14.77 1 12 1 7.42 1 3.51 3.58 1.63 7.34l3.7 2.87C6.21 7.29 8.87 5 12 5z" />
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-2 3.72-4.94 3.72-8.69z" />
    <path fill="#FBBC05" d="M5.33 14.79C5.12 14.15 5 13.47 5 12.75s.12-1.4.33-2.04L1.63 7.84C.59 9.93 0 12.27 0 14.75s.59 4.82 1.63 6.91l3.7-2.87z" />
    <path fill="#34A853" d="M12 23.5c3.24 0 5.96-1.08 7.95-2.91l-3.7-2.87c-1.08.72-2.45 1.16-4.25 1.16-3.13 0-5.79-2.29-6.67-5.21L1.63 16.54C3.51 20.3 7.42 22.88 12 22.88z" />
  </svg>
);

export const FacebookIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2" {...props}>
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.018 1.793-4.685 4.533-4.685 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.93-1.956 1.886v2.274h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
    <path d="M17.479 17.499A10.75 10.75 0 0 1 2.062 12.349a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 2.898-4.474" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

export const SpinnerIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="auth-spinner" {...props}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 48, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

export const AlertCircleIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);
