import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import QuestionnaireEditor from './components/questionnaire/QuestionnaireEditor';
import AdminDashboard from './components/questionnaire/AdminDashboard';
import EnhancedQuestionnaire from './components/questionnaire/EnhancedQuestionnaire';
import ResourceSuggestionForm from './components/suggestions/ResourceSuggestionForm';
import { User, LogOut, Settings, FileEdit, FileText, Lightbulb } from 'lucide-react';

const App = () => {
  const { user, signOut } = useAuth();
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const location = useLocation();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const userRole = user?.role || 'user';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-left">
                <h1 className="text-lg font-semibold text-gray-800">
                  GESDA OQI Evaluation
                </h1>
                <p className="text-xs text-gray-500">GESDA Initiative</p>
              </Link>
              <span className="ml-4 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <nav className="flex space-x-4">
                <Link
                  to="/questionnaire"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/questionnaire'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText size={16} className="inline mr-1" />
                  Evaluation
                </Link>

                <Link
                  to="/editor"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/editor'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileEdit size={16} className="inline mr-1" />
                  Editor
                </Link>

                {userRole === 'admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Settings size={16} className="inline mr-1" />
                    Admin
                  </Link>
                )}
              </nav>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSuggestionForm(true)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  title="Suggest Resources or Definitions"
                >
                  <Lightbulb size={16} className="mr-1" />
                  Suggest
                </button>

                <div className="flex items-center text-sm text-gray-700">
                  <User size={16} className="mr-2" />
                  {user?.first_name || user?.email}
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <LogOut size={16} className="mr-1" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {showSuggestionForm && (
        <ResourceSuggestionForm
          user={user}
          onClose={() => setShowSuggestionForm(false)}
          onSubmitted={() => {}}
        />
      )}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/questionnaire" element={<EnhancedQuestionnaire user={user} />} />
          <Route path="/editor" element={<QuestionnaireEditor user={user} />} />
          {userRole === 'admin' && <Route path="/admin" element={<AdminDashboard />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;