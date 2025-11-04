import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        // 1. Get the current session and authenticated user from Supabase Auth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          // 2. If a user is logged in, fetch their profile from the 'profiles' table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching user profile:", profileError.message);
            // Still set the user from auth, but role will be missing
            setUser(session.user);
          } else {
            // 3. Combine the auth user data with the profile data (role)
            setUser({
              ...session.user,
              role: profile.role,
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in user session handling:", error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSession();

    // 4. Listen for changes in authentication state (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchUserSession(); // Re-fetch everything when auth state changes
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};