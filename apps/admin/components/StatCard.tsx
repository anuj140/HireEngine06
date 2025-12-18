import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change, changeType }) => {
  const isIncrease = changeType === 'increase';

  return (
    <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-primary-light/10 transition-colors">
            {React.cloneElement(icon as React.ReactElement, {
              className: `w-6 h-6 ${(icon as React.ReactElement).props.className}`
            })}
          </div>
          {change && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center ${isIncrease ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
              }`}>
              {isIncrease ? '↑' : '↓'} {change}
            </span>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;