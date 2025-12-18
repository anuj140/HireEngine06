import React from 'react';
import ReactDOM from 'react-dom/client';

// Uncomment the app you want to run:
// import App from './apps/web/App';        // Public job seeker portal
import App from './apps/company/App';    // Company/recruiter panel
// import App from './apps/admin/App';      // Admin panel

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);