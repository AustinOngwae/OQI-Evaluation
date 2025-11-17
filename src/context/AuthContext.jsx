import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        let userProfile = null;
        if (session?.user) {
          // If a session exists, fetch the user's profile to get all necessary data (like roles).
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no row was found
            console.error("AuthContext: Error fetching profile:", profileError);
            // Fallback to user data from session if profile fetch fails
            userProfile = session.user;
          } else {
            // Combine session user data with profile data
            userProfile = { ...session.user, ...profile };
          }
        }
        
        setUser(userProfile);
        
        // This is the key fix: ensure loading is set to false after the initial
        // session check (or any auth state change) is complete.
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};