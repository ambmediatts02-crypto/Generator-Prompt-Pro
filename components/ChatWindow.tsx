import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { PlusIcon, SparklesIcon } from './icons';

interface ChatWindowProps {
    history: ChatMessage[];
    onSendMessage: (message: string) => void;
    isChatting: boolean;
    onAddSuggestion: (suggestion: string) => void;
    onFinalizeScript: () => void;
    isFinalizingScript: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
    history, 
    onSendMessage, 
    isChatting, 
    onAddSuggestion,
    onFinalizeScript,
    isFinalizingScript
}) => {
    const [input, setInput] = useState('');
    const endOfMessagesRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSend = () => {
        if (input.trim() && !isChatting) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="bg-brand-bg-dark border border-brand-border rounded-md p-4 flex flex-col h-80">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {history.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 group ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                                AI
                            </div>
                        )}
                        <div className={`relative max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-purple text-white' : 'bg-brand-bg-light text-brand-text-secondary'}`}>
                           <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                           {msg.role === 'model' && (
                                <button 
                                    onClick={() => onAddSuggestion(msg.text)}
                                    title="Add this suggestion to your script"
                                    className="absolute -bottom-3 -right-3 p-1 bg-green-600 text-white rounded-full hover:bg-green-500 transition-transform transform hover:scale-110 opacity-0 group-hover:opacity-100"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                           )}
                        </div>
                         {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-brand-border flex-shrink-0 flex items-center justify-center font-bold text-sm">
                                Y
                            </div>
                        )}
                    </div>
                ))}
                 {isChatting && (
                    <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-sm animate-pulse">
                            AI
                        </div>
                        <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-brand-bg-light text-brand-text-secondary">
                           <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce"></div>
                               <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce delay-75"></div>
                               <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce delay-150"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>
            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask the AI Director for ideas..."
                    disabled={isChatting || isFinalizingScript}
                    className="flex-1 p-2 bg-brand-bg-light border border-brand-border rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none transition text-sm"
                />
                 <button
                    onClick={onFinalizeScript}
                    disabled={isChatting || isFinalizingScript || history.length < 2}
                    title="Summarize chat into a final script"
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition disabled:bg-gray-500 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                    <SparklesIcon className="w-4 h-4" />
                    {isFinalizingScript ? 'Finalizing...' : 'Finalize Script'}
                </button>
                <button
                    onClick={handleSend}
                    disabled={isChatting || isFinalizingScript || !input.trim()}
                    className="px-4 py-2 bg-brand-purple text-white font-semibold rounded-md hover:bg-brand-purple-light transition disabled:bg-gray-500 disabled:cursor-not-allowed text-sm"
                >
                    Send
                </button>
            </div>
        </div>
    );
};