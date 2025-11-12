import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserProfile = async (sessionUser) => {
    if (!sessionUser) return null;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Auth: Error fetching user profile:', error);
        return sessionUser; // Fallback to session user data
      }
      return { ...sessionUser, ...profile };
    } catch (e) {
      console.error('Auth: Exception fetching user profile:', e);
      return sessionUser; // Fallback on exception
    }
  };

  useEffect(() => {
    const checkSessionAndSetUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Auth: Error getting session:', sessionError);
          setUser(null);
          return;
        }

        if (session) {
          const fullUser = await getUserProfile(session.user);
          setUser(fullUser);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Auth: Exception during session check:', e);
        setUser(null);
      } finally {
        // This is crucial: always remove the loading screen
        setLoading(false);
      }
    };

    checkSessionAndSetUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const fullUser = await getUserProfile(session?.user);
        setUser(fullUser);
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