import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async (session) => {
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching user profile:", error.message);
          return { ...session.user };
        }
        return { ...session.user, ...profile };
      }
      return null;
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const fullUser = await fetchUserProfile(session);
      setUser(fullUser);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      const fullUser = await fetchUserProfile(session);
      setUser(fullUser);
      setLoading(false);
      if (event === 'SIGNED_IN') {
        navigate('/', { replace: true });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const value = {
    session,
    user,
    signOut: () => supabase.auth.signOut(),
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};