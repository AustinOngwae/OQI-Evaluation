import React, { useState, useEffect } from 'react';
import { supabase } from './integrations/supabase/client';
import { SessionContextProvider } from '@supabase/auth-ui-react';
import QuestionnaireEditor from './components/questionnaire/QuestionnaireEditor';
import AdminDashboard from './components/questionnaire/AdminDashboard';
import EnhancedQuestionnaire from './components/questionnaire/EnhancedQuestionnaire';
import SafeIcon from './components/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const { FiUser, FiLogOut, FiSettings, FiEdit, FiFileText, FiEye } = FiIcons;

const MainApp = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentView, setCurrentView] = useState('questionnaire');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const getProfile = async () => {
      if (session) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, role, organization, avatar_url')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;
          setProfile({ ...session.user, ...data });
        } catch (error) {
          console.error('Error fetching profile:', error.message);
          setProfile(session.user); // Fallback to basic user info
        }
      } else {
        setProfile(null);
      }
    };

    getProfile();
  }, [session]);

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center mb-6">
            <img 
              src="https://dyad-assets.s3.us-east-2.amazonaws.com/UN_logo_(2).png" 
              alt="UN-HABITAT Logo" 
              className="h-16 w-auto mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-800">Welcome to the Urban Planner's Aedes Action Tool</h2>
            <p className="text-gray-600 mt-2">Sign in to access your personalized planning tools.</p>
          </div>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#0891b2', // cyan-600
                    brandAccent: '#06b6d4', // cyan-500
                  },
                },
              },
            }}
            theme="light"
          />
        </div>
      </div>
    );
  }

  const userRole = profile?.role || 'user'; // Default to 'user' if role is not set

  const getViewComponent = () => {
    switch (currentView) {
      case 'admin':
        return <AdminDashboard user={profile} />;
      case 'editor':
        return <QuestionnaireEditor user={profile} onSwitchToFiller={() => setCurrentView('questionnaire')} />;
      case 'questionnaire':
      default:
        return <EnhancedQuestionnaire user={profile} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="https://dyad-assets.s3.us-east-2.amazonaws.com/UN_logo_(2).png" 
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
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
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

                {(userRole === 'editor' || userRole === 'admin') && (
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

                {userRole === 'admin' && (
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
                  {profile?.first_name || profile?.email}
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
    <SessionContextProvider supabaseClient={supabase}>
      <MainApp />
    </SessionContextProvider>
  );
}

export default App;