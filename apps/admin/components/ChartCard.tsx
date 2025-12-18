import React from 'react';

const ChartCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm h-full flex flex-col">
        <h3 className="font-bold text-gray-900 text-base mb-4">{title}</h3>
        <div className="flex-grow min-h-[300px] w-full">{children}</div>
    </div>
);

export default ChartCard;