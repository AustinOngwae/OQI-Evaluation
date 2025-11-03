import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Memoize fetchUserProfile to avoid re-creation on every render
  const fetchUserProfile = useCallback(async (currentSession) => {
    if (currentSession?.user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error("Error fetching user profile:", error.message);
        // If there's an error fetching profile but user exists, return basic user info
        return { ...currentSession.user };
      }
      // If no profile found (PGRST116), profile will be null, so merge carefully
      return { ...currentSession.user, ...(profile || {}) };
    }
    return null;
  }, []); // No dependencies, as it only uses currentSession and supabase

  const refreshUser = useCallback(async () => {
    setLoading(true); // Indicate loading while refreshing
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    const fullUser = await fetchUserProfile(currentSession);
    setUser(fullUser);
    setLoading(false);
  }, [fetchUserProfile]); // Depends on fetchUserProfile

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      const fullUser = await fetchUserProfile(initialSession);
      setUser(fullUser);
      setLoading(false);
    };

    getInitialSession();

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
  }, [navigate, fetchUserProfile]); // Added fetchUserProfile to dependencies

  const value = {
    session,
    user,
    signOut: () => supabase.auth.signOut(),
    refreshUser, // Expose refreshUser
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