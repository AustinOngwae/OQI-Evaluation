import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function handles fetching the user profile and setting the user state.
    const setUserProfile = async (session) => {
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching profile:", error);
          setUser(session.user); // Fallback to basic user info
        } else {
          setUser({ ...session.user, ...profile });
        }
      } else {
        setUser(null);
      }
    };

    // Check for an existing session when the component mounts.
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await setUserProfile(session);
      setLoading(false); // Crucially, set loading to false after the initial check.
    };

    initializeSession();

    // Set up a listener for auth state changes (e.g., sign in, sign out).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await setUserProfile(session);
        // If the app was loading, this ensures it stops.
        if (loading) setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // The empty dependency array ensures this runs only once on mount.

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