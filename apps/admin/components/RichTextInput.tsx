import React, { useRef, useEffect } from 'react';
import { BoldIcon, ItalicIcon } from './Icons';

interface RichTextInputProps {
    label: string;
    value: string;
    onChange: (newValue: string) => void;
}

const RichTextInput: React.FC<RichTextInputProps> = ({ label, value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    // Sync external changes to the editor
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };
    
    // Prevent focus loss when clicking toolbar buttons
    const handleToolbarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); 
    };

    const applyFormat = (command: string) => {
        document.execCommand(command, false);
        editorRef.current?.focus();
        handleInput(); // Immediately update state after command
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                <div onMouseDown={handleToolbarMouseDown} className="flex items-center p-1 bg-gray-50 border-b rounded-t-md space-x-1">
                    <button type="button" onClick={() => applyFormat('bold')} className="p-1.5 rounded hover:bg-gray-200" aria-label="Bold">
                        <BoldIcon className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={() => applyFormat('italic')} className="p-1.5 rounded hover:bg-gray-200" aria-label="Italic">
                        <ItalicIcon className="w-5 h-5" />
                    </button>
                </div>
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    dangerouslySetInnerHTML={{ __html: value }}
                    className="w-full min-h-[120px] p-3 text-sm focus:outline-none"
                    style={{ lineHeight: '1.5' }}
                />
            </div>
        </div>
    );
};

export default RichTextInput;
