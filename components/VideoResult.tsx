import React from 'react';
import { DownloadIcon } from './icons';

interface VideoResultProps {
  videoUrl: string;
  prompt: string;
}

export const VideoResult: React.FC<VideoResultProps> = ({ videoUrl, prompt }) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = videoUrl;
        // Sanitize prompt to create a valid filename
        const fileName = prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'generated_video';
        link.download = `${fileName}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <div className="bg-brand-bg-light p-6 rounded-lg border border-brand-border shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-brand-text">Your Video is Ready!</h2>
      <div className="aspect-video w-full rounded-lg overflow-hidden border border-brand-border">
        <video src={videoUrl} controls autoPlay loop className="w-full h-full bg-black" />
      </div>
      <div className="mt-4 flex flex-col sm:flex-row items-start gap-4">
        <div className="flex-1 text-brand-text-secondary italic text-sm">
            <strong>Prompt:</strong>
            <p className="whitespace-pre-wrap mt-1">{prompt}</p>
        </div>
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          <DownloadIcon className="w-5 h-5" />
          Download Video
        </button>
      </div>
    </div>
  );
};
