import { Message, User, TeamMember } from '../../../packages/types';
import { fetchMessages, sendMessageApi } from '../../../packages/api-client';

export const getMessagesForUser = async (userId: string): Promise<Message[]> => {
    // The backend endpoint GET /messages is user-specific via token, so userId is not needed.
    const response: any = await fetchMessages('company');
    
    // The backend returns an object with a 'conversations' array, not an array of messages directly.
    const conversations = response.conversations || [];
    if (!Array.isArray(conversations)) {
        console.error("Expected 'conversations' to be an array, but got:", conversations);
        return [];
    }

    // Extract the 'lastMessage' from each conversation and map it to the Message type.
    const allMessages: Message[] = conversations
        .map((convo: any) => {
            if (!convo.lastMessage) return null;
            const msg = convo.lastMessage;
            const sender = msg.sender || {};
            const recipient = convo.participants.find((p: any) => p._id !== sender._id);
            
            return {
                id: msg._id,
                from: { id: sender._id || '', name: sender.name || 'Unknown' },
                to: recipient ? { id: recipient._id, name: recipient.name || 'Unknown' } : { id: '', name: '' },
                job: msg.job ? { id: msg.job, title: 'Job' } : { id: '', title: '' }, // Job is not populated in this query
                content: msg.content,
                timestamp: msg.createdAt, // Backend uses createdAt
                isRead: msg.isRead,
            };
        })
        .filter((msg: Message | null): msg is Message => msg !== null);

    return allMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const sendMessage = (
    fromUser: TeamMember, 
    toUser: { id: string; name: string; }, 
    job: { id: string; title: string; },
    content: string
): Promise<Message> => {
    return sendMessageApi(toUser.id, content, job.id, 'company');
};

export const markMessagesAsRead = (userId: string) => {
    // TODO: Implement a backend endpoint for this and call it here.
    console.warn("markMessagesAsRead is not yet implemented on the backend.");
    // This will now be a no-op until the backend is ready.
};