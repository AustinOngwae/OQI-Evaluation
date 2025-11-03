import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            {/* Removed logo image, using text for branding */}
            <h1 className="text-2xl font-bold text-gray-800">
              GESDA OQI Evaluation Tool
            </h1>
            <p className="text-gray-600 mt-1">
              Sign in to continue
            </p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            theme="light"
            socialLayout="horizontal"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;