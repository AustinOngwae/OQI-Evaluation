import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import Index from "./pages/Index.jsx";
import Admin from "./pages/Admin.jsx";
import Questionnaire from "./pages/Questionnaire.jsx";
import Editor from "./pages/Editor.jsx";
import AdminRoute from "./components/auth/AdminRoute.jsx";
import Navbar from "./components/layout/Navbar.jsx";

const AppLayout = () => (
  <div className="min-h-screen">
    <Navbar />
    <main>
      <Outlet />
    </main>
  </div>
);

function App() {
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