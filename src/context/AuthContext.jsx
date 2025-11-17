import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to fetch the initial session and user profile
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      let userProfile = null;
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("AuthContext: Error fetching profile on initial load:", profileError);
          userProfile = session.user; // Fallback to session user
        } else {
          userProfile = { ...session.user, ...profile };
        }
      }
      
      setUser(userProfile);
      setLoading(false);
    };

    // Run the initial check
    getInitialSession();

    // Set up a listener for subsequent auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        let userProfile = null;
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("AuthContext: Error fetching profile on auth change:", profileError);
            userProfile = session.user;
          } else {
            userProfile = { ...session.user, ...profile };
          }
        }
        setUser(userProfile);
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