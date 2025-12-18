import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  applicantName: string;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({ isOpen, onClose, onSend, applicantName }) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMessage('');
    }
  }, [isOpen]);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h3 className="text-xl font-bold text-dark-gray">Send Message to {applicantName}</h3>
        <p className="text-sm text-gray-500 mt-1">The candidate will receive this message as a notification.</p>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={6}
          placeholder="Type your message here..."
          className="w-full mt-4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          autoFocus
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendMessageModal;