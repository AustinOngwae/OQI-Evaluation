import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { DataProvider } from './context/DataContext';
import { SessionProvider } from './context/SessionContext';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <DataProvider>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'font-sans',
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </DataProvider>
      </SessionProvider>
    </BrowserRouter>
  </React.StrictMode>
);