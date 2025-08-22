
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center w-full max-w-6xl">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
        VEO Video Generator
      </h1>
      <p className="mt-2 text-lg text-brand-text-secondary">
        Bring your ideas to life with Google's state-of-the-art video generation AI.
      </p>
    </header>
  );
};