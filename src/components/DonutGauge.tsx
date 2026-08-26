import React from 'react';

interface DonutGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  glowColor?: string;
  showPercentageText?: boolean;
  textColor?: string;
  fontSize?: string;
  className?: string;
}

export const DonutGauge: React.FC<DonutGaugeProps> = React.memo(({
  percentage,
  size = 110,
  strokeWidth = 11,
  color = '#8b5cf6',
  glowColor,
  showPercentageText = true,
  textColor = '#ffffff',
  fontSize = 'text-lg',
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, Math.round(percentage)));
  const offset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 origin-center"
      >
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e294b"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Dynamic progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: glowColor ? `drop-shadow(0 0 6px ${glowColor})` : 'none',
          }}
        />
      </svg>

      {/* Centered Percentage Label */}
      {showPercentageText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={`font-mono-num font-bold tracking-tight ${fontSize}`}
            style={{ color: textColor }}
          >
            {clampedPercentage}%
          </span>
        </div>
      )}
    </div>
  );
});
