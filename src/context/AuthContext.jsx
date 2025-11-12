import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Perform a dedicated, one-time session check on initial application load.
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session?.user) {
          // If a session exists, validate it by fetching the user's profile.
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            // If the profile fetch fails, the session is likely invalid.
            // Gracefully handle this by signing the user out.
            console.error("Error fetching profile on initial load, signing out:", profileError);
            await supabase.auth.signOut();
            setUser(null);
          } else {
            // Session is valid, set the user.
            setUser({ ...session.user, ...profile });
          }
        } else {
          // No session, user is not logged in.
          setUser(null);
        }
      } catch (e) {
        // Catch any other unexpected errors during the session check.
        console.error("Error during initial session check:", e);
        setUser(null);
      } finally {
        // This is critical: always stop loading after the initial check is complete.
        setLoading(false);
      }
    };

    checkSession();

    // 2. After the initial check, listen for subsequent auth state changes (e.g., login, logout).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile on auth state change:", profileError);
            setUser(session.user); // Fallback to basic user info
          } else {
            setUser({ ...session.user, ...profile });
          }
        } else {
          setUser(null);
        }
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