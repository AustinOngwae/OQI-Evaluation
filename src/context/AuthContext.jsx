import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserProfile = async (sessionUser) => {
    if (!sessionUser) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('Auth: Error fetching user profile:', error);
      return sessionUser; // Return base user on profile fetch error
    }
    
    // Combine auth user data with public profile data
    return { ...sessionUser, ...profile };
  };

  useEffect(() => {
    setLoading(true);

    // Check for an active session on initial load
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const fullUser = await getUserProfile(session?.user);
      setUser(fullUser);
      setLoading(false);
    };

    checkSession();

    // Set up a listener for auth state changes (e.g., sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const fullUser = await getUserProfile(session?.user);
        setUser(fullUser);
      }
    );

    // Cleanup the subscription when the component unmounts
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