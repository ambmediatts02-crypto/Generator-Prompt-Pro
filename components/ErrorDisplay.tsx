import React from 'react';
import { AlertTriangleIcon } from './icons';

interface ErrorDisplayProps {
    error: Error;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
    if (!error) return null;

    return (
        <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative w-full" role="alert">
            <div className="flex items-start">
                <AlertTriangleIcon className="w-6 h-6 mr-3 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error.message}</span>
                </div>
            </div>
        </div>
    );
};