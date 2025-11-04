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
    
    console.log("Auth: Fetching profile for user ID:", sessionUser.id);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Auth: Error fetching user profile:', profileError);
      // Set basic user info even if profile fetch fails, but log the error.
      setUser(sessionUser); 
    } else if (profile) {
      console.log("Auth: Profile fetched successfully:", profile);
      const fullUser = { ...sessionUser, role: profile.role, first_name: profile.first_name, last_name: profile.last_name };
      console.log("Auth: Setting full user object:", fullUser);
      setUser(fullUser);
    } else {
      console.warn("Auth: No profile found for this user. Setting basic user object.");
      // No profile found, set basic user. Role will be undefined.
      setUser(sessionUser); 
    }
  };

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Auth: Initial session check.", session);
      await fetchUserProfile(session?.user);
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth: Auth state changed. Event: ${event}`, session);
        await fetchUserProfile(session?.user);
        if (event !== 'INITIAL_SESSION') {
            setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};