import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import Index from "./pages/Index.jsx";
import Admin from "./pages/Admin.jsx";
import Questionnaire from "./pages/Questionnaire.jsx";
import Editor from "./pages/Editor.jsx";
import AdminRoute from "./components/auth/AdminRoute.jsx";
import Navbar from "./components/layout/Navbar.jsx";

import React, { useState } from 'react';
import { useData } from './context/DataContext';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const AppLayout = () => (
  <div className="min-h-screen">
    <Navbar />
    <main>
      <Outlet />
    </main>
  </div>
);

function App() {
  const { loading, error, progress, reload } = useData();
  const [agreed, setAgreed] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <img src="/oqi-logo.png" alt="OQI Logo" className="h-20 mb-8" />
        <h1 className="text-2xl font-bold mb-2">Preparing the Evaluation Tool</h1>
        <p className="text-gray-400 mb-6">Downloading latest evaluation data...</p>
        <div className="w-full max-w-md bg-gray-700 rounded-full h-2.5">
          <div className="bg-brand-purple h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="mt-2 text-sm text-gray-300">{Math.round(progress)}%</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-400 mb-2">An Error Occurred</h1>
        <p className="text-gray-300 max-w-md mb-4">
          We couldn't load the necessary data for the application. This might be a temporary issue with the network or our servers.
        </p>
        <p className="text-sm bg-red-500/20 p-3 rounded-md text-red-200 font-mono max-w-md">{error}</p>
        <button onClick={reload} className="mt-6 btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!agreed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="glass-card p-8 max-w-2xl text-center">
          <ShieldCheck size={48} className="mx-auto mb-4 text-brand-purple-light" />
          <h1 className="text-2xl font-bold mb-4">Data & Privacy Agreement</h1>
          <p className="text-gray-300 mb-6">
            Welcome to the OQI Evaluation Tool. Before you begin, please read and agree to our data and privacy policy. Your responses will be collected to generate an evaluation report. Anonymized data may be used for research and to improve this tool.
          </p>
          <div className="text-left text-sm text-gray-400 space-y-2 mb-8 p-4 bg-white/5 rounded-lg border border-white/10 max-h-60 overflow-y-auto">
              <p><strong>1. Data Collection:</strong> We collect your answers to the questionnaire, user context information (like name and organization if provided), and technical data for session management.</p>
              <p><strong>2. Data Usage:</strong> Your data is used to generate a personalized OQI evaluation report. Aggregated and anonymized data helps us analyze the effectiveness of the OQI framework.</p>
              <p><strong>3. Data Storage:</strong> All data is securely stored. You can save your progress and resume later using a unique session code.</p>
              <p><strong>4. Anonymity:</strong> While you can provide identifying information for your report, suggestions and comments can be made anonymously.</p>
          </div>
          <button onClick={() => setAgreed(true)} className="btn-primary w-full">
            I Agree and Continue
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/editor" element={<Editor />} />
        
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;