import React from 'react';
import type { ChatSession } from '../types';
import { PlusIcon, XCircleIcon } from './icons';
import { ChatItem } from './ChatItem';

interface ChatHistorySidebarProps {
    isOpen: boolean;
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onRenameSession: (id: string, newTitle: string) => void;
    onPinSession: (id: string, isPinned: boolean) => void;
    onDeleteSession: (id: string) => void;
    onClose: () => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
    isOpen,
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onRenameSession,
    onPinSession,
    onDeleteSession,
    onClose,
}) => {
    if (!isOpen) {
        return null;
    }

    const sortedSessions = [...sessions].sort((a, b) => b.createdAt - a.createdAt);
    const pinnedSessions = sortedSessions.filter(s => s.isPinned);
    const recentSessions = sortedSessions.filter(s => !s.isPinned);

    const renderSessionList = (sessionList: ChatSession[], title: string) => (
        <div>
            <h3 className="px-2 text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1">{title}</h3>
            <div className="space-y-1">
                {sessionList.map(session => (
                    <ChatItem
                        key={session.id}
                        session={session}
                        isActive={session.id === activeSessionId}
                        onSelect={onSelectSession}
                        onRename={onRenameSession}
                        onPin={onPinSession}
                        onDelete={onDeleteSession}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="h-full w-64 bg-brand-bg-dark border-r border-brand-border flex flex-col p-2 animate-slide-in">
            <style>{`
                @keyframes slide-in {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
            `}</style>
            <div className="flex items-center gap-2 mb-4">
                 <button
                    onClick={onNewChat}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-purple text-white rounded-md hover:bg-brand-purple-light transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Chat
                </button>
                 <button
                    onClick={onClose}
                    className="p-2 text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-light rounded-md transition-colors"
                    title="Close Sidebar"
                >
                    <XCircleIcon className="w-6 h-6" />
                </button>
            </div>
           
            <div className="flex-1 overflow-y-auto space-y-4">
                {pinnedSessions.length > 0 && renderSessionList(pinnedSessions, 'Pinned')}
                {recentSessions.length > 0 && renderSessionList(recentSessions, 'Recent')}
                
                {sessions.length === 0 && (
                    <div className="text-center text-xs text-brand-text-secondary px-4 py-8">
                        Your chat history will appear here. Start a new chat to begin brainstorming!
                    </div>
                )}
            </div>
        </div>
    );
};
