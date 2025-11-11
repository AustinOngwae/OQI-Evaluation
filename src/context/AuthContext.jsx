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
    console.log('Auth: useEffect for auth listener running.');

    // Force sign out on every app load to simulate a "never visited before" state.
    // This will clear any existing session and ensure the app starts fresh.
    supabase.auth.signOut().then(() => {
      console.log('Auth: Forced sign out completed on app load.');
      // After signing out, the onAuthStateChange listener will be triggered with 'SIGNED_OUT'
      // which will then set the user to null and loading to false.
    }).catch(error => {
      console.error('Auth: Error during forced sign out on app load:', error);
      // In case of an error during sign out, ensure loading is still set to false
      setLoading(false); 
    });

    // This listener will catch the 'SIGNED_OUT' event from the forced signOut,
    // and also handle any other auth state changes if they occur.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth: onAuthStateChange event:', event, 'session:', session);
        await fetchUserProfile(session?.user);
        console.log('Auth: Setting loading to false after auth state change.');
        setLoading(false); 
      }
    );

    return () => {
      console.log('Auth: Cleaning up auth listener.');
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount

  const logout = async () => {
    console.log('Auth: Logging out...');
    await supabase.auth.signOut();
    setUser(null);
    console.log('Auth: User logged out.');
  };

  console.log('Auth: Current loading state (outside useEffect):', loading, 'user:', user);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};