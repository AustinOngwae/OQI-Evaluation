import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      return;
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Auth: Error fetching user profile:', profileError);
      setUser(sessionUser); 
    } else if (profile) {
      const fullUser = { ...sessionUser, role: profile.role, first_name: profile.first_name, last_name: profile.last_name };
      setUser(fullUser);
    } else {
      // This can happen if the handle_new_user trigger hasn't run yet for a new signup.
      // We'll just set the basic user object.
      setUser(sessionUser); 
    }
  };

  useEffect(() => {
    // Check for an active session when the component mounts
    const checkSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserProfile(session?.user);
      setLoading(false);
    };

    checkSession();

    // Listen for auth state changes (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await fetchUserProfile(session?.user);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};