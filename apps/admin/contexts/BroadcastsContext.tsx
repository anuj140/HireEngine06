import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Broadcast } from '../data/mockData';
import { useToast } from '../hooks/useToast';
import { fetchBroadcasts, createBroadcast } from '../services/api';

interface BroadcastsContextType {
    broadcasts: Broadcast[];
    addBroadcast: (newBroadcast: Omit<Broadcast, 'id' | 'sentDate' | 'openRate' | 'clickRate'>) => void;
}

const BroadcastsContext = createContext<BroadcastsContextType | undefined>(undefined);

export const BroadcastsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        fetchBroadcasts()
            .then(data => setBroadcasts(data))
            .catch(err => addToast('Failed to load broadcasts.', 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);

    const addBroadcast = async (newBroadcastData: Omit<Broadcast, 'id' | 'sentDate' | 'openRate' | 'clickRate'>) => {
        try {
            const newBroadcast = await createBroadcast(newBroadcastData);
            setBroadcasts(prev => [newBroadcast, ...prev]);
            addToast(`Broadcast "${newBroadcast.name}" has been scheduled!`);
        } catch (err) {
            addToast('Failed to create broadcast.', 'error');
            console.error(err);
        }
    };

    return (
        <BroadcastsContext.Provider value={{ broadcasts, addBroadcast }}>
            {children}
        </BroadcastsContext.Provider>
    );
};

export const useBroadcasts = (): BroadcastsContextType => {
    const context = useContext(BroadcastsContext);
    if (!context) {
        throw new Error('useBroadcasts must be used within a BroadcastsProvider');
    }
    return context;
};
