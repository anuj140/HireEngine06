import React from 'react';

const SecurityPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-dark-text">System Security & Access Control</h1>
      <div className="mt-8 p-8 bg-white rounded-xl shadow-sm">
        <p className="text-light-text leading-relaxed">Admins will manage platform security here. This includes role-based access control for the admin panel, monitoring for suspicious activities, managing API keys, and revoking access for fraudulent accounts (both companies and users).</p>
      </div>
    </div>
  );
};

export default SecurityPage;