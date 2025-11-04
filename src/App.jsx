import { Toaster } from "react-hot-toast";
import { Routes, Route } from "react-router-dom"; // Removed BrowserRouter import
import Index from "./pages/Index.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";
import SuggestEvaluation from "./pages/SuggestEvaluation.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import PrivateRoute from "./components/auth/PrivateRoute.jsx";
import Navbar from "./components/layout/Navbar.jsx";

function App() {
  return (
    // Removed BrowserRouter wrapper
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/suggest-evaluation" element={<SuggestEvaluation />} />
        
        {/* Admin Private Route */}
        <Route element={<PrivateRoute roles={['admin']} />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;