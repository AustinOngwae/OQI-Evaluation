import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (sessionUser) => {
    console.log('Auth: fetchUserProfile called with sessionUser:', sessionUser);
    if (!sessionUser) {
      setUser(null);
      console.log('Auth: No session user, setting user to null.');
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
      console.log('Auth: User profile fetched and set:', fullUser);
    } else {
      console.warn("Auth: No profile found for this user. Setting basic user object.");
      setUser(sessionUser); 
    }
  };

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    // Explicitly get the initial session and set loading to false
    supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (!isMounted) return;

      if (sessionError) {
        console.error('Auth: Error during initial getSession:', sessionError);
      }
      console.log('Auth: Initial getSession result:', session);
      await fetchUserProfile(session?.user);
      setLoading(false); // Ensure loading is false after initial session check
    }).catch(error => {
      if (!isMounted) return;
      console.error('Auth: Unexpected error during initial getSession:', error);
      setLoading(false); // Ensure loading is false even if getSession fails
    });

    // Set up the auth state change listener for subsequent events
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        console.log('Auth: onAuthStateChange event:', event, 'session:', session);
        // Only update user profile if it's not the initial session already handled by getSession()
        // or if the event is a sign-in/out/update
        if (event !== 'INITIAL_SESSION') {
          await fetchUserProfile(session?.user);
        }
        // For subsequent events, loading should already be false, but ensure it
        setLoading(false); 
      }
    );

    return () => {
      console.log('Auth: Cleaning up auth listener.');
      isMounted = false; // Set flag to false on unmount
      authListener.subscription.unsubscribe();
    };
  }, []); 

  const logout = async () => {
    console.log('Auth: Logging out...');
    await supabase.auth.signOut();
    setUser(null);
    console.log('Auth: User logged out.');
  };

  console.log('Auth: Current loading state:', loading, 'user:', user);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};