import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext();
const USER_PROFILE_CACHE_KEY = 'supabase-user-profile';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (sessionUser) => {
    if (!sessionUser) {
      sessionStorage.removeItem(USER_PROFILE_CACHE_KEY);
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
      sessionStorage.removeItem(USER_PROFILE_CACHE_KEY); // Invalidate cache on error
    } else {
      const fullUser = { ...sessionUser, ...profile };
      setUser(fullUser);
      sessionStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(fullUser));
    }
  };

  useEffect(() => {
    // Check for a cached user profile for a fast initial load
    const cachedProfile = sessionStorage.getItem(USER_PROFILE_CACHE_KEY);
    if (cachedProfile) {
      try {
        setUser(JSON.parse(cachedProfile));
        setLoading(false); // Render the app immediately with cached data
      } catch (e) {
        sessionStorage.removeItem(USER_PROFILE_CACHE_KEY);
        setLoading(true); // Cache was invalid, fall back to normal loading
      }
    } else {
      setLoading(true); // No cache, show the loader
    }

    // Always verify the session with Supabase in the background
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserProfile(session?.user);
      setLoading(false); // Ensure loading is false after verification
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
    sessionStorage.removeItem(USER_PROFILE_CACHE_KEY);
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