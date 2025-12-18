
import React from 'react';
import { Link } from 'react-router-dom';

// This component is a placeholder in the 'web' app.
// The primary, functional version is located in the 'company' app.
const RecruiterCompanyProfilePage: React.FC = () => {
    return (
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold">Company Profile</h1>
            <p className="mt-2 text-gray-600">This feature is available in the Recruiter Portal.</p>
            <Link to="/company/" className="mt-4 inline-block bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-primary-dark">
                Go to Recruiter Portal
            </Link>
        </div>
    );
};

export default RecruiterCompanyProfilePage;
