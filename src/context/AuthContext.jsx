import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        let userProfile = null;
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("AuthContext: Error fetching profile on initial load:", profileError);
            userProfile = session.user;
          } else {
            userProfile = { ...session.user, ...profile };
          }
        }
        setUser(userProfile);
      } catch (error) {
        console.error("AuthContext: Error during initial session fetch:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

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

  // If the initial session check is running, show the loading spinner.
  if (loading) {
    return <LoadingSpinner />;
  }

  // Once loading is complete, provide the context and render the app.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};