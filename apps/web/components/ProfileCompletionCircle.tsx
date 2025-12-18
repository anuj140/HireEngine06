import React from 'react';

interface ProfileCompletionCircleProps {
  progress: number;
  size?: number;
  children?: React.ReactNode;
}

const ProfileCompletionCircle: React.FC<ProfileCompletionCircleProps> = ({ progress, size = 96, children }) => {
  const strokeWidth = size * 0.04; // Made the circle even thinner
  const padding = 4; // Added padding between circle and content
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const innerDivSize = size - (strokeWidth * 2) - (padding * 2);

  const getColorClass = () => {
    if (progress >= 75) {
      return 'text-green-500';
    }
    if (progress >= 50) {
      return 'text-yellow-500';
    }
    return 'text-red-500';
  };

  const colorClass = getColorClass();

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-500 ease-in-out`}
        />
      </svg>
      <div 
        className="absolute flex items-center justify-center overflow-hidden bg-gray-100"
        style={{
            width: innerDivSize,
            height: innerDivSize,
            borderRadius: '50%'
        }}
      >
        {children ? (
          children
        ) : (
          <div className="text-center">
            <span className={`font-bold ${colorClass}`} style={{ fontSize: size / 4 }}>{progress}%</span>
            <span className="block text-gray-500" style={{ fontSize: size / 12, marginTop: '2px' }}>Completed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletionCircle;
