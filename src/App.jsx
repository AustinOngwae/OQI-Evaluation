import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import QuestionnaireEditor from './components/questionnaire/QuestionnaireEditor';
import AdminDashboard from './components/questionnaire/AdminDashboard';
import EnhancedQuestionnaire from './components/questionnaire/EnhancedQuestionnaire';
import { User, LogOut, Settings, FileEdit, FileText } from 'lucide-react';

const App = () => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('questionnaire');

  if (!user) {
    return <Login />;
  }

  const userRole = user?.role || 'user';

  const getViewComponent = () => {
    switch (currentView) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'editor':
        return <QuestionnaireEditor user={user} onSwitchToFiller={() => setCurrentView('questionnaire')} />;
      case 'questionnaire':
      default:
        return <EnhancedQuestionnaire user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="https://via.placeholder.com/150/0891b2/FFFFFF?text=LOGO" alt="UN-HABITAT Logo" className="h-10 mr-4"/>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  Urban Planner's Tool
                </h1>
                <p className="text-xs text-gray-500">UN-HABITAT Initiative</p>
              </div>
              <span className="ml-4 px-2 py-1 bg-cyan-100 text-cyan-800 text-sm rounded-full">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation Links */}
              <nav className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('questionnaire')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'questionnaire'
                      ? 'bg-cyan-100 text-cyan-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText size={16} className="inline mr-1" />
                  Questionnaire
                </button>

                <button
                  onClick={() => setCurrentView('editor')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'editor'
                      ? 'bg-cyan-100 text-cyan-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileEdit size={16} className="inline mr-1" />
                  Editor
                </button>

                {userRole === 'admin' && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'admin'
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Settings size={16} className="inline mr-1" />
                    Admin
                  </button>
                )}
              </nav>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
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

      {/* Main Content */}
      <main>
        {getViewComponent()}
      </main>
    </div>
  );
};

export default App;