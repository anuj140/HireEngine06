import React from 'react';
import { CloseIcon } from './Icons';

interface ChangeDetail {
  from: any;
  to: any;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changes: Record<string, ChangeDetail>;
  title: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, changes, title }) => {
  if (!isOpen) return null;

  const renderValue = (value: any) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined || value === '') return <i className="text-gray-400">empty</i>;
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4 animate-fade-in-up" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-dark-text">{title}</h2>
          <button onClick={onClose} className="text-light-text hover:text-dark-text"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
          <p className="text-sm text-light-text mb-4">Please review the changes you are about to save:</p>
          <ul className="space-y-3">
            {Object.entries(changes).map(([key, value]) => (
              <li key={key} className="text-sm p-3 bg-light rounded-lg border">
                <strong className="capitalize text-dark-text">{String(key).replace('.', ' ')}:</strong>
                <div className="flex items-center mt-1">
                  <span className="text-red-600 line-through">{renderValue((value as ChangeDetail).from)}</span>
                  <span className="mx-2 font-bold text-dark-text">→</span>
                  <span className="text-accent-green font-semibold">{renderValue((value as ChangeDetail).to)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 bg-light rounded-b-2xl flex justify-end space-x-4">
          <button onClick={onClose} className="px-6 py-2 text-sm font-semibold text-dark-text bg-white border rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={onConfirm} className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:opacity-90">✔ Yes, Save</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;