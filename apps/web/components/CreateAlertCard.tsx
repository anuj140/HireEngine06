import React from 'react';
import { MailOpenIcon } from './Icons';

interface CreateAlertCardProps {
    onClick: () => void;
}

const CreateAlertCard: React.FC<CreateAlertCardProps> = ({ onClick }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
            <div className="flex items-center">
                <MailOpenIcon className="w-8 h-8 text-primary mr-4" />
                <div>
                    <h3 className="font-bold text-dark-gray">Create job alert</h3>
                    <p className="text-sm text-gray-600">Get new jobs for this search by email</p>
                </div>
            </div>
            <button
                onClick={onClick}
                className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
            >
                Create
            </button>
        </div>
    );
};

export default CreateAlertCard;
