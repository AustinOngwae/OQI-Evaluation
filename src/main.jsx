import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { EditorAuthProvider } from './context/EditorAuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DataProvider>
        <AdminAuthProvider>
          <EditorAuthProvider>
            <App />
            <Toaster toastOptions={{
              style: {
                background: '#111111',
                color: '#ffffff',
              },
            }} />
          </EditorAuthProvider>
        </AdminAuthProvider>
      </DataProvider>
    </BrowserRouter>
  </StrictMode>,
);