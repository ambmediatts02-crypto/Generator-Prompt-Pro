import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
// The App component is now wrapped in an Error Boundary in App.tsx
// We render the exported WrappedApp here.
root.render(
  <App />
);
