
import React from 'react';
import { Link } from 'react-router-dom';

const PostJobPage: React.FC = () => {
    return (
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold">Post a Job</h1>
            <p className="mt-2 text-gray-600">This feature is available for registered recruiters.</p>
            <Link to="/company/" className="mt-4 inline-block bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-primary-dark">
                Go to Recruiter Portal
            </Link>
        </div>
    );
};

export default PostJobPage;
