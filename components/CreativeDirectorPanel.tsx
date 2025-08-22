
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { BotMessageSquareIcon } from './icons';

interface CreativeDirectorPanelProps {
    chatHistory: ChatMessage[];
    onSendMessage: (message: string) => void;
    isThinking: boolean;
}

const PromptSuggestion: React.FC<{ text: string, onClick: () => void }> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="px-3 py-1.5 bg-brand-bg-dark border border-brand-border rounded-full text-xs text-brand-text-secondary hover:border-brand-purple hover:text-brand-text transition"
    >
        {text}
    </button>
);


export const CreativeDirectorPanel: React.FC<CreativeDirectorPanelProps> = ({ chatHistory, onSendMessage, isThinking }) => {
    const [input, setInput] = useState('');
    const endOfMessagesRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const handleSend = (message: string = input) => {
        const trimmedMessage = message.trim();
        if (trimmedMessage && !isThinking) {
            onSendMessage(trimmedMessage);
            setInput('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 p-4">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                                AI
                            </div>
                        )}
                        <div className={`relative max-w-xs p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-purple text-white' : 'bg-brand-bg-dark text-brand-text-secondary'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-brand-border flex-shrink-0 flex items-center justify-center font-bold text-sm">
                                Y
                            </div>
                        )}
                    </div>
                ))}
                {isThinking && (
                    <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-sm animate-pulse">
                            AI
                        </div>
                        <div className="max-w-xs p-3 rounded-lg bg-brand-bg-dark text-brand-text-secondary">
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

            <footer className="p-4 border-t border-brand-border flex-shrink-0">
                <div className="flex flex-wrap gap-2 mb-3">
                    <PromptSuggestion text="Buat iklan TikTok" onClick={() => handleSend('Buat iklan TikTok menggunakan aset yang paling cocok.')} />
                    <PromptSuggestion text="Hapus klip terakhir" onClick={() => handleSend('Hapus klip terakhir dari timeline.')} />
                    <PromptSuggestion text="Ganti ke split view" onClick={() => handleSend('Ganti layout ke split view.')} />
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="e.g., Add Scene 1 to timeline"
                        disabled={isThinking}
                        className="flex-1 p-2 bg-brand-bg-dark border border-brand-border rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none transition text-sm"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isThinking || !input.trim()}
                        className="px-4 py-2 bg-brand-purple text-white font-semibold rounded-md hover:bg-brand-purple-light transition disabled:bg-gray-500 disabled:cursor-not-allowed text-sm"
                    >
                        Send
                    </button>
                </div>
            </footer>
        </div>
    );
};
