import React, { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const supabaseTheme = {
  theme: ThemeSupa,
  variables: {
    default: {
      colors: {
        brand: '#9333EA',
        brandAccent: '#7E22CE',
        brandButtonText: 'white',
        defaultButtonBackground: 'rgba(255, 255, 255, 0.1)',
        defaultButtonBackgroundHover: 'rgba(255, 255, 255, 0.2)',
        defaultButtonBorder: 'rgba(255, 255, 255, 0.2)',
        defaultButtonText: 'white',
        dividerBackground: 'rgba(255, 255, 255, 0.2)',
        inputBackground: 'rgba(255, 255, 255, 0.05)',
        inputBorder: 'rgba(255, 255, 255, 0.2)',
        inputBorderHover: '#A855F7',
        inputBorderFocus: '#A855F7',
        inputText: 'white',
        inputLabelText: '#d1d5db',
        inputPlaceholder: '#9ca3af',
        messageText: '#d1d5db',
        messageTextDanger: '#fca5a5',
        anchorTextColor: '#d1d5db',
        anchorTextHoverColor: 'white',
      },
      radii: {
        borderRadiusButton: '8px',
        buttonBorderRadius: '8px',
        inputBorderRadius: '8px',
      },
    },
  },
};

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('sign_in');

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-main">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">
              GESDA OQI Evaluation Tool
            </h1>
            <p className="text-gray-300 mt-1">
              {view === 'sign_up' ? 'Create an account to continue' : 'Sign in to your account'}
            </p>
          </div>

          <div className="flex border-b border-white/20 mb-6">
            <button onClick={() => setView('sign_in')} className={`flex-1 py-2 text-center font-medium transition-colors ${view === 'sign_in' ? 'border-b-2 border-brand-purple-light text-white' : 'text-gray-400 hover:text-white'}`}>
              Sign In
            </button>
            <button onClick={() => setView('sign_up')} className={`flex-1 py-2 text-center font-medium transition-colors ${view === 'sign_up' ? 'border-b-2 border-brand-purple-light text-white' : 'text-gray-400 hover:text-white'}`}>
              Sign Up
            </button>
          </div>

          <Auth
            supabaseClient={supabase}
            appearance={supabaseTheme}
            providers={['google']}
            theme="dark"
            view={view}
            showLinks={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;