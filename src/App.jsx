import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import Index from "./pages/Index.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";
import Questionnaire from "./pages/Questionnaire.jsx";
import Editor from "./pages/Editor.jsx";
import PrivateRoute from "./components/auth/PrivateRoute.jsx";
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
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Index />} />
        
        <Route element={<PrivateRoute />}>
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/editor" element={<Editor />} />
        </Route>

        <Route element={<PrivateRoute adminOnly={true} />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;