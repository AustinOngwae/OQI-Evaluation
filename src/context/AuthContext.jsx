import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        setUser(null);
      } else if (session) {
        // Fetch user profile from public.profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching user profile:', profileError);
          setUser(session.user); // Still set basic user if profile fetch fails
        } else if (profile) {
          setUser({ ...session.user, role: profile.role, first_name: profile.first_name, last_name: profile.last_name });
        } else {
          setUser(session.user); // No profile found, set basic user
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            // Fetch user profile from public.profiles table
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching user profile on auth change:', profileError);
              setUser(session.user);
            } else if (profile) {
              setUser({ ...session.user, role: profile.role, first_name: profile.first_name, last_name: profile.last_name });
            } else {
              setUser(session.user);
            }
          } else {
            setUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
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