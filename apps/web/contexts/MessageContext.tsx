import React, { createContext, useState, useCallback, useContext, ReactNode, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Message } from '../../../packages/types';
import { getMessagesForUser, markMessagesAsRead } from '../services/messageService';

interface MessageContextType {
  messages: Message[];
  unreadCount: number;
  markAllAsRead: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  const loadMessages = useCallback(async () => {
    if (user) {
      try {
        const userMessages = await getMessagesForUser(user.id);
        setMessages(userMessages);
      } catch (error) {
        console.error("Failed to load messages:", error);
        setMessages([]); // Clear messages on error
      }
    } else {
      setMessages([]);
    }
  }, [user]);

  useEffect(() => {
    loadMessages();
  }, [user, loadMessages]);
  
  useEffect(() => {
    window.addEventListener('messages_updated', loadMessages);
    return () => {
      window.removeEventListener('messages_updated', loadMessages);
    };
  }, [loadMessages]);

  const markAllAsRead = useCallback(() => {
    if (user) {
      markMessagesAsRead(user.id);
      // Optimistically update UI as backend endpoint is not ready
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    }
  }, [user]);

  const unreadCount = useMemo(() => messages.filter(m => !m.isRead).length, [messages]);
  
  const value = { messages, unreadCount, markAllAsRead };

  return (
    <MessageContext.Provider value={user ? value : undefined}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = (): MessageContextType | undefined => {
  return useContext(MessageContext);
};