import React, { useEffect } from 'react';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { BuildingOfficeIcon } from '../components/Icons';

const RecruiterCompanyProfilePage: React.FC = () => {
    const { setCrumbs } = useBreadcrumbs();

    useEffect(() => {
        // This page is likely incorrectly placed in admin, but we'll make it work as a placeholder
        // setCrumbs might fail if BreadcrumbContext is not available in the admin app layout
        try {
            setCrumbs([
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Company Profile' }
            ]);
            return () => setCrumbs([]);
        } catch(e) {
            console.error("Could not set breadcrumbs. Is BreadcrumbProvider missing in admin app?");
        }
    }, [setCrumbs]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-white p-8 rounded-xl shadow-sm">
            <BuildingOfficeIcon className="w-24 h-24 mb-4 text-gray-300" />
            <h1 className="text-3xl font-bold text-dark-text">Company Profile</h1>
            <p className="mt-2 text-lg">Admin view for a company's profile.</p>
        </div>
    );
};

export default RecruiterCompanyProfilePage;