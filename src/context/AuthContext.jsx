import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const getUserProfile = async (session) => {
  if (!session?.user) {
    return null;
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // This is a real error, not just 'profile not found'
      throw profileError;
    }
    
    // Combine user data from auth with profile data
    return { ...session.user, ...profile };

  } catch (error) {
    console.error("AuthContext: Critical error fetching user profile:", error);
    // We have a session, but can't get profile. This is a bad state.
    // Let's sign the user out to force a clean login.
    await supabase.auth.signOut();
    toast.error("Your session may be corrupted. Please sign in again.");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userProfile = await getUserProfile(session);
        setUser(userProfile);
      } catch (error) {
        console.error("AuthContext: Error during initial session setup:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const userProfile = await getUserProfile(session);
        setUser(userProfile);
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

  // If the initial session check is running, show the loading spinner.
  if (loading) {
    return <LoadingSpinner />;
  }

  // Once loading is complete, provide the context and render the app.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};