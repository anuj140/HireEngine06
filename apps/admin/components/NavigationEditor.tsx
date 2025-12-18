import React, { useState } from 'react';
import { CmsNavigation, CmsLinkGroup, CmsLink } from '../../../packages/types';
import { TrashIcon, PlusCircleIcon, DragHandleIcon } from './Icons';

interface NavigationEditorProps {
    navigation: CmsNavigation;
    path: string;
    onUpdate: (path: string, value: any) => void;
}

const NavigationEditor: React.FC<NavigationEditorProps> = ({ navigation, path, onUpdate }) => {
    const [draggedGroup, setDraggedGroup] = useState<{ index: number } | null>(null);
    const [draggedLink, setDraggedLink] = useState<{ groupIndex: number, linkIndex: number } | null>(null);

    // --- Group Drag & Drop ---
    const handleGroupDragStart = (index: number) => setDraggedGroup({ index });
    const handleGroupDrop = (targetIndex: number) => {
        if (draggedGroup === null || draggedGroup.index === targetIndex) return;
        const newGroups = [...navigation.groups];
        const [removed] = newGroups.splice(draggedGroup.index, 1);
        newGroups.splice(targetIndex, 0, removed);
        onUpdate(`${path}.groups`, newGroups);
        setDraggedGroup(null);
    };

    // --- Link Drag & Drop ---
    const handleLinkDragStart = (groupIndex: number, linkIndex: number) => setDraggedLink({ groupIndex, linkIndex });
    const handleLinkDrop = (targetGroupIndex: number, targetLinkIndex: number) => {
        if (draggedLink === null) return;
        const { groupIndex: sourceGroupIndex, linkIndex: sourceLinkIndex } = draggedLink;

        const newGroups = JSON.parse(JSON.stringify(navigation.groups));
        const draggedItem = newGroups[sourceGroupIndex].links.splice(sourceLinkIndex, 1)[0];
        
        if (!newGroups[targetGroupIndex].links) {
            newGroups[targetGroupIndex].links = [];
        }
        newGroups[targetGroupIndex].links.splice(targetLinkIndex, 0, draggedItem);
        
        onUpdate(`${path}.groups`, newGroups);
        setDraggedLink(null);
    };

    // --- Add/Remove Handlers ---
    const handleAddGroup = () => onUpdate(`${path}.groups`, [...(navigation.groups || []), { title: 'New Group', links: [] }]);
    const handleRemoveGroup = (index: number) => onUpdate(`${path}.groups`, navigation.groups.filter((_, i) => i !== index));
    const handleAddLink = (groupIndex: number) => {
        const newGroups = [...navigation.groups];
        if (!newGroups[groupIndex].links) newGroups[groupIndex].links = [];
        newGroups[groupIndex].links.push({ text: 'New Link', url: '#' });
        onUpdate(`${path}.groups`, newGroups);
    };
    const handleRemoveLink = (groupIndex: number, linkIndex: number) => {
        const newGroups = [...navigation.groups];
        newGroups[groupIndex].links = newGroups[groupIndex].links.filter((_, i) => i !== linkIndex);
        onUpdate(`${path}.groups`, newGroups);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-dark-text">{navigation.name}</h2>
            <div className="flex overflow-x-auto scrollbar-hide space-x-6 pb-4">
                {(navigation.groups || []).map((group, groupIndex) => (
                    <div 
                        key={groupIndex} 
                        className="w-72 flex-shrink-0 bg-gray-50 rounded-lg border"
                        draggable
                        onDragStart={() => handleGroupDragStart(groupIndex)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleGroupDrop(groupIndex)}
                        onDragEnd={() => setDraggedGroup(null)}
                    >
                        <div className={`p-3 border-b flex justify-between items-center ${draggedGroup?.index === groupIndex ? 'bg-primary/10' : ''}`}>
                            <div className="flex items-center gap-2">
                                <div className="cursor-grab text-gray-400 p-1"><DragHandleIcon className="w-5 h-5"/></div>
                                <input 
                                    type="text"
                                    value={group.title}
                                    onChange={e => onUpdate(`${path}.groups[${groupIndex}].title`, e.target.value)}
                                    className="font-semibold text-lg bg-transparent focus:bg-white focus:ring-1 ring-primary rounded px-1 w-full"
                                />
                            </div>
                            <button type="button" onClick={() => handleRemoveGroup(groupIndex)} className="text-gray-400 hover:text-red-700 p-1 rounded-full hover:bg-red-50"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="p-3 space-y-2">
                            {(group.links || []).map((link, linkIndex) => (
                                <div 
                                    key={linkIndex}
                                    className={`p-2 border rounded-md bg-white flex items-center gap-2 ${draggedLink?.groupIndex === groupIndex && draggedLink?.linkIndex === linkIndex ? 'opacity-50' : ''}`}
                                    draggable
                                    onDragStart={() => handleLinkDragStart(groupIndex, linkIndex)}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={() => handleLinkDrop(groupIndex, linkIndex)}
                                    onDragEnd={() => setDraggedLink(null)}
                                >
                                    <div className="cursor-grab text-gray-400"><DragHandleIcon className="w-4 h-4"/></div>
                                    <div className="flex-grow space-y-1">
                                        <input type="text" placeholder="Link Text" value={link.text} onChange={e => onUpdate(`${path}.groups[${groupIndex}].links[${linkIndex}].text`, e.target.value)} className="w-full border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary/50 focus:border-primary" />
                                        <input type="text" placeholder="URL" value={link.url} onChange={e => onUpdate(`${path}.groups[${groupIndex}].links[${linkIndex}].url`, e.target.value)} className="w-full border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary/50 focus:border-primary" />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveLink(groupIndex, linkIndex)} className="text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                            {/* Drop zone for empty list */}
                            {(group.links || []).length === 0 && (
                                <div onDragOver={e => e.preventDefault()} onDrop={() => handleLinkDrop(groupIndex, 0)} className="h-10 border-2 border-dashed rounded-md flex items-center justify-center text-sm text-gray-400">Drop link here</div>
                            )}
                            <button type="button" onClick={() => handleAddLink(groupIndex)} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary pt-2 hover:text-primary-dark">
                                <PlusCircleIcon className="w-5 h-5" /> Add Link
                            </button>
                        </div>
                    </div>
                ))}
                <div className="flex-shrink-0">
                    <button type="button" onClick={handleAddGroup} className="w-48 h-full flex flex-col items-center justify-center gap-2 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 border-2 border-dashed border-primary/20 rounded-lg">
                        <PlusCircleIcon className="w-8 h-8" /> Add Group
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NavigationEditor;
