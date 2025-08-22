
import React, { useState, useEffect } from 'react';
import type { Project } from '../types';
import { XCircleIcon, DownloadIcon } from './icons';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onExport: () => void;
    isExporting: boolean;
    exportProgress: number;
    exportedVideoUrl: string | null;
}

const renderMessages: { [key: number]: string } = {
    0: "Initializing render...",
    10: "Concatenating clips...",
    30: "Applying transformations...",
    60: "Mixing audio tracks...",
    85: "Finalizing video...",
    100: "Render complete!"
};

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen, onClose, project, onExport, isExporting, exportProgress, exportedVideoUrl
}) => {
    const [fileName, setFileName] = useState(project.name);
    const [resolution, setResolution] = useState('720p');
    const [renderMessage, setRenderMessage] = useState(renderMessages[0]);

    useEffect(() => {
        // Reset file name when project changes or modal opens
        setFileName(project.name);
    }, [project.name, isOpen]);

    useEffect(() => {
        const progressKeys = Object.keys(renderMessages).map(Number).sort((a,b) => a - b);
        const currentMessageKey = progressKeys.reduce((prev, curr) => (curr <= exportProgress ? curr : prev), 0);
        setRenderMessage(renderMessages[currentMessageKey]);
    }, [exportProgress]);

    const handleStartExport = () => {
        onExport();
    };

    const handleDownload = () => {
        if (!exportedVideoUrl) return;
        const link = document.createElement('a');
        link.href = exportedVideoUrl;
        const sanitizedFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'exported_video';
        link.download = `${sanitizedFileName}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onClose();
    };
    
    if (!isOpen) return null;

    const showProgress = isExporting || exportedVideoUrl;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-brand-bg-dark rounded-xl border border-brand-border shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-brand-border">
                    <h2 className="text-xl font-bold text-brand-text">Export Video</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-bg-light" disabled={isExporting}><XCircleIcon className="w-6 h-6 text-brand-text-secondary" /></button>
                </header>
                
                <div className="p-6">
                    {!showProgress ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="fileName" className="block text-sm font-medium text-brand-text-secondary mb-1">File Name</label>
                                <input
                                    type="text"
                                    id="fileName"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="w-full p-2 bg-brand-bg-light border border-brand-border rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none transition"
                                />
                            </div>
                            <div>
                                <label htmlFor="resolution" className="block text-sm font-medium text-brand-text-secondary mb-1">Resolution</label>
                                <select
                                    id="resolution"
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                     className="w-full p-2 bg-brand-bg-light border border-brand-border rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none transition appearance-none"
                                     style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                                >
                                    <option value="720p">720p (HD)</option>
                                    <option value="1080p" disabled>1080p (Full HD) - Coming Soon</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">{exportedVideoUrl ? 'Export Successful!' : 'Exporting...'}</h3>
                            <p className="text-sm text-brand-text-secondary mt-1">{renderMessage}</p>
                            <div className="w-full bg-brand-bg-light rounded-full h-2.5 my-4">
                                <div 
                                    className="bg-brand-purple h-2.5 rounded-full transition-all duration-500 ease-linear" 
                                    style={{ width: `${exportProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-4 border-t border-brand-border">
                    {exportedVideoUrl ? (
                         <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Download Video
                        </button>
                    ) : (
                        <button
                            onClick={handleStartExport}
                            disabled={isExporting}
                            className="w-full px-4 py-3 text-sm font-semibold bg-brand-purple text-white rounded-md hover:bg-brand-purple-light transition-colors disabled:bg-gray-500"
                        >
                            {isExporting ? 'Rendering...' : 'Start Export'}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};
