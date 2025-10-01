import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import LoginForm from './components/auth/LoginForm';
import QuestionnaireEditor from './components/questionnaire/QuestionnaireEditor';
import AdminDashboard from './components/questionnaire/AdminDashboard';
import EnhancedQuestionnaire from './components/questionnaire/EnhancedQuestionnaire';
import SafeIcon from './components/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiLogOut, FiSettings, FiEdit, FiFileText, FiEye, FiLogIn } = FiIcons;

const RoleSelector = ({ onRoleSelect }) => {
  const roles = [
    {
      id: 'user',
      title: 'Questionnaire Filler',
      description: 'Fill out questionnaires and receive personalized action plans',
      icon: FiFileText,
      color: 'bg-blue-500'
    },
    {
      id: 'editor',
      title: 'Question Editor',
      description: 'Edit and modify questionnaire questions and structure',
      icon: FiEdit,
      color: 'bg-green-500'
    },
    {
      id: 'reviewer',
      title: 'Content Reviewer',
      description: 'Review questions and suggest improvements',
      icon: FiEye,
      color: 'bg-purple-500'
    },
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Manage all aspects of the questionnaire system',
      icon: FiSettings,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* UN-HABITAT Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1759320275254-Logo-UN-Habitat.jpg" 
              alt="UN-HABITAT Logo" 
              className="h-20 w-auto mr-4"
            />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-gray-800 leading-tight">
                Urban Planner's Aedes Action Tool
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                UN-HABITAT Partnership Initiative
              </p>
            </div>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Integrate public health into urban planning practice to design resilient, mosquito-free cities. Choose your role to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => onRoleSelect(role.id)}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 border border-gray-100 hover:border-cyan-200"
            >
              <div className="flex items-center mb-4">
                <div className={`${role.color} p-3 rounded-lg text-white mr-4`}>
                  <SafeIcon icon={role.icon} className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{role.title}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">{role.description}</p>
            </div>
          ))}
        </div>

        {/* Login Section */}
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-cyan-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Already have an account?
            </h3>
            <button
              onClick={() => onRoleSelect('login')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors flex items-center justify-center mx-auto text-lg shadow-md hover:shadow-lg"
            >
              <SafeIcon icon={FiLogIn} className="mr-2 text-xl" />
              Sign In Here
            </button>
            <p className="text-sm text-gray-500 mt-3">
              Use demo credentials: demo@example.com / demo123
            </p>
          </div>
        </div>

        {/* Footer with UN-HABITAT branding */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by UN-HABITAT • Supporting sustainable urban development worldwide</p>
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const { user, logout, login } = useAuth();
  const [currentView, setCurrentView] = useState('questionnaire');
  const [showLogin, setShowLogin] = useState(false);

  const handleRoleSelect = (roleId) => {
    if (roleId === 'login') {
      setShowLogin(true);
    } else {
      // Auto-create a demo user for the selected role
      const demoUser = {
        id: Date.now(),
        name: `Demo ${roleId.charAt(0).toUpperCase() + roleId.slice(1)}`,
        email: `demo-${roleId}@example.com`,
        role: roleId,
        organization: 'UN-HABITAT Partner Organization',
        createdAt: new Date().toISOString()
      };
      
      login(demoUser);
    }
  };

  const getViewComponent = () => {
    if (!user) {
      return (
        <div>
          <RoleSelector onRoleSelect={handleRoleSelect} />
          {showLogin && (
            <LoginForm 
              onClose={() => setShowLogin(false)}
              onSuccess={() => setShowLogin(false)}
            />
          )}
        </div>
      );
    }

    switch (currentView) {
      case 'admin':
        return <AdminDashboard />;
      case 'editor':
        return <QuestionnaireEditor onSwitchToFiller={() => setCurrentView('questionnaire')} />;
      case 'questionnaire':
      default:
        return <EnhancedQuestionnaire />;
    }
  };

  if (!user) {
    return getViewComponent();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1759320275254-Logo-UN-Habitat.jpg" 
                alt="UN-HABITAT Logo" 
                className="h-10 w-auto mr-3"
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  Urban Planner's Tool
                </h1>
                <p className="text-xs text-gray-500">UN-HABITAT Initiative</p>
              </div>
              <span className="ml-4 px-2 py-1 bg-cyan-100 text-cyan-800 text-sm rounded-full">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation Links */}
              <nav className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('questionnaire')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'questionnaire'
                      ? 'bg-cyan-100 text-cyan-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <SafeIcon icon={FiFileText} className="inline mr-1" />
                  Questionnaire
                </button>

                {(user.role === 'editor' || user.role === 'admin') && (
                  <button
                    onClick={() => setCurrentView('editor')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'editor'
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <SafeIcon icon={FiEdit} className="inline mr-1" />
                    Editor
                  </button>
                )}

                {user.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'admin'
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <SafeIcon icon={FiSettings} className="inline mr-1" />
                    Admin
                  </button>
                )}
              </nav>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center text-sm text-gray-700">
                  <SafeIcon icon={FiUser} className="mr-2" />
                  {user.name}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <SafeIcon icon={FiLogOut} className="mr-1" />
                  Logout
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

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;