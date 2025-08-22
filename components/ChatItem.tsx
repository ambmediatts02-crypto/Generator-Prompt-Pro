import React, { useState, useRef, useEffect } from 'react';
import type { ChatSession } from '../types';
import { EditIcon, TrashIcon, PinIcon } from './icons';

interface ChatItemProps {
    session: ChatSession;
    isActive: boolean;
    onSelect: (id: string) => void;
    onRename: (id: string, newTitle: string) => void;
    onPin: (id: string, isPinned: boolean) => void;
    onDelete: (id: string) => void;
}

export const ChatItem: React.FC<ChatItemProps> = ({ session, isActive, onSelect, onRename, onPin, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(session.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);
    
    useEffect(() => {
        // Reset title if session changes from parent
        setTitle(session.title);
    }, [session.title]);

    const handleRename = () => {
        if (title.trim() && title.trim() !== session.title) {
            onRename(session.id, title.trim());
        } else {
            setTitle(session.title);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            setTitle(session.title);
            setIsEditing(false);
        }
    };

    return (
        <div 
            className={`group relative flex items-center w-full rounded-md transition-colors pr-2 ${isActive ? 'bg-brand-purple' : 'hover:bg-brand-bg-light'}`}
        >
            {isEditing ? (
                <div className="flex-1 p-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent border border-brand-purple rounded-md px-1 text-sm text-brand-text outline-none"
                    />
                </div>
            ) : (
                <>
                    <div 
                        className="flex-1 cursor-pointer p-2 truncate"
                        onClick={() => onSelect(session.id)}
                    >
                        <span className="text-sm text-brand-text">{session.title}</span>
                    </div>
                    <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                         <button 
                            onClick={(e) => { e.stopPropagation(); onPin(session.id, !session.isPinned); }}
                            className="p-1 rounded-md hover:bg-brand-border"
                            title={session.isPinned ? 'Unpin' : 'Pin'}
                         >
                            <PinIcon className={`w-4 h-4 text-brand-text-secondary ${session.isPinned ? 'fill-current' : ''}`} />
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            className="p-1 rounded-md hover:bg-brand-border"
                            title="Rename"
                         >
                            <EditIcon className="w-4 h-4 text-brand-text-secondary" />
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                            className="p-1 rounded-md hover:bg-brand-border"
                            title="Delete"
                         >
                            <TrashIcon className="w-4 h-4 text-brand-text-secondary" />
                         </button>
                    </div>
                </>
            )}
        </div>
    );
};