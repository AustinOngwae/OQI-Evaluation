import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";
import SuggestEvaluation from "./pages/SuggestEvaluation.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import PrivateRoute from "./components/auth/PrivateRoute.jsx";
import Navbar from "./components/layout/Navbar.jsx";

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;