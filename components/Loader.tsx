
import React from 'react';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="bg-brand-bg-light p-6 rounded-lg border border-brand-border shadow-lg flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 border-4 border-t-brand-purple border-brand-border rounded-full animate-spin mb-4"></div>
      <p className="text-lg font-semibold text-brand-text">Generating Your Video</p>
      <p className="text-brand-text-secondary mt-1">{message}</p>
    </div>
  );
};
