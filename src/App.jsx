import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import Index from "./pages/Index.jsx";
import Admin from "./pages/Admin.jsx";
import Questionnaire from "./pages/Questionnaire.jsx";
import Editor from "./pages/Editor.jsx";
import Login from "./pages/Login.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import { useSession } from "./context/SessionContext.jsx";
import { AlertTriangle } from 'lucide-react';
import { useData } from './context/DataContext';
import { Button } from "@/components/ui/button.jsx";

const AppLayout = () => {
  const { session } = useSession();
  const { loading, error, progress, reload } = useData();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <img src="/oqi-logo.png" alt="OQI Logo" className="h-20 mb-8" />
        <h1 className="text-2xl font-bold mb-2 font-sans">Preparing the Evaluation Tool</h1>
        <p className="text-gray-400 mb-6 font-body">Downloading latest evaluation data...</p>
        <div className="w-full max-w-md bg-gray-700 rounded-full h-2.5">
          <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="mt-2 text-sm text-gray-300">{Math.round(progress)}%</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
        <AlertTriangle size={48} className="text-brand-red mb-4" />
        <h1 className="text-2xl font-bold text-red-400 mb-2 font-sans">An Error Occurred</h1>
        <p className="text-gray-300 max-w-md mb-4 font-body">
          We couldn't load the necessary data for the application. This might be a temporary issue with the network or our servers.
        </p>
        <p className="text-sm bg-red-500/20 p-3 rounded-md text-red-200 font-mono max-w-md">{error}</p>
        <Button onClick={reload} className="mt-6">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

const AdminRoute = () => {
  const { isAdmin } = useSession();
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  const { session } = useSession();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<AppLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/editor" element={<Editor />} />
        
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
      
      <Route path="*" element={session ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;